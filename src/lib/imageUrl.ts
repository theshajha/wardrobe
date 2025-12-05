/**
 * Image URL utilities
 * Converts imageRef paths to full URLs for R2-stored images
 */

const SYNC_API_URL = import.meta.env.VITE_SYNC_API_URL || '';

/**
 * Get the full URL for an image from its imageRef
 * imageRef format: "{username}/images/{hash}" or just a hash
 * 
 * @param imageRef - The image reference path from the database
 * @returns Full URL to the image, or null if no imageRef
 */
export function getImageUrl(imageRef: string | undefined): string | null {
    if (!imageRef) return null;

    // If imageRef is already a full URL (data: URL or http), return as-is
    if (imageRef.startsWith('data:') || imageRef.startsWith('http')) {
        return imageRef;
    }

    // If SYNC_API_URL is not configured, we can't build the URL
    if (!SYNC_API_URL) {
        console.warn('[imageUrl] SYNC_API_URL is not configured');
        return null;
    }

    // imageRef format: "{username}/images/{hash}"
    // Use the public images endpoint
    return `${SYNC_API_URL}/public/images/${imageRef}`;
}

/**
 * Get a public image URL (for showcase)
 * @param username - The username whose showcase this is
 * @param imageRef - The image reference or hash
 * @returns Full public URL to the image
 */
export function getPublicImageUrl(username: string, imageRef: string | undefined): string | null {
    if (!imageRef || !username) return null;

    // If imageRef is already a full URL, return as-is
    if (imageRef.startsWith('data:') || imageRef.startsWith('http')) {
        return imageRef;
    }

    if (!SYNC_API_URL) {
        console.warn('[imageUrl] SYNC_API_URL is not configured');
        return null;
    }

    // Extract hash from imageRef if it's a full path
    let hash = imageRef;
    if (imageRef.includes('/')) {
        const parts = imageRef.split('/');
        hash = parts[parts.length - 1]; // Get the last part (hash)
    }

    return `${SYNC_API_URL}/public/showcase/${username}/image/${hash}`;
}
