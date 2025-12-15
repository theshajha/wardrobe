/**
 * Fitso.me Sync API - Cloudflare Worker
 * Handles authentication, data sync, and image storage
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, Session } from './types';
import { authRouter } from './routes/auth';
import { syncRouter } from './routes/sync';
import { imagesRouter } from './routes/images';
import { publicRouter } from './routes/public';
import { migrationRouter } from './routes/migration';
import { proxyRouter } from './routes/proxy';
import { verifySession } from './utils/auth';

// Create Hono app with Env type
const app = new Hono<{ Bindings: Env; Variables: { session: Session } }>();

// CORS middleware
app.use('*', async (c, next) => {
  const origins = c.env.CORS_ORIGINS.split(',');
  const corsMiddleware = cors({
    origin: origins,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 86400,
    credentials: true,
  });
  return corsMiddleware(c, next);
});

// Health check
app.get('/', (c) => {
  return c.json({ 
    service: 'fitsome-sync-api', 
    status: 'healthy',
    version: '1.0.0',
  });
});

// Public routes - auth and showcase
app.route('/auth', authRouter);
app.route('/public', publicRouter);

// Migration routes (protected by secret key, not session)
app.route('/migration', migrationRouter);

// Protected routes middleware
app.use('/sync/*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  const session = await verifySession(token, c.env);
  
  if (!session) {
    return c.json({ error: 'Invalid or expired session' }, 401);
  }

  c.set('session', session);
  return next();
});

app.use('/images/*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  const session = await verifySession(token, c.env);
  
  if (!session) {
    return c.json({ error: 'Invalid or expired session' }, 401);
  }

  c.set('session', session);
  return next();
});

// Protected routes
app.route('/sync', syncRouter);
app.route('/images', imagesRouter);

// Proxy routes (protected - requires auth)
app.use('/proxy/*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  const session = await verifySession(token, c.env);
  
  if (!session) {
    return c.json({ error: 'Invalid or expired session' }, 401);
  }

  c.set('session', session);
  return next();
});

app.route('/proxy', proxyRouter);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;

