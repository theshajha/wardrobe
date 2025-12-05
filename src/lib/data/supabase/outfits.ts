import { supabase } from '@/lib/supabase';
import type { Outfit } from '@/db';
import type { RealtimeChannel } from '@supabase/supabase-js';

function toDbOutfit(outfit: Partial<Outfit>, userId: string): any {
  return {
    id: outfit.id,
    user_id: userId,
    name: outfit.name,
    occasion: outfit.occasion || null,
    season: outfit.season || null,
    notes: outfit.notes || null,
    rating: outfit.rating || null,
    last_worn: outfit.lastWorn || null,
    created_at: outfit.createdAt,
    updated_at: outfit.updatedAt,
  };
}

function fromDbOutfit(dbOutfit: any, itemIds: string[] = []): Outfit {
  return {
    id: dbOutfit.id,
    name: dbOutfit.name,
    occasion: dbOutfit.occasion || undefined,
    season: dbOutfit.season || undefined,
    notes: dbOutfit.notes || undefined,
    rating: dbOutfit.rating || undefined,
    lastWorn: dbOutfit.last_worn || undefined,
    itemIds,
    createdAt: dbOutfit.created_at,
    updatedAt: dbOutfit.updated_at,
  };
}

export async function getOutfits(): Promise<Outfit[]> {
  const { data: outfitsData, error: outfitsError } = await supabase
    .from('outfits')
    .select('*')
    .order('created_at', { ascending: false });

  if (outfitsError) {
    console.error('[Supabase] Error fetching outfits:', outfitsError);
    throw outfitsError;
  }

  const { data: outfitItemsData, error: itemsError } = await supabase
    .from('outfit_items')
    .select('outfit_id, item_id');

  if (itemsError) {
    console.error('[Supabase] Error fetching outfit items:', itemsError);
    throw itemsError;
  }

  const itemIdsByOutfit = new Map<string, string[]>();
  for (const oi of outfitItemsData) {
    if (!oi.outfit_id || !oi.item_id) continue;
    const existing = itemIdsByOutfit.get(oi.outfit_id) || [];
    existing.push(oi.item_id);
    itemIdsByOutfit.set(oi.outfit_id, existing);
  }

  return outfitsData.map(outfit => fromDbOutfit(outfit, itemIdsByOutfit.get(outfit.id) || []));
}

export async function getOutfit(id: string): Promise<Outfit | null> {
  const { data: outfitData, error: outfitError } = await supabase
    .from('outfits')
    .select('*')
    .eq('id', id)
    .single();

  if (outfitError) {
    if (outfitError.code === 'PGRST116') {
      return null;
    }
    console.error('[Supabase] Error fetching outfit:', outfitError);
    throw outfitError;
  }

  const { data: outfitItemsData, error: itemsError } = await supabase
    .from('outfit_items')
    .select('item_id')
    .eq('outfit_id', id);

  if (itemsError) {
    console.error('[Supabase] Error fetching outfit items:', itemsError);
    throw itemsError;
  }

  const itemIds = outfitItemsData.map(oi => oi.item_id).filter(Boolean) as string[];

  return fromDbOutfit(outfitData, itemIds);
}

export async function createOutfit(outfit: Omit<Outfit, 'id' | 'createdAt' | 'updatedAt'>): Promise<Outfit> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const outfitWithId = {
    ...outfit,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { data: outfitData, error: outfitError } = await supabase
    .from('outfits')
    .insert([toDbOutfit(outfitWithId, user.id)])
    .select()
    .single();

  if (outfitError) {
    console.error('[Supabase] Error creating outfit:', outfitError);
    throw outfitError;
  }

  if (outfit.itemIds && outfit.itemIds.length > 0) {
    const outfitItems = outfit.itemIds.map(itemId => ({
      id: crypto.randomUUID(),
      outfit_id: outfitWithId.id,
      item_id: itemId,
    }));

    const { error: itemsError } = await supabase.from('outfit_items').insert(outfitItems);

    if (itemsError) {
      console.error('[Supabase] Error creating outfit items:', itemsError);
      throw itemsError;
    }
  }

  return fromDbOutfit(outfitData, outfit.itemIds);
}

export async function updateOutfit(id: string, updates: Partial<Outfit>): Promise<Outfit> {
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
    .from('outfits')
    .update(toDbOutfit(updatesWithTimestamp, user.id))
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Error updating outfit:', error);
    throw error;
  }

  const { data: outfitItemsData } = await supabase
    .from('outfit_items')
    .select('item_id')
    .eq('outfit_id', id);

  const itemIds = outfitItemsData?.map(oi => oi.item_id).filter(Boolean) as string[] || [];

  return fromDbOutfit(data, itemIds);
}

export async function updateOutfitItems(outfitId: string, itemIds: string[]): Promise<void> {
  const { error: deleteError } = await supabase
    .from('outfit_items')
    .delete()
    .eq('outfit_id', outfitId);

  if (deleteError) {
    console.error('[Supabase] Error deleting outfit items:', deleteError);
    throw deleteError;
  }

  if (itemIds.length > 0) {
    const outfitItems = itemIds.map(itemId => ({
      id: crypto.randomUUID(),
      outfit_id: outfitId,
      item_id: itemId,
    }));

    const { error: insertError } = await supabase.from('outfit_items').insert(outfitItems);

    if (insertError) {
      console.error('[Supabase] Error inserting outfit items:', insertError);
      throw insertError;
    }
  }
}

export async function deleteOutfit(id: string): Promise<void> {
  const { error } = await supabase.from('outfits').delete().eq('id', id);

  if (error) {
    console.error('[Supabase] Error deleting outfit:', error);
    throw error;
  }
}

export function subscribeToOutfits(callback: (outfits: Outfit[]) => void): () => void {
  let channel: RealtimeChannel;

  const handleChange = async () => {
    try {
      const outfits = await getOutfits();
      callback(outfits);
    } catch (error) {
      console.error('[Supabase] Error in subscription callback:', error);
    }
  };

  channel = supabase
    .channel('outfits-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'outfits',
      },
      handleChange
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'outfit_items',
      },
      handleChange
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

export async function bulkUpsertOutfits(outfits: Outfit[]): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const dbOutfits = outfits.map(outfit => toDbOutfit(outfit, user.id));

  const { error: outfitsError } = await supabase.from('outfits').upsert(dbOutfits);

  if (outfitsError) {
    console.error('[Supabase] Error bulk upserting outfits:', outfitsError);
    throw outfitsError;
  }

  const allOutfitItems = [];
  for (const outfit of outfits) {
    if (outfit.itemIds && outfit.itemIds.length > 0) {
      for (const itemId of outfit.itemIds) {
        allOutfitItems.push({
          id: crypto.randomUUID(),
          outfit_id: outfit.id,
          item_id: itemId,
        });
      }
    }
  }

  const outfitIds = outfits.map(o => o.id);
  const { error: deleteError } = await supabase
    .from('outfit_items')
    .delete()
    .in('outfit_id', outfitIds);

  if (deleteError) {
    console.error('[Supabase] Error deleting outfit items during bulk upsert:', deleteError);
    throw deleteError;
  }

  if (allOutfitItems.length > 0) {
    const { error: itemsError } = await supabase.from('outfit_items').insert(allOutfitItems);

    if (itemsError) {
      console.error('[Supabase] Error bulk upserting outfit items:', itemsError);
      throw itemsError;
    }
  }
}
