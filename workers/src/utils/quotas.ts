/**
 * Resource Quotas and Rate Limits
 * Prevents abuse and ensures fair usage of the system
 */

export interface UserQuotas {
  // Storage limits
  maxImageSizeBytes: number;           // 1MB per image
  maxTotalStorageBytes: number;        // 100MB total per user
  maxImageDimensions: number;          // 4000x4000 pixels

  // Item limits
  maxTotalItems: number;               // 10,000 items total
  maxItemsPerDay: number;              // 200 new items per day
  maxTrips: number;                    // 100 trips
  maxOutfits: number;                  // 500 outfits
  maxWishlistItems: number;            // 1,000 wishlist items

  // Field length limits
  maxNameLength: number;               // 200 characters
  maxNotesLength: number;              // 5,000 characters
  maxBrandLength: number;              // 100 characters

  // Rate limits (requests per time window)
  sync: { requests: number; windowSeconds: number };           // 60 syncs per hour
  imageUpload: { requests: number; windowSeconds: number };    // 100 images per hour
  magicLink: { requests: number; windowSeconds: number };      // 3 magic links per hour
  apiGeneral: { requests: number; windowSeconds: number };     // 1000 API calls per hour
}

export const DEFAULT_QUOTAS: UserQuotas = {
  // Storage limits
  maxImageSizeBytes: 1 * 1024 * 1024,        // 1MB
  maxTotalStorageBytes: 100 * 1024 * 1024,   // 100MB
  maxImageDimensions: 2000,                   // 2000x2000px

  // Item limits
  maxTotalItems: 1000,
  maxItemsPerDay: 200,
  maxTrips: 100,
  maxOutfits: 500,
  maxWishlistItems: 1000,

  // Field length limits
  maxNameLength: 200,
  maxNotesLength: 5000,
  maxBrandLength: 100,

  // Rate limits
  sync: { requests: 60, windowSeconds: 3600 },           // 60/hour
  imageUpload: { requests: 100, windowSeconds: 3600 },   // 100/hour
  magicLink: { requests: 3, windowSeconds: 3600 },       // 3/hour
  apiGeneral: { requests: 1000, windowSeconds: 3600 },   // 1000/hour
};

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  current?: number;
  limit?: number;
  resetAt?: Date;
}

/**
 * Check rate limit using KV storage
 */
export async function checkRateLimit(
  kv: KVNamespace,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<QuotaCheckResult> {
  const now = Date.now();
  const windowKey = `ratelimit:${key}:${Math.floor(now / (windowSeconds * 1000))}`;

  // Get current count
  const currentStr = await kv.get(windowKey);
  const current = currentStr ? parseInt(currentStr, 10) : 0;

  if (current >= limit) {
    const windowStart = Math.floor(now / (windowSeconds * 1000)) * windowSeconds * 1000;
    const resetAt = new Date(windowStart + windowSeconds * 1000);

    return {
      allowed: false,
      reason: `Rate limit exceeded. Try again after ${resetAt.toISOString()}`,
      current,
      limit,
      resetAt,
    };
  }

  // Increment counter
  const newCount = current + 1;
  await kv.put(windowKey, String(newCount), {
    expirationTtl: windowSeconds * 2, // Keep for 2 windows for safety
  });

  return {
    allowed: true,
    current: newCount,
    limit,
  };
}

/**
 * Check daily item creation limit
 */
export async function checkDailyItemLimit(
  kv: KVNamespace,
  username: string,
  quotas: UserQuotas = DEFAULT_QUOTAS
): Promise<QuotaCheckResult> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const key = `daily-items:${username}:${today}`;

  const currentStr = await kv.get(key);
  const current = currentStr ? parseInt(currentStr, 10) : 0;

  if (current >= quotas.maxItemsPerDay) {
    return {
      allowed: false,
      reason: `Daily item creation limit exceeded (${quotas.maxItemsPerDay} items per day)`,
      current,
      limit: quotas.maxItemsPerDay,
    };
  }

  return {
    allowed: true,
    current,
    limit: quotas.maxItemsPerDay,
  };
}

/**
 * Increment daily item count
 */
export async function incrementDailyItemCount(
  kv: KVNamespace,
  username: string,
  count: number = 1
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const key = `daily-items:${username}:${today}`;

  const currentStr = await kv.get(key);
  const current = currentStr ? parseInt(currentStr, 10) : 0;
  const newCount = current + count;

  // Expire at end of day (86400 seconds = 24 hours, plus buffer)
  await kv.put(key, String(newCount), {
    expirationTtl: 86400 * 2, // 48 hours to be safe
  });
}

