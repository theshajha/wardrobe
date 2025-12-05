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
    imageData?: string; // base64 encoded image (for demo mode only)
    imageRef?: string; // Cloud reference path (e.g., "images/{hash}.jpg")
    imageHash?: string; // SHA-256 hash for deduplication
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
    updatedAt?: string;
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

// Database class (used for demo mode only)
class WardrobeDatabase extends Dexie {
    items!: EntityTable<Item, 'id'>;
    trips!: EntityTable<Trip, 'id'>;
    tripItems!: EntityTable<TripItem, 'id'>;
    outfits!: EntityTable<Outfit, 'id'>;
    wishlist!: EntityTable<WishlistItem, 'id'>;

    constructor() {
        super('FitSoMeDB');

        // Version 5: Current schema (for demo mode)
        this.version(5).stores({
            items: 'id, name, category, condition, location, isPhaseOut, isFeatured, createdAt, updatedAt',
            trips: 'id, name, status, createdAt, updatedAt',
            tripItems: 'id, tripId, itemId',
            outfits: 'id, name, occasion, createdAt',
            wishlist: 'id, name, category, priority, isPurchased, createdAt, updatedAt',
        });
    }
}

export const db = new WardrobeDatabase();

// Helper functions
export function generateId(): string {
    return crypto.randomUUID();
}

// Export data (for demo mode export)
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

// Import data (for demo mode)
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
