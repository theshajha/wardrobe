/**
 * Auth Routes for Fitso.me Sync API
 * Handles magic link authentication
 */

import { Hono } from 'hono';
import type { Env } from '../types';
import {
  checkRateLimit,
  createSessionToken,
  generateToken,
  generateUserId,
  getOrCreateUsername,
  sendMagicLinkEmail,
  storeMagicLinkToken,
  updateDisplayName,
  updateShowcaseSetting,
  verifyMagicLinkToken,
  verifySession,
} from '../utils/auth';

export const authRouter = new Hono<{ Bindings: Env }>();

/**
 * POST /auth/magic-link
 * Request a magic link to be sent to email
 */
authRouter.post('/magic-link', async (c) => {
  try {
    const body = await c.req.json<{ email: string }>();
    const email = body.email?.toLowerCase().trim();

    if (!email || !email.includes('@')) {
      return c.json({ success: false, error: 'Valid email required' }, 400);
    }

    // Rate limit check
    const rateLimit = await checkRateLimit(email, c.env);
    if (!rateLimit.allowed) {
      return c.json({
        success: false,
        error: `Please wait ${rateLimit.retryAfter} seconds before requesting another link`
      }, 429);
    }

    // Generate and store magic link token
    const token = generateToken();
    await storeMagicLinkToken(token, email, c.env);

    // Send email
    const sent = await sendMagicLinkEmail(email, token, c.env);

    if (!sent && c.env.ENVIRONMENT !== 'development') {
      return c.json({ success: false, error: 'Failed to send email' }, 500);
    }

    return c.json({
      success: true,
      message: 'Check your email for the magic link!'
    });
  } catch (error) {
    console.error('Magic link request error:', error);
    return c.json({ success: false, error: 'Server error' }, 500);
  }
});

/**
 * POST /auth/verify
 * Verify magic link token and create session
 */
authRouter.post('/verify', async (c) => {
  try {
    const body = await c.req.json<{ token: string }>();
    const token = body.token?.trim();

    if (!token) {
      return c.json({ success: false, error: 'Token required' }, 400);
    }

    // Verify and consume the magic link token
    const email = await verifyMagicLinkToken(token, c.env);

    if (!email) {
      return c.json({ success: false, error: 'Invalid or expired token' }, 401);
    }

    // Generate user ID and get/create username
    const userId = await generateUserId(email);
    const username = await getOrCreateUsername(email, userId, c.env);

    // Create session token with username
    const sessionToken = await createSessionToken(userId, username, email, c.env);

    // Initialize user data in R2 if needed - stored at {username}/data.json
    const userDataKey = `${username}/data.json`;
    const existingData = await c.env.R2_BUCKET.get(userDataKey);

    if (!existingData) {
      // Create initial user data
      const initialData = {
        version: 0,
        updatedAt: new Date().toISOString(),
        items: [],
        trips: [],
        tripItems: [],
        outfits: [],
        wishlist: [],
      };

      await c.env.R2_BUCKET.put(userDataKey, JSON.stringify(initialData), {
        customMetadata: { userId, username, email },
      });
    }

    return c.json({
      success: true,
      session: {
        userId,
        username,
        email,
        sessionToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return c.json({ success: false, error: 'Server error' }, 500);
  }
});

/**
 * GET /auth/validate
 * Validate current session token
 */
authRouter.get('/validate', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ valid: false }, 401);
    }

    const token = authHeader.slice(7);
    const session = await verifySession(token, c.env);

    if (!session) {
      return c.json({ valid: false }, 401);
    }

    return c.json({ valid: true, userId: session.userId, username: session.username, email: session.email });
  } catch (error) {
    console.error('Session validation error:', error);
    return c.json({ valid: false }, 500);
  }
});

/**
 * POST /auth/logout
 * Logout (currently a no-op since JWTs are stateless, but reserved for future use)
 */
authRouter.post('/logout', async (c) => {
  // JWTs are stateless, so we can't really invalidate them server-side
  // without maintaining a blacklist. For now, the client handles logout
  // by deleting the local session.
  return c.json({ success: true });
});

/**
 * POST /auth/showcase
 * Enable or disable public showcase for authenticated user
 */
authRouter.post('/showcase', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const token = authHeader.slice(7);
    const session = await verifySession(token, c.env);

    if (!session) {
      return c.json({ success: false, error: 'Invalid session' }, 401);
    }

    const body = await c.req.json<{ enabled: boolean }>();
    const enabled = !!body.enabled;

    const success = await updateShowcaseSetting(session.username, enabled, c.env);

    if (!success) {
      return c.json({ success: false, error: 'Failed to update setting' }, 500);
    }

    return c.json({
      success: true,
      showcaseEnabled: enabled,
      showcaseUrl: enabled ? `/${session.username}` : null,
    });
  } catch (error) {
    console.error('Showcase toggle error:', error);
    return c.json({ success: false, error: 'Server error' }, 500);
  }
});

/**
 * GET /auth/showcase
 * Get current showcase status for authenticated user
 */
authRouter.get('/showcase', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const token = authHeader.slice(7);
    const session = await verifySession(token, c.env);

    if (!session) {
      return c.json({ success: false, error: 'Invalid session' }, 401);
    }

    // Get user info from KV
    const userInfo = await c.env.AUTH_KV.get(`username:${session.username}`);
    const data = userInfo ? JSON.parse(userInfo) : { showcaseEnabled: false };

    return c.json({
      success: true,
      username: session.username,
      showcaseEnabled: data.showcaseEnabled || false,
      showcaseUrl: data.showcaseEnabled ? `/${session.username}` : null,
      displayName: data.displayName || session.username,
    });
  } catch (error) {
    console.error('Showcase status error:', error);
    return c.json({ success: false, error: 'Server error' }, 500);
  }
});

/**
 * POST /auth/display-name
 * Update display name for authenticated user
 */
authRouter.post('/display-name', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const token = authHeader.slice(7);
    const session = await verifySession(token, c.env);

    if (!session) {
      return c.json({ success: false, error: 'Invalid session' }, 401);
    }

    const body = await c.req.json<{ displayName: string }>();
    const displayName = body.displayName?.trim();

    if (!displayName || displayName.length < 1 || displayName.length > 50) {
      return c.json({ success: false, error: 'Display name must be 1-50 characters' }, 400);
    }

    const success = await updateDisplayName(session.username, displayName, c.env);

    if (!success) {
      return c.json({ success: false, error: 'Failed to update display name' }, 500);
    }

    return c.json({
      success: true,
      displayName,
    });
  } catch (error) {
    console.error('Display name update error:', error);
    return c.json({ success: false, error: 'Server error' }, 500);
  }
});

