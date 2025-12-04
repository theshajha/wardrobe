import { type SizeInfo } from '@/lib/utils';
import Dexie, { type EntityTable } from 'dexie';

// Sync status types
export type ImageSyncStatus = 'local' | 'uploading' | 'synced' | 'cloud-only' | 'error';
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'error';

// Types
export interface Item {
    id: string;
    name: string;
    category: string;
    subcategory?: string;
    color?: string;
    brand?: string;
    size?: SizeInfo; // Smart size based on category
    purchaseDate?: string;
    cost?: number; // Purchase cost
    currency?: string; // Currency code (USD, EUR, etc.)
    condition: string;
    imageData?: string; // base64 encoded image (local storage)
    imageRef?: string; // Cloud reference path (e.g., "images/{hash}.jpg")
    imageHash?: string; // SHA-256 hash for deduplication
    imageSyncStatus?: ImageSyncStatus; // Track image sync state
    notes?: string;
    tags?: string[];
    location: string;
    isPhaseOut: boolean;
    isFeatured: boolean; // For showcase feature
    climate?: string;
    occasion?: string;
    createdAt: string;
    updatedAt: string;
    _deleted?: boolean; // Soft delete for sync
    _syncVersion?: number; // Version when last synced
}

export interface Trip {
    id: string;
    name: string;
    destination?: string;
    startDate?: string;
    endDate?: string;
    climate?: string;
    occasion?: string;
    notes?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    _deleted?: boolean;
    _syncVersion?: number;
}

export interface TripItem {
    id: string;
    tripId: string;
    itemId: string;
    packed: boolean;
    quantity: number;
    _deleted?: boolean;
    _syncVersion?: number;
}

export interface Outfit {
    id: string;
    name: string;
    occasion?: string;
    season?: string;
    notes?: string;
    rating?: number;
    lastWorn?: string;
    itemIds: string[];
    createdAt: string;
    updatedAt?: string;
    _deleted?: boolean;
    _syncVersion?: number;
}

export interface WishlistItem {
    id: string;
    name: string;
    category?: string;
    quantity: number;
    priority: 'low' | 'medium' | 'high';
    estimatedCost?: number;
    currency?: string;
    link?: string;
    notes?: string;
    isPurchased: boolean;
    purchasedAt?: string;
    createdAt: string;
    updatedAt: string;
    _deleted?: boolean;
    _syncVersion?: number;
}

// Sync-related types
export type ChangeOperation = 'create' | 'update' | 'delete';
export type SyncTable = 'items' | 'trips' | 'tripItems' | 'outfits' | 'wishlist';

export interface ChangeLog {
    id: string;
    table: SyncTable;
    recordId: string;
    operation: ChangeOperation;
    timestamp: string;
    payload?: string; // JSON stringified data
    synced: boolean;
    syncedAt?: string;
    error?: string;
}

export interface SyncMeta {
    id: string; // 'sync-state'
    userId?: string;
    username?: string;  // Human-readable username for storage and showcase
    email?: string;
    sessionToken?: string;
    lastSyncAt?: string;
    lastSyncVersion: number;
    syncEnabled: boolean;
    pendingChanges: number;
    showcaseEnabled?: boolean;
    lastError?: string;
    lastErrorAt?: string;
}

export interface ImageUpload {
    id: string; // Same as item id
    hash: string; // SHA-256 of image data
    status: ImageSyncStatus;
    cloudRef?: string; // R2 path
    localData?: string; // base64 (temporary during upload)
    uploadAttempts: number;
    lastAttemptAt?: string;
    error?: string;
}

// Database class
class WardrobeDatabase extends Dexie {
    items!: EntityTable<Item, 'id'>;
    trips!: EntityTable<Trip, 'id'>;
    tripItems!: EntityTable<TripItem, 'id'>;
    outfits!: EntityTable<Outfit, 'id'>;
    wishlist!: EntityTable<WishlistItem, 'id'>;
    changeLog!: EntityTable<ChangeLog, 'id'>;
    syncMeta!: EntityTable<SyncMeta, 'id'>;
    imageUploads!: EntityTable<ImageUpload, 'id'>;

