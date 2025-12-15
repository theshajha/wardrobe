/**
 * Style Guide Types
 * Shared type definitions for all style guides
 */

/**
 * Guide categories for visual differentiation
 */
export type GuideCategory =
  | 'festival'      // Indian festivals (Diwali, Holi, etc.)
  | 'celebration'   // Global celebrations (Christmas, New Year)
  | 'occasion'      // Life events (weddings, dates)
  | 'lifestyle'     // Everyday fashion (office, capsule wardrobe)
  | 'travel'        // Travel packing guides
  | 'seasonal';     // Weather/season-based (monsoon, summer)

/**
 * Category metadata for styling
 */
export interface CategoryMeta {
  label: string;
  color: string;        // Tailwind color class
  bgColor: string;      // Background gradient
  icon: string;         // Emoji
}

export const CATEGORY_META: Record<GuideCategory, CategoryMeta> = {
  festival: {
    label: 'Festival',
    color: 'text-amber-400',
    bgColor: 'from-amber-500/20 to-orange-500/20',
    icon: '🎉',
  },
  celebration: {
    label: 'Celebration',
    color: 'text-pink-400',
    bgColor: 'from-pink-500/20 to-rose-500/20',
    icon: '🎊',
  },
  occasion: {
    label: 'Occasion',
    color: 'text-violet-400',
    bgColor: 'from-violet-500/20 to-purple-500/20',
    icon: '✨',
  },
  lifestyle: {
    label: 'Lifestyle',
    color: 'text-emerald-400',
    bgColor: 'from-emerald-500/20 to-teal-500/20',
    icon: '💼',
  },
  travel: {
    label: 'Travel',
    color: 'text-sky-400',
    bgColor: 'from-sky-500/20 to-blue-500/20',
    icon: '✈️',
  },
  seasonal: {
    label: 'Seasonal',
    color: 'text-cyan-400',
    bgColor: 'from-cyan-500/20 to-teal-500/20',
    icon: '🌤️',
  },
};

export interface GuideSection {
  title: string;
  content: string; // HTML content
  tips?: string[];
  image?: string;
}

export interface Guide {
  slug: string;
  title: string;              // Can include {year} placeholder
  metaTitle: string;          // Can include {year} placeholder
  metaDescription: string;
  emoji: string;
  category: GuideCategory;
  heroImage?: string;
  introduction: string;
  sections: GuideSection[];
  quickTips: string[];
  ctaText: string;
  relatedGuides: string[];
  keywords: string[];
  // Dates are now dynamic - these are just for schema.org
  // We'll show current year in the UI
}

/**
 * Get current year for dynamic content
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/**
 * Replace {year} placeholder with current year
 */
export function replaceYearPlaceholder(text: string): string {
  return text.replace(/\{year\}/g, getCurrentYear().toString());
}

/**
 * Get formatted "Updated" date (always shows current month/year)
 */
export function getUpdatedDateDisplay(): string {
  const now = new Date();
  return now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

/**
 * Get schema.org dates (for SEO - shows actual current date)
 */
export function getSchemaDate(): string {
  return new Date().toISOString().split('T')[0];
}
