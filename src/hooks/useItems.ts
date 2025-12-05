import { db, type Item } from '@/db';
import * as supabaseItems from '@/lib/data/supabase/items';
import { isDemoMode } from '@/lib/demo';
import { isBase64Image, uploadImage } from '@/lib/imageUpload';
import { useCallback, useEffect, useState } from 'react';

/**
 * Hook for items - uses Supabase for cloud storage, or Dexie for demo mode
 * In demo mode, data is stored locally in IndexedDB via Dexie
 * In normal mode, all data is stored in Supabase, images in R2
 */
export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isDemo, setIsDemo] = useState(isDemoMode());

  // Check demo mode on mount
  useEffect(() => {
    setIsDemo(isDemoMode());
  }, []);

  // Fetch items from Supabase or Dexie (for demo mode)
  useEffect(() => {
    let mounted = true;

    const fetchItems = async () => {
      try {
        setIsLoading(true);
        
        if (isDemo) {
          // Demo mode: fetch from local Dexie database
          const localItems = await db.items.toArray();
          if (mounted) {
            // Sort by createdAt descending
            const sorted = localItems.sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setItems(sorted);
            setError(null);
          }
        } else {
          // Normal mode: fetch from Supabase
          const data = await supabaseItems.getItems();
          if (mounted) {
            setItems(data as Item[]);
            setError(null);
          }
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

    // Subscribe to real-time changes (only for non-demo mode)
    let unsubscribe: (() => void) | undefined;
    if (!isDemo) {
      unsubscribe = supabaseItems.subscribeToItems(data => {
        if (mounted) {
          setItems(data as Item[]);
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

  // Add item with image upload support
  const addItem = useCallback(
    async (item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'> & { imageData?: string }) => {
      try {
        if (isDemo) {
          // Demo mode: add to local Dexie database
          const newItem: Item = {
            ...item,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await db.items.put(newItem);
          setItems(prev => [newItem, ...prev]);
          return newItem.id;
        }

        // Normal mode: upload to Supabase
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
    [isDemo]
  );

  // Update item with image upload support
  const updateItem = useCallback(
    async (id: string, updates: Partial<Item> & { imageData?: string }) => {
      try {
        if (isDemo) {
          // Demo mode: update in local Dexie database
          const existing = await db.items.get(id);
          if (existing) {
            const updatedItem = {
              ...existing,
              ...updates,
              updatedAt: new Date().toISOString(),
            };
            await db.items.put(updatedItem);
            setItems(prev => prev.map(item =>
              item.id === id ? updatedItem : item
            ));
          }
          return;
        }

        // Normal mode: upload to Supabase
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
    [isDemo]
  );

  // Delete item
  const deleteItem = useCallback(
    async (id: string) => {
      try {
        if (isDemo) {
          // Demo mode: delete from local Dexie database
          await db.items.delete(id);
          setItems(prev => prev.filter(item => item.id !== id));
          return;
        }

        // Normal mode: delete from Supabase
        await supabaseItems.deleteItem(id);

        // Optimistically remove from local state
        setItems(prev => prev.filter(item => item.id !== id));
      } catch (err) {
        console.error('[useItems] Error deleting item:', err);
        throw err;
      }
    },
    [isDemo]
  );

  // Get single item
  const getItem = useCallback(
    async (id: string): Promise<Item | null> => {
      try {
        if (isDemo) {
          // Demo mode: get from local Dexie database
          const item = await db.items.get(id);
          return item || null;
        }
        // Normal mode: get from Supabase
        const item = await supabaseItems.getItem(id);
        return item as Item | null;
      } catch (err) {
        console.error('[useItems] Error getting item:', err);
        throw err;
      }
    },
    [isDemo]
  );

  // Get featured items
  const getFeaturedItems = useCallback(async (): Promise<Item[]> => {
    try {
      if (isDemo) {
        // Demo mode: get from local Dexie database
        const allItems = await db.items.toArray();
        return allItems.filter(item => item.isFeatured);
      }
      // Normal mode: get from Supabase
      const featured = await supabaseItems.getFeaturedItems();
      return featured as Item[];
    } catch (err) {
      console.error('[useItems] Error getting featured items:', err);
      throw err;
    }
  }, [isDemo]);

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