    constructor() {
        super('FitSoMeDB');

        // Version 1: Initial schema
        this.version(1).stores({
            items: 'id, name, category, condition, location, isPhaseOut, createdAt',
            trips: 'id, name, status, createdAt',
            tripItems: 'id, tripId, itemId',
            outfits: 'id, name, occasion, createdAt',
        });

        // Version 2: Added size field (no schema change needed, just data)
        this.version(2).stores({
            items: 'id, name, category, condition, location, isPhaseOut, createdAt',
            trips: 'id, name, status, createdAt',
            tripItems: 'id, tripId, itemId',
            outfits: 'id, name, occasion, createdAt',
        });

        // Version 3: Added isFeatured for showcase feature
        this.version(3).stores({
            items: 'id, name, category, condition, location, isPhaseOut, isFeatured, createdAt',
            trips: 'id, name, status, createdAt',
            tripItems: 'id, tripId, itemId',
            outfits: 'id, name, occasion, createdAt',
        });

        // Version 4: Added wishlist
        this.version(4).stores({
            items: 'id, name, category, condition, location, isPhaseOut, isFeatured, createdAt',
            trips: 'id, name, status, createdAt',
            tripItems: 'id, tripId, itemId',
            outfits: 'id, name, occasion, createdAt',
            wishlist: 'id, name, category, priority, isPurchased, createdAt',
        });

        // Version 5: Added cloud sync support
        this.version(5).stores({
            items: 'id, name, category, condition, location, isPhaseOut, isFeatured, createdAt, updatedAt, _deleted, imageSyncStatus',
            trips: 'id, name, status, createdAt, updatedAt, _deleted',
            tripItems: 'id, tripId, itemId, _deleted',
            outfits: 'id, name, occasion, createdAt, _deleted',
            wishlist: 'id, name, category, priority, isPurchased, createdAt, updatedAt, _deleted',
            changeLog: 'id, table, recordId, operation, timestamp, synced',
            syncMeta: 'id',
            imageUploads: 'id, hash, status',
        });
    }
}

export const db = new WardrobeDatabase();

// Helper functions
export function generateId(): string {
    return crypto.randomUUID();
}

export async function exportAllData() {
    const items = await db.items.toArray();
    const trips = await db.trips.toArray();
    const tripItems = await db.tripItems.toArray();
    const outfits = await db.outfits.toArray();
    const wishlist = await db.wishlist.toArray();

    return {
        version: '2.1',
        exportedAt: new Date().toISOString(),
        data: { items, trips, tripItems, outfits, wishlist },
    };
}

export async function importAllData(data: {
    data: {
        items?: Item[];
        trips?: Trip[];
        tripItems?: TripItem[];
        outfits?: Outfit[];
        wishlist?: WishlistItem[];
    };
}) {
    const results = { items: 0, trips: 0, tripItems: 0, outfits: 0, wishlist: 0 };

    if (data.data.items) {
        for (const item of data.data.items) {
            try {
                await db.items.put(item);
                results.items++;
            } catch (e) {
                console.warn('Skipping item:', item.id);
            }
        }
    }

    if (data.data.trips) {
        for (const trip of data.data.trips) {
            try {
                await db.trips.put(trip);
                results.trips++;
            } catch (e) {
                console.warn('Skipping trip:', trip.id);
            }
        }
    }

    if (data.data.tripItems) {
        for (const tripItem of data.data.tripItems) {
            try {
                await db.tripItems.put(tripItem);
                results.tripItems++;
            } catch (e) {
                console.warn('Skipping tripItem:', tripItem.id);
            }
        }
    }

    if (data.data.outfits) {
        for (const outfit of data.data.outfits) {
            try {
                await db.outfits.put(outfit);
                results.outfits++;
            } catch (e) {
                console.warn('Skipping outfit:', outfit.id);
            }
        }
    }

    if (data.data.wishlist) {
        for (const wishlistItem of data.data.wishlist) {
            try {
                await db.wishlist.put(wishlistItem);
                results.wishlist++;
            } catch (e) {
                console.warn('Skipping wishlist item:', wishlistItem.id);
            }
        }
    }

    return results;
}

