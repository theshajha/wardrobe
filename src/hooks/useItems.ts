import { type Item } from '@/db';
import * as supabaseItems from '@/lib/data/supabase/items';
import { isBase64Image, uploadImage } from '@/lib/imageUpload';
import { useCallback, useEffect, useState } from 'react';

/**
 * Hook for items - uses Supabase for cloud storage
 * All data is stored in Supabase, images in R2
 */
export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch items from Supabase
  useEffect(() => {
    let mounted = true;

    const fetchItems = async () => {
      try {
        setIsLoading(true);
        const data = await supabaseItems.getItems();
        if (mounted) {
          setItems(data as Item[]);
          setError(null);
        }
      } catch (err) {
        console.error('[useItems] Error fetching items:', err);
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchItems();

    // Subscribe to real-time changes
    const unsubscribe = supabaseItems.subscribeToItems(data => {
      if (mounted) {
        setItems(data as Item[]);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Add item with image upload support
  const addItem = useCallback(
    async (item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'> & { imageData?: string }) => {
      try {
        let imageRef = item.imageRef;

        // If there's base64 image data, upload it first
        if (item.imageData && isBase64Image(item.imageData)) {
          console.log('[useItems] Uploading image...');
          const uploadResult = await uploadImage(item.imageData);
          if (uploadResult.success && uploadResult.imageRef) {
            imageRef = uploadResult.imageRef;
            console.log('[useItems] Image uploaded, ref:', imageRef);
          } else {
            console.warn('[useItems] Image upload failed:', uploadResult.error);
          }
        }

        // Create item without imageData (it's only for local base64)
        const { imageData: _, ...itemWithoutImageData } = item;
        const newItem = await supabaseItems.createItem({
          ...itemWithoutImageData,
          imageRef,
        });

        // Optimistically add to local state
        setItems(prev => [newItem as Item, ...prev]);

        return newItem.id;
      } catch (err) {
        console.error('[useItems] Error adding item:', err);
        throw err;
      }
    },
    []
  );

  // Update item with image upload support
  const updateItem = useCallback(
    async (id: string, updates: Partial<Item> & { imageData?: string }) => {
      try {
        let imageRef = updates.imageRef;

        // If there's new base64 image data, upload it first
        if (updates.imageData && isBase64Image(updates.imageData)) {
          console.log('[useItems] Uploading new image...');
          const uploadResult = await uploadImage(updates.imageData);
          if (uploadResult.success && uploadResult.imageRef) {
            imageRef = uploadResult.imageRef;
            console.log('[useItems] Image uploaded, ref:', imageRef);
          } else {
            console.warn('[useItems] Image upload failed:', uploadResult.error);
          }
        }

        // Update item without imageData
        const { imageData: _, ...updatesWithoutImageData } = updates;
        const updatedItem = await supabaseItems.updateItem(id, {
          ...updatesWithoutImageData,
          imageRef,
        });

        // Optimistically update local state immediately
        setItems(prev => prev.map(item =>
          item.id === id ? { ...item, ...updatedItem } as Item : item
        ));
      } catch (err) {
        console.error('[useItems] Error updating item:', err);
        throw err;
      }
    },
    []
  );

  // Delete item
  const deleteItem = useCallback(
    async (id: string) => {
      try {
        await supabaseItems.deleteItem(id);

        // Optimistically remove from local state
        setItems(prev => prev.filter(item => item.id !== id));
      } catch (err) {
        console.error('[useItems] Error deleting item:', err);
        throw err;
      }
    },
    []
  );

  // Get single item
  const getItem = useCallback(
    async (id: string): Promise<Item | null> => {
      try {
        const item = await supabaseItems.getItem(id);
        return item as Item | null;
      } catch (err) {
        console.error('[useItems] Error getting item:', err);
        throw err;
      }
    },
    []
  );

  // Get featured items
  const getFeaturedItems = useCallback(async (): Promise<Item[]> => {
    try {
      const featured = await supabaseItems.getFeaturedItems();
      return featured as Item[];
    } catch (err) {
      console.error('[useItems] Error getting featured items:', err);
      throw err;
    }
  }, []);

  return {
    items,
    isLoading,
    error,
    addItem,
    updateItem,
    deleteItem,
    getItem,
    getFeaturedItems,
  };
}
