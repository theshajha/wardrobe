/**
 * Public Routes for Fitso.me
 * Handles public showcase pages (no auth required)
 */

import { Hono } from 'hono';
import type { Env } from '../types';
import { getUserByUsername } from '../utils/auth';
import { loadFeaturedData } from '../utils/dataAccess';

export const publicRouter = new Hono<{ Bindings: Env }>();

/**
 * GET /public/showcase/:username
 * Get public showcase data for a user
 */
publicRouter.get('/showcase/:username', async (c) => {
  try {
    const username = c.req.param('username')?.toLowerCase();

    if (!username) {
      return c.json({ success: false, error: 'Username required' }, 400);
    }

    // Look up user by username
    const userInfo = await getUserByUsername(username, c.env);

    if (!userInfo) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // Check if showcase is enabled
    if (!userInfo.showcaseEnabled) {
      return c.json({ success: false, error: 'Showcase not enabled' }, 403);
    }

    // Load featured items and outfits using data access layer
    const { items: publicItems, outfits: publicOutfits } = await loadFeaturedData(c.env.R2_BUCKET, username);

    return c.json({
      success: true,
      username,
      displayName: userInfo.displayName || username,  // Fallback to username if no display name
      data: {
        items: publicItems,
        outfits: publicOutfits,
        // Include basic stats
        stats: {
          totalItems: publicItems.length,
          totalOutfits: publicOutfits.length,
        },
      },
    });
  } catch (error) {
    console.error('Showcase error:', error);
    return c.json({ success: false, error: 'Server error' }, 500);
  }
});

/**
 * GET /public/showcase/:username/image/:hash
 * Get a public image (only if showcase is enabled)
 */
publicRouter.get('/showcase/:username/image/:hash', async (c) => {
  try {
    const username = c.req.param('username')?.toLowerCase();
    const hash = c.req.param('hash');

    if (!username || !hash) {
      return c.json({ error: 'Invalid request' }, 400);
    }

    // Verify showcase is enabled for this user
    const userInfo = await getUserByUsername(username, c.env);
    if (!userInfo || !userInfo.showcaseEnabled) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Get image from R2
    const imageKey = `${username}/images/${hash}`;
    const object = await c.env.R2_BUCKET.get(imageKey);

    if (!object) {
      return c.json({ error: 'Image not found' }, 404);
    }

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('ETag', object.httpEtag);

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Public image error:', error);
    return c.json({ error: 'Server error' }, 500);
  }
});

/**
 * GET /public/images/:path
 * Serve images publicly (for authenticated users viewing in-app)
 * The path should be: {username}/images/{hash}
 */
publicRouter.get('/images/:path{.+}', async (c) => {
  try {
    const path = c.req.param('path');

    if (!path || !path.includes('/images/')) {
      return c.json({ error: 'Invalid image path' }, 400);
    }

    // Get image from R2
    const object = await c.env.R2_BUCKET.get(path);

    if (!object) {
      return c.json({ error: 'Image not found' }, 404);
    }

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('ETag', object.httpEtag);
    // Allow cross-origin access
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Public image error:', error);
    return c.json({ error: 'Server error' }, 500);
  }
});

/**
 * GET /public/check/:username
 * Check if a username exists and has showcase enabled
 */
publicRouter.get('/check/:username', async (c) => {
  try {
    const username = c.req.param('username')?.toLowerCase();

    if (!username) {
      return c.json({ exists: false, showcaseEnabled: false });
    }

    const userInfo = await getUserByUsername(username, c.env);

    return c.json({
      exists: !!userInfo,
      showcaseEnabled: userInfo?.showcaseEnabled || false,
    });
  } catch (error) {
    return c.json({ exists: false, showcaseEnabled: false });
  }
});

