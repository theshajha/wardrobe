/**
 * Style Guides Index Page
 * Public page listing all style guides organized by category
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  allGuides,
  CATEGORY_META,
  replaceYearPlaceholder,
  type Guide,
  type GuideCategory,
} from '@/lib/guides';
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Compass,
  PartyPopper,
  Plane,
  Sparkles,
  Sun,
  Heart,
  Briefcase,
} from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

// Logo component
function Logo({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  return (
    <span className={`${sizeClasses[size]} font-black tracking-tighter`}>
      <span className="text-amber-400">FIT</span>
      <span className="text-pink-400">·</span>
      <span className="text-pink-400">SO</span>
      <span className="text-violet-400">·</span>
      <span className="text-violet-400">ME</span>
    </span>
  );
}

// Category icons
const CATEGORY_ICONS: Record<GuideCategory, React.ReactNode> = {
  festival: <PartyPopper className="h-5 w-5" />,
  celebration: <Sparkles className="h-5 w-5" />,
  occasion: <Heart className="h-5 w-5" />,
  lifestyle: <Briefcase className="h-5 w-5" />,
  travel: <Plane className="h-5 w-5" />,
  seasonal: <Sun className="h-5 w-5" />,
};

// Group guides by category
function groupGuidesByCategory(guides: Guide[]): Record<GuideCategory, Guide[]> {
  return guides.reduce((acc, guide) => {
    if (!acc[guide.category]) {
      acc[guide.category] = [];
    }
    acc[guide.category].push(guide);
    return acc;
  }, {} as Record<GuideCategory, Guide[]>);
}

// Category order for display
const CATEGORY_ORDER: GuideCategory[] = [
  'festival',
  'celebration',
  'travel',
  'occasion',
  'lifestyle',
  'seasonal',
];

export default function GuidesIndex() {
  const groupedGuides = groupGuidesByCategory(allGuides);

  useEffect(() => {
    // Set page meta
    document.title = 'Style Guides | Fashion & Travel Outfit Ideas | FITSO';
    
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute(
      'content',
      'Complete collection of style guides for festivals, weddings, travel, and everyday fashion. What to wear for Diwali, Holi, Thailand, Bali, and more.'
    );

    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 right-1/3 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 px-6 py-6 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/">
            <Logo />
          </Link>
          <Link to="/">
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Build Your Wardrobe
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative z-10 py-16 md:py-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 via-pink-500/20 to-violet-500/20 border border-white/10 mb-6">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
            Style Guides
          </h1>
          
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-8">
            Know exactly what to wear for every occasion — festivals, travel, weddings, and everyday life.
          </p>

          <div className="flex items-center justify-center gap-4 text-sm text-white/50">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4" />
              <span>{allGuides.length} guides</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/30" />
            <div className="flex items-center gap-2">
              <span>{CATEGORY_ORDER.filter(c => groupedGuides[c]?.length > 0).length} categories</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          {/* Categories */}
          {CATEGORY_ORDER.map((category) => {
            const guides = groupedGuides[category];
            if (!guides || guides.length === 0) return null;
            
            const meta = CATEGORY_META[category];
            
            return (
              <section key={category} className="mb-16">
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.bgColor} flex items-center justify-center ${meta.color}`}>
                    {CATEGORY_ICONS[category]}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{meta.label} Guides</h2>
                    <p className="text-sm text-white/50">{guides.length} guides</p>
                  </div>
                </div>

                {/* Guides Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {guides.map((guide) => (
                    <Link
                      key={guide.slug}
                      to={`/guides/${guide.slug}`}
                      className="group"
                    >
                      <Card className={`bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07] transition-all h-full`}>
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <span className="text-3xl flex-shrink-0">{guide.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold group-hover:text-amber-400 transition-colors line-clamp-2">
                                {replaceYearPlaceholder(guide.title).split(':')[0]}
                              </h3>
                              <p className="text-sm text-white/50 mt-1.5 line-clamp-2">
                                {guide.metaDescription}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0 mt-1" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}

          {/* CTA */}
          <div className="mt-16 text-center p-8 rounded-2xl bg-gradient-to-br from-amber-500/10 via-pink-500/10 to-violet-500/10 border border-white/10">
            <Sparkles className="h-10 w-10 text-amber-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-3">
              Ready to organize your wardrobe?
            </h3>
            <p className="text-white/60 mb-6 max-w-lg mx-auto">
              Import your clothes from Myntra & Ajio, create outfit combinations, and use these guides to always know what to wear.
            </p>
            <Link to="/">
              <Button
                size="lg"
                className="gap-2 bg-gradient-to-r from-amber-500 via-pink-500 to-violet-600 hover:from-amber-400 hover:via-pink-400 hover:to-violet-500 text-white font-bold"
              >
                Get Started — Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo />
          <div className="flex items-center gap-6 text-sm text-white/40">
            <Link to="/privacy" className="hover:text-white/70 transition-colors">
              Privacy
            </Link>
            <Link to="/" className="hover:text-white/70 transition-colors">
              Build Your Wardrobe
            </Link>
            <a
              href="mailto:shashank@fitso.me"
              className="hover:text-white/70 transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

