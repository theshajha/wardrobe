import { type SizeInfo } from '@/lib/utils';
import Dexie, { type EntityTable } from 'dexie';

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
    imageData?: string; // base64 encoded image
    notes?: string;
    tags?: string[];
    location: string;
    isPhaseOut: boolean;
    isFeatured: boolean; // For showcase feature
    climate?: string;
    occasion?: string;
    createdAt: string;
    updatedAt: string;
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
}

export interface TripItem {
    id: string;
    tripId: string;
    itemId: string;
    packed: boolean;
    quantity: number;
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
}

// Database class
class WardrobeDatabase extends Dexie {
    items!: EntityTable<Item, 'id'>;
    trips!: EntityTable<Trip, 'id'>;
    tripItems!: EntityTable<TripItem, 'id'>;
    outfits!: EntityTable<Outfit, 'id'>;
    wishlist!: EntityTable<WishlistItem, 'id'>;

    constructor() {
        super('NomadWardrobe');

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
    const jsonFileName = `capsule-backup-${new Date().toISOString().split('T')[0]}.json`;
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

