/**
 * Sync Engine for Fitso.me
 * Orchestrates bidirectional sync between local IndexedDB and Cloudflare R2
 * Uses Last-Write-Wins conflict resolution
 */

import { 
    db, 
    getSyncMeta, 
    updateSyncMeta, 
    getUnsyncedChanges, 
    markChangesSynced,
    cleanupSyncedChanges,
    type Item,
    type Trip,
    type TripItem,
    type Outfit,
    type WishlistItem,
    type SyncTable,
} from '@/db';
import { getAuthHeaders, isAuthenticated, validateSession } from './auth';
import { setTrackingEnabled } from './changeTracker';
import { syncAllImages, downloadMissingImages } from './imageSync';
import type {
    SyncResult,
    SyncPullResponse,
    SyncPushResponse,
    SyncChanges,
    LocalChange,
    SyncEventHandler,
    SyncEvent,
    SyncConfig,
} from './types';
import { SYNC_API_URL, DEFAULT_SYNC_CONFIG } from './types';

type SyncableRecord = Item | Trip | TripItem | Outfit | WishlistItem;

class SyncEngine {
    private syncInProgress = false;
    private autoSyncTimer: ReturnType<typeof setInterval> | null = null;
    private debouncedSyncTimer: ReturnType<typeof setTimeout> | null = null;
    private eventHandlers: Set<SyncEventHandler> = new Set();
    private config: SyncConfig;

    constructor(config: Partial<SyncConfig> = {}) {
        this.config = { ...DEFAULT_SYNC_CONFIG, ...config };
    }

    /**
     * Subscribe to sync events
     */
    subscribe(handler: SyncEventHandler): () => void {
        this.eventHandlers.add(handler);
        return () => this.eventHandlers.delete(handler);
    }

    /**
     * Emit sync event to all subscribers
     */
    private emit(event: SyncEvent): void {
        this.eventHandlers.forEach(handler => handler(event));
    }

    /**
     * Start auto-sync interval
     */
    startAutoSync(): void {
        if (this.autoSyncTimer) return;
        if (this.config.autoSyncInterval <= 0) return;

        this.autoSyncTimer = setInterval(() => {
            this.sync().catch(console.error);
        }, this.config.autoSyncInterval);

        console.log(`[SyncEngine] Auto-sync started (${this.config.autoSyncInterval / 1000}s interval)`);
    }

    /**
     * Stop auto-sync interval
     */
    stopAutoSync(): void {
        if (this.autoSyncTimer) {
            clearInterval(this.autoSyncTimer);
            this.autoSyncTimer = null;
            console.log('[SyncEngine] Auto-sync stopped');
        }
    }

    /**
     * Trigger a debounced sync (called when local data changes)
     */
    triggerDebouncedSync(): void {
        if (!this.config.syncOnChange) return;

        if (this.debouncedSyncTimer) {
            clearTimeout(this.debouncedSyncTimer);
        }

        this.debouncedSyncTimer = setTimeout(() => {
            this.sync().catch(console.error);
        }, this.config.syncDebounceMs);
    }

