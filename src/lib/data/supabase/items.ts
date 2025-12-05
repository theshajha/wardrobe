import { supabase } from '@/lib/supabase';
import type { Item } from '@/db';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Convert local Item format to Supabase database format
 */
function toDbItem(item: Partial<Item>, userId: string): any {
  return {
    id: item.id,
    user_id: userId,
    name: item.name,
    category: item.category || null,
    subcategory: item.subcategory || null,
    color: item.color || null,
    brand: item.brand || null,
    purchase_date: item.purchaseDate || null,
    cost: item.cost || null,
    currency: item.currency || 'INR',
    condition: item.condition || null,
    notes: item.notes || null,
    location: item.location || null,
    climate: item.climate || null,
    occasion: item.occasion || null,
    is_phase_out: item.isPhaseOut || false,
    is_featured: item.isFeatured || false,
    image_url: item.imageRef || null, // imageRef maps to image_url
    image_hash: item.imageHash || null,
    size: item.size as any || null,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

/**
 * Convert Supabase database format to local Item format
 * Note: imageData is NOT included - that stays local only
 */
function fromDbItem(dbItem: any): Omit<Item, 'imageData'> {
  return {
    id: dbItem.id,
    name: dbItem.name,
    category: dbItem.category || '',
    subcategory: dbItem.subcategory ?? undefined,
    color: dbItem.color ?? undefined,
    brand: dbItem.brand ?? undefined,
    size: dbItem.size as any,
    purchaseDate: dbItem.purchase_date ?? undefined,
    cost: dbItem.cost ?? undefined,
    currency: dbItem.currency,
    condition: dbItem.condition || '',
    imageRef: dbItem.image_url ?? undefined, // image_url maps to imageRef
    imageHash: dbItem.image_hash ?? undefined,
    notes: dbItem.notes ?? undefined,
    location: dbItem.location || '',
    isPhaseOut: dbItem.is_phase_out,
    isFeatured: dbItem.is_featured,
    climate: dbItem.climate ?? undefined,
    occasion: dbItem.occasion ?? undefined,
    createdAt: dbItem.created_at,
    updatedAt: dbItem.updated_at,
  };
}

export async function getItems(): Promise<Omit<Item, 'imageData'>[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] Error fetching items:', error);
    throw error;
  }

  return data.map(fromDbItem);
}

export async function getItem(id: string): Promise<Omit<Item, 'imageData'> | null> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[Supabase] Error fetching item:', error);
    throw error;
  }

  return fromDbItem(data);
}

export async function createItem(item: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'imageData'>): Promise<Omit<Item, 'imageData'>> {
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
    .from('items')
    .insert([toDbItem(itemWithId, user.id)])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Error creating item:', error);
    throw error;
  }

  return fromDbItem(data);
}

export async function updateItem(id: string, updates: Partial<Item>): Promise<Omit<Item, 'imageData'>> {
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
    .from('items')
    .update(toDbItem(updatesWithTimestamp, user.id))
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Error updating item:', error);
    throw error;
  }

  return fromDbItem(data);
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase.from('items').delete().eq('id', id);

  if (error) {
    console.error('[Supabase] Error deleting item:', error);
    throw error;
  }
}

export async function getFeaturedItems(): Promise<Omit<Item, 'imageData'>[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('is_featured', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] Error fetching featured items:', error);
    throw error;
  }

  return data.map(fromDbItem);
}

export function subscribeToItems(callback: (items: Omit<Item, 'imageData'>[]) => void): () => void {
  let channel: RealtimeChannel;

  const handleChange = async () => {
    try {
      const items = await getItems();
      callback(items);
    } catch (error) {
      console.error('[Supabase] Error in subscription callback:', error);
    }
  };

  channel = supabase
    .channel('items-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'items',
      },
      handleChange
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

export async function bulkUpsertItems(items: Omit<Item, 'imageData'>[]): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const dbItems = items.map(item => toDbItem(item, user.id));

  const { error } = await supabase.from('items').upsert(dbItems);

  if (error) {
    console.error('[Supabase] Error bulk upserting items:', error);
    throw error;
  }
}
