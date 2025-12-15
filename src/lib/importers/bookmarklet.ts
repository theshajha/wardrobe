/**
 * Bookmarklet generator for e-commerce scraping
 * 
 * Uses store-specific scrapers from ./scrapers/
 */

import { STORE_INSTRUCTIONS, STORE_SCRAPERS } from './scrapers';
import type { StoreId } from './types';

/**
 * Generate bookmarklet code for a specific store
 * Returns a javascript: URL that can be used as a bookmark
 */
export function generateBookmarkletCode(storeId: StoreId): string {
  const scraperCode = STORE_SCRAPERS[storeId];
  if (!scraperCode) {
    throw new Error(`No scraper available for store: ${storeId}`);
  }

  // Strip single-line comments and clean up the code for bookmarklet use
  const cleanCode = scraperCode
    .split('\n')
    .map(line => {
      // Remove single-line comments (but preserve URLs with //)
      const commentIndex = line.indexOf('//');
      if (commentIndex >= 0) {
        // Check if // is inside a string (rough heuristic)
        const beforeComment = line.substring(0, commentIndex);
        const singleQuotes = (beforeComment.match(/'/g) || []).length;
        const doubleQuotes = (beforeComment.match(/"/g) || []).length;
        // If odd number of quotes, we're inside a string - keep the line
        if (singleQuotes % 2 === 0 && doubleQuotes % 2 === 0) {
          return line.substring(0, commentIndex);
        }
      }
      return line;
    })
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('');  // Join without newlines - statements end with ; or }

  // Wrap in IIFE and URL-encode
  const code = `(function(){${cleanCode}})();`;
  return `javascript:${encodeURIComponent(code)}`;
}

/**
 * Generate console-friendly script code (not URL-encoded)
 * This is used when bookmarklets are blocked by React/CSP
 */
export function generateConsoleScript(storeId: StoreId): string {
  const scraperCode = STORE_SCRAPERS[storeId];
  if (!scraperCode) {
    throw new Error(`No scraper available for store: ${storeId}`);
  }

  // Return the raw IIFE code that can be pasted in console
  return `// Fitsomee ${storeId.charAt(0).toUpperCase() + storeId.slice(1)} Scraper - Paste in Console (F12)
(function(){${scraperCode}})();`;
}

/**
 * Generate bookmarklet code with version for cache busting
 */
export function generateVersionedBookmarklet(storeId: StoreId): {
  code: string;
  version: string;
} {
  return {
    code: generateBookmarkletCode(storeId),
    version: SCRAPER_VERSION,
  };
}

const SCRAPER_VERSION = '1.2.0';

/**
 * Get store-specific instructions
 */
export function getStoreInstructions(storeId: StoreId): {
  steps: string[];
  tips: string[];
  orderUrl: string;
} {
  const instructions = STORE_INSTRUCTIONS[storeId];
  if (!instructions) {
    return {
      orderUrl: '',
      steps: ['This store is not yet supported'],
      tips: [],
    };
  }
  return instructions;
}

// Re-export for convenience
export { STORE_INSTRUCTIONS, STORE_SCRAPERS };

