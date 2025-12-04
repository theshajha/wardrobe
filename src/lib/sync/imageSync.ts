/**
 * Image Sync Manager for Fitso.me
 * Handles uploading/downloading images to/from Cloudflare R2
 */

import {
    computeImageHash,
    db,
    getItemsNeedingImageSync,
    updateImageSyncStatus,
    type ImageSyncStatus,
    type Item
} from '@/db';
import { getAuthHeaders } from './auth';
import type { PresignedUrlResponse } from './types';
import { SYNC_API_URL } from './types';

/**
 * Convert base64 data URL to Blob
 */
function base64ToBlob(base64: string): Blob {
    const parts = base64.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const binaryString = atob(parts[1]);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    return new Blob([bytes], { type: mime });
}

/**
 * Convert Blob to base64 data URL
 */
async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Get presigned URL for image upload
 */
async function getPresignedUploadUrl(
    hash: string,
    contentType: string,
    size: number
): Promise<PresignedUrlResponse> {
    const apiUrl = SYNC_API_URL;
    if (!apiUrl) {
        return { success: false, error: 'Sync API not configured' };
    }

    try {
        const response = await fetch(`${apiUrl}/images/presign-upload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(await getAuthHeaders()),
            },
            body: JSON.stringify({ hash, contentType, size }),
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, error: data.error || 'Failed to get upload URL' };
        }

        return data;
    } catch (error) {
        console.error('[ImageSync] Failed to get presigned URL:', error);
        return { success: false, error: 'Network error' };
    }
}

/**
 * Upload a single image to R2
 */
export async function uploadImage(item: Item): Promise<{
    success: boolean;
    imageRef?: string;
    error?: string;
}> {
    if (!item.imageData) {
        return { success: false, error: 'No image data' };
    }

    try {
        // Mark as uploading
        await updateImageSyncStatus(item.id, 'uploading');

        // Compute hash for deduplication
        const hash = await computeImageHash(item.imageData);
        const blob = base64ToBlob(item.imageData);
        const contentType = blob.type;
        const size = blob.size;

        // Get presigned URL
        const presignResult = await getPresignedUploadUrl(hash, contentType, size);

        if (!presignResult.success) {
            await updateImageSyncStatus(item.id, 'error');
            return { success: false, error: presignResult.error };
        }

        // Image already exists (deduplication)
        if (presignResult.alreadyExists && presignResult.imageRef) {
            await updateImageSyncStatus(item.id, 'synced', presignResult.imageRef, hash);
            return { success: true, imageRef: presignResult.imageRef };
        }

        // Upload to R2 through worker endpoint
        if (!presignResult.uploadUrl) {
            await updateImageSyncStatus(item.id, 'error');
            return { success: false, error: 'No upload URL received' };
        }

        // The uploadUrl is relative, make it absolute and add auth
        const apiUrl = SYNC_API_URL;
        const fullUploadUrl = presignResult.uploadUrl.startsWith('http')
            ? presignResult.uploadUrl
            : `${apiUrl}${presignResult.uploadUrl}`;

        const uploadResponse = await fetch(fullUploadUrl, {
            method: 'PUT',
            body: blob,
            headers: {
                'Content-Type': contentType,
                ...(await getAuthHeaders()),
            },
        });

        if (!uploadResponse.ok) {
            await updateImageSyncStatus(item.id, 'error');
            return { success: false, error: 'Upload failed' };
        }

        // Update item with cloud reference
        await updateImageSyncStatus(item.id, 'synced', presignResult.imageRef, hash);

        return { success: true, imageRef: presignResult.imageRef };
    } catch (error) {
        console.error('[ImageSync] Upload failed for item:', item.id, error);
        await updateImageSyncStatus(item.id, 'error');
        return { success: false, error: String(error) };
    }
}

/**
 * Download an image from R2
 */
export async function downloadImage(imageRef: string): Promise<{
    success: boolean;
    data?: string;
    error?: string;
}> {
    const apiUrl = SYNC_API_URL;
    if (!apiUrl) {
        console.error('[ImageSync] API URL not configured');
        return { success: false, error: 'Sync API not configured' };
    }

    try {
        const url = `${apiUrl}/images/${encodeURIComponent(imageRef)}`;
        console.log('[ImageSync] Downloading image from:', url, 'imageRef:', imageRef);

        const response = await fetch(url, {
            method: 'GET',
            headers: await getAuthHeaders(),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[ImageSync] Download failed:', response.status, errorText);
            return { success: false, error: `Download failed: ${response.status} ${errorText}` };
        }

        const blob = await response.blob();
        console.log('[ImageSync] Downloaded blob:', blob.size, 'bytes, type:', blob.type);
        const base64 = await blobToBase64(blob);
        console.log('[ImageSync] Converted to base64, length:', base64.length);

        return { success: true, data: base64 };
    } catch (error) {
        console.error('[ImageSync] Download failed for:', imageRef, error);
        return { success: false, error: String(error) };
    }
}

/**
 * Sync all pending images
 */
export async function syncAllImages(
    onProgress?: (current: number, total: number) => void
): Promise<{
    uploaded: number;
    failed: number;
    skipped: number;
}> {
    const itemsNeedingSync = await getItemsNeedingImageSync();
    const total = itemsNeedingSync.length;
    let uploaded = 0;
    let failed = 0;
    let skipped = 0;

    for (let i = 0; i < itemsNeedingSync.length; i++) {
        const item = itemsNeedingSync[i];
        onProgress?.(i + 1, total);

        // Skip items without images
        if (!item.imageData) {
            skipped++;
            continue;
        }

        // Skip already synced images (by hash comparison)
        if (item.imageHash && item.imageSyncStatus === 'synced') {
            const currentHash = await computeImageHash(item.imageData);
            if (currentHash === item.imageHash) {
                skipped++;
                continue;
            }
        }

        const result = await uploadImage(item);
        if (result.success) {
            uploaded++;
        } else {
            failed++;
        }
    }

    return { uploaded, failed, skipped };
}

/**
 * Download images for items that have cloud refs but no local data
 */
export async function downloadMissingImages(
    onProgress?: (current: number, total: number) => void
): Promise<{
    downloaded: number;
    failed: number;
}> {
    const { setTrackingEnabled } = await import('./changeTracker');

    // Find items with cloud refs but no local image data
    const items = await db.items
        .filter(item =>
            !!item.imageRef &&
            !item.imageData &&
            item.imageSyncStatus !== 'error'
        )
        .toArray();

    const total = items.length;
    console.log(`[ImageSync] Found ${total} items needing image download`);

    if (total > 0) {
        console.log('[ImageSync] Sample items:', items.slice(0, 3).map(i => ({
            id: i.id,
            name: i.name,
            imageRef: i.imageRef,
            hasImageData: !!i.imageData,
            syncStatus: i.imageSyncStatus
        })));
    }

    let downloaded = 0;
    let failed = 0;

    // Disable tracking for internal sync operations
    setTrackingEnabled(false);

    try {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            onProgress?.(i + 1, total);

            if (!item.imageRef) continue;

            console.log(`[ImageSync] Downloading ${i + 1}/${total}: ${item.name} (${item.imageRef})`);
            const result = await downloadImage(item.imageRef);
            if (result.success && result.data) {
                // Store downloaded image
                await db.items.update(item.id, {
                    imageData: result.data,
                    imageSyncStatus: 'synced' as ImageSyncStatus,
                });
                console.log(`[ImageSync] ✓ Downloaded: ${item.name}`);
                downloaded++;
            } else {
                await db.items.update(item.id, {
                    imageSyncStatus: 'error' as ImageSyncStatus,
                });
                console.error(`[ImageSync] ✗ Failed: ${item.name} - ${result.error}`);
                failed++;
            }
        }
    } finally {
        setTrackingEnabled(true);
    }

    console.log(`[ImageSync] Download complete: ${downloaded} succeeded, ${failed} failed`);
    return { downloaded, failed };
}

/**
 * Check if an image exists in the cloud by hash
 */
export async function checkImageExists(hash: string): Promise<boolean> {
    const apiUrl = SYNC_API_URL;
    if (!apiUrl) return false;

    try {
        const response = await fetch(`${apiUrl}/images/check/${hash}`, {
            method: 'GET',
            headers: await getAuthHeaders(),
        });

        if (!response.ok) return false;

        const data = await response.json();
        return data.exists === true;
    } catch {
        return false;
    }
}

/**
 * Get image sync statistics
 */
export async function getImageSyncStats(): Promise<{
    total: number;
    synced: number;
    pending: number;
    uploading: number;
    errors: number;
    localOnly: number;
}> {
    const items = await db.items.toArray();

    const stats = {
        total: 0,
        synced: 0,
        pending: 0,
        uploading: 0,
        errors: 0,
        localOnly: 0,
    };

    for (const item of items) {
        if (!item.imageData && !item.imageRef) continue;

        stats.total++;

        switch (item.imageSyncStatus) {
            case 'synced':
                stats.synced++;
                break;
            case 'uploading':
                stats.uploading++;
                break;
            case 'error':
                stats.errors++;
                break;
            case 'local':
            default:
                if (item.imageData) {
                    stats.localOnly++;
                    stats.pending++;
                }
                break;
        }
    }

    return stats;
}

