/**
 * Supabase Authentication
 * Handles user authentication with Supabase Auth (magic links, sessions)
 */

import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Send a magic link to the user's email
 */
export async function sendMagicLink(email: string): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('[Auth] Error sending magic link:', error);
      return {
        success: false,
        error: error.message || 'Failed to send magic link',
      };
    }

    return {
      success: true,
      message: 'Check your email for the magic link!',
    };
  } catch (error) {
    console.error('[Auth] Magic link request failed:', error);
    return {
      success: false,
      error: 'Network error. Please try again.',
    };
  }
}

/**
 * Sign up a new user with email and password (optional)
 * For now, we'll use magic links only, but this is here for future expansion
 */
export async function signUp(email: string, password?: string): Promise<AuthResult> {
  try {
    if (password) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        message: 'Check your email to confirm your account!',
      };
    } else {
      // Use magic link for passwordless signup
      return await sendMagicLink(email);
    }
  } catch (error) {
    console.error('[Auth] Sign up failed:', error);
    return {
      success: false,
      error: 'Network error. Please try again.',
    };
  }
}

/**
 * Sign in with email and password (optional - for future use)
 */
export async function signInWithPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      message: 'Signed in successfully!',
    };
  } catch (error) {
    console.error('[Auth] Sign in failed:', error);
    return {
      success: false,
      error: 'Network error. Please try again.',
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[Auth] Sign out error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      message: 'Signed out successfully',
    };
  } catch (error) {
    console.error('[Auth] Sign out failed:', error);
    return {
      success: false,
      error: 'Network error. Please try again.',
    };
  }
}

/**
 * Get the current session
 */
export async function getCurrentSession(): Promise<Session | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('[Auth] Error getting session:', error);
    return null;
  }
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch username from profile if it exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email || '',
      username: profile?.username,
    };
  } catch (error) {
    console.error('[Auth] Error getting user:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getCurrentSession();
  return session !== null;
}

/**
 * Create or update user profile with username
 */
export async function updateProfile(username: string, displayName?: string): Promise<AuthResult> {
  try {
    console.log('[Auth] Starting profile update for username:', username);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error('[Auth] Error getting user:', userError);
      return {
        success: false,
        error: userError.message,
      };
    }

    if (!user) {
      console.error('[Auth] No user found');
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    console.log('[Auth] User ID:', user.id);

    // Check if username is already taken
    console.log('[Auth] Checking if username is taken...');
    const { data: existing, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', user.id)
      .maybeSingle();

    if (checkError) {
      console.error('[Auth] Error checking username:', checkError);
      // Continue anyway - the table might not exist yet
    }

    if (existing) {
      console.log('[Auth] Username already taken');
      return {
        success: false,
        error: 'Username already taken',
      };
    }

    // Upsert profile
    console.log('[Auth] Upserting profile...');
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      username,
      display_name: displayName || username,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('[Auth] Error updating profile:', error);
      return {
        success: false,
        error: error.message || 'Failed to update profile',
      };
    }

    console.log('[Auth] Profile updated successfully');
    return {
      success: true,
      message: 'Profile updated successfully',
    };
  } catch (error) {
    console.error('[Auth] Profile update failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error. Please try again.',
    };
  }
}

/**
 * Check if user has completed profile setup (has username)
 */
export async function hasCompletedProfile(): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    return !!profile?.username;
  } catch (error) {
    console.error('[Auth] Error checking profile:', error);
    return false;
  }
}

/**
 * Exchange auth code for session (for OAuth callback)
 */
export async function exchangeCodeForSession(code: string): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      message: 'Authentication successful',
    };
  } catch (error) {
    console.error('[Auth] Code exchange failed:', error);
    return {
      success: false,
      error: 'Authentication failed. Please try again.',
    };
  }
}

/**
 * Parse auth token from URL (for magic link callback)
 */
export function parseAuthParamsFromUrl(url: string): {
  token?: string;
  type?: string;
  code?: string;
} {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.hash.substring(1)); // Remove # and parse

    return {
      token: params.get('access_token') || undefined,
      type: params.get('type') || undefined,
      code: urlObj.searchParams.get('code') || undefined,
    };
  } catch {
    return {};
  }
}
