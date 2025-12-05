import { db, type WishlistItem } from '@/db';
import * as supabaseWishlist from '@/lib/data/supabase/wishlist';
import { isDemoMode } from '@/lib/demo';
import { useCallback, useEffect, useState } from 'react';

/**
 * Hook for wishlist - uses Supabase for cloud storage, or Dexie for demo mode
 * In demo mode, data is stored locally in IndexedDB via Dexie
 * In normal mode, all data is stored in Supabase
 */
export function useWishlist() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isDemo, setIsDemo] = useState(isDemoMode());

  // Check demo mode on mount
  useEffect(() => {
    setIsDemo(isDemoMode());
  }, []);

  // Fetch wishlist from Supabase or Dexie (for demo mode)
  useEffect(() => {
    let mounted = true;

    const fetchWishlist = async () => {
      try {
        setIsLoading(true);
        
        if (isDemo) {
          // Demo mode: fetch from local Dexie database
          const localWishlist = await db.wishlist.toArray();
          if (mounted) {
            // Sort by createdAt descending
            const sorted = localWishlist.sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setWishlist(sorted);
            setError(null);
          }
        } else {
          // Normal mode: fetch from Supabase
          const data = await supabaseWishlist.getWishlistItems();
          if (mounted) {
            setWishlist(data);
            setError(null);
          }
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

    // Subscribe to real-time changes (only for non-demo mode)
    let unsubscribe: (() => void) | undefined;
    if (!isDemo) {
      unsubscribe = supabaseWishlist.subscribeToWishlist(data => {
        if (mounted) {
          setWishlist(data);
        }
      });
    }

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isDemo]);

  // Add wishlist item
  const addWishlistItem = useCallback(
    async (item: Omit<WishlistItem, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        if (isDemo) {
          // Demo mode: add to local Dexie database
          const newItem: WishlistItem = {
            ...item,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await db.wishlist.put(newItem);
          setWishlist(prev => [newItem, ...prev]);
          return newItem.id;
        }

        // Normal mode: add to Supabase
        const newItem = await supabaseWishlist.createWishlistItem(item);
        return newItem.id;
      } catch (err) {
        console.error('[useWishlist] Error adding wishlist item:', err);
        throw err;
      }
    },
    [isDemo]
  );

  // Update wishlist item
  const updateWishlistItem = useCallback(
    async (id: string, updates: Partial<WishlistItem>) => {
      try {
        if (isDemo) {
          // Demo mode: update in local Dexie database
          const existing = await db.wishlist.get(id);
          if (existing) {
            const updatedItem = {
              ...existing,
              ...updates,
              updatedAt: new Date().toISOString(),
            };
            await db.wishlist.put(updatedItem);
            setWishlist(prev => prev.map(item =>
              item.id === id ? updatedItem : item
            ));
          }
          return;
        }

        // Normal mode: update in Supabase
        await supabaseWishlist.updateWishlistItem(id, updates);
      } catch (err) {
        console.error('[useWishlist] Error updating wishlist item:', err);
        throw err;
      }
    },
    [isDemo]
  );

  // Delete wishlist item
  const deleteWishlistItem = useCallback(
    async (id: string) => {
      try {
        if (isDemo) {
          // Demo mode: delete from local Dexie database
          await db.wishlist.delete(id);
          setWishlist(prev => prev.filter(item => item.id !== id));
          return;
        }

        // Normal mode: delete from Supabase
        await supabaseWishlist.deleteWishlistItem(id);
      } catch (err) {
        console.error('[useWishlist] Error deleting wishlist item:', err);
        throw err;
      }
    },
    [isDemo]
  );

  // Mark as purchased
  const markAsPurchased = useCallback(
    async (id: string) => {
      try {
        if (isDemo) {
          // Demo mode: update in local Dexie database
          const existing = await db.wishlist.get(id);
          if (existing) {
            const updatedItem = {
              ...existing,
              isPurchased: true,
              purchasedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await db.wishlist.put(updatedItem);
            setWishlist(prev => prev.map(item =>
              item.id === id ? updatedItem : item
            ));
          }
          return;
        }

        // Normal mode: update in Supabase
        await supabaseWishlist.markWishlistItemAsPurchased(id);
      } catch (err) {
        console.error('[useWishlist] Error marking as purchased:', err);
        throw err;
      }
    },
    [isDemo]
  );

  // Get unpurchased items
  const getUnpurchasedItems = useCallback(async (): Promise<WishlistItem[]> => {
    try {
      if (isDemo) {
        // Demo mode: get from local Dexie database
        const allItems = await db.wishlist.toArray();
        return allItems.filter(item => !item.isPurchased);
      }
      // Normal mode: get from Supabase
      return await supabaseWishlist.getUnpurchasedWishlistItems();
    } catch (err) {
      console.error('[useWishlist] Error getting unpurchased items:', err);
      throw err;
    }
  }, [isDemo]);

  // Get single item
  const getWishlistItem = useCallback(
    async (id: string): Promise<WishlistItem | null> => {
      try {
        if (isDemo) {
          // Demo mode: get from local Dexie database
          const item = await db.wishlist.get(id);
          return item || null;
        }
        // Normal mode: get from Supabase
        return await supabaseWishlist.getWishlistItem(id);
      } catch (err) {
        console.error('[useWishlist] Error getting wishlist item:', err);
        throw err;
      }
    },
    [isDemo]
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
