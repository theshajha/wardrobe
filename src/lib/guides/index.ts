/**
 * Style Guides Index
 *
 * This file imports all individual guide files and exports them as a unified collection.
 * Each guide lives in its own file for maintainability.
 *
 * To add a new guide:
 * 1. Create a new file in this directory (e.g., my-new-guide.ts)
 * 2. Export the guide following the Guide interface
 * 3. Import and add it to the allGuides array below
 */

// Types and utilities
export type { Guide, GuideCategory, GuideSection } from './types';
export {
  CATEGORY_META,
  getCurrentYear,
  getSchemaDate,
  getUpdatedDateDisplay,
  replaceYearPlaceholder,
} from './types';

// Individual guide imports - Festivals
import { christmasGuide } from './christmas';
import { diwaliGuide } from './diwali';
import { durgaPujaGuide } from './durga-puja';
import { eidGuide } from './eid';
import { holiGuide } from './holi';
import { navratriGuide } from './navratri';
import { newYearGuide } from './new-year';
import { onamGuide } from './onam';
import { pongalGuide } from './pongal';
import { rakhiGuide } from './rakhi';

// Individual guide imports - Occasion & Lifestyle
import { capsuleWardrobeGuide } from './capsule-wardrobe';
import { firstDateGuide } from './first-date';
import { monsoonGuide } from './monsoon';
import { officeWearGuide } from './office-wear';
import { weddingGuide } from './wedding';

// Individual guide imports - Travel (India)
import { goaGuide } from './travel-goa';
import { jaipurGuide } from './travel-jaipur';
import { ladakhGuide } from './travel-ladakh';

// Individual guide imports - Travel (International)
import { baliGuide } from './travel-bali';
import { dubaiGuide } from './travel-dubai';
import { thailandGuide } from './travel-thailand';

import type { Guide, GuideCategory } from './types';

// Master collection of all guides
export const allGuides: Guide[] = [
  // Festival Guides - Indian
  holiGuide,
  diwaliGuide,
  navratriGuide,
  durgaPujaGuide,
  eidGuide,
  onamGuide,
  pongalGuide,
  rakhiGuide,

  // Festival Guides - Global
  christmasGuide,
  newYearGuide,

  // Occasion Guides
  weddingGuide,
  firstDateGuide,

  // Lifestyle Guides
  officeWearGuide,
  capsuleWardrobeGuide,
  monsoonGuide,

  // Travel Guides - India
  ladakhGuide,
  goaGuide,
  jaipurGuide,

  // Travel Guides - International
  thailandGuide,
  baliGuide,
  dubaiGuide,
];

// Export individual guides for direct access
export {
  // Festivals
  christmasGuide,
  diwaliGuide,
  durgaPujaGuide,
  eidGuide,
  holiGuide,
  navratriGuide,
  newYearGuide,
  onamGuide,
  pongalGuide,
  rakhiGuide,
  // Occasion & Lifestyle
  capsuleWardrobeGuide,
  firstDateGuide,
  monsoonGuide,
  officeWearGuide,
  weddingGuide,
  // Travel - India
  goaGuide,
  jaipurGuide,
  ladakhGuide,
  // Travel - International
  baliGuide,
  dubaiGuide,
  thailandGuide,
};

/**
 * Get a guide by its slug
 */
export function getGuideBySlug(slug: string): Guide | undefined {
  return allGuides.find((guide) => guide.slug === slug);
}

/**
 * Get all available guide slugs
 */
export function getAllGuideSlugs(): string[] {
  return allGuides.map((guide) => guide.slug);
}

/**
 * Get guides by category
 */
export function getGuidesByCategory(category: GuideCategory): Guide[] {
  return allGuides.filter((guide) => guide.category === category);
}

/**
 * Get guides by category/tag
 */
export function getGuidesByKeyword(keyword: string): Guide[] {
  const lowerKeyword = keyword.toLowerCase();
  return allGuides.filter(
    (guide) =>
      guide.keywords.some((k) => k.toLowerCase().includes(lowerKeyword)) ||
      guide.title.toLowerCase().includes(lowerKeyword)
  );
}

/**
 * Get related guides based on a guide's relatedGuides property
 */
export function getRelatedGuides(guide: Guide): Guide[] {
  return guide.relatedGuides
    .map((slug) => getGuideBySlug(slug))
    .filter((g): g is Guide => g !== undefined);
}

/**
 * Get festival guides
 */
export function getFestivalGuides(): Guide[] {
  return allGuides.filter(
    (guide) => guide.category === 'festival' || guide.category === 'celebration'
  );
}

/**
 * Get lifestyle guides
 */
export function getLifestyleGuides(): Guide[] {
  return allGuides.filter((guide) => guide.category === 'lifestyle');
}

/**
 * Get travel guides
 */
export function getTravelGuides(): Guide[] {
  return allGuides.filter((guide) => guide.category === 'travel');
}

/**
 * Get travel guides for India
 */
export function getIndiaTravelGuides(): Guide[] {
  const indiaSlugs = ['ladakh-packing-guide', 'goa-packing-guide', 'jaipur-packing-guide'];
  return allGuides.filter((guide) => indiaSlugs.includes(guide.slug));
}

/**
 * Get travel guides for International destinations
 */
export function getInternationalTravelGuides(): Guide[] {
  const intlSlugs = ['thailand-packing-guide', 'bali-packing-guide', 'dubai-packing-guide'];
  return allGuides.filter((guide) => intlSlugs.includes(guide.slug));
}

/**
 * Get guides suitable for SEO sitemap
 */
export function getGuidesForSitemap(): Array<{
  slug: string;
  title: string;
  category: GuideCategory;
}> {
  return allGuides.map((guide) => ({
    slug: guide.slug,
    title: guide.title,
    category: guide.category,
  }));
}
