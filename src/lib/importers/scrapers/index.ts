/**
 * Store Scrapers Index
 * 
 * Each store has its own file with:
 * - Scraper code (JavaScript string to inject via bookmarklet)
 * - Instructions (steps and tips for users)
 */

import { myntraScraper, myntraInstructions } from './myntra';
import { ajioScraper, ajioInstructions } from './ajio';
import type { StoreId } from '../types';

// Map of store scrapers
export const STORE_SCRAPERS: Record<StoreId, string> = {
  myntra: myntraScraper,
  ajio: ajioScraper,
  // Placeholders for future stores
  amazon: `alert("Amazon import coming soon!")`,
  flipkart: `alert("Flipkart import coming soon!")`,
  hm: `alert("H&M import coming soon!")`,
  zara: `alert("Zara import coming soon!")`,
};

// Map of store instructions
export const STORE_INSTRUCTIONS: Record<StoreId, {
  orderUrl: string;
  steps: string[];
  tips: string[];
}> = {
  myntra: myntraInstructions,
  ajio: ajioInstructions,
  amazon: {
    orderUrl: 'https://www.amazon.in/gp/css/order-history',
    steps: ['Coming soon!'],
    tips: [],
  },
  flipkart: {
    orderUrl: 'https://www.flipkart.com/account/orders',
    steps: ['Coming soon!'],
    tips: [],
  },
  hm: {
    orderUrl: 'https://www2.hm.com/en_in/my-account/orders',
    steps: ['Coming soon!'],
    tips: [],
  },
  zara: {
    orderUrl: 'https://www.zara.com/in/en/user/orders',
    steps: ['Coming soon!'],
    tips: [],
  },
};

export { myntraScraper, ajioScraper };

