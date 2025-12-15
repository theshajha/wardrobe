/**
 * Style Guide Content
 * SEO-optimized fashion guides for festivals, occasions, and style tips
 *
 * This file is a re-export wrapper for backwards compatibility.
 * Individual guides now live in src/lib/guides/ directory.
 *
 * To add a new guide:
 * 1. Create a new file in src/lib/guides/ (e.g., my-new-guide.ts)
 * 2. Export the guide following the Guide interface
 * 3. Import and add it to the allGuides array in src/lib/guides/index.ts
 */

// Import from guides module
import {
  getFestivalGuides as getFestivalGuidesFromModule,
  getGuideBySlug as getGuideBySlugFromModule,
  getGuidesByCategory as getGuidesByCategoryFromModule,
  getGuidesForSitemap as getGuidesForSitemapFromModule,
  getLifestyleGuides as getLifestyleGuidesFromModule,
  getRelatedGuides as getRelatedGuidesFromModule,
  getTravelGuides as getTravelGuidesFromModule,
  allGuides as guidesCollection,
} from './guides/index';
import type { Guide, GuideCategory, GuideSection } from './guides/types';

// Re-export types and utilities
export {
  CATEGORY_META,
  getCurrentYear,
  getSchemaDate,
  getUpdatedDateDisplay,
  replaceYearPlaceholder
} from './guides/types';
export type { Guide, GuideCategory, GuideSection };

/**
 * GUIDES record - for backwards compatibility
 * Maps slug -> Guide
 */
export const GUIDES: Record<string, Guide> = guidesCollection.reduce<Record<string, Guide>>(
  (acc: Record<string, Guide>, guide: Guide) => {
    acc[guide.slug] = guide;
    return acc;
  },
  {}
);

/**
 * Get a guide by its slug
 */
export function getGuideBySlug(slug: string): Guide | null {
  return getGuideBySlugFromModule(slug) || null;
}

/**
 * Get all guide slugs (for sitemap generation)
 */
export function getAllGuideSlugs(): string[] {
  return Object.keys(GUIDES);
}

/**
 * Get related guides
 */
export function getRelatedGuides(currentSlug: string): Guide[] {
  const current = GUIDES[currentSlug];
  if (!current) return [];

  return getRelatedGuidesFromModule(current);
}

// Re-export utility functions
export const allGuides = guidesCollection;
export const getGuidesByCategory = getGuidesByCategoryFromModule;
export const getFestivalGuides = getFestivalGuidesFromModule;
export const getLifestyleGuides = getLifestyleGuidesFromModule;
export const getTravelGuides = getTravelGuidesFromModule;
export const getGuidesForSitemap = getGuidesForSitemapFromModule;