// Storage estimation
export async function getStorageStats() {
    const items = await db.items.toArray();

    let totalImageSize = 0;
    let itemsWithImages = 0;

    for (const item of items) {
        if (item.imageData) {
            itemsWithImages++;
            // Estimate base64 size
            const base64Data = item.imageData.split(',')[1] || item.imageData;
            totalImageSize += Math.round(base64Data.length * 0.75);
        }
    }

    // Estimate non-image data (rough: ~1KB per item for metadata)
    const metadataSize = items.length * 1024;

    return {
        totalItems: items.length,
        itemsWithImages,
        totalImageSize,
        metadataSize,
        totalEstimatedSize: totalImageSize + metadataSize,
        averageImageSize: itemsWithImages > 0 ? Math.round(totalImageSize / itemsWithImages) : 0,
    };
}

// Export data with images as separate files
export async function exportWithImages(folderHandle: FileSystemDirectoryHandle) {
    const items = await db.items.toArray();
    const trips = await db.trips.toArray();
    const tripItems = await db.tripItems.toArray();
    const outfits = await db.outfits.toArray();
    const wishlist = await db.wishlist.toArray();

    // Create images subfolder
    const imagesFolder = await folderHandle.getDirectoryHandle('images', { create: true });

    // Track image mappings
    const imageMap: Record<string, string> = {};
    let imageCount = 0;

    // Export items with image references instead of base64
    const itemsForExport = await Promise.all(items.map(async (item) => {
        if (item.imageData) {
            const ext = item.imageData.startsWith('data:image/png') ? 'png' : 'jpg';
            const fileName = `${item.id}.${ext}`;

            try {
                // Convert base64 to blob and save
                const base64Data = item.imageData.split(',')[1];
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: `image/${ext}` });

                // Write image file
                const fileHandle = await imagesFolder.getFileHandle(fileName, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(blob);
                await writable.close();

                imageMap[item.id] = fileName;
                imageCount++;

                // Return item with image reference instead of base64
                return { ...item, imageData: undefined, imageFile: fileName };
            } catch (e) {
                console.warn('Failed to export image for item:', item.id);
                return item;
            }
        }
        return item;
    }));

    // Create export data
    const exportData = {
        version: '3.0',
        exportedAt: new Date().toISOString(),
        hasImages: imageCount > 0,
        imageCount,
        data: {
            items: itemsForExport,
            trips,
            tripItems,
            outfits,
            wishlist
        },
    };

    // Write JSON file
    const jsonFileName = `fitsome-backup-${new Date().toISOString().split('T')[0]}.json`;
    const jsonHandle = await folderHandle.getFileHandle(jsonFileName, { create: true });
    const jsonWritable = await jsonHandle.createWritable();
    await jsonWritable.write(JSON.stringify(exportData, null, 2));
    await jsonWritable.close();

    return { jsonFileName, imageCount };
}

