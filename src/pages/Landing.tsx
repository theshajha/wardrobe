/**
 * Landing Page - Focused on user outcomes (Jobs to Be Done)
 * Compelling messaging about what users can accomplish
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import {
  trackDemoEntered,
  trackGetStartedClicked,
  trackLandingPageViewed,
} from '@/lib/analytics';
import { sendMagicLink } from '@/lib/auth/supabase-auth';
import { enterDemoMode, type DemoType } from '@/lib/demo';
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  FlaskConical,
  Loader2,
  Lock,
  Mail,
  Package,
  Quote,
  Sparkles,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import {
  CATEGORY_META,
  getFestivalGuides,
  getLifestyleGuides,
  replaceYearPlaceholder,
} from '@/lib/guides';

// Fitso.me Logo
function Logo({ size = 'lg' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl md:text-7xl',
    xl: 'text-6xl md:text-8xl',
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

type DialogStep = 'signup' | 'demo-select';

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [dialogStep, setDialogStep] = useState<DialogStep>('signup');
  const [email, setEmail] = useState('');
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'Fitso.me — Know What to Wear. Every Day.';
    trackLandingPageViewed();

    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, isAuthenticated, authLoading]);

  const handleGetStarted = () => {
    trackGetStartedClicked();
    setDialogStep('signup');
    setShowDialog(true);
  };

  const handleSendMagicLink = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSendingLink(true);
    setError(null);

    const result = await sendMagicLink(email.trim());

    if (!result.success) {
      setError(result.error || 'Failed to send magic link');
      setIsSendingLink(false);
      return;
    }

    setEmailSent(true);
    setIsSendingLink(false);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open && !demoLoading) {
      setShowDialog(false);
      setTimeout(() => {
        setDialogStep('signup');
        setEmail('');
        setEmailSent(false);
        setError(null);
      }, 200);
    }
  };

  const handleTryDemo = () => {
    setDialogStep('demo-select');
    setShowDialog(true);
  };

  const handleSelectDemoType = async (type: DemoType) => {
    setDemoLoading(true);
    trackDemoEntered(type);
    const success = await enterDemoMode(type);
    if (success) {
      navigate('/dashboard', { replace: true });
      window.location.reload();
    }
    setDemoLoading(false);
  };

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-pink-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="relative z-20 px-6 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Logo size="sm" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGetStarted}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              Sign In
            </Button>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-white/80">Your outfit decisions, simplified</span>
            </div>

            {/* Main Headline - Outcome focused */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
              Know what to wear.
              <br />
              <span className="bg-gradient-to-r from-amber-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
                Every day.
              </span>
            </h1>

            {/* Subheadline - The problem */}
            <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
              Festivals, weddings, work, or weekends — plan the perfect outfit from your own wardrobe.
              Import from Myntra & Ajio in minutes, or add items manually. Never ask "what should I wear?" again.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="text-lg px-8 py-7 gap-3 bg-gradient-to-r from-amber-500 via-pink-500 to-violet-600 hover:from-amber-400 hover:via-pink-400 hover:to-violet-500 text-white font-bold shadow-2xl shadow-pink-500/20 hover:shadow-pink-500/40 hover:scale-105 transition-all duration-300"
              >
                Build Your Wardrobe — Free
                <ArrowRight className="h-5 w-5" />
              </Button>

              <button
                onClick={handleTryDemo}
                disabled={demoLoading}
                className="group flex items-center gap-2 px-6 py-3 text-white/60 hover:text-white transition-colors"
              >
                <FlaskConical className="h-4 w-4" />
                <span className="text-sm font-medium underline underline-offset-4 decoration-dashed decoration-white/30 group-hover:decoration-white/60">
                  {demoLoading ? 'Loading...' : 'Try with sample data'}
                </span>
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-6 pt-4 text-sm text-white/40">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span>Your data stays private</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-white/20" />
              <div className="hidden sm:flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Free forever</span>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <button
            onClick={scrollToFeatures}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 hover:text-white/60 transition-colors animate-bounce"
          >
            <ChevronDown className="h-8 w-8" />
          </button>
        </div>
      </section>

      {/* Product Screenshot */}
      <section className="relative z-10 px-6 pb-32">
        <div className="max-w-6xl mx-auto">
          {/* Glow */}
          <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-violet-500/20 rounded-3xl blur-3xl opacity-40" />
          
          {/* Browser Frame */}
          <div className="relative bg-[#1a1a1a] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Browser Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[#0f0f0f] border-b border-white/10">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-lg bg-white/5 text-xs text-white/50 flex items-center gap-2">
                  <Lock className="h-3 w-3" />
                  fitso.me/inventory
                </div>
              </div>
              <div className="w-16" />
            </div>
            
            {/* Screenshot */}
            <img
              src="/images/product-og.png"
              alt="Fitso.me - Your wardrobe organized beautifully"
              className="w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* Import Integrations Section */}
      <section className="relative z-10 py-32 px-6 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-sm mb-6">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-amber-300 font-medium">New Feature</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">
              Build your wardrobe in{' '}
              <span className="bg-gradient-to-r from-amber-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
                minutes, not hours
              </span>
            </h2>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">
              Import dozens of items automatically from your order history.
              One click and your wardrobe is ready to organize.
            </p>
          </div>

          {/* Integration Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
            {/* Myntra Card */}
            <div className="group relative p-8 rounded-3xl bg-gradient-to-br from-pink-500/10 via-pink-500/5 to-transparent border border-pink-500/20 hover:border-pink-500/40 transition-all duration-300 overflow-hidden">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative">
                {/* Myntra-ish branding */}
                <div className="flex items-center justify-between mb-6">
                  <div className="text-3xl font-black tracking-tight text-pink-300">
                    MYNTRA
                  </div>
                  <CheckCircle className="h-6 w-6 text-emerald-400" />
                </div>

                <p className="text-white/70 mb-6 leading-relaxed">
                  Automatically import your entire order history with images, brands, sizes, and prices.
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-white/50">
                    <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                    <span>One-click bookmarklet</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/50">
                    <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                    <span>Auto-categorization</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/50">
                    <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                    <span>Duplicate detection</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ajio Card */}
            <div className="group relative p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300 overflow-hidden">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative">
                {/* Ajio-ish branding */}
                <div className="flex items-center justify-between mb-6">
                  <div className="text-3xl font-black tracking-tight text-amber-300">
                    AJIO
                  </div>
                  <CheckCircle className="h-6 w-6 text-emerald-400" />
                </div>

                <p className="text-white/70 mb-6 leading-relaxed">
                  Import all your Ajio purchases seamlessly. Product details extracted automatically.
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-white/50">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Quick setup</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/50">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Smart size detection</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/50">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Privacy-first proxy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coming Soon */}
          <div className="text-center">
            <p className="text-white/40 text-sm mb-4">More integrations coming soon</p>
            <div className="flex items-center justify-center gap-6 opacity-30">
              <div className="px-6 py-3 rounded-lg border border-white/10 text-sm font-medium text-white/60">
                Amazon
              </div>
              <div className="px-6 py-3 rounded-lg border border-white/10 text-sm font-medium text-white/60">
                Flipkart
              </div>
              <div className="px-6 py-3 rounded-lg border border-white/10 text-sm font-medium text-white/60">
                Zara
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Jobs to Be Done Section */}
      <section ref={featuresRef} className="relative z-10 py-32 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">
              Finally, answers to{' '}
              <span className="bg-gradient-to-r from-amber-400 to-pink-400 bg-clip-text text-transparent">
                "what should I wear?"
              </span>
            </h2>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">
              We built Fitso.me for people who are tired of staring at a full closet
              and feeling like they have nothing to wear.
            </p>
          </div>

          {/* JTBD Cards */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* JTBD 1 */}
            <div className="group p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold mb-3 text-amber-300">
                "I forget what I actually own"
              </h3>
              <p className="text-white/60 leading-relaxed mb-6">
                You've bought something only to realize you already have three just like it. 
                With everything cataloged in one place, you'll finally see your complete 
                wardrobe at a glance — and stop buying duplicates.
              </p>
              <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                <CheckCircle className="h-4 w-4" />
                <span>Visual catalog of everything you own</span>
              </div>
            </div>

            {/* JTBD 2 */}
            <div className="group p-8 rounded-3xl bg-gradient-to-br from-pink-500/10 to-pink-500/5 border border-pink-500/20 hover:border-pink-500/40 transition-all duration-300">
              <div className="text-4xl mb-4">👗</div>
              <h3 className="text-2xl font-bold mb-3 text-pink-300">
                "I wear the same things over and over"
              </h3>
              <p className="text-white/60 leading-relaxed mb-6">
                Those great pieces buried in the back? You'll rediscover them. 
                Create and save outfit combinations, see what you haven't worn lately, 
                and finally use your whole wardrobe — not just the front row.
              </p>
              <div className="flex items-center gap-2 text-pink-400 text-sm font-medium">
                <CheckCircle className="h-4 w-4" />
                <span>Mix, match, and save outfit ideas</span>
              </div>
            </div>

            {/* JTBD 3 */}
            <div className="group p-8 rounded-3xl bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/20 hover:border-violet-500/40 transition-all duration-300">
              <div className="text-4xl mb-4">🧳</div>
              <h3 className="text-2xl font-bold mb-3 text-violet-300">
                "I always forget something when packing"
              </h3>
              <p className="text-white/60 leading-relaxed mb-6">
                No more arriving at your destination without a phone charger or 
                your favorite jeans. Build packing lists from your actual wardrobe, 
                check items off as you pack, and travel with confidence.
              </p>
              <div className="flex items-center gap-2 text-violet-400 text-sm font-medium">
                <CheckCircle className="h-4 w-4" />
                <span>Smart packing lists you can reuse</span>
              </div>
            </div>

            {/* JTBD 4 */}
            <div className="group p-8 rounded-3xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-2xl font-bold mb-3 text-cyan-300">
                "I want to share my style"
              </h3>
              <p className="text-white/60 leading-relaxed mb-6">
                Proud of your collection? Create a public showcase of your favorite 
                pieces and share your unique style with friends, family, or followers. 
                Your personal style, beautifully displayed.
              </p>
              <div className="flex items-center gap-2 text-cyan-400 text-sm font-medium">
                <CheckCircle className="h-4 w-4" />
                <span>Get your own fitso.me/username page</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Quote */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <Quote className="h-10 w-10 text-white/20 mx-auto mb-6" />
          <blockquote className="text-2xl md:text-3xl font-medium text-white/80 leading-relaxed mb-6">
            "I used to stress about what to pack every single trip. Now I just pull up 
            my packing list, check things off, and I'm done. Life-changing."
          </blockquote>
          <div className="text-white/40">
            — A very happy early user
          </div>
        </div>
      </section>

      {/* How it Works - Simple */}
      <section className="relative z-10 py-32 px-6 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-16">
            Get organized in{' '}
            <span className="text-amber-400">3 simple steps</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-6 text-2xl font-black text-white">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Import or add items</h3>
              <p className="text-white/50">
                Import from Myntra & Ajio in one click, or add items manually with photos.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mx-auto mb-6 text-2xl font-black text-white">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Organize & tag</h3>
              <p className="text-white/50">
                Items are auto-categorized. Refine details like size, color, and location as needed.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mx-auto mb-6 text-2xl font-black text-white">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Plan & pack</h3>
              <p className="text-white/50">
                Create outfits, build packing lists, and never forget what you have.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Style Guides Section */}
      <section className="relative z-10 py-32 px-6 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 backdrop-blur-sm mb-6">
              <BookOpen className="h-4 w-4 text-violet-400" />
              <span className="text-sm text-violet-300 font-medium">Style Guides</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">
              Know what to wear for{' '}
              <span className="bg-gradient-to-r from-amber-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
                every occasion
              </span>
            </h2>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">
              Expert outfit ideas for festivals, travel, work, and special moments.
              Never second-guess your outfit choices again.
            </p>
          </div>

          {/* Featured Guides Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {/* Festival Guides */}
            {getFestivalGuides().slice(0, 3).map((guide) => {
              const meta = CATEGORY_META[guide.category];
              return (
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
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${meta.color} bg-white/5 mb-2`}>
                            {meta.label}
                          </div>
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
              );
            })}

            {/* Lifestyle Guides */}
            {getLifestyleGuides().slice(0, 3).map((guide) => {
              const meta = CATEGORY_META[guide.category];
              return (
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
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${meta.color} bg-white/5 mb-2`}>
                            {meta.label}
                          </div>
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
              );
            })}
          </div>

          {/* View All Link */}
          <div className="text-center">
            <Link to="/guides">
              <Button
                variant="outline"
                className="gap-2 border-white/20 text-white hover:bg-white/10"
              >
                <BookOpen className="h-4 w-4" />
                View All Style Guides
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500 via-pink-500 to-violet-600 mb-8 shadow-2xl shadow-pink-500/30">
            <Package className="h-10 w-10 text-white" />
          </div>
          
          <h2 className="text-3xl md:text-5xl font-black mb-6">
            Never stress about
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
              outfits again
            </span>
          </h2>
          
          <p className="text-lg text-white/50 mb-10 max-w-xl mx-auto">
            Diwali, Holi, weddings, or just Monday morning — know exactly what to wear.
            Import from Myntra & Ajio or add items manually.
            Free to use. Syncs across all your devices.
          </p>

          <Button
            size="lg"
            onClick={handleGetStarted}
            className="text-lg px-10 py-7 gap-3 bg-gradient-to-r from-amber-500 via-pink-500 to-violet-600 hover:from-amber-400 hover:via-pink-400 hover:to-violet-500 text-white font-bold shadow-2xl shadow-pink-500/20 hover:shadow-pink-500/40 hover:scale-105 transition-all duration-300"
          >
            Get Started — It's Free
            <ArrowRight className="h-5 w-5" />
          </Button>

          <p className="text-sm text-white/30 mt-6">
            No credit card required. No spam. Just a simpler closet.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          
          <div className="flex items-center gap-6 text-sm text-white/40">
            <Link to="/privacy" className="hover:text-white/70 transition-colors">
              Privacy
            </Link>
            <Link to="/guides" className="hover:text-white/70 transition-colors">
              Style Guides
            </Link>
            <a href="mailto:shashank@fitso.me" className="hover:text-white/70 transition-colors">
              Contact
            </a>
            <a
              href="https://theshajha.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/70 transition-colors"
            >
              Built by Shashank
            </a>
          </div>
        </div>
      </footer>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md bg-[#1a1a1a] border-white/10">
          {dialogStep === 'signup' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl text-white">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 via-pink-500 to-violet-600 flex items-center justify-center">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  Create Your Account
                </DialogTitle>
                <DialogDescription className="text-white/50">
                  {emailSent
                    ? 'Check your email for the magic link!'
                    : 'Enter your email to get started. No password needed!'}
                </DialogDescription>
              </DialogHeader>

              {emailSent ? (
                <div className="py-6">
                  <Alert className="bg-emerald-500/10 border-emerald-500/30">
                    <Mail className="h-4 w-4 text-emerald-400" />
                    <AlertDescription className="text-emerald-200">
                      We've sent a magic link to <strong>{email}</strong>. Click the
                      link in your email to sign in.
                    </AlertDescription>
                  </Alert>
                  <p className="text-xs text-white/40 mt-4 text-center">
                    Didn't receive it? Check your spam folder or try again.
                  </p>
                </div>
              ) : (
                <>
                  <div className="py-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white/70">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError(null);
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMagicLink()}
                        autoFocus
                        className="text-lg py-6 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                        disabled={isSendingLink}
                      />
                      {error && <p className="text-sm text-red-400">{error}</p>}
                      <p className="text-xs text-white/40">
                        We'll send you a magic link — no password needed.
                      </p>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      onClick={handleSendMagicLink}
                      disabled={isSendingLink || !email.trim()}
                      className="w-full gap-2 bg-gradient-to-r from-amber-500 via-pink-500 to-violet-600 hover:from-amber-400 hover:via-pink-400 hover:to-violet-500"
                    >
                      {isSendingLink ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          Send Magic Link
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </>
          )}

          {dialogStep === 'demo-select' && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center text-xl text-white">
                  Choose Your Demo
                </DialogTitle>
                <DialogDescription className="text-center text-white/50">
                  Pick a collection style to explore
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-6">
                <button
                  onClick={() => handleSelectDemoType('him')}
                  disabled={demoLoading}
                  className="group relative flex flex-col items-center gap-4 p-6 rounded-xl border-2 border-transparent hover:border-blue-500/50 bg-gradient-to-br from-blue-500/10 to-slate-500/10 hover:from-blue-500/20 hover:to-slate-500/20 transition-all disabled:opacity-50"
                >
                  <div className="text-5xl">⌚</div>
                  <div className="text-center">
                    <p className="font-bold text-lg text-white">For Him</p>
                    <p className="text-xs text-white/50 mt-1">
                      Tech, gear & essentials
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => handleSelectDemoType('her')}
                  disabled={demoLoading}
                  className="group relative flex flex-col items-center gap-4 p-6 rounded-xl border-2 border-transparent hover:border-pink-500/50 bg-gradient-to-br from-pink-500/10 to-rose-500/10 hover:from-pink-500/20 hover:to-rose-500/20 transition-all disabled:opacity-50"
                >
                  <div className="text-5xl">👠</div>
                  <div className="text-center">
                    <p className="font-bold text-lg text-white">For Her</p>
                    <p className="text-xs text-white/50 mt-1">
                      Fashion & accessories
                    </p>
                  </div>
                </button>
              </div>
              {demoLoading && (
                <div className="flex items-center justify-center gap-2 text-sm text-white/50">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading demo...
                </div>
              )}
              <p className="text-xs text-center text-white/30">
                Explore freely — your data stays safe
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
