/**
 * Public data access for showcase
 * These functions don't require authentication - they use Supabase RLS policies
 * to allow public read access to showcase data
 */

import { supabase } from '@/lib/supabase';

export interface PublicItem {
    id: string;
    name: string;
    category: string;
    subcategory?: string;
    color?: string;
    brand?: string;
    image_url?: string;
    condition?: string;
    is_featured: boolean;
}

export interface PublicProfile {
    username: string;
    display_name?: string;
    showcase_enabled: boolean;
}

export interface PublicShowcaseData {
    profile: PublicProfile;
    items: PublicItem[];
    stats: {
        totalItems: number;
        totalOutfits: number;
    };
}

/**
 * Get public showcase data for a username
 * Returns null if user not found or showcase not enabled
 */
export async function getPublicShowcase(username: string): Promise<PublicShowcaseData | null> {
    try {
        console.log('[Public] Fetching showcase for:', username);

        // First, get the profile and check if showcase is enabled
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, username, display_name, showcase_enabled')
            .eq('username', username.toLowerCase())
            .single();

        if (profileError || !profile) {
            console.log('[Public] Profile not found:', profileError?.message);
            return null;
        }

        if (!profile.showcase_enabled) {
            console.log('[Public] Showcase not enabled for user');
            return null;
        }

        // Get featured items for this user
        const { data: items, error: itemsError } = await supabase
            .from('items')
            .select('id, name, category, subcategory, color, brand, image_url, condition, is_featured')
            .eq('user_id', profile.id)
            .eq('is_featured', true)
            .order('created_at', { ascending: false });

        if (itemsError) {
            console.error('[Public] Error fetching items:', itemsError);
            return null;
        }

        // Get outfit count for stats
        const { count: outfitCount } = await supabase
            .from('outfits')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id);

        return {
            profile: {
                username: profile.username,
                display_name: profile.display_name,
                showcase_enabled: profile.showcase_enabled,
            },
            items: items || [],
            stats: {
                totalItems: items?.length || 0,
                totalOutfits: outfitCount || 0,
            },
        };
    } catch (error) {
        console.error('[Public] Error fetching showcase:', error);
        return null;
    }
}

