/**
 * Image Upload Service
 * Handles uploading images to R2 via the sync API
 */

import { supabase } from './supabase';

const SYNC_API_URL = import.meta.env.VITE_SYNC_API_URL || '';

/**
 * Compute SHA-256 hash of image data
 */
async function computeHash(data: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert base64 data URL to ArrayBuffer and content type
 */
function base64ToArrayBuffer(base64: string): { buffer: ArrayBuffer; contentType: string } {
    // Extract content type and base64 data
    const matches = base64.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
        throw new Error('Invalid base64 data URL');
    }

    const contentType = matches[1];
    const base64Data = matches[2];

    // Decode base64 to binary
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    return { buffer: bytes.buffer, contentType };
}

export interface ImageUploadResult {
    success: boolean;
    imageRef?: string;
    error?: string;
}

/**
 * Upload an image to R2 storage
 * @param imageData - Base64 encoded image data URL (data:image/jpeg;base64,...)
 * @returns The imageRef (path in R2) or error
 */
export async function uploadImage(imageData: string): Promise<ImageUploadResult> {
    try {
        // Get current user's session for auth
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return { success: false, error: 'Not authenticated' };
        }

        // Get username from profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', session.user.id)
            .single();

        if (!profile?.username) {
            return { success: false, error: 'Profile not found' };
        }

        // Convert base64 to buffer
        const { buffer, contentType } = base64ToArrayBuffer(imageData);

        // Compute hash
        const hash = await computeHash(buffer);

        // First, check if image already exists via presign endpoint
        const presignResponse = await fetch(`${SYNC_API_URL}/images/presign-upload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
                hash,
                contentType,
                size: buffer.byteLength,
            }),
        });

        const presignResult = await presignResponse.json();

        if (!presignResult.success) {
            return { success: false, error: presignResult.error || 'Failed to prepare upload' };
        }

        // If image already exists, return the existing imageRef
        if (presignResult.alreadyExists) {
            console.log('[ImageUpload] Image already exists:', presignResult.imageRef);
            return { success: true, imageRef: presignResult.imageRef };
        }

        // Upload the image
        const uploadResponse = await fetch(`${SYNC_API_URL}${presignResult.uploadUrl}`, {
            method: 'PUT',
            headers: {
                'Content-Type': contentType,
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: buffer,
        });

        const uploadResult = await uploadResponse.json();

        if (!uploadResult.success) {
            return { success: false, error: uploadResult.error || 'Failed to upload image' };
        }

        console.log('[ImageUpload] Image uploaded successfully:', uploadResult.imageRef);
        return { success: true, imageRef: uploadResult.imageRef };
    } catch (error) {
        console.error('[ImageUpload] Error uploading image:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Upload failed' };
    }
}

/**
 * Check if a string is a base64 data URL (as opposed to an imageRef path)
 */
export function isBase64Image(value: string | undefined): boolean {
    if (!value) return false;
    return value.startsWith('data:image/');
}

/**
 * Check if a string is an imageRef (R2 path)
 */
export function isImageRef(value: string | undefined): boolean {
    if (!value) return false;
    return value.includes('/images/') && !value.startsWith('data:');
}

