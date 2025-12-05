import { type WishlistItem } from '@/db';
import * as supabaseWishlist from '@/lib/data/supabase/wishlist';
import { useCallback, useEffect, useState } from 'react';

/**
 * Hook for wishlist - uses Supabase for cloud storage
 * All data is stored in Supabase, no local storage
 */
export function useWishlist() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch wishlist from Supabase
  useEffect(() => {
    let mounted = true;

    const fetchWishlist = async () => {
      try {
        setIsLoading(true);
        const data = await supabaseWishlist.getWishlistItems();
        if (mounted) {
          setWishlist(data);
          setError(null);
        }
      } catch (err) {
        console.error('[useWishlist] Error fetching wishlist:', err);
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchWishlist();

    // Subscribe to real-time changes
    const unsubscribe = supabaseWishlist.subscribeToWishlist(data => {
      if (mounted) {
        setWishlist(data);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Add wishlist item
  const addWishlistItem = useCallback(
    async (item: Omit<WishlistItem, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const newItem = await supabaseWishlist.createWishlistItem(item);
        return newItem.id;
      } catch (err) {
        console.error('[useWishlist] Error adding wishlist item:', err);
        throw err;
      }
    },
    []
  );

  // Update wishlist item
  const updateWishlistItem = useCallback(
    async (id: string, updates: Partial<WishlistItem>) => {
      try {
        await supabaseWishlist.updateWishlistItem(id, updates);
      } catch (err) {
        console.error('[useWishlist] Error updating wishlist item:', err);
        throw err;
      }
    },
    []
  );

  // Delete wishlist item
  const deleteWishlistItem = useCallback(
    async (id: string) => {
      try {
        await supabaseWishlist.deleteWishlistItem(id);
      } catch (err) {
        console.error('[useWishlist] Error deleting wishlist item:', err);
        throw err;
      }
    },
    []
  );

  // Mark as purchased
  const markAsPurchased = useCallback(
    async (id: string) => {
      try {
        await supabaseWishlist.markWishlistItemAsPurchased(id);
      } catch (err) {
        console.error('[useWishlist] Error marking as purchased:', err);
        throw err;
      }
    },
    []
  );

  // Get unpurchased items
  const getUnpurchasedItems = useCallback(async (): Promise<WishlistItem[]> => {
    try {
      return await supabaseWishlist.getUnpurchasedWishlistItems();
    } catch (err) {
      console.error('[useWishlist] Error getting unpurchased items:', err);
      throw err;
    }
  }, []);

  // Get single item
  const getWishlistItem = useCallback(
    async (id: string): Promise<WishlistItem | null> => {
      try {
        return await supabaseWishlist.getWishlistItem(id);
      } catch (err) {
        console.error('[useWishlist] Error getting wishlist item:', err);
        throw err;
      }
    },
    []
  );

  return {
    wishlist,
    isLoading,
    error,
    addWishlistItem,
    updateWishlistItem,
    deleteWishlistItem,
    markAsPurchased,
    getUnpurchasedItems,
    getWishlistItem,
  };
}
