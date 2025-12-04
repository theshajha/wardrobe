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
  sendMagicLinkEmail,
  storeMagicLinkToken,
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

    // Generate user ID and session token
    const userId = await generateUserId(email);
    const sessionToken = await createSessionToken(userId, email, c.env);

    // Initialize user data in R2 if needed - stored at {userId}/data.json
    const userDataKey = `${userId}/data.json`;
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
        customMetadata: { userId, email },
      });
    }

    return c.json({
      success: true,
      session: {
        userId,
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

    return c.json({ valid: true, userId: session.userId, email: session.email });
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

