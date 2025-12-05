/**
 * Authentication utilities for Fitso.me Sync API
 */

import * as jose from 'jose';
import type { Env, MagicLinkData, Session } from '../types';

// JWT configuration
const JWT_ALGORITHM = 'HS256';
const SESSION_DURATION_DAYS = 30;
const MAGIC_LINK_DURATION_MINUTES = 15;

/**
 * Generate a secure random string
 */
export function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a user ID from email (deterministic hash for internal use)
 */
export async function generateUserId(email: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a username from email (human-readable, for storage and URLs)
 * Takes local part of email, sanitizes it, and ensures uniqueness
 */
export function generateBaseUsername(email: string): string {
  const localPart = email.toLowerCase().trim().split('@')[0];
  // Remove non-alphanumeric chars, limit to 20 chars
  const sanitized = localPart.replace(/[^a-z0-9]/g, '').slice(0, 20);
  // Ensure at least 3 chars
  return sanitized.length >= 3 ? sanitized : sanitized.padEnd(3, '0');
}

/**
 * Generate a display name from email
 * Capitalizes first letter of local part
 */
export function generateDisplayName(email: string): string {
  const localPart = email.toLowerCase().trim().split('@')[0];
  // Remove dots and underscores, capitalize first letter
  const cleaned = localPart.replace(/[._-]/g, ' ').trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Get or create a unique username for an email
 * Stores mapping in KV: email:{email} -> {username, userId, createdAt}
 * Also stores reverse: username:{username} -> {email, userId}
 */
export async function getOrCreateUsername(
  email: string,
  userId: string,
  env: Env
): Promise<string> {
  const normalizedEmail = email.toLowerCase().trim();
  const emailKey = `email:${normalizedEmail}`;

  // Check if user already has a username
  const existingMapping = await env.AUTH_KV.get(emailKey);
  if (existingMapping) {
    const data = JSON.parse(existingMapping);
    return data.username;
  }

  // Generate new username
  const baseUsername = generateBaseUsername(email);
  let username = baseUsername;
  let counter = 1;

  // Check for collisions and find unique username
  while (true) {
    const usernameKey = `username:${username}`;
    const existing = await env.AUTH_KV.get(usernameKey);
    if (!existing) {
      // Username is available
      break;
    }
    // Try next number
    counter++;
    username = `${baseUsername}${counter}`;
  }

  // Store mappings
  const now = new Date().toISOString();
  const displayName = generateDisplayName(email);

  // email -> username mapping
  await env.AUTH_KV.put(emailKey, JSON.stringify({
    username,
    userId,
    email: normalizedEmail,
    createdAt: now,
  }));

  // username -> email mapping (for public lookups)
  await env.AUTH_KV.put(`username:${username}`, JSON.stringify({
    email: normalizedEmail,
    userId,
    createdAt: now,
    showcaseEnabled: false,  // Default: showcase disabled
    displayName,  // Default display name from email
  }));

  return username;
}

/**
 * Get user info by username (for public showcase)
 */
export async function getUserByUsername(
  username: string,
  env: Env
): Promise<{ email: string; userId: string; showcaseEnabled: boolean; displayName?: string } | null> {
  const data = await env.AUTH_KV.get(`username:${username.toLowerCase()}`);
  if (!data) return null;
  return JSON.parse(data);
}

/**
 * Update showcase setting for a user
 */
export async function updateShowcaseSetting(
  username: string,
  enabled: boolean,
  env: Env
): Promise<boolean> {
  const key = `username:${username.toLowerCase()}`;
  const data = await env.AUTH_KV.get(key);
  if (!data) return false;

  const userData = JSON.parse(data);
  userData.showcaseEnabled = enabled;
  await env.AUTH_KV.put(key, JSON.stringify(userData));
  return true;
}

/**
 * Update display name for a user
 */
export async function updateDisplayName(
  username: string,
  displayName: string,
  env: Env
): Promise<boolean> {
  const key = `username:${username.toLowerCase()}`;
  const data = await env.AUTH_KV.get(key);
  if (!data) return false;

  const userData = JSON.parse(data);
  userData.displayName = displayName.trim();
  await env.AUTH_KV.put(key, JSON.stringify(userData));
  return true;
}

/**
 * Create a JWT session token
 */
export async function createSessionToken(
  userId: string,
  username: string,
  email: string,
  env: Env
): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_SECRET || 'dev-secret-change-me');

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  const jwt = await new jose.SignJWT({
    userId,
    username,
    email,
    createdAt: new Date().toISOString(),
  })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .setSubject(userId)
    .sign(secret);

  return jwt;
}

/**
 * Verify a session token and return the session
 * Supports both the old R2-based JWT tokens and Supabase JWTs
 */
