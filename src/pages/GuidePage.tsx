/**
 * Style Guide Page
 * SEO-optimized fashion guide pages for festivals, occasions, and style tips
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  CATEGORY_META,
  getGuideBySlug,
  getRelatedGuides,
  getSchemaDate,
  getUpdatedDateDisplay,
  replaceYearPlaceholder,
} from '@/lib/guides';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronRight,
  Lightbulb,
  Sparkles,
  Tag,
} from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';

// Logo component (same as Landing)
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

export default function GuidePage() {
  const { slug } = useParams<{ slug: string }>();
  const guide = slug ? getGuideBySlug(slug) : null;
  const relatedGuides = slug ? getRelatedGuides(slug) : [];

  // Process guide content with current year
  const processedGuide = useMemo(() => {
    if (!guide) return null;
    return {
      ...guide,
      title: replaceYearPlaceholder(guide.title),
      metaTitle: replaceYearPlaceholder(guide.metaTitle),
    };
  }, [guide]);

  const categoryMeta = guide ? CATEGORY_META[guide.category] : null;

  useEffect(() => {
    if (processedGuide) {
      // Set page title
      document.title = processedGuide.metaTitle;

      // Set meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', processedGuide.metaDescription);

      // Set meta keywords
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', processedGuide.keywords.join(', '));

      // Set OG tags
      const ogTags = [
        { property: 'og:title', content: processedGuide.metaTitle },
        { property: 'og:description', content: processedGuide.metaDescription },
        { property: 'og:type', content: 'article' },
        { property: 'og:url', content: `https://fitso.me/guides/${processedGuide.slug}` },
      ];

      ogTags.forEach(({ property, content }) => {
        let tag = document.querySelector(`meta[property="${property}"]`);
        if (!tag) {
          tag = document.createElement('meta');
          tag.setAttribute('property', property);
          document.head.appendChild(tag);
        }
        tag.setAttribute('content', content);
      });

      // Set JSON-LD structured data with current date
      const existingScript = document.querySelector('script[data-guide-schema]');
      if (existingScript) {
        existingScript.remove();
      }

      const schemaDate = getSchemaDate();
      const schemaScript = document.createElement('script');
      schemaScript.type = 'application/ld+json';
      schemaScript.setAttribute('data-guide-schema', 'true');
      schemaScript.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: processedGuide.title,
        description: processedGuide.metaDescription,
        author: {
          '@type': 'Organization',
          name: 'Fitso.me',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Fitso.me',
          logo: {
            '@type': 'ImageObject',
            url: 'https://fitso.me/favicon.svg',
          },
        },
        datePublished: schemaDate,
        dateModified: schemaDate,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `https://fitso.me/guides/${processedGuide.slug}`,
        },
      });
      document.head.appendChild(schemaScript);

      // Scroll to top
      window.scrollTo(0, 0);
    }

    return () => {
      // Cleanup
      const schemaScript = document.querySelector('script[data-guide-schema]');
      if (schemaScript) {
        schemaScript.remove();
      }
    };
  }, [processedGuide]);

  if (!processedGuide || !guide) {
    return <GuideNotFound />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className={`absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br ${categoryMeta?.bgColor || 'from-amber-500/10 to-violet-500/10'} rounded-full blur-[120px] opacity-50`} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 px-6 py-6 border-b border-white/10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Logo />
            </Link>
            <span className="text-white/30">/</span>
            <Link to="/guides" className="text-white/60 text-sm hover:text-white/80 transition-colors">
              Style Guides
            </Link>
          </div>
          <Link to="/">
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to FITSO
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 py-16 md:py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Emoji Badge */}
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br ${categoryMeta?.bgColor || 'from-amber-500/20 to-violet-500/20'} border border-white/10 mb-6 text-5xl`}>
            {guide.emoji}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-6">
            {processedGuide.title}
          </h1>

          {/* Meta - Including Category */}
          <div className="flex items-center justify-center flex-wrap gap-3 text-sm text-white/50 mb-8">
            {/* Category Badge */}
            {categoryMeta && (
              <>
                <div className={`flex items-center gap-1.5 ${categoryMeta.color}`}>
                  <Tag className="h-3.5 w-3.5" />
                  <span className="font-medium">{categoryMeta.label}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-white/30" />
              </>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>Updated {getUpdatedDateDisplay()}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/30" />
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              <span>{guide.sections.length} sections</span>
            </div>
          </div>

          {/* Quick Tips Preview */}
          <div className="inline-flex flex-wrap justify-center gap-2">
            {guide.quickTips.slice(0, 3).map((tip, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/70"
              >
                {tip}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Introduction */}
          <div
            className="prose prose-invert prose-lg max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: guide.introduction }}
          />

          {/* Sections - Single Column */}
          <div className="space-y-12">
            {guide.sections.map((section, index) => (
              <section
                key={index}
                className="scroll-mt-24"
                id={section.title.toLowerCase().replace(/\s+/g, '-')}
              >
                {/* Section Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${categoryMeta?.bgColor || 'from-amber-500 to-violet-500'} flex items-center justify-center text-sm font-bold`}>
                    {index + 1}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold">{section.title}</h2>
                </div>

                {/* Section Content */}
                <div
                  className="prose prose-invert max-w-none mb-6"
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />

                {/* Tips - Two Column Grid */}
                {section.tips && section.tips.length > 0 && (
                  <div className="grid md:grid-cols-2 gap-3">
                    {section.tips.map((tip, tipIndex) => (
                      <div
                        key={tipIndex}
                        className="flex gap-3 p-4 rounded-xl bg-white/5 border border-white/10"
                      >
                        <CheckCircle className={`h-5 w-5 ${categoryMeta?.color || 'text-amber-400'} flex-shrink-0 mt-0.5`} />
                        <span
                          className="text-white/80"
                          dangerouslySetInnerHTML={{ __html: tip }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Quick Tips Summary */}
          <div className={`mt-16 p-8 rounded-2xl bg-gradient-to-br ${categoryMeta?.bgColor || 'from-amber-500/10 to-violet-500/10'} border border-white/10`}>
            <div className="flex items-center gap-3 mb-6">
              <Lightbulb className={`h-6 w-6 ${categoryMeta?.color || 'text-amber-400'}`} />
              <h3 className="text-xl font-bold">Quick Tips Summary</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {guide.quickTips.map((tip, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className={categoryMeta?.color || 'text-amber-400'}>•</span>
                  <span className="text-white/70">{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 via-pink-500 to-violet-600 mb-6`}>
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to {guide.ctaText}?
            </h3>
            <p className="text-white/60 mb-6 max-w-lg mx-auto">
              Import your wardrobe from Myntra & Ajio in minutes, create outfit combinations, and never ask "what should I wear?" again.
            </p>
            <Link to="/">
              <Button
                size="lg"
                className="gap-2 bg-gradient-to-r from-amber-500 via-pink-500 to-violet-600 hover:from-amber-400 hover:via-pink-400 hover:to-violet-500 text-white font-bold"
              >
                Get Started with FITSO — Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Related Guides */}
          {relatedGuides.length > 0 && (
            <div className="mt-20">
              <h3 className="text-xl font-bold mb-6">Related Style Guides</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {relatedGuides.map((related) => (
                    <Link
                      key={related.slug}
                      to={`/guides/${related.slug}`}
                      className="group"
                    >
                      <Card className="bg-white/5 border-white/10 hover:border-white/20 transition-all h-full">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <span className="text-3xl">{related.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold group-hover:text-amber-400 transition-colors line-clamp-2">
                                {replaceYearPlaceholder(related.title).split(':')[0]}
                              </h4>
                              <p className="text-sm text-white/50 mt-1 line-clamp-2">
                                {related.metaDescription}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-white/30 group-hover:text-white/60 transition-colors flex-shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-white/10">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo />
          <div className="flex items-center gap-6 text-sm text-white/40">
            <Link to="/privacy" className="hover:text-white/70 transition-colors">
              Privacy
            </Link>
            <Link to="/guides" className="hover:text-white/70 transition-colors">
              All Guides
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

function GuideNotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
      <div className="text-center">
        <div className="text-6xl mb-6">📚</div>
        <h1 className="text-2xl font-bold mb-4">Guide Not Found</h1>
        <p className="text-white/60 mb-6">
          We couldn't find the style guide you're looking for.
        </p>
        <Link to="/guides">
          <Button className="gap-2 bg-gradient-to-r from-amber-500 via-pink-500 to-violet-600">
            <ArrowLeft className="h-4 w-4" />
            Browse All Guides
          </Button>
        </Link>
      </div>
    </div>
  );
}
