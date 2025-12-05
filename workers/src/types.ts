/**
 * Type definitions for Fitso.me Sync Worker
 */

// Cloudflare bindings
export interface Env {
  R2_BUCKET: R2Bucket;  // Single bucket for all user data: {userId}/data.json and {userId}/images/{hash}
  AUTH_KV: KVNamespace;

  // Environment variables
  ENVIRONMENT: string;
  APP_URL: string;
  CORS_ORIGINS: string;

  // Secrets (set via wrangler secret put)
  RESEND_API_KEY?: string;
  JWT_SECRET?: string;
  EMAIL_FROM?: string;
  MIGRATION_SECRET?: string;  // For one-time R2 to Supabase migration
}

// User data stored in R2
export interface UserData {
  version: number;
  updatedAt: string;
  items: SyncItem[];
  trips: SyncTrip[];
  tripItems: SyncTripItem[];
  outfits: SyncOutfit[];
  wishlist: SyncWishlistItem[];
}

// Sync record types (without imageData for metadata)
export interface SyncItem {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  color?: string;
  brand?: string;
  size?: unknown;
  purchaseDate?: string;
  cost?: number;
  currency?: string;
  condition: string;
  imageRef?: string;
  imageHash?: string;
  notes?: string;
  tags?: string[];
  location: string;
  isPhaseOut: boolean;
  isFeatured: boolean;
  climate?: string;
  occasion?: string;
  createdAt: string;
  updatedAt: string;
  _deleted?: boolean;
}

export interface SyncTrip {
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
}

export interface SyncTripItem {
  id: string;
  tripId: string;
  itemId: string;
  packed: boolean;
  quantity: number;
  _deleted?: boolean;
}

export interface SyncOutfit {
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
}

export interface SyncWishlistItem {
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
}

// Auth types
export interface Session {
  userId: string;
  username: string;  // Human-readable, used for R2 storage and showcase URLs
  email: string;
  createdAt: string;
  expiresAt: string;
}

export interface MagicLinkData {
  email: string;
  createdAt: string;
}

// API request/response types
export interface SyncPullResponse {
  success: boolean;
  version: number;
  changes: {
    items: { upserts: SyncItem[]; deletes: string[] };
    trips: { upserts: SyncTrip[]; deletes: string[] };
    tripItems: { upserts: SyncTripItem[]; deletes: string[] };
    outfits: { upserts: SyncOutfit[]; deletes: string[] };
    wishlist: { upserts: SyncWishlistItem[]; deletes: string[] };
  };
  error?: string;
}

export interface LocalChange {
  id: string;
  table: 'items' | 'trips' | 'tripItems' | 'outfits' | 'wishlist';
  recordId: string;
  operation: 'create' | 'update' | 'delete';
  timestamp: string;
  payload?: unknown;
}

export interface SyncPushRequest {
  lastSyncVersion: number;
  changes: LocalChange[];
}

export interface SyncPushResponse {
  success: boolean;
  version: number;
  conflictIds?: string[];
  error?: string;
}

// Image types
export interface ImageMetadata {
  hash: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
}

