import { supabase } from '@/lib/supabase';
import type { WishlistItem } from '@/db';
import type { RealtimeChannel } from '@supabase/supabase-js';

function toDbWishlistItem(item: Partial<WishlistItem>, userId: string): any {
  return {
    id: item.id,
    user_id: userId,
    name: item.name,
    category: item.category || null,
    quantity: item.quantity || 1,
    priority: item.priority || null,
    estimated_cost: item.estimatedCost || null,
    currency: item.currency || 'INR',
    link: item.link || null,
    notes: item.notes || null,
    is_purchased: item.isPurchased || false,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

function fromDbWishlistItem(dbItem: any): WishlistItem {
  return {
    id: dbItem.id,
    name: dbItem.name,
    category: dbItem.category || undefined,
    quantity: dbItem.quantity,
    priority: (dbItem.priority as 'low' | 'medium' | 'high') || 'medium',
    estimatedCost: dbItem.estimated_cost || undefined,
    currency: dbItem.currency,
    link: dbItem.link || undefined,
    notes: dbItem.notes || undefined,
    isPurchased: dbItem.is_purchased,
    purchasedAt: undefined, // Note: Supabase schema doesn't have purchasedAt
    createdAt: dbItem.created_at,
    updatedAt: dbItem.updated_at,
  };
}

export async function getWishlistItems(): Promise<WishlistItem[]> {
  const { data, error } = await supabase
    .from('wishlist')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] Error fetching wishlist items:', error);
    throw error;
  }

  return data.map(fromDbWishlistItem);
}

export async function getWishlistItem(id: string): Promise<WishlistItem | null> {
  const { data, error } = await supabase
    .from('wishlist')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[Supabase] Error fetching wishlist item:', error);
    throw error;
  }

  return fromDbWishlistItem(data);
}

export async function createWishlistItem(
  item: Omit<WishlistItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<WishlistItem> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const itemWithId = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('wishlist')
    .insert([toDbWishlistItem(itemWithId, user.id)])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Error creating wishlist item:', error);
    throw error;
  }

  return fromDbWishlistItem(data);
}

export async function updateWishlistItem(id: string, updates: Partial<WishlistItem>): Promise<WishlistItem> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const updatesWithTimestamp = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('wishlist')
    .update(toDbWishlistItem(updatesWithTimestamp, user.id))
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Error updating wishlist item:', error);
    throw error;
  }

  return fromDbWishlistItem(data);
}

export async function deleteWishlistItem(id: string): Promise<void> {
  const { error } = await supabase.from('wishlist').delete().eq('id', id);

  if (error) {
    console.error('[Supabase] Error deleting wishlist item:', error);
    throw error;
  }
}

export async function markWishlistItemAsPurchased(id: string): Promise<WishlistItem> {
  return updateWishlistItem(id, {
    isPurchased: true,
    purchasedAt: new Date().toISOString(),
  });
}

export async function getUnpurchasedWishlistItems(): Promise<WishlistItem[]> {
  const { data, error } = await supabase
    .from('wishlist')
    .select('*')
    .eq('is_purchased', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] Error fetching unpurchased wishlist items:', error);
    throw error;
  }

  return data.map(fromDbWishlistItem);
}

export function subscribeToWishlist(callback: (items: WishlistItem[]) => void): () => void {
  let channel: RealtimeChannel;

  const handleChange = async () => {
    try {
      const items = await getWishlistItems();
      callback(items);
    } catch (error) {
      console.error('[Supabase] Error in subscription callback:', error);
    }
  };

  channel = supabase
    .channel('wishlist-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'wishlist',
      },
      handleChange
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

export async function bulkUpsertWishlistItems(items: WishlistItem[]): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const dbItems = items.map(item => toDbWishlistItem(item, user.id));

  const { error } = await supabase.from('wishlist').upsert(dbItems);

  if (error) {
    console.error('[Supabase] Error bulk upserting wishlist items:', error);
    throw error;
  }
}
