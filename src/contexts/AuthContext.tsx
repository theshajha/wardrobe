/**
 * Auth Context Provider
 * Token-based authentication using Supabase sessions
 * Username is loaded lazily and doesn't block app access
 */

import * as auth from '@/lib/auth/supabase-auth';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  username: string | null;
  isLoading: boolean; // Only for initial auth check
  isAuthenticated: boolean;
  hasProfile: boolean | null; // null = unknown, true = has profile, false = needs setup
  signIn: (email: string) => Promise<auth.AuthResult>;
  signOut: () => Promise<auth.AuthResult>;
  updateProfile: (username: string, displayName?: string) => Promise<auth.AuthResult>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Timeout for initial auth check (5 seconds)
const AUTH_INIT_TIMEOUT = 5000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load username from profile (non-blocking, best effort)
  const loadProfile = useCallback(async (userId: string) => {
    try {
      console.log('[Auth] Loading profile for user:', userId);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();

      if (error) {
        // PGRST116 means no rows returned - user hasn't set up profile yet
        if (error.code === 'PGRST116') {
          console.log('[Auth] No profile found - user needs to complete setup');
          setHasProfile(false);
          setUsername(null);
          return;
        }
        console.error('[Auth] Error loading profile:', error.message);
        // On error, assume no profile to be safe
        setHasProfile(false);
        return;
      }

      if (profile?.username) {
        console.log('[Auth] Profile loaded:', profile.username);
        setUsername(profile.username);
        setHasProfile(true);
      } else {
        setHasProfile(false);
      }
    } catch (error) {
      console.error('[Auth] Error loading profile:', error);
      setHasProfile(false);
    }
  }, []);

  // Initialize auth state - only checks for existing session
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const initAuth = async () => {
      console.log('[Auth] Initializing auth...');

      // Set a timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        if (mounted && isLoading) {
          console.warn('[Auth] Auth initialization timed out, allowing access');
          setIsLoading(false);
        }
      }, AUTH_INIT_TIMEOUT);

      try {
        // Get initial session from Supabase
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('[Auth] Error getting session:', error);
          setIsLoading(false);
          return;
        }

        console.log('[Auth] Initial session:', initialSession ? `user=${initialSession.user.id}` : 'none');

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        // Auth check is complete - don't wait for profile
        setIsLoading(false);

        // Load profile in background (non-blocking)
        if (initialSession?.user) {
          loadProfile(initialSession.user.id);
        }
      } catch (error) {
        console.error('[Auth] Init error:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      console.log('[Auth] Auth state changed:', event, newSession ? `user=${newSession.user.id}` : 'no session');

      // If signing out, clear everything immediately
      if (!newSession) {
        setSession(null);
        setUser(null);
        setUsername(null);
        setHasProfile(null);
        return;
      }

      // For sign in or token refresh
      setSession(newSession);
      setUser(newSession.user);

      // Load profile in background
      loadProfile(newSession.user.id);
    });

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  // Sign in with magic link
  const signIn = useCallback(async (email: string): Promise<auth.AuthResult> => {
    return await auth.sendMagicLink(email);
  }, []);

  // Sign out
  const signOut = useCallback(async (): Promise<auth.AuthResult> => {
    const result = await auth.signOut();
    if (result.success) {
      setUser(null);
      setSession(null);
      setUsername(null);
      setHasProfile(null);
    }
    return result;
  }, []);

  // Update profile
  const updateProfile = useCallback(async (
    newUsername: string,
    displayName?: string
  ): Promise<auth.AuthResult> => {
    const result = await auth.updateProfile(newUsername, displayName);
    if (result.success) {
      setUsername(newUsername);
      setHasProfile(true);
    }
    return result;
  }, []);

  // Refresh profile (for manual refresh)
  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadProfile(user.id);
    }
  }, [user, loadProfile]);

  const value: AuthContextType = {
    user,
    session,
    username,
    isLoading,
    isAuthenticated: !!session, // Use session presence, not user
    hasProfile,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
