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
} from '../types';
import {
  loadMetadata,
  saveMetadata,
  loadTableData,
  saveTableData,
  type SyncableRecord,
} from '../utils/dataAccess';
import {
  checkRateLimit,
  checkDailyItemLimit,
  checkTotalItemCount,
  incrementDailyItemCount,
  getRateLimitKey,
  DEFAULT_QUOTAS,
} from '../utils/quotas';

export const syncRouter = new Hono<{
  Bindings: Env;
  Variables: { session: Session }
}>();

/**
 * GET /sync
 * Pull changes from server since a given version
 */
syncRouter.get('/', async (c) => {
  try {
    const session = c.get('session');
    const sinceVersion = parseInt(c.req.query('since') || '0', 10);

    // Check sync rate limit
    const rateLimitKey = getRateLimitKey('sync', session.username);
    const rateCheck = await checkRateLimit(
      c.env.AUTH_KV,
      rateLimitKey,
      DEFAULT_QUOTAS.sync.requests,
      DEFAULT_QUOTAS.sync.windowSeconds
    );

    if (!rateCheck.allowed) {
      return c.json(
        {
          success: false,
          error: rateCheck.reason,
          retryAfter: rateCheck.resetAt?.toISOString(),
        } as SyncPullResponse,
        429
      );
    }

    // Load metadata
    const metadata = await loadMetadata(c.env.R2_BUCKET, session.username);

    // If client is at current version, no changes needed
    if (sinceVersion >= metadata.version) {
      const response: SyncPullResponse = {
        success: true,
        version: metadata.version,
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

    // Load all table data from separate files
    const [items, trips, tripItems, outfits, wishlist] = await Promise.all([
      loadTableData<SyncItem>(c.env.R2_BUCKET, session.username, 'items'),
      loadTableData<SyncTrip>(c.env.R2_BUCKET, session.username, 'trips'),
      loadTableData<SyncTripItem>(c.env.R2_BUCKET, session.username, 'tripItems'),
      loadTableData<SyncOutfit>(c.env.R2_BUCKET, session.username, 'outfits'),
      loadTableData<SyncWishlistItem>(c.env.R2_BUCKET, session.username, 'wishlist'),
    ]);

    // Return all current data (client will merge using timestamps)
    // Separate active records from deleted ones
    const response: SyncPullResponse = {
      success: true,
      version: metadata.version,
      changes: {
        items: {
          upserts: items.filter(i => !i._deleted),
          deletes: items.filter(i => i._deleted).map(i => i.id),
        },
        trips: {
          upserts: trips.filter(t => !t._deleted),
          deletes: trips.filter(t => t._deleted).map(t => t.id),
        },
        tripItems: {
          upserts: tripItems.filter(ti => !ti._deleted),
          deletes: tripItems.filter(ti => ti._deleted).map(ti => ti.id),
        },
        outfits: {
          upserts: outfits.filter(o => !o._deleted),
          deletes: outfits.filter(o => o._deleted).map(o => o.id),
        },
        wishlist: {
          upserts: wishlist.filter(w => !w._deleted),
          deletes: wishlist.filter(w => w._deleted).map(w => w.id),
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

    // Check sync rate limit
    const rateLimitKey = getRateLimitKey('sync', session.username);
    const rateCheck = await checkRateLimit(
      c.env.AUTH_KV,
      rateLimitKey,
      DEFAULT_QUOTAS.sync.requests,
      DEFAULT_QUOTAS.sync.windowSeconds
    );

    if (!rateCheck.allowed) {
      return c.json(
        {
          success: false,
          error: rateCheck.reason,
          retryAfter: rateCheck.resetAt?.toISOString(),
        } as SyncPushResponse,
        429
      );
    }

    // Count new item creations for daily limit check
    const newItemCount = changes.filter(
      c => c.table === 'items' && c.operation === 'create'
    ).length;

    if (newItemCount > 0) {
      // Check daily item creation limit
      const dailyCheck = await checkDailyItemLimit(c.env.AUTH_KV, session.username);
      if (!dailyCheck.allowed) {
        return c.json({ success: false, error: dailyCheck.reason } as SyncPushResponse, 429);
      }
    }

    // Load current metadata
    const metadata = await loadMetadata(c.env.R2_BUCKET, session.username);

    // Check for version conflict (optimistic locking)
    const conflictIds: string[] = [];

    if (lastSyncVersion !== metadata.version) {
      // There are server changes the client doesn't have
      // We'll still apply changes using LWW, but flag conflicts
      console.log(`Version mismatch: client=${lastSyncVersion}, server=${metadata.version}`);
    }

    // Group changes by table for efficient processing
    const changesByTable = new Map<string, LocalChange[]>();
    for (const change of changes) {
      const tableChanges = changesByTable.get(change.table) || [];
      tableChanges.push(change);
      changesByTable.set(change.table, tableChanges);
    }

    // Load all table data to check total counts
    const [items, trips, outfits, wishlist] = await Promise.all([
      loadTableData<SyncItem>(c.env.R2_BUCKET, session.username, 'items'),
      loadTableData<SyncTrip>(c.env.R2_BUCKET, session.username, 'trips'),
      loadTableData<SyncOutfit>(c.env.R2_BUCKET, session.username, 'outfits'),
      loadTableData<SyncWishlistItem>(c.env.R2_BUCKET, session.username, 'wishlist'),
    ]);

    // Check total item counts (after applying changes would exceed limits)
    const activeItems = items.filter(i => !i._deleted);
    const activeTrips = trips.filter(t => !t._deleted);
    const activeOutfits = outfits.filter(o => !o._deleted);
    const activeWishlist = wishlist.filter(w => !w._deleted);

    const newItemsToAdd = changes.filter(c => c.table === 'items' && c.operation === 'create').length;
    const newTripsToAdd = changes.filter(c => c.table === 'trips' && c.operation === 'create').length;
    const newOutfitsToAdd = changes.filter(c => c.table === 'outfits' && c.operation === 'create').length;
    const newWishlistToAdd = changes.filter(c => c.table === 'wishlist' && c.operation === 'create').length;

    const countCheck = checkTotalItemCount(
      activeItems.length + newItemsToAdd,
      activeTrips.length + newTripsToAdd,
      activeOutfits.length + newOutfitsToAdd,
      activeWishlist.length + newWishlistToAdd
    );

    if (!countCheck.allowed) {
      return c.json({ success: false, error: countCheck.reason } as SyncPushResponse, 429);
    }

    // Process each table's changes
    for (const [tableName, tableChanges] of changesByTable) {
      // Load current table data
      const tableData = await loadTableData<SyncableRecord>(c.env.R2_BUCKET, session.username, tableName);

      // Apply changes using Last-Write-Wins
      for (const change of tableChanges) {
        const result = applyChangeToArray(tableData, change);
        if (result.conflict) {
          conflictIds.push(change.recordId);
        }
      }

      // Save updated table data
      await saveTableData(c.env.R2_BUCKET, session.username, tableName, tableData);
    }

    // Increment version and update timestamp
    metadata.version += 1;
    metadata.updatedAt = new Date().toISOString();
    await saveMetadata(c.env.R2_BUCKET, session.username, metadata, session);

    // Increment daily item counter if new items were created
    if (newItemCount > 0) {
      await incrementDailyItemCount(c.env.AUTH_KV, session.username, newItemCount);
    }

    const response: SyncPushResponse = {
      success: true,
      version: metadata.version,
      conflictIds: conflictIds.length > 0 ? conflictIds : undefined,
    };

    return c.json(response);
  } catch (error) {
    console.error('Sync push error:', error);
    return c.json({ success: false, error: 'Server error' } as SyncPushResponse, 500);
  }
});

/**
 * Apply a single change to an array using Last-Write-Wins
 */
function applyChangeToArray(
  dataArray: SyncableRecord[],
  change: LocalChange
): { applied: boolean; conflict: boolean } {
  const { recordId, operation, payload, timestamp } = change;

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

