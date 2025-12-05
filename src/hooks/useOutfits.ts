import { type Outfit } from '@/db';
import * as supabaseOutfits from '@/lib/data/supabase/outfits';
import { useCallback, useEffect, useState } from 'react';

/**
 * Hook for outfits - uses Supabase for cloud storage
 * All data is stored in Supabase, no local storage
 */
export function useOutfits() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch outfits from Supabase
  useEffect(() => {
    let mounted = true;

    const fetchOutfits = async () => {
      try {
        setIsLoading(true);
        const data = await supabaseOutfits.getOutfits();
        if (mounted) {
          setOutfits(data);
          setError(null);
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

    // Subscribe to real-time changes
    const unsubscribe = supabaseOutfits.subscribeToOutfits(data => {
      if (mounted) {
        setOutfits(data);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Add outfit
  const addOutfit = useCallback(
    async (outfit: Omit<Outfit, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const newOutfit = await supabaseOutfits.createOutfit(outfit);
        return newOutfit.id;
      } catch (err) {
        console.error('[useOutfits] Error adding outfit:', err);
        throw err;
      }
    },
    []
  );

  // Update outfit
  const updateOutfit = useCallback(
    async (id: string, updates: Partial<Outfit>) => {
      try {
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
    []
  );

  // Delete outfit
  const deleteOutfit = useCallback(
    async (id: string) => {
      try {
        await supabaseOutfits.deleteOutfit(id);
      } catch (err) {
        console.error('[useOutfits] Error deleting outfit:', err);
        throw err;
      }
    },
    []
  );

  // Get single outfit
  const getOutfit = useCallback(
    async (id: string): Promise<Outfit | null> => {
      try {
        return await supabaseOutfits.getOutfit(id);
      } catch (err) {
        console.error('[useOutfits] Error getting outfit:', err);
        throw err;
      }
    },
    []
  );

  // Update outfit items (replace all items in outfit)
  const updateOutfitItems = useCallback(
    async (outfitId: string, itemIds: string[]) => {
      try {
        await supabaseOutfits.updateOutfitItems(outfitId, itemIds);
      } catch (err) {
        console.error('[useOutfits] Error updating outfit items:', err);
        throw err;
      }
    },
    []
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
