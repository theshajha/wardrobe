import { Hono } from 'hono';
import type { Env, Session } from '../types';

const proxyRouter = new Hono<{ Bindings: Env; Variables: { session: Session } }>();

const ALLOWED_DOMAINS = [
  'myntra.com',
  'ajio.com',
  'amazon.in',
  'amazon.com',
  'flipkart.com',
  'hm.com',
  'zara.com',
  'assets.myntassets.com',
  'assets.ajio.com',
  'rukminim1.flixcart.com',
  'rukminim2.flixcart.com',
  'm.media-amazon.com',
  'images-na.ssl-images-amazon.com',
  'lp2.hm.com',
  'static.zara.net',
];

function isAllowedDomain(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ALLOWED_DOMAINS.some(domain => 
      parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

proxyRouter.get('/', async (c) => {
  const url = c.req.query('url');
  
  if (!url) {
    return c.json({ error: 'Missing url parameter' }, 400);
  }

  let decodedUrl: string;
  try {
    decodedUrl = decodeURIComponent(url);
  } catch {
    decodedUrl = url;
  }

  if (!isAllowedDomain(decodedUrl)) {
    return c.json({ error: 'Domain not allowed' }, 403);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(decodedUrl, {
      signal: controller.signal,
      redirect: 'error',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': new URL(decodedUrl).origin,
      },
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      return c.json({ error: `Failed to fetch image: ${response.status}` }, response.status);
    }

    const contentType = response.headers.get('Content-Type') || 'image/jpeg';

    if (!contentType.startsWith('image/')) {
      return c.json({ error: 'URL does not point to an image' }, 400);
    }

    const imageData = await response.arrayBuffer();

    if (imageData.byteLength > 5 * 1024 * 1024) {
      return c.json({ error: 'Image too large (max 5MB)' }, 413);
    }

    return new Response(imageData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 1 day
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error) {
    console.error('Proxy error:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return c.json({ error: 'Request timeout' }, 504);
    }
    
    return c.json({ error: 'Failed to proxy image' }, 500);
  }
});

export { proxyRouter };

