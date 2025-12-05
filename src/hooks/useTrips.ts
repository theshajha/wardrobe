import { db, type Trip, type TripItem } from '@/db';
import * as supabaseTrips from '@/lib/data/supabase/trips';
import { isDemoMode } from '@/lib/demo';
import { useCallback, useEffect, useState } from 'react';

/**
 * Hook for trips - uses Supabase for cloud storage, or Dexie for demo mode
 * In demo mode, data is stored locally in IndexedDB via Dexie
 * In normal mode, all data is stored in Supabase
 */
export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isDemo, setIsDemo] = useState(isDemoMode());

  // Check demo mode on mount
  useEffect(() => {
    setIsDemo(isDemoMode());
  }, []);

  // Fetch trips from Supabase or Dexie (for demo mode)
  useEffect(() => {
    let mounted = true;

    const fetchTrips = async () => {
      try {
        setIsLoading(true);
        
        if (isDemo) {
          // Demo mode: fetch from local Dexie database
          const localTrips = await db.trips.toArray();
          if (mounted) {
            // Sort by createdAt descending
            const sorted = localTrips.sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setTrips(sorted);
            setError(null);
          }
        } else {
          // Normal mode: fetch from Supabase
          const data = await supabaseTrips.getTrips();
          if (mounted) {
            setTrips(data);
            setError(null);
          }
        }
      } catch (err) {
        console.error('[useTrips] Error fetching trips:', err);
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTrips();

    // Subscribe to real-time changes (only for non-demo mode)
    let unsubscribe: (() => void) | undefined;
    if (!isDemo) {
      unsubscribe = supabaseTrips.subscribeToTrips(data => {
        if (mounted) {
          setTrips(data);
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

  // Add trip
  const addTrip = useCallback(
    async (trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        if (isDemo) {
          // Demo mode: add to local Dexie database
          const newTrip: Trip = {
            ...trip,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await db.trips.put(newTrip);
          setTrips(prev => [newTrip, ...prev]);
          return newTrip.id;
        }

        // Normal mode: add to Supabase
        const newTrip = await supabaseTrips.createTrip(trip);
        return newTrip.id;
      } catch (err) {
        console.error('[useTrips] Error adding trip:', err);
        throw err;
      }
    },
    [isDemo]
  );

  // Update trip
  const updateTrip = useCallback(
    async (id: string, updates: Partial<Trip>) => {
      try {
        if (isDemo) {
          // Demo mode: update in local Dexie database
          const existing = await db.trips.get(id);
          if (existing) {
            const updatedTrip = {
              ...existing,
              ...updates,
              updatedAt: new Date().toISOString(),
            };
            await db.trips.put(updatedTrip);
            setTrips(prev => prev.map(trip =>
              trip.id === id ? updatedTrip : trip
            ));
          }
          return;
        }

        // Normal mode: update in Supabase
        await supabaseTrips.updateTrip(id, updates);
      } catch (err) {
        console.error('[useTrips] Error updating trip:', err);
        throw err;
      }
    },
    [isDemo]
  );

  // Delete trip
  const deleteTrip = useCallback(
    async (id: string) => {
      try {
        if (isDemo) {
          // Demo mode: delete from local Dexie database
          await db.trips.delete(id);
          // Also delete associated trip items
          const tripItems = await db.tripItems.where('tripId').equals(id).toArray();
          for (const item of tripItems) {
            await db.tripItems.delete(item.id);
          }
          setTrips(prev => prev.filter(trip => trip.id !== id));
          return;
        }

        // Normal mode: delete from Supabase
        await supabaseTrips.deleteTrip(id);
      } catch (err) {
        console.error('[useTrips] Error deleting trip:', err);
        throw err;
      }
    },
    [isDemo]
  );

  // Get single trip
  const getTrip = useCallback(
    async (id: string): Promise<Trip | null> => {
      try {
        if (isDemo) {
          // Demo mode: get from local Dexie database
          const trip = await db.trips.get(id);
          return trip || null;
        }
        // Normal mode: get from Supabase
        return await supabaseTrips.getTrip(id);
      } catch (err) {
        console.error('[useTrips] Error getting trip:', err);
        throw err;
      }
    },
    [isDemo]
  );

  return {
    trips,
    isLoading,
    error,
    addTrip,
    updateTrip,
    deleteTrip,
    getTrip,
  };
}

/**
 * Hook for managing trip items (items packed for a trip)
 */
export function useTripItems(tripId?: string) {
  const [tripItems, setTripItems] = useState<TripItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isDemo, setIsDemo] = useState(isDemoMode());

  // Check demo mode on mount
  useEffect(() => {
    setIsDemo(isDemoMode());
  }, []);

  // Fetch trip items from Supabase or Dexie (for demo mode)
  useEffect(() => {
    let mounted = true;

    if (!tripId) {
      setTripItems([]);
      setIsLoading(false);
      return;
    }

    const fetchTripItems = async () => {
      try {
        setIsLoading(true);
        
        if (isDemo) {
          // Demo mode: fetch from local Dexie database
          const localTripItems = await db.tripItems.where('tripId').equals(tripId).toArray();
          if (mounted) {
            setTripItems(localTripItems);
            setError(null);
          }
        } else {
          // Normal mode: fetch from Supabase
          const data = await supabaseTrips.getTripItems(tripId);
          if (mounted) {
            setTripItems(data);
            setError(null);
          }
        }
      } catch (err) {
        console.error('[useTripItems] Error fetching trip items:', err);
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTripItems();

    return () => {
      mounted = false;
    };
  }, [tripId, isDemo]);

  // Add item to trip
  const addTripItem = useCallback(
    async (tripItem: Omit<TripItem, 'id'>) => {
      try {
        if (isDemo) {
          // Demo mode: add to local Dexie database
          const newTripItem: TripItem = {
            ...tripItem,
            id: crypto.randomUUID(),
          };
          await db.tripItems.put(newTripItem);
          // Refetch to get updated list
          if (tripId) {
            const data = await db.tripItems.where('tripId').equals(tripId).toArray();
            setTripItems(data);
          }
          return newTripItem.id;
        }

        // Normal mode: add to Supabase
        const newTripItem = await supabaseTrips.addTripItem(tripItem);
        // Refetch to get updated list
        if (tripId) {
          const data = await supabaseTrips.getTripItems(tripId);
          setTripItems(data);
        }
        return newTripItem.id;
      } catch (err) {
        console.error('[useTripItems] Error adding trip item:', err);
        throw err;
      }
    },
    [tripId, isDemo]
  );

  // Update trip item (e.g., toggle packed)
  const updateTripItem = useCallback(
    async (id: string, updates: Partial<TripItem>) => {
      try {
        if (isDemo) {
          // Demo mode: update in local Dexie database
          const existing = await db.tripItems.get(id);
          if (existing) {
            const updatedTripItem = {
              ...existing,
              ...updates,
            };
            await db.tripItems.put(updatedTripItem);
            // Refetch to get updated list
            if (tripId) {
              const data = await db.tripItems.where('tripId').equals(tripId).toArray();
              setTripItems(data);
            }
          }
          return;
        }

        // Normal mode: update in Supabase
        await supabaseTrips.updateTripItem(id, updates);
        // Refetch to get updated list
        if (tripId) {
          const data = await supabaseTrips.getTripItems(tripId);
          setTripItems(data);
        }
      } catch (err) {
        console.error('[useTripItems] Error updating trip item:', err);
        throw err;
      }
    },
    [tripId, isDemo]
  );

  // Remove item from trip
  const removeTripItem = useCallback(
    async (id: string) => {
      try {
        if (isDemo) {
          // Demo mode: delete from local Dexie database
          await db.tripItems.delete(id);
          // Refetch to get updated list
          if (tripId) {
            const data = await db.tripItems.where('tripId').equals(tripId).toArray();
            setTripItems(data);
          }
          return;
        }

        // Normal mode: delete from Supabase
        await supabaseTrips.removeTripItem(id);
        // Refetch to get updated list
        if (tripId) {
          const data = await supabaseTrips.getTripItems(tripId);
          setTripItems(data);
        }
      } catch (err) {
        console.error('[useTripItems] Error removing trip item:', err);
        throw err;
      }
    },
    [tripId, isDemo]
  );

  return {
    tripItems,
    isLoading,
    error,
    addTripItem,
    updateTripItem,
    removeTripItem,
  };
}