/**
 * Check total storage usage for a user
 */
export async function checkStorageQuota(
  bucket: R2Bucket,
  username: string,
  additionalBytes: number,
  quotas: UserQuotas = DEFAULT_QUOTAS
): Promise<QuotaCheckResult> {
  // List all objects for this user
  const listed = await bucket.list({
    prefix: `${username}/`,
  });

  // Calculate total size
  let totalSize = 0;
  for (const object of listed.objects) {
    totalSize += object.size;
  }

  const newTotal = totalSize + additionalBytes;

  if (newTotal > quotas.maxTotalStorageBytes) {
    return {
      allowed: false,
      reason: `Storage quota exceeded (${Math.round(quotas.maxTotalStorageBytes / 1024 / 1024)}MB limit)`,
      current: Math.round(totalSize / 1024 / 1024),
      limit: Math.round(quotas.maxTotalStorageBytes / 1024 / 1024),
    };
  }

  return {
    allowed: true,
    current: Math.round(totalSize / 1024 / 1024),
    limit: Math.round(quotas.maxTotalStorageBytes / 1024 / 1024),
  };
}

/**
 * Validate image constraints
 */
export function validateImage(
  sizeBytes: number,
  width?: number,
  height?: number,
  quotas: UserQuotas = DEFAULT_QUOTAS
): QuotaCheckResult {
  // Check file size
  if (sizeBytes > quotas.maxImageSizeBytes) {
    return {
      allowed: false,
      reason: `Image size exceeds limit (${Math.round(quotas.maxImageSizeBytes / 1024)}KB max)`,
      current: Math.round(sizeBytes / 1024),
      limit: Math.round(quotas.maxImageSizeBytes / 1024),
    };
  }

  // Check dimensions if provided
  if (width && height) {
    if (width > quotas.maxImageDimensions || height > quotas.maxImageDimensions) {
      return {
        allowed: false,
        reason: `Image dimensions exceed limit (${quotas.maxImageDimensions}x${quotas.maxImageDimensions}px max)`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Validate field lengths
 */
export function validateFieldLengths(
  fields: Record<string, string | undefined>,
  quotas: UserQuotas = DEFAULT_QUOTAS
): QuotaCheckResult {
  const checks: Array<{ field: string; value: string; max: number }> = [
    { field: 'name', value: fields.name || '', max: quotas.maxNameLength },
    { field: 'notes', value: fields.notes || '', max: quotas.maxNotesLength },
    { field: 'brand', value: fields.brand || '', max: quotas.maxBrandLength },
  ];

  for (const check of checks) {
    if (check.value.length > check.max) {
      return {
        allowed: false,
        reason: `Field '${check.field}' exceeds maximum length (${check.max} characters)`,
        current: check.value.length,
        limit: check.max,
      };
    }
  }

  return { allowed: true };
}

/**
 * Check total item count across all tables
 */
export function checkTotalItemCount(
  itemCount: number,
  tripCount: number,
  outfitCount: number,
  wishlistCount: number,
  quotas: UserQuotas = DEFAULT_QUOTAS
): QuotaCheckResult {
  // Check total items
  if (itemCount > quotas.maxTotalItems) {
    return {
      allowed: false,
      reason: `Total item limit exceeded (${quotas.maxTotalItems} items max)`,
      current: itemCount,
      limit: quotas.maxTotalItems,
    };
  }

  // Check trips
  if (tripCount > quotas.maxTrips) {
    return {
      allowed: false,
      reason: `Trip limit exceeded (${quotas.maxTrips} trips max)`,
      current: tripCount,
      limit: quotas.maxTrips,
    };
  }

  // Check outfits
  if (outfitCount > quotas.maxOutfits) {
    return {
      allowed: false,
      reason: `Outfit limit exceeded (${quotas.maxOutfits} outfits max)`,
      current: outfitCount,
      limit: quotas.maxOutfits,
    };
  }

  // Check wishlist
  if (wishlistCount > quotas.maxWishlistItems) {
    return {
      allowed: false,
      reason: `Wishlist limit exceeded (${quotas.maxWishlistItems} items max)`,
      current: wishlistCount,
      limit: quotas.maxWishlistItems,
    };
  }

  return { allowed: true };
}

/**
 * Create a rate limit key for a specific operation
 */
export function getRateLimitKey(operation: string, identifier: string): string {
  return `${operation}:${identifier}`;
}