// Import data with images from folder
export async function importWithImages(folderHandle: FileSystemDirectoryHandle) {
    const results = { items: 0, trips: 0, tripItems: 0, outfits: 0, wishlist: 0, images: 0 };

    // Find the JSON file
    let jsonData = null;
    // @ts-ignore - File System Access API iteration
    for await (const [name, entry] of folderHandle.entries()) {
        if (entry.kind === 'file' && name.endsWith('.json')) {
            const file = await (entry as FileSystemFileHandle).getFile();
            const text = await file.text();
            jsonData = JSON.parse(text);
            break;
        }
    }

    if (!jsonData) {
        throw new Error('No JSON backup file found in folder');
    }

    // Check for images folder
    let imagesFolder: FileSystemDirectoryHandle | null = null;
    try {
        imagesFolder = await folderHandle.getDirectoryHandle('images');
    } catch {
        // No images folder
    }

    // Import items with images
    if (jsonData.data.items) {
        for (const item of jsonData.data.items) {
            try {
                // Try to load image if referenced
                if (item.imageFile && imagesFolder) {
                    try {
                        const imageHandle = await imagesFolder.getFileHandle(item.imageFile);
                        const imageFile = await imageHandle.getFile();
                        const buffer = await imageFile.arrayBuffer();
                        const base64 = btoa(
                            new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
                        );
                        const mimeType = item.imageFile.endsWith('.png') ? 'image/png' : 'image/jpeg';
                        item.imageData = `data:${mimeType};base64,${base64}`;
                        results.images++;
                    } catch {
                        console.warn('Could not load image:', item.imageFile);
                    }
                }
                delete item.imageFile;
                await db.items.put(item);
                results.items++;
            } catch (e) {
                console.warn('Skipping item:', item.id);
            }
        }
    }

    // Import other data
    if (jsonData.data.trips) {
        for (const trip of jsonData.data.trips) {
            try {
                await db.trips.put(trip);
                results.trips++;
            } catch (e) {
                console.warn('Skipping trip:', trip.id);
            }
        }
    }

    if (jsonData.data.tripItems) {
        for (const tripItem of jsonData.data.tripItems) {
            try {
                await db.tripItems.put(tripItem);
                results.tripItems++;
            } catch (e) {
                console.warn('Skipping tripItem:', tripItem.id);
            }
        }
    }

    if (jsonData.data.outfits) {
        for (const outfit of jsonData.data.outfits) {
            try {
                await db.outfits.put(outfit);
                results.outfits++;
            } catch (e) {
                console.warn('Skipping outfit:', outfit.id);
            }
        }
    }

    if (jsonData.data.wishlist) {
        for (const wishlistItem of jsonData.data.wishlist) {
            try {
                await db.wishlist.put(wishlistItem);
                results.wishlist++;
            } catch (e) {
                console.warn('Skipping wishlist item:', wishlistItem.id);
            }
        }
    }

    return results;
}

// ============================================
// SYNC HELPER FUNCTIONS
// ============================================

const SYNC_META_ID = 'sync-state';

// Get or create sync metadata
export async function getSyncMeta(): Promise<SyncMeta> {
    let meta = await db.syncMeta.get(SYNC_META_ID);
    if (!meta) {
        meta = {
            id: SYNC_META_ID,
            lastSyncVersion: 0,
            syncEnabled: false,
            pendingChanges: 0,
        };
        await db.syncMeta.add(meta);
    }
    return meta;
}

// Update sync metadata
export async function updateSyncMeta(updates: Partial<SyncMeta>): Promise<void> {
    await db.syncMeta.update(SYNC_META_ID, updates);
}

// Check if sync is enabled
export async function isSyncEnabled(): Promise<boolean> {
    const meta = await getSyncMeta();
    return meta.syncEnabled && !!meta.sessionToken;
}

// Get pending changes count
export async function getPendingChangesCount(): Promise<number> {
    return await db.changeLog.filter(log => log.synced === false).count();
}

// Add a change to the log (called by Dexie hooks)
export async function logChange(
    table: SyncTable,
    recordId: string,
    operation: ChangeOperation,
    payload?: unknown
): Promise<void> {
    const meta = await getSyncMeta();
    if (!meta.syncEnabled) return;

    await db.changeLog.add({
        id: generateId(),
        table,
        recordId,
        operation,
        timestamp: new Date().toISOString(),
        payload: payload ? JSON.stringify(payload) : undefined,
        synced: false,
    });

    // Update pending count
    const pendingCount = await getPendingChangesCount();
    await updateSyncMeta({ pendingChanges: pendingCount });

    // Trigger debounced sync if change tracking is enabled
    // Use dynamic import to avoid circular dependency
    import('@/lib/sync').then(({ syncEngine }) => {
        syncEngine.triggerDebouncedSync();
    }).catch(err => {
        console.warn('[logChange] Failed to trigger sync:', err);
    });
}

