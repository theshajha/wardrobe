import { db, type Outfit } from '@/db';
import * as supabaseOutfits from '@/lib/data/supabase/outfits';
import { isDemoMode } from '@/lib/demo';
import { useCallback, useEffect, useState } from 'react';

/**
 * Hook for outfits - uses Supabase for cloud storage, or Dexie for demo mode
 * In demo mode, data is stored locally in IndexedDB via Dexie
 * In normal mode, all data is stored in Supabase
 */
export function useOutfits() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isDemo, setIsDemo] = useState(isDemoMode());

  // Check demo mode on mount
  useEffect(() => {
    setIsDemo(isDemoMode());
  }, []);

  // Fetch outfits from Supabase or Dexie (for demo mode)
  useEffect(() => {
    let mounted = true;

    const fetchOutfits = async () => {
      try {
        setIsLoading(true);
        
        if (isDemo) {
          // Demo mode: fetch from local Dexie database
          const localOutfits = await db.outfits.toArray();
          if (mounted) {
            // Sort by createdAt descending
            const sorted = localOutfits.sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setOutfits(sorted);
            setError(null);
          }
        } else {
          // Normal mode: fetch from Supabase
          const data = await supabaseOutfits.getOutfits();
          if (mounted) {
            setOutfits(data);
            setError(null);
          }
        }
      } catch (err) {
        console.error('[useOutfits] Error fetching outfits:', err);
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchOutfits();

    // Subscribe to real-time changes (only for non-demo mode)
    let unsubscribe: (() => void) | undefined;
    if (!isDemo) {
      unsubscribe = supabaseOutfits.subscribeToOutfits(data => {
        if (mounted) {
          setOutfits(data);
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

  // Add outfit
  const addOutfit = useCallback(
    async (outfit: Omit<Outfit, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        if (isDemo) {
          // Demo mode: add to local Dexie database
          const newOutfit: Outfit = {
            ...outfit,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await db.outfits.put(newOutfit);
          setOutfits(prev => [newOutfit, ...prev]);
          return newOutfit.id;
        }

        // Normal mode: add to Supabase
        const newOutfit = await supabaseOutfits.createOutfit(outfit);
        return newOutfit.id;
      } catch (err) {
        console.error('[useOutfits] Error adding outfit:', err);
        throw err;
      }
    },
    [isDemo]
  );

  // Update outfit
  const updateOutfit = useCallback(
    async (id: string, updates: Partial<Outfit>) => {
      try {
        if (isDemo) {
          // Demo mode: update in local Dexie database
          const existing = await db.outfits.get(id);
          if (existing) {
            const updatedOutfit = {
              ...existing,
              ...updates,
              updatedAt: new Date().toISOString(),
            };
            await db.outfits.put(updatedOutfit);
            setOutfits(prev => prev.map(outfit =>
              outfit.id === id ? updatedOutfit : outfit
            ));
          }
          return;
        }

        // Normal mode: update in Supabase
        await supabaseOutfits.updateOutfit(id, updates);

        // If itemIds are being updated, update the junction table too
        if (updates.itemIds !== undefined) {
          await supabaseOutfits.updateOutfitItems(id, updates.itemIds);
        }
      } catch (err) {
        console.error('[useOutfits] Error updating outfit:', err);
        throw err;
      }
    },
    [isDemo]
  );

  // Delete outfit
  const deleteOutfit = useCallback(
    async (id: string) => {
      try {
        if (isDemo) {
          // Demo mode: delete from local Dexie database
          await db.outfits.delete(id);
          setOutfits(prev => prev.filter(outfit => outfit.id !== id));
          return;
        }

        // Normal mode: delete from Supabase
        await supabaseOutfits.deleteOutfit(id);
      } catch (err) {
        console.error('[useOutfits] Error deleting outfit:', err);
        throw err;
      }
    },
    [isDemo]
  );

  // Get single outfit
  const getOutfit = useCallback(
    async (id: string): Promise<Outfit | null> => {
      try {
        if (isDemo) {
          // Demo mode: get from local Dexie database
          const outfit = await db.outfits.get(id);
          return outfit || null;
        }
        // Normal mode: get from Supabase
        return await supabaseOutfits.getOutfit(id);
      } catch (err) {
        console.error('[useOutfits] Error getting outfit:', err);
        throw err;
      }
    },
    [isDemo]
  );

  // Update outfit items (replace all items in outfit)
  const updateOutfitItems = useCallback(
    async (outfitId: string, itemIds: string[]) => {
      try {
        if (isDemo) {
          // Demo mode: update in local Dexie database
          const existing = await db.outfits.get(outfitId);
          if (existing) {
            const updatedOutfit = {
              ...existing,
              itemIds,
              updatedAt: new Date().toISOString(),
            };
            await db.outfits.put(updatedOutfit);
            setOutfits(prev => prev.map(outfit =>
              outfit.id === outfitId ? updatedOutfit : outfit
            ));
          }
          return;
        }

        // Normal mode: update in Supabase
        await supabaseOutfits.updateOutfitItems(outfitId, itemIds);
      } catch (err) {
        console.error('[useOutfits] Error updating outfit items:', err);
        throw err;
      }
    },
    [isDemo]
  );

  return {
    outfits,
    isLoading,
    error,
    addOutfit,
    updateOutfit,
    deleteOutfit,
    getOutfit,
    updateOutfitItems,
  };
}
