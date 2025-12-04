/**
 * Image Routes for Fitso.me Sync API
 * Handles image upload/download with R2 storage
 * Images are stored per-user: {userId}/images/{hash}
 * Same bucket as metadata: {userId}/data.json
 */

import { Hono } from 'hono';
import type { Env, ImageMetadata, Session } from '../types';

export const imagesRouter = new Hono<{
  Bindings: Env;
  Variables: { session: Session }
}>();

// Maximum image size (10MB)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

// Allowed content types
const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

/**
 * Build user-scoped image key: {userId}/images/{hash}
 */
function buildImageKey(userId: string, hash: string): string {
  return `${userId}/images/${hash}`;
}

/**
 * POST /images/presign-upload
 * Get a presigned URL for direct upload to R2
 */
imagesRouter.post('/presign-upload', async (c) => {
  try {
    const session = c.get('session');
    const body = await c.req.json<{
      hash: string;
      contentType: string;
      size: number;
    }>();

    const { hash, contentType, size } = body;

    // Validate input
    if (!hash || typeof hash !== 'string' || hash.length !== 64) {
      return c.json({ success: false, error: 'Invalid hash' }, 400);
    }

    if (!contentType || !ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return c.json({ success: false, error: 'Invalid content type' }, 400);
    }

    if (!size || size > MAX_IMAGE_SIZE) {
      return c.json({ success: false, error: 'Image too large (max 10MB)' }, 400);
    }

    // Image key is user-scoped for isolation
    const imageKey = buildImageKey(session.userId, hash);

    // Check if image already exists for this user (per-user deduplication)
    const existing = await c.env.R2_BUCKET.head(imageKey);
    if (existing) {
      return c.json({
        success: true,
        alreadyExists: true,
        imageRef: imageKey,
      });
    }

    // For Cloudflare R2, we can't create presigned URLs directly in Workers
    // Instead, we'll handle the upload through the Worker
    // Return a special endpoint URL for upload
    return c.json({
      success: true,
      alreadyExists: false,
      imageRef: imageKey,
      uploadUrl: `/images/upload/${hash}`,
      // Note: In production, you might want to use R2's multipart upload
      // or a direct presigned URL if you enable it in your R2 bucket settings
    });
  } catch (error) {
    console.error('Presign upload error:', error);
    return c.json({ success: false, error: 'Server error' }, 500);
  }
});

/**
 * PUT /images/upload/:hash
 * Upload an image directly through the Worker
 */
imagesRouter.put('/upload/:hash', async (c) => {
  try {
    const session = c.get('session');
    const hash = c.req.param('hash');

    if (!hash || hash.length !== 64) {
      return c.json({ success: false, error: 'Invalid hash' }, 400);
    }

    const contentType = c.req.header('Content-Type');
    if (!contentType || !ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return c.json({ success: false, error: 'Invalid content type' }, 400);
    }

    const body = await c.req.arrayBuffer();

    if (body.byteLength > MAX_IMAGE_SIZE) {
      return c.json({ success: false, error: 'Image too large' }, 400);
    }

    // Verify hash matches content
    const computedHash = await computeHash(body);
    if (computedHash !== hash) {
      return c.json({ success: false, error: 'Hash mismatch' }, 400);
    }

    // User-scoped image key
    const imageKey = buildImageKey(session.userId, hash);

    // Check if already exists for this user
    const existing = await c.env.R2_BUCKET.head(imageKey);
    if (existing) {
      return c.json({
        success: true,
        imageRef: imageKey,
        message: 'Image already exists',
      });
    }

    // Upload to R2
    const metadata: ImageMetadata = {
      hash,
      contentType,
      size: body.byteLength,
      uploadedAt: new Date().toISOString(),
      uploadedBy: session.userId,
    };

    await c.env.R2_BUCKET.put(imageKey, body, {
      httpMetadata: {
        contentType,
        cacheControl: 'public, max-age=31536000, immutable',
      },
      customMetadata: metadata as unknown as Record<string, string>,
    });

    return c.json({
      success: true,
      imageRef: imageKey,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return c.json({ success: false, error: 'Server error' }, 500);
  }
});

/**
 * GET /images/check/:hash
 * Check if an image exists for the current user
 */
imagesRouter.get('/check/:hash', async (c) => {
  try {
    const session = c.get('session');
    const hash = c.req.param('hash');

    if (!hash || hash.length !== 64) {
      return c.json({ exists: false });
    }

    // Check in user's image folder
    const imageKey = buildImageKey(session.userId, hash);
    const existing = await c.env.R2_BUCKET.head(imageKey);

    return c.json({ exists: !!existing });
  } catch (error) {
    console.error('Image check error:', error);
    return c.json({ exists: false });
  }
});

/**
 * GET /images/:path
 * Download an image (must belong to current user)
 */
imagesRouter.get('/:path{.+}', async (c) => {
  try {
    const session = c.get('session');
    const path = c.req.param('path');

    if (!path) {
      return c.json({ error: 'Path required' }, 400);
    }

    // The path should be the full imageRef ({userId}/images/{hash})
    // or just the hash for backward compatibility
    let imageKey: string;

    if (path.includes('/images/')) {
      // Full path provided - verify it belongs to this user
      if (!path.startsWith(`${session.userId}/`)) {
        return c.json({ error: 'Access denied' }, 403);
      }
      imageKey = path;
    } else {
      // Just hash provided - build user-scoped key
      const hash = path.replace('images/', '');
      imageKey = buildImageKey(session.userId, hash);
    }

    const object = await c.env.R2_BUCKET.get(imageKey);

    if (!object) {
      return c.json({ error: 'Image not found' }, 404);
    }

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('ETag', object.httpEtag);

    // Check for conditional request
    const ifNoneMatch = c.req.header('If-None-Match');
    if (ifNoneMatch === object.httpEtag) {
      return new Response(null, { status: 304, headers });
    }

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Image download error:', error);
    return c.json({ error: 'Server error' }, 500);
  }
});

/**
 * DELETE /images/:hash
 * Delete an image (user can only delete their own images)
 */
imagesRouter.delete('/:hash', async (c) => {
  try {
    const session = c.get('session');
    const hash = c.req.param('hash');

    if (!hash || hash.length !== 64) {
      return c.json({ success: false, error: 'Invalid hash' }, 400);
    }

    // User-scoped image key - users can only delete their own images
    const imageKey = buildImageKey(session.userId, hash);

    // Check if image exists
    const object = await c.env.R2_BUCKET.head(imageKey);
    if (!object) {
      return c.json({ success: true, message: 'Image already deleted' });
    }

    await c.env.R2_BUCKET.delete(imageKey);

    return c.json({ success: true });
  } catch (error) {
    console.error('Image delete error:', error);
    return c.json({ success: false, error: 'Server error' }, 500);
  }
});

/**
 * Compute SHA-256 hash of data
 */
async function computeHash(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