// Get unsynced changes
export async function getUnsyncedChanges(): Promise<ChangeLog[]> {
    return await db.changeLog.filter(log => log.synced === false).toArray();
}

// Mark changes as synced
export async function markChangesSynced(changeIds: string[]): Promise<void> {
    if (changeIds.length === 0) return;

    const now = new Date().toISOString();
    let updatedCount = 0;

    // Use transaction with individual updates for reliability
    await db.transaction('rw', db.changeLog, async () => {
        for (const id of changeIds) {
            const result = await db.changeLog.update(id, { synced: true, syncedAt: now });
            if (result === 1) {
                updatedCount++;
            } else {
                console.warn(`[DB] Failed to update changeLog entry: ${id}`);
            }
        }
    });

    console.log(`[DB] Successfully updated ${updatedCount}/${changeIds.length} changeLog entries`);

    // Update pending count
    const pendingCount = await getPendingChangesCount();
    console.log(`[DB] Pending changes count: ${pendingCount}`);
    await updateSyncMeta({ pendingChanges: pendingCount });
}

// Clear old synced changes (keep last 1000)
export async function cleanupSyncedChanges(): Promise<number> {
    const syncedChanges = await db.changeLog
        .filter(log => log.synced === true)
        .sortBy('timestamp');

    if (syncedChanges.length <= 1000) return 0;

    const toDelete = syncedChanges.slice(0, syncedChanges.length - 1000);
    await db.changeLog.bulkDelete(toDelete.map(c => c.id));
    return toDelete.length;
}

