/**
 * Hook for managing user profile settings in Supabase
 * Handles display name, currency, and showcase settings
 */

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useCallback, useEffect, useState } from 'react';

export interface Profile {
    username: string;
    display_name: string | null;
    showcase_enabled: boolean;
    default_currency: string;
}

export interface ProfileState {
    profile: Profile | null;
    loading: boolean;
    error: string | null;
}

export function useProfile() {
    const { user, isAuthenticated, username } = useAuth();
    const [state, setState] = useState<ProfileState>({
        profile: null,
        loading: true,
        error: null,
    });
    const [saving, setSaving] = useState(false);

    // Fetch profile from Supabase
    const fetchProfile = useCallback(async () => {
        if (!user) {
            setState({ profile: null, loading: false, error: null });
            return;
        }

        try {
            console.log('[useProfile] Fetching profile for user:', user.id);
            const { data, error } = await supabase
                .from('profiles')
                .select('username, display_name, showcase_enabled, default_currency')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('[useProfile] Error fetching profile:', error);
                setState({
                    profile: null,
                    loading: false,
                    error: error.message,
                });
                return;
            }

            console.log('[useProfile] Profile loaded:', data);
            setState({
                profile: {
                    username: data.username,
                    display_name: data.display_name,
                    showcase_enabled: data.showcase_enabled ?? false,
                    default_currency: data.default_currency ?? 'USD',
                },
                loading: false,
                error: null,
            });
        } catch (err) {
            console.error('[useProfile] Error:', err);
            setState({
                profile: null,
                loading: false,
                error: 'Failed to load profile',
            });
        }
    }, [user]);

    // Load profile on mount and when auth changes
    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    // Update display name
    const updateDisplayName = useCallback(async (displayName: string): Promise<boolean> => {
        if (!user) return false;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    display_name: displayName.trim(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (error) {
                console.error('[useProfile] Error updating display name:', error);
                return false;
            }

            setState(prev => ({
                ...prev,
                profile: prev.profile ? { ...prev.profile, display_name: displayName.trim() } : null,
            }));
            return true;
        } catch (err) {
            console.error('[useProfile] Error:', err);
            return false;
        } finally {
            setSaving(false);
        }
    }, [user]);

    // Update default currency
    const updateCurrency = useCallback(async (currency: string): Promise<boolean> => {
        if (!user) return false;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    default_currency: currency,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (error) {
                console.error('[useProfile] Error updating currency:', error);
                return false;
            }

            setState(prev => ({
                ...prev,
                profile: prev.profile ? { ...prev.profile, default_currency: currency } : null,
            }));
            return true;
        } catch (err) {
            console.error('[useProfile] Error:', err);
            return false;
        } finally {
            setSaving(false);
        }
    }, [user]);

    // Toggle showcase (public profile)
    const toggleShowcase = useCallback(async (): Promise<boolean> => {
        if (!user || !state.profile) return false;

        setSaving(true);
        const newValue = !state.profile.showcase_enabled;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    showcase_enabled: newValue,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (error) {
                console.error('[useProfile] Error toggling showcase:', error);
                return false;
            }

            setState(prev => ({
                ...prev,
                profile: prev.profile ? { ...prev.profile, showcase_enabled: newValue } : null,
            }));
            return true;
        } catch (err) {
            console.error('[useProfile] Error:', err);
            return false;
        } finally {
            setSaving(false);
        }
    }, [user, state.profile]);

    // Get public URL for showcase
    const getPublicUrl = useCallback(() => {
        if (!state.profile?.username) return null;
        return `${window.location.origin}/${state.profile.username}`;
    }, [state.profile?.username]);

    return {
        profile: state.profile,
        loading: state.loading,
        error: state.error,
        saving,
        isAuthenticated,
        username,
        updateDisplayName,
        updateCurrency,
        toggleShowcase,
        getPublicUrl,
        refresh: fetchProfile,
    };
}

