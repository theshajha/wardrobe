/**
 * Migration Routes - One-time data export for R2 to Supabase migration
 * Protected by admin secret key
 */

import { Hono } from 'hono';
import type { Env } from '../types';
import { loadUserData } from '../utils/dataAccess';

export const migrationRouter = new Hono<{ Bindings: Env }>();

/**
 * GET /migration/export/:username
 * Export all user data from R2 for migration to Supabase
 * Requires X-Migration-Key header matching MIGRATION_SECRET env var
 */
migrationRouter.get('/export/:username', async (c) => {
  try {
    // Check migration secret
    const migrationKey = c.req.header('X-Migration-Key');
    const expectedKey = c.env.MIGRATION_SECRET;
    
    if (!expectedKey) {
      return c.json({ success: false, error: 'Migration not configured' }, 500);
    }
    
    if (!migrationKey || migrationKey !== expectedKey) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const username = c.req.param('username')?.toLowerCase();
    
    if (!username) {
      return c.json({ success: false, error: 'Username required' }, 400);
    }

    console.log(`[Migration] Exporting data for user: ${username}`);

    // Load all user data
    const userData = await loadUserData(c.env.R2_BUCKET, username);
    
    // Check if any data exists
    const hasData = userData.items.length > 0 || 
                    userData.trips.length > 0 || 
                    userData.outfits.length > 0 ||
                    userData.wishlist.length > 0;
    
    if (!hasData) {
      return c.json({ 
        success: false, 
        error: 'No data found for user',
        username 
      }, 404);
    }

    console.log(`[Migration] Found ${userData.items.length} items, ${userData.outfits.length} outfits for ${username}`);

    return c.json({
      success: true,
      username,
      data: userData,
      stats: {
        items: userData.items.length,
        trips: userData.trips.length,
        tripItems: userData.tripItems.length,
        outfits: userData.outfits.length,
        wishlist: userData.wishlist.length,
      }
    });
  } catch (error) {
    console.error('[Migration] Export error:', error);
    return c.json({ success: false, error: 'Server error' }, 500);
  }
});

/**
 * GET /migration/image/:username/:hash
 * Get a specific image for migration
 * Requires X-Migration-Key header
 */
migrationRouter.get('/image/:username/:hash', async (c) => {
  try {
    const migrationKey = c.req.header('X-Migration-Key');
    const expectedKey = c.env.MIGRATION_SECRET;
    
    if (!expectedKey || !migrationKey || migrationKey !== expectedKey) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const username = c.req.param('username')?.toLowerCase();
    const hash = c.req.param('hash');

    if (!username || !hash) {
      return c.json({ error: 'Invalid request' }, 400);
    }

    const imageKey = `${username}/images/${hash}`;
    const object = await c.env.R2_BUCKET.get(imageKey);

    if (!object) {
      return c.json({ error: 'Image not found' }, 404);
    }

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
    headers.set('Cache-Control', 'no-store');

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('[Migration] Image error:', error);
    return c.json({ error: 'Server error' }, 500);
  }
});