// Compute SHA-256 hash of image data
export async function computeImageHash(base64Data: string): Promise<string> {
    // Remove data URL prefix if present
    const cleanData = base64Data.includes(',')
        ? base64Data.split(',')[1]
        : base64Data;

    const binaryString = atob(cleanData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Get all data for sync (excluding soft-deleted)
export async function getDataForSync() {
    const [items, trips, tripItems, outfits, wishlist] = await Promise.all([
        db.items.filter(i => !i._deleted).toArray(),
        db.trips.filter(t => !t._deleted).toArray(),
        db.tripItems.filter(ti => !ti._deleted).toArray(),
        db.outfits.filter(o => !o._deleted).toArray(),
        db.wishlist.filter(w => !w._deleted).toArray(),
    ]);

    // Strip imageData from items for metadata sync (images synced separately)
    const itemsWithoutImages = items.map(({ imageData, ...rest }) => rest);

    return {
        items: itemsWithoutImages,
        trips,
        tripItems,
        outfits,
        wishlist,
    };
}

// Get items with pending image uploads
export async function getItemsNeedingImageSync(): Promise<Item[]> {
    return await db.items
        .filter(item =>
            !!item.imageData &&
            (!item.imageSyncStatus || item.imageSyncStatus === 'local' || item.imageSyncStatus === 'error')
        )
        .toArray();
}

// Update item's image sync status
export async function updateImageSyncStatus(
    itemId: string,
    status: ImageSyncStatus,
    imageRef?: string,
    imageHash?: string,
    skipTracking: boolean = true // Skip change tracking by default - this is an internal sync operation
): Promise<void> {
    const { setTrackingEnabled } = await import('@/lib/sync/changeTracker');
    const wasTracking = skipTracking;

    if (skipTracking) {
        setTrackingEnabled(false);
    }

    try {
        const updates: Partial<Item> = {
            imageSyncStatus: status,
            // Don't update updatedAt for sync status changes - it's an internal field
        };
        if (imageRef) updates.imageRef = imageRef;
        if (imageHash) updates.imageHash = imageHash;

        await db.items.update(itemId, updates);
    } finally {
        if (wasTracking) {
            setTrackingEnabled(true);
        }
    }
}

// Clear pending changes only (without logging out)
export async function clearPendingChanges(): Promise<void> {
    await db.changeLog.clear();
    await updateSyncMeta({ pendingChanges: 0, lastSyncVersion: 0 });
}

// Re-queue all data for sync (strips imageData from items)
// Also resets image sync status so images get re-uploaded
export async function requeueAllForSync(): Promise<number> {
    // Clear existing change log
    await db.changeLog.clear();

    // Get all data
    const [items, trips, tripItems, outfits, wishlist] = await Promise.all([
        db.items.filter(i => !i._deleted).toArray(),
        db.trips.filter(t => !t._deleted).toArray(),
        db.tripItems.filter(ti => !ti._deleted).toArray(),
        db.outfits.filter(o => !o._deleted).toArray(),
        db.wishlist.filter(w => !w._deleted).toArray(),
    ]);

    let count = 0;
    const now = new Date().toISOString();

    // Reset image sync status for all items so they get re-uploaded
    await db.items.bulkUpdate(
        items.map(item => ({
            key: item.id,
            changes: {
                imageSyncStatus: 'local' as ImageSyncStatus,
                imageRef: undefined,  // Clear old ref so new path is used
            }
        }))
    );

    // Queue items (without imageData)
    for (const item of items) {
        const { imageData, imageRef, ...itemWithoutImage } = item;
        await db.changeLog.add({
            id: `items-${item.id}-${Date.now()}-${count}`,
            table: 'items',
            recordId: item.id,
            operation: 'update',
            timestamp: now,
            payload: JSON.stringify({ ...itemWithoutImage, imageSyncStatus: 'local' }),
            synced: false,
        });
        count++;
    }

    // Queue trips
    for (const trip of trips) {
        await db.changeLog.add({
            id: `trips-${trip.id}-${Date.now()}-${count}`,
            table: 'trips',
            recordId: trip.id,
            operation: 'update',
            timestamp: now,
            payload: JSON.stringify(trip),
            synced: false,
        });
        count++;
    }

    // Queue tripItems
    for (const tripItem of tripItems) {
        await db.changeLog.add({
            id: `tripItems-${tripItem.id}-${Date.now()}-${count}`,
            table: 'tripItems',
            recordId: tripItem.id,
            operation: 'update',
            timestamp: now,
            payload: JSON.stringify(tripItem),
            synced: false,
        });
        count++;
    }

    // Queue outfits
    for (const outfit of outfits) {
        await db.changeLog.add({
            id: `outfits-${outfit.id}-${Date.now()}-${count}`,
            table: 'outfits',
            recordId: outfit.id,
            operation: 'update',
            timestamp: now,
            payload: JSON.stringify(outfit),
            synced: false,
        });
        count++;
    }

    // Queue wishlist
    for (const wishlistItem of wishlist) {
        await db.changeLog.add({
            id: `wishlist-${wishlistItem.id}-${Date.now()}-${count}`,
            table: 'wishlist',
            recordId: wishlistItem.id,
            operation: 'update',
            timestamp: now,
            payload: JSON.stringify(wishlistItem),
            synced: false,
        });
        count++;
    }

    // Update pending count and reset sync version to force full sync
    await updateSyncMeta({ pendingChanges: count, lastSyncVersion: 0 });

    return count;
}

// Sign out - clear sync data but keep user data
export async function clearSyncData(): Promise<void> {
    await db.changeLog.clear();
    await db.imageUploads.clear();
    await db.syncMeta.update(SYNC_META_ID, {
        userId: undefined,
        email: undefined,
        sessionToken: undefined,
        lastSyncAt: undefined,
        lastSyncVersion: 0,
        syncEnabled: false,
        pendingChanges: 0,
        lastError: undefined,
        lastErrorAt: undefined,
    });

    // Reset image sync status on all items
    const items = await db.items.toArray();
    await db.items.bulkUpdate(
        items.map(item => ({
            key: item.id,
            changes: { imageSyncStatus: 'local' as ImageSyncStatus }
        }))
    );
}

