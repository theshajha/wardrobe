import { supabase } from '@/lib/supabase';
import type { Trip, TripItem } from '@/db';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Convert local Trip format to Supabase database format
 */
function toDbTrip(trip: Partial<Trip>, userId: string): any {
  return {
    id: trip.id,
    user_id: userId,
    name: trip.name,
    destination: trip.destination || null,
    start_date: trip.startDate || null,
    end_date: trip.endDate || null,
    climate: trip.climate || null,
    notes: trip.notes || null,
    status: trip.status || 'planning',
    created_at: trip.createdAt,
    updated_at: trip.updatedAt,
  };
}

/**
 * Convert Supabase database format to local Trip format
 */
function fromDbTrip(dbTrip: any): Trip {
  return {
    id: dbTrip.id,
    name: dbTrip.name,
    destination: dbTrip.destination || undefined,
    startDate: dbTrip.start_date || undefined,
    endDate: dbTrip.end_date || undefined,
    climate: dbTrip.climate || undefined,
    notes: dbTrip.notes || undefined,
    status: dbTrip.status,
    createdAt: dbTrip.created_at,
    updatedAt: dbTrip.updated_at,
  };
}

/**
 * Convert local TripItem format to Supabase database format
 */
function toDbTripItem(tripItem: Partial<TripItem>): any {
  return {
    id: tripItem.id,
    trip_id: tripItem.tripId || null,
    item_id: tripItem.itemId || null,
    packed: tripItem.packed || false,
    quantity: tripItem.quantity || 1,
  };
}

/**
 * Convert Supabase database format to local TripItem format
 */
function fromDbTripItem(dbTripItem: any): TripItem {
  return {
    id: dbTripItem.id,
    tripId: dbTripItem.trip_id || '',
    itemId: dbTripItem.item_id || '',
    packed: dbTripItem.packed,
    quantity: dbTripItem.quantity,
  };
}

export async function getTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] Error fetching trips:', error);
    throw error;
  }

  return data.map(fromDbTrip);
}

export async function getTrip(id: string): Promise<Trip | null> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[Supabase] Error fetching trip:', error);
    throw error;
  }

  return fromDbTrip(data);
}

export async function createTrip(trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Promise<Trip> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const tripWithId = {
    ...trip,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('trips')
    .insert([toDbTrip(tripWithId, user.id)])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Error creating trip:', error);
    throw error;
  }

  return fromDbTrip(data);
}

export async function updateTrip(id: string, updates: Partial<Trip>): Promise<Trip> {
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
    .from('trips')
    .update(toDbTrip(updatesWithTimestamp, user.id))
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Error updating trip:', error);
    throw error;
  }

  return fromDbTrip(data);
}

export async function deleteTrip(id: string): Promise<void> {
  const { error } = await supabase.from('trips').delete().eq('id', id);

  if (error) {
    console.error('[Supabase] Error deleting trip:', error);
    throw error;
  }
}

export function subscribeToTrips(callback: (trips: Trip[]) => void): () => void {
  let channel: RealtimeChannel;

  const handleChange = async () => {
    try {
      const trips = await getTrips();
      callback(trips);
    } catch (error) {
      console.error('[Supabase] Error in subscription callback:', error);
    }
  };

  channel = supabase
    .channel('trips-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'trips',
      },
      handleChange
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

export async function getTripItems(tripId: string): Promise<TripItem[]> {
  const { data, error } = await supabase
    .from('trip_items')
    .select('*')
    .eq('trip_id', tripId);

  if (error) {
    console.error('[Supabase] Error fetching trip items:', error);
    throw error;
  }

  return data.map(fromDbTripItem);
}

export async function addTripItem(tripItem: Omit<TripItem, 'id'>): Promise<TripItem> {
  const tripItemWithId = {
    ...tripItem,
    id: crypto.randomUUID(),
  };

  const { data, error } = await supabase
    .from('trip_items')
    .insert([toDbTripItem(tripItemWithId)])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Error adding trip item:', error);
    throw error;
  }

  return fromDbTripItem(data);
}

export async function updateTripItem(id: string, updates: Partial<TripItem>): Promise<TripItem> {
  const { data, error } = await supabase
    .from('trip_items')
    .update(toDbTripItem(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Error updating trip item:', error);
    throw error;
  }

  return fromDbTripItem(data);
}

export async function removeTripItem(id: string): Promise<void> {
  const { error } = await supabase.from('trip_items').delete().eq('id', id);

  if (error) {
    console.error('[Supabase] Error removing trip item:', error);
    throw error;
  }
}

export async function getAllTripItems(): Promise<TripItem[]> {
  const { data, error } = await supabase.from('trip_items').select('*');

  if (error) {
    console.error('[Supabase] Error fetching all trip items:', error);
    throw error;
  }

  return data.map(fromDbTripItem);
}

export async function bulkUpsertTrips(trips: Trip[]): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const dbTrips = trips.map(trip => toDbTrip(trip, user.id));

  const { error } = await supabase.from('trips').upsert(dbTrips);

  if (error) {
    console.error('[Supabase] Error bulk upserting trips:', error);
    throw error;
  }
}

export async function bulkUpsertTripItems(tripItems: TripItem[]): Promise<void> {
  const dbTripItems = tripItems.map(ti => toDbTripItem(ti));

  const { error } = await supabase.from('trip_items').upsert(dbTripItems);

  if (error) {
    console.error('[Supabase] Error bulk upserting trip items:', error);
    throw error;
  }
}