export async function verifySession(
  token: string,
  env: Env
): Promise<Session | null> {
  // First, try to verify as our own JWT
  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET || 'dev-secret-change-me');
    const { payload } = await jose.jwtVerify(token, secret);

    return {
      userId: payload.userId as string,
      username: payload.username as string,
      email: payload.email as string,
      createdAt: payload.createdAt as string,
      expiresAt: new Date((payload.exp || 0) * 1000).toISOString(),
    };
  } catch (error) {
    // Not our JWT, try Supabase
  }

  // Try to decode as Supabase JWT (we don't verify signature here, Supabase handles that)
  // We just extract user info and look up the username from KV
  try {
    // Decode the JWT without verification (we trust the token came from Supabase)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

    // Check if this looks like a Supabase JWT
    if (!payload.sub || !payload.email || !payload.exp) {
      return null;
    }

    // Check expiration
    const expiresAt = new Date(payload.exp * 1000);
    if (expiresAt < new Date()) {
      console.log('Supabase token expired');
      return null;
    }

    // Get or create username for this Supabase user
    const email = payload.email as string;
    const userId = payload.sub as string;

    // Look up username from KV by email
    const emailKey = `email:${email.toLowerCase().trim()}`;
    let usernameData = await env.AUTH_KV.get(emailKey);

    let username: string;
    if (usernameData) {
      const data = JSON.parse(usernameData);
      username = data.username;
    } else {
      // Create a new username for this Supabase user
      username = await getOrCreateUsername(email, userId, env);
    }

    console.log('Supabase JWT verified for user:', username);

    return {
      userId,
      username,
      email,
      createdAt: new Date(payload.iat * 1000).toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error) {
    console.error('Session verification failed:', error);
    return null;
  }
}

/**
 * Store a magic link token in KV
 */
export async function storeMagicLinkToken(
  token: string,
  email: string,
  env: Env
): Promise<void> {
  const data: MagicLinkData = {
    email: email.toLowerCase().trim(),
    createdAt: new Date().toISOString(),
  };

  // Store with 15 minute expiration
  await env.AUTH_KV.put(
    `magic:${token}`,
    JSON.stringify(data),
    { expirationTtl: MAGIC_LINK_DURATION_MINUTES * 60 }
  );
}

/**
 * Verify and consume a magic link token
 */
export async function verifyMagicLinkToken(
  token: string,
  env: Env
): Promise<string | null> {
  const key = `magic:${token}`;
  const dataStr = await env.AUTH_KV.get(key);

  if (!dataStr) {
    return null;
  }

  const data = JSON.parse(dataStr) as MagicLinkData;

  // Delete the token (one-time use)
  await env.AUTH_KV.delete(key);

  return data.email;
}

/**
 * Store active session reference in KV (for logout/invalidation)
 */
export async function storeSessionReference(
  userId: string,
  sessionId: string,
  env: Env
): Promise<void> {
  const key = `sessions:${userId}`;
  const existing = await env.AUTH_KV.get(key);
  const sessions: string[] = existing ? JSON.parse(existing) : [];

  // Keep last 5 sessions per user
  sessions.push(sessionId);
  if (sessions.length > 5) {
    sessions.shift();
  }

  await env.AUTH_KV.put(key, JSON.stringify(sessions), {
    expirationTtl: SESSION_DURATION_DAYS * 24 * 60 * 60
  });
}

/**
 * Send magic link email via Resend
 */
export async function sendMagicLinkEmail(
  email: string,
  token: string,
  env: Env
): Promise<boolean> {
  if (!env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    // In development, log the link instead
    if (env.ENVIRONMENT === 'development') {
      console.log(`Magic link for ${email}: ${env.APP_URL}/auth/verify?token=${token}`);
      return true;
    }
    return false;
  }

  const magicLink = `${env.APP_URL}/auth/verify?token=${token}`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM || 'Fitso.me <noreply@updates.fitso.me>',
        to: email,
        subject: 'Sign in to Fitso.me',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="font-size: 24px; font-weight: 800; margin: 0;">
                  <span style="color: #f59e0b;">FIT</span><span style="color: #ec4899;">·</span><span style="color: #ec4899;">SO</span><span style="color: #8b5cf6;">·</span><span style="color: #8b5cf6;">ME</span>
                </h1>
                <p style="color: #666; margin-top: 5px;">Your stuff. Your style. Your way.</p>
              </div>
              
              <div style="background: linear-gradient(135deg, #f59e0b10, #ec489910, #8b5cf610); border-radius: 12px; padding: 30px; margin-bottom: 20px;">
                <h2 style="margin: 0 0 15px 0; font-size: 20px;">Sign in to your account</h2>
                <p style="margin: 0 0 20px 0; color: #555;">Click the button below to securely sign in. This link expires in 15 minutes.</p>
                <a href="${magicLink}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6); color: white; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 600;">
                  Sign In
                </a>
              </div>
              
              <p style="font-size: 13px; color: #888; text-align: center;">
                If you didn't request this email, you can safely ignore it.
              </p>
              <p style="font-size: 12px; color: #aaa; text-align: center; margin-top: 30px;">
                © ${new Date().getFullYear()} Fitso.me · Your personal wardrobe manager
              </p>
            </body>
          </html>
        `,
        text: `Sign in to Fitso.me\n\nClick this link to sign in: ${magicLink}\n\nThis link expires in 15 minutes.\n\nIf you didn't request this email, you can safely ignore it.`,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to send email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

/**
 * Rate limit check for magic link requests
 */
export async function checkRateLimit(
  email: string,
  env: Env
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const key = `ratelimit:magic:${email.toLowerCase()}`;
  const existing = await env.AUTH_KV.get(key);

  if (existing) {
    const data = JSON.parse(existing);
    const timeSince = Date.now() - data.timestamp;
    const cooldown = 60 * 1000; // 1 minute between requests

    if (timeSince < cooldown) {
      return {
        allowed: false,
        retryAfter: Math.ceil((cooldown - timeSince) / 1000)
      };
    }
  }

  // Store rate limit entry
  await env.AUTH_KV.put(key, JSON.stringify({ timestamp: Date.now() }), {
    expirationTtl: 300 // 5 minutes
  });

  return { allowed: true };
}

