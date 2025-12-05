import { type Trip, type TripItem } from '@/db';
import * as supabaseTrips from '@/lib/data/supabase/trips';
import { useCallback, useEffect, useState } from 'react';

/**
 * Hook for trips - uses Supabase for cloud storage
 * All data is stored in Supabase, no local storage
 */
export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch trips from Supabase
  useEffect(() => {
    let mounted = true;

    const fetchTrips = async () => {
      try {
        setIsLoading(true);
        const data = await supabaseTrips.getTrips();
        if (mounted) {
          setTrips(data);
          setError(null);
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

    // Subscribe to real-time changes
    const unsubscribe = supabaseTrips.subscribeToTrips(data => {
      if (mounted) {
        setTrips(data);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Add trip
  const addTrip = useCallback(
    async (trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const newTrip = await supabaseTrips.createTrip(trip);
        return newTrip.id;
      } catch (err) {
        console.error('[useTrips] Error adding trip:', err);
        throw err;
      }
    },
    []
  );

  // Update trip
  const updateTrip = useCallback(
    async (id: string, updates: Partial<Trip>) => {
      try {
        await supabaseTrips.updateTrip(id, updates);
      } catch (err) {
        console.error('[useTrips] Error updating trip:', err);
        throw err;
      }
    },
    []
  );

  // Delete trip
  const deleteTrip = useCallback(
    async (id: string) => {
      try {
        await supabaseTrips.deleteTrip(id);
      } catch (err) {
        console.error('[useTrips] Error deleting trip:', err);
        throw err;
      }
    },
    []
  );

  // Get single trip
  const getTrip = useCallback(
    async (id: string): Promise<Trip | null> => {
      try {
        return await supabaseTrips.getTrip(id);
      } catch (err) {
        console.error('[useTrips] Error getting trip:', err);
        throw err;
      }
    },
    []
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

  // Fetch trip items from Supabase
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
        const data = await supabaseTrips.getTripItems(tripId);
        if (mounted) {
          setTripItems(data);
          setError(null);
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
  }, [tripId]);

  // Add item to trip
  const addTripItem = useCallback(
    async (tripItem: Omit<TripItem, 'id'>) => {
      try {
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
    [tripId]
  );

  // Update trip item (e.g., toggle packed)
  const updateTripItem = useCallback(
    async (id: string, updates: Partial<TripItem>) => {
      try {
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
    [tripId]
  );

  // Remove item from trip
  const removeTripItem = useCallback(
    async (id: string) => {
      try {
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
    [tripId]
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
