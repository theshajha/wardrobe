/**
 * Sync Routes for Fitso.me Sync API
 * Handles bidirectional data sync with Last-Write-Wins conflict resolution
 */

import { Hono } from 'hono';
import type {
  Env,
  LocalChange,
  Session,
  SyncItem,
  SyncOutfit,
  SyncPullResponse,
  SyncPushRequest,
  SyncPushResponse,
  SyncTrip,
  SyncTripItem,
  SyncWishlistItem,
  UserData,
} from '../types';

export const syncRouter = new Hono<{
  Bindings: Env;
  Variables: { session: Session }
}>();

type SyncableRecord = SyncItem | SyncTrip | SyncTripItem | SyncOutfit | SyncWishlistItem;

/**
 * GET /sync
 * Pull changes from server since a given version
 */
syncRouter.get('/', async (c) => {
  try {
    const session = c.get('session');
    const sinceVersion = parseInt(c.req.query('since') || '0', 10);

    // Get user data from R2 - stored at {userId}/data.json
    const userDataKey = `${session.userId}/data.json`;
    const dataObject = await c.env.R2_BUCKET.get(userDataKey);

    if (!dataObject) {
      // No data yet, return empty
      const response: SyncPullResponse = {
        success: true,
        version: 0,
        changes: {
          items: { upserts: [], deletes: [] },
          trips: { upserts: [], deletes: [] },
          tripItems: { upserts: [], deletes: [] },
          outfits: { upserts: [], deletes: [] },
          wishlist: { upserts: [], deletes: [] },
        },
      };
      return c.json(response);
    }

    const userData = await dataObject.json<UserData>();

    // If client is at current version, no changes needed
    if (sinceVersion >= userData.version) {
      const response: SyncPullResponse = {
        success: true,
        version: userData.version,
        changes: {
          items: { upserts: [], deletes: [] },
          trips: { upserts: [], deletes: [] },
          tripItems: { upserts: [], deletes: [] },
          outfits: { upserts: [], deletes: [] },
          wishlist: { upserts: [], deletes: [] },
        },
      };
      return c.json(response);
    }

    // Return all current data (client will merge using timestamps)
    // Separate active records from deleted ones
    const response: SyncPullResponse = {
      success: true,
      version: userData.version,
      changes: {
        items: {
          upserts: userData.items.filter(i => !i._deleted),
          deletes: userData.items.filter(i => i._deleted).map(i => i.id),
        },
        trips: {
          upserts: userData.trips.filter(t => !t._deleted),
          deletes: userData.trips.filter(t => t._deleted).map(t => t.id),
        },
        tripItems: {
          upserts: userData.tripItems.filter(ti => !ti._deleted),
          deletes: userData.tripItems.filter(ti => ti._deleted).map(ti => ti.id),
        },
        outfits: {
          upserts: userData.outfits.filter(o => !o._deleted),
          deletes: userData.outfits.filter(o => o._deleted).map(o => o.id),
        },
        wishlist: {
          upserts: userData.wishlist.filter(w => !w._deleted),
          deletes: userData.wishlist.filter(w => w._deleted).map(w => w.id),
        },
      },
    };

    return c.json(response);
  } catch (error) {
    console.error('Sync pull error:', error);
    return c.json({ success: false, error: 'Server error' } as SyncPullResponse, 500);
  }
});

/**
 * POST /sync
 * Push local changes to server
 */
syncRouter.post('/', async (c) => {
  try {
    const session = c.get('session');
    const body = await c.req.json<SyncPushRequest>();
    const { lastSyncVersion, changes } = body;

    if (!Array.isArray(changes)) {
      return c.json({ success: false, error: 'Invalid changes format' } as SyncPushResponse, 400);
    }

    // Get current user data from R2 - stored at {userId}/data.json
    const userDataKey = `${session.userId}/data.json`;
    const dataObject = await c.env.R2_BUCKET.get(userDataKey);

    let userData: UserData;
    if (dataObject) {
      userData = await dataObject.json<UserData>();
    } else {
      // Initialize empty user data
      userData = {
        version: 0,
        updatedAt: new Date().toISOString(),
        items: [],
        trips: [],
        tripItems: [],
        outfits: [],
        wishlist: [],
      };
    }

    // Check for version conflict (optimistic locking)
    const conflictIds: string[] = [];

    if (lastSyncVersion !== userData.version) {
      // There are server changes the client doesn't have
      // We'll still apply changes using LWW, but flag conflicts
      console.log(`Version mismatch: client=${lastSyncVersion}, server=${userData.version}`);
    }

    // Apply changes using Last-Write-Wins
    for (const change of changes) {
      const result = applyChange(userData, change);
      if (result.conflict) {
        conflictIds.push(change.recordId);
      }
    }

    // Increment version and update timestamp
    userData.version += 1;
    userData.updatedAt = new Date().toISOString();

    // Save updated data to R2
    await c.env.R2_BUCKET.put(userDataKey, JSON.stringify(userData), {
      customMetadata: {
        userId: session.userId,
        version: String(userData.version),
        updatedAt: userData.updatedAt,
      },
    });

    const response: SyncPushResponse = {
      success: true,
      version: userData.version,
      conflictIds: conflictIds.length > 0 ? conflictIds : undefined,
    };

    return c.json(response);
  } catch (error) {
    console.error('Sync push error:', error);
    return c.json({ success: false, error: 'Server error' } as SyncPushResponse, 500);
  }
});

/**
 * Apply a single change to user data using Last-Write-Wins
 */
function applyChange(
  userData: UserData,
  change: LocalChange
): { applied: boolean; conflict: boolean } {
  const { table, recordId, operation, payload, timestamp } = change;

  // Get the appropriate array from userData
  const dataArray = getDataArray(userData, table);
  if (!dataArray) {
    return { applied: false, conflict: false };
  }

  const existingIndex = dataArray.findIndex((r: SyncableRecord) => r.id === recordId);
  const existingRecord = existingIndex >= 0 ? dataArray[existingIndex] : null;

  // Last-Write-Wins: compare timestamps
  if (existingRecord) {
    const existingTime = new Date(getUpdatedAt(existingRecord)).getTime();
    const changeTime = new Date(timestamp).getTime();

    if (changeTime <= existingTime) {
      // Existing record is newer or same time, don't apply
      return { applied: false, conflict: true };
    }
  }

  switch (operation) {
    case 'create':
    case 'update':
      if (payload) {
        const newRecord = payload as SyncableRecord;
        if (existingIndex >= 0) {
          dataArray[existingIndex] = newRecord;
        } else {
          dataArray.push(newRecord);
        }
        return { applied: true, conflict: existingRecord !== null };
      }
      break;

    case 'delete':
      if (existingIndex >= 0) {
        // Soft delete - mark as deleted instead of removing
        (dataArray[existingIndex] as SyncableRecord)._deleted = true;
        return { applied: true, conflict: false };
      }
      break;
  }

  return { applied: false, conflict: false };
}

/**
 * Get the data array for a table name
 */
function getDataArray(userData: UserData, table: string): SyncableRecord[] | null {
  switch (table) {
    case 'items': return userData.items;
    case 'trips': return userData.trips;
    case 'tripItems': return userData.tripItems;
    case 'outfits': return userData.outfits;
    case 'wishlist': return userData.wishlist;
    default: return null;
  }
}

/**
 * Get updatedAt timestamp from a record
 */
function getUpdatedAt(record: SyncableRecord): string {
  if ('updatedAt' in record && record.updatedAt) {
    return record.updatedAt;
  }
  if ('createdAt' in record && record.createdAt) {
    return record.createdAt;
  }
  return new Date(0).toISOString();
}