    /**
     * Main sync function - orchestrates pull, push, and image sync
     */
    async sync(): Promise<SyncResult> {
        const startTime = Date.now();
        
        // Prevent concurrent syncs
        if (this.syncInProgress) {
            return {
                success: false,
                pulled: 0,
                pushed: 0,
                imagesUploaded: 0,
                imagesDownloaded: 0,
                conflicts: 0,
                duration: 0,
                error: 'Sync already in progress',
            };
        }

        // Check if sync is enabled and authenticated
        const meta = await getSyncMeta();
        if (!meta.syncEnabled || !meta.sessionToken) {
            return {
                success: false,
                pulled: 0,
                pushed: 0,
                imagesUploaded: 0,
                imagesDownloaded: 0,
                conflicts: 0,
                duration: 0,
                error: 'Sync not enabled or not authenticated',
            };
        }

        this.syncInProgress = true;
        this.emit({ type: 'sync:started' });

        try {
            // Validate session first
            const sessionValid = await validateSession();
            if (!sessionValid) {
                this.emit({ type: 'auth:required' });
                throw new Error('Session expired');
            }

            let pulled = 0;
            let pushed = 0;
            let conflicts = 0;

            // Step 1: PULL - Get changes from server
            this.emit({ type: 'sync:progress', data: { step: 'pulling' } });
            const pullResult = await this.pullFromServer(meta.lastSyncVersion);
            
            if (pullResult.success) {
                // Apply server changes to local DB
                const applyResult = await this.applyPulledChanges(pullResult.changes);
                pulled = applyResult.total;
                conflicts = applyResult.conflicts;
                
                // Update sync version
                await updateSyncMeta({ lastSyncVersion: pullResult.version });
            }

            // Step 2: PUSH - Send local changes to server
            this.emit({ type: 'sync:progress', data: { step: 'pushing' } });
            const localChanges = await getUnsyncedChanges();
            console.log(`[Sync] Found ${localChanges.length} local changes to push`);
            
            if (localChanges.length > 0) {
                const pushResult = await this.pushToServer(meta.lastSyncVersion, localChanges);
                console.log('[Sync] Push result:', JSON.stringify(pushResult));
                
                if (pushResult.success) {
                    console.log(`[Sync] Push successful, marking ${localChanges.length} changes as synced`);
                    const changeIds = localChanges.map(c => c.id);
                    console.log('[Sync] Change IDs to mark:', changeIds.slice(0, 5), '...');
                    await markChangesSynced(changeIds);
                    pushed = localChanges.length;
                    
                    // Update sync version from push response
                    await updateSyncMeta({ lastSyncVersion: pushResult.version });
                } else if (pushResult.conflictIds && pushResult.conflictIds.length > 0) {
                    // Some items had conflicts - they were resolved by server
                    conflicts += pushResult.conflictIds.length;
                    console.log(`[Sync] ${conflicts} conflicts detected, re-pulling`);
                    
                    // Re-pull to get resolved state
                    const repullResult = await this.pullFromServer(meta.lastSyncVersion);
                    if (repullResult.success) {
                        await this.applyPulledChanges(repullResult.changes);
                        await updateSyncMeta({ lastSyncVersion: repullResult.version });
                    }
                } else {
                    console.log('[Sync] Push failed:', pushResult.error);
                }
            }

            // Step 3: Sync images
            this.emit({ type: 'sync:progress', data: { step: 'syncing-images' } });
            
            // Upload local images
            const uploadResult = await syncAllImages((current, total) => {
                this.emit({ 
                    type: 'sync:progress', 
                    data: { step: 'uploading-images', current, total } 
                });
            });

            // Download missing images
            const downloadResult = await downloadMissingImages((current, total) => {
                this.emit({ 
                    type: 'sync:progress', 
                    data: { step: 'downloading-images', current, total } 
                });
            });

            // Cleanup old synced changes
            await cleanupSyncedChanges();

            // Update last sync time
            await updateSyncMeta({ 
                lastSyncAt: new Date().toISOString(),
                lastError: undefined,
                lastErrorAt: undefined,
            });

            const result: SyncResult = {
                success: true,
                pulled,
                pushed,
                imagesUploaded: uploadResult.uploaded,
                imagesDownloaded: downloadResult.downloaded,
                conflicts,
                duration: Date.now() - startTime,
            };

            this.emit({ type: 'sync:completed', data: result });
            return result;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('[SyncEngine] Sync failed:', errorMessage);
            
            await updateSyncMeta({ 
                lastError: errorMessage,
                lastErrorAt: new Date().toISOString(),
            });

            this.emit({ type: 'sync:error', data: { error: errorMessage } });

            return {
                success: false,
                pulled: 0,
                pushed: 0,
                imagesUploaded: 0,
                imagesDownloaded: 0,
                conflicts: 0,
                duration: Date.now() - startTime,
                error: errorMessage,
            };
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Pull changes from server since a given version
     */
    private async pullFromServer(sinceVersion: number): Promise<SyncPullResponse> {
        const apiUrl = SYNC_API_URL;
        if (!apiUrl) {
            return { 
                success: false, 
                version: sinceVersion, 
                changes: this.emptyChanges(),
                error: 'API not configured' 
            };
        }

        try {
            const response = await fetch(`${apiUrl}/sync?since=${sinceVersion}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(await getAuthHeaders()),
                },
            });

            if (!response.ok) {
                const error = await response.text();
                return { 
                    success: false, 
                    version: sinceVersion, 
                    changes: this.emptyChanges(),
                    error 
                };
            }

            return await response.json();
        } catch (error) {
            return { 
                success: false, 
                version: sinceVersion, 
                changes: this.emptyChanges(),
                error: String(error) 
            };
        }
    }

    /**
     * Push local changes to server
     */
    private async pushToServer(
        lastSyncVersion: number, 
        changes: Array<{ id: string; table: SyncTable; recordId: string; operation: string; timestamp: string; payload?: string }>
    ): Promise<SyncPushResponse> {
        const apiUrl = SYNC_API_URL;
        if (!apiUrl) {
            return { success: false, version: lastSyncVersion, error: 'API not configured' };
        }

        // Transform changes for API
        const transformedChanges: LocalChange[] = changes.map(c => ({
            id: c.id,
            table: c.table,
            recordId: c.recordId,
            operation: c.operation as 'create' | 'update' | 'delete',
            timestamp: c.timestamp,
            payload: c.payload ? JSON.parse(c.payload) : undefined,
        }));

        try {
            console.log(`[Sync] Pushing ${transformedChanges.length} changes to server, lastSyncVersion: ${lastSyncVersion}`);
            const response = await fetch(`${apiUrl}/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(await getAuthHeaders()),
                },
                body: JSON.stringify({
                    lastSyncVersion,
                    changes: transformedChanges,
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                console.error('[Sync] Push failed with status:', response.status, error);
                return { success: false, version: lastSyncVersion, error };
            }

            const result = await response.json();
            console.log('[Sync] Server push response:', result);
            return result;
        } catch (error) {
            console.error('[Sync] Push error:', error);
            return { success: false, version: lastSyncVersion, error: String(error) };
        }
    }

    /**
     * Apply pulled changes to local database using Last-Write-Wins
     */
    private async applyPulledChanges(changes: SyncChanges): Promise<{
        total: number;
        conflicts: number;
    }> {
        let total = 0;
        let conflicts = 0;

        // Disable change tracking while applying server changes
        setTrackingEnabled(false);

        try {
            // Apply changes for each table
            const tables: Array<{ name: SyncTable; changes: { upserts: SyncableRecord[]; deletes: string[] } }> = [
                { name: 'items', changes: changes.items as { upserts: SyncableRecord[]; deletes: string[] } },
                { name: 'trips', changes: changes.trips as { upserts: SyncableRecord[]; deletes: string[] } },
                { name: 'tripItems', changes: changes.tripItems as { upserts: SyncableRecord[]; deletes: string[] } },
                { name: 'outfits', changes: changes.outfits as { upserts: SyncableRecord[]; deletes: string[] } },
                { name: 'wishlist', changes: changes.wishlist as { upserts: SyncableRecord[]; deletes: string[] } },
            ];

            for (const { name, changes: tableChanges } of tables) {
                // Apply upserts with LWW conflict resolution
                for (const serverRecord of tableChanges.upserts) {
                    const localRecord = await this.getLocalRecord(name, serverRecord.id);
                    
                    if (!localRecord) {
                        // New record from server
                        await this.upsertRecord(name, serverRecord);
                        total++;
                    } else {
                        // Check timestamps for LWW
                        const serverTime = new Date(this.getUpdatedAt(serverRecord)).getTime();
                        const localTime = new Date(this.getUpdatedAt(localRecord)).getTime();

                        if (serverTime > localTime) {
                            // Server wins - apply update
                            await this.upsertRecord(name, serverRecord);
                            total++;
                        } else if (serverTime === localTime && serverRecord !== localRecord) {
                            // Same timestamp but different data - count as conflict
                            // Server still wins (deterministic resolution)
                            await this.upsertRecord(name, serverRecord);
                            conflicts++;
                            total++;
                        }
                        // else: local is newer, keep local (will be pushed)
                    }
                }

                // Apply deletes
                for (const id of tableChanges.deletes) {
                    await this.softDeleteRecord(name, id);
                    total++;
                }
            }

            return { total, conflicts };
        } finally {
            setTrackingEnabled(true);
        }
    }

    /**
     * Get a record from local database
     */
    private async getLocalRecord(table: SyncTable, id: string): Promise<SyncableRecord | undefined> {
        switch (table) {
            case 'items': return db.items.get(id);
            case 'trips': return db.trips.get(id);
            case 'tripItems': return db.tripItems.get(id);
            case 'outfits': return db.outfits.get(id);
            case 'wishlist': return db.wishlist.get(id);
        }
    }

    /**
     * Upsert a record in local database
     * Preserves local imageData for items when syncing from server
     */
    private async upsertRecord(table: SyncTable, record: SyncableRecord): Promise<void> {
        // For items table, intelligently preserve local imageData
        if (table === 'items') {
            const itemRecord = record as Item;
            const localItem = await db.items.get(itemRecord.id);

            // Preserve local imageData in these scenarios:
            // 1. Server has same imageRef as local (same image in cloud)
            // 2. Server has no imageData and local has imageData (server never stores base64)
            // 3. Local has imageData but no imageRef (image not yet uploaded)

            if (localItem?.imageData) {
                // Case 1: ImageRefs match - definitely keep local imageData
                if (itemRecord.imageRef === localItem.imageRef) {
                    itemRecord.imageData = localItem.imageData;
                    console.log('[Sync] Preserving imageData for', itemRecord.name, '(matching imageRef)');
                }
                // Case 2: Server has imageRef but no imageData, and local has both
                else if (itemRecord.imageRef && !itemRecord.imageData) {
                    // Server has updated imageRef, keep it but we'll need to download the new image
                    // Don't overwrite with local imageData - let download handle it
                    console.log('[Sync] New imageRef from server for', itemRecord.name, '- will download');
                }
                // Case 3: Neither has imageRef - preserve local imageData (not yet uploaded)
                else if (!itemRecord.imageRef && !localItem.imageRef) {
                    itemRecord.imageData = localItem.imageData;
                    console.log('[Sync] Preserving imageData for', itemRecord.name, '(not yet synced to cloud)');
                }
                // Case 4: Local has imageData but no imageRef, server now has imageRef
                else if (!localItem.imageRef && itemRecord.imageRef) {
                    // Image was uploaded from another device, use server's imageRef but clear local imageData
                    // It will be downloaded in the next step
                    console.log('[Sync] Using server imageRef for', itemRecord.name, '- will download');
                }
            }

            await db.items.put(itemRecord);
        } else {
            switch (table) {
                case 'trips': await db.trips.put(record as Trip); break;
                case 'tripItems': await db.tripItems.put(record as TripItem); break;
                case 'outfits': await db.outfits.put(record as Outfit); break;
                case 'wishlist': await db.wishlist.put(record as WishlistItem); break;
            }
        }
    }

    /**
     * Soft delete a record
     */
    private async softDeleteRecord(table: SyncTable, id: string): Promise<void> {
        const update = { _deleted: true };
        switch (table) {
            case 'items': await db.items.update(id, update); break;
            case 'trips': await db.trips.update(id, update); break;
            case 'tripItems': await db.tripItems.update(id, update); break;
            case 'outfits': await db.outfits.update(id, update); break;
            case 'wishlist': await db.wishlist.update(id, update); break;
        }
    }

    /**
     * Get updatedAt timestamp from a record
     */
    private getUpdatedAt(record: SyncableRecord): string {
        if ('updatedAt' in record && record.updatedAt) {
            return record.updatedAt;
        }
        if ('createdAt' in record && record.createdAt) {
            return record.createdAt;
        }
        return new Date(0).toISOString();
    }

    /**
     * Create empty changes object
     */
    private emptyChanges(): SyncChanges {
        return {
            items: { upserts: [], deletes: [] },
            trips: { upserts: [], deletes: [] },
            tripItems: { upserts: [], deletes: [] },
            outfits: { upserts: [], deletes: [] },
            wishlist: { upserts: [], deletes: [] },
        };
    }

    /**
     * Get current sync status
     */
    async getStatus(): Promise<{
        enabled: boolean;
        authenticated: boolean;
        lastSyncAt: string | null;
        pendingChanges: number;
        inProgress: boolean;
        lastError: string | null;
    }> {
        const meta = await getSyncMeta();
        const authenticated = await isAuthenticated();

        return {
            enabled: meta.syncEnabled,
            authenticated,
            lastSyncAt: meta.lastSyncAt || null,
            pendingChanges: meta.pendingChanges,
            inProgress: this.syncInProgress,
            lastError: meta.lastError || null,
        };
    }
}

// Export singleton instance
export const syncEngine = new SyncEngine();

// Export class for testing/custom instances
export { SyncEngine };

