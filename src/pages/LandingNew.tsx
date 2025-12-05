/**
 * Landing Page with Get Started flow
 * Single CTA button that opens sign up dialog
 * Includes demo mode for exploring with sample data
 */

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  trackDemoEntered,
  trackGetStartedClicked,
  trackLandingPageViewed,
} from '@/lib/analytics';
import { enterDemoMode, type DemoType } from '@/lib/demo';
import {
  ArrowRight,
  Cloud,
  Lock,
  MapPin,
  Package,
  Shirt,
  Sparkles,
  Star,
  Watch,
  Laptop,
  Zap,
  Mail,
  Loader2,
  RefreshCw,
  Smartphone,
  FlaskConical,
  CheckCircle2,
  Camera,
  Luggage,
  Layers,
  Share2,
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { sendMagicLink } from '@/lib/auth/supabase-auth';

// Quirky logo component
function FitSomeLogo({ size = 'lg' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl md:text-8xl',
  };

  return (
    <h1
      className={`${sizeClasses[size]} font-extrabold tracking-tight flex items-center justify-center gap-1`}
    >
      <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
        FIT
      </span>
      <span className="text-pink-500 animate-pulse">·</span>
      <span className="bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent">
        SO
      </span>
      <span className="text-violet-500 animate-pulse delay-150">·</span>
      <span className="bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">
        ME
      </span>
    </h1>
  );
}

type DialogStep = 'signup' | 'demo-select';

export default function LandingNew() {
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
    document.title = 'Fitso.me - Your Wardrobe, Your Style, Your Way';
    trackLandingPageViewed();

    // Redirect authenticated users to dashboard
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

    // Basic email validation
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
      // Reset state after dialog closes
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

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-amber-950/10">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-amber-950/10">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="h-20 w-20 md:h-28 md:w-28 rounded-3xl bg-gradient-to-br from-amber-500 via-pink-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-pink-500/20 group-hover:scale-105 transition-transform">
                <Package className="h-10 w-10 md:h-14 md:w-14 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center animate-bounce shadow-lg">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="absolute -bottom-1 -left-1 h-6 w-6 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center animate-pulse shadow-lg">
                <Zap className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-4">
            <FitSomeLogo />
            <p className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              <span className="text-foreground font-medium">Your stuff.</span>{' '}
              <span className="text-foreground font-medium">Your style.</span>{' '}
              <span className="text-foreground font-medium">Your way.</span>
              <br />
              <span className="text-base md:text-lg">
                Manage everything you own, without the overwhelm.
              </span>
            </p>
          </div>

          {/* Features */}
          <div className="flex flex-wrap justify-center gap-3 py-6">
            {[
              { icon: Shirt, label: 'Track Clothing', color: 'text-amber-400' },
              { icon: Watch, label: 'Accessories', color: 'text-pink-400' },
              { icon: Laptop, label: 'Gadgets', color: 'text-violet-400' },
              { icon: MapPin, label: 'Pack for Trips', color: 'text-cyan-400' },
              { icon: Star, label: 'Showcase Style', color: 'text-amber-400' },
            ].map((feature) => (
              <div
                key={feature.label}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-secondary/50 border border-border/50 backdrop-blur-sm hover:bg-secondary/70 hover:scale-105 transition-all cursor-default"
              >
                <feature.icon className={`h-4 w-4 ${feature.color}`} />
                <span className="text-sm font-medium">{feature.label}</span>
              </div>
            ))}
          </div>

          {/* Single Get Started CTA */}
          <div className="pt-4 space-y-6">
            <div className="flex flex-col items-center gap-4">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="text-lg px-10 py-7 gap-3 bg-gradient-to-r from-amber-500 via-pink-500 to-violet-600 hover:from-amber-600 hover:via-pink-600 hover:to-violet-700 text-white font-bold shadow-2xl shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all"
              >
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Button>

              {/* Try Demo - subtle link style */}
              <button
                onClick={handleTryDemo}
                disabled={demoLoading}
                className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="text-sm">or</span>
                <span className="flex items-center gap-1.5 text-sm font-medium underline underline-offset-4 decoration-dashed decoration-muted-foreground/50 group-hover:decoration-foreground/50">
                  <FlaskConical className="h-3.5 w-3.5" />
                  {demoLoading ? 'Loading demo...' : 'explore with sample data'}
                </span>
              </button>
            </div>

            {/* Privacy note */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>Your data, your control</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Screenshot Section */}
      <div className="relative z-10 px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Screenshot in a browser-like frame */}
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-violet-500/20 rounded-3xl blur-2xl opacity-50 group-hover:opacity-70 transition-opacity" />
            
            {/* Browser frame */}
            <div className="relative bg-secondary/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-2xl overflow-hidden">
              {/* Browser header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-secondary/50 border-b border-border/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-background/50 text-xs text-muted-foreground flex items-center gap-2">
                    <Lock className="h-3 w-3" />
                    fitso.me
                  </div>
                </div>
                <div className="w-16" />
              </div>
              
              {/* Screenshot */}
              <img
                src="/images/product-og.png"
                alt="Fitso.me - Your wardrobe management app"
                className="w-full h-auto"
              />
            </div>
          </div>
          
          {/* Caption */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Organize your entire wardrobe in one beautiful place
          </p>
        </div>
      </div>

      {/* Features Deep Dive Section */}
      <div ref={featuresRef} className="relative z-10 py-24 px-6 bg-gradient-to-b from-transparent via-secondary/30 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Everything you need to{' '}
              <span className="bg-gradient-to-r from-amber-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
                manage your stuff
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From daily outfit planning to trip packing, Fitso.me helps you stay organized without the overwhelm.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: Inventory */}
            <div className="group p-6 rounded-2xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 hover:border-amber-500/30 transition-all">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Visual Inventory</h3>
              <p className="text-muted-foreground">
                Snap photos of your items and organize them by category. See everything you own at a glance.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-500" />
                  Quick photo capture
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-500" />
                  Smart categorization
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-500" />
                  Track brands & details
                </li>
              </ul>
            </div>

            {/* Feature 2: Outfits */}
            <div className="group p-6 rounded-2xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 hover:border-pink-500/30 transition-all">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Layers className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Outfit Planning</h3>
              <p className="text-muted-foreground">
                Create and save outfit combinations. Never stand in front of your closet wondering what to wear.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-pink-500" />
                  Mix and match items
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-pink-500" />
                  Save favorite looks
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-pink-500" />
                  Track what you've worn
                </li>
              </ul>
            </div>

            {/* Feature 3: Trip Packing */}
            <div className="group p-6 rounded-2xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 hover:border-violet-500/30 transition-all">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Luggage className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Trip Packing</h3>
              <p className="text-muted-foreground">
                Plan what to pack for your next trip. Check off items as you pack and never forget essentials.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-violet-500" />
                  Create packing lists
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-violet-500" />
                  Reuse for similar trips
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-violet-500" />
                  Track packed status
                </li>
              </ul>
            </div>

            {/* Feature 4: Showcase */}
            <div className="group p-6 rounded-2xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 hover:border-cyan-500/30 transition-all">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Share2 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Public Showcase</h3>
              <p className="text-muted-foreground">
                Share your style with the world. Create a public page showcasing your favorite items and outfits.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan-500" />
                  Custom profile URL
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan-500" />
                  Choose what to share
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan-500" />
                  Inspire others
                </li>
              </ul>
            </div>

            {/* Feature 5: Wishlist */}
            <div className="group p-6 rounded-2xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 hover:border-emerald-500/30 transition-all">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Star className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Wishlist</h3>
              <p className="text-muted-foreground">
                Keep track of items you want to buy. Save links and prices to make shopping decisions easier.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Save items to buy
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Track prices
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Prioritize purchases
                </li>
              </ul>
            </div>

            {/* Feature 6: Phase Out */}
            <div className="group p-6 rounded-2xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 hover:border-rose-500/30 transition-all">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Package className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Phase Out</h3>
              <p className="text-muted-foreground">
                Declutter mindfully. Mark items to donate, sell, or discard and keep your wardrobe fresh.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-rose-500" />
                  Track unused items
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-rose-500" />
                  Donate or sell
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-rose-500" />
                  Reduce clutter
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Features Section */}
      <div className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 via-pink-500/10 to-violet-500/10 border border-amber-500/20 mb-6">
            <Cloud className="h-4 w-4 text-pink-500" />
            <span className="text-sm font-medium">Cloud Sync Available</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Your wardrobe,{' '}
            <span className="bg-gradient-to-r from-amber-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
              everywhere you go
            </span>
          </h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Create a free account to sync your data across all your devices. Access your wardrobe from your phone, tablet, or computer.
          </p>

          <div className="grid sm:grid-cols-3 gap-8">
            <div className="flex flex-col items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/10 flex items-center justify-center">
                <RefreshCw className="h-7 w-7 text-amber-500" />
              </div>
              <h3 className="font-semibold">Auto Sync</h3>
              <p className="text-sm text-muted-foreground">
                Changes sync automatically across all your devices in real-time.
              </p>
            </div>
            
            <div className="flex flex-col items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-pink-500/20 to-pink-500/10 flex items-center justify-center">
                <Smartphone className="h-7 w-7 text-pink-500" />
              </div>
              <h3 className="font-semibold">Multi-Device</h3>
              <p className="text-sm text-muted-foreground">
                Access from your phone when shopping or your laptop at home.
              </p>
            </div>
            
            <div className="flex flex-col items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-500/10 flex items-center justify-center">
                <Lock className="h-7 w-7 text-violet-500" />
              </div>
              <h3 className="font-semibold">Secure Backup</h3>
              <p className="text-sm text-muted-foreground">
                Your data is encrypted and securely backed up in the cloud.
              </p>
            </div>
          </div>

          <div className="mt-12">
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="text-lg px-8 py-6 gap-2 bg-gradient-to-r from-amber-500 via-pink-500 to-violet-600 hover:from-amber-600 hover:via-pink-600 hover:to-violet-700 text-white font-bold shadow-xl hover:shadow-pink-500/30 hover:scale-105 transition-all"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-6 text-center relative z-10">
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-muted-foreground/60 mt-2">
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            {' · '}
            <a
              href="mailto:shashank@fitso.me"
              className="hover:text-foreground transition-colors"
            >
              Contact
            </a>
          </p>
        </div>
      </footer>

      {/* Main Dialog - handles all steps */}
      <Dialog open={showDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          {/* Step 1: Choice between Sign Up and Try Locally */}
          {/* Sign Up Form */}
          {dialogStep === 'signup' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 via-pink-500 to-violet-600 flex items-center justify-center">
                    <Cloud className="h-5 w-5 text-white" />
                  </div>
                  Create Your Account
                </DialogTitle>
                <DialogDescription>
                  {emailSent
                    ? 'Check your email for the magic link!'
                    : 'Enter your email to get started. No password needed!'}
                </DialogDescription>
              </DialogHeader>

              {emailSent ? (
                <div className="py-6">
                  <Alert className="bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800">
                    <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      We've sent a magic link to <strong>{email}</strong>. Click the
                      link in your email to sign in.
                    </AlertDescription>
                  </Alert>
                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    Didn't receive it? Check your spam folder or try again.
                  </p>
                </div>
              ) : (
                <>
                  <div className="py-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
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
                        className="text-lg py-6"
                        disabled={isSendingLink}
                      />
                      {error && (
                        <p className="text-sm text-red-600">{error}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        We'll send you a magic link to sign in — no password needed.
                      </p>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      onClick={handleSendMagicLink}
                      disabled={isSendingLink || !email.trim()}
                      className="w-full gap-2 bg-gradient-to-r from-amber-500 via-pink-500 to-violet-600 hover:from-amber-600 hover:via-pink-600 hover:to-violet-700"
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

          {/* Demo Selection */}
          {dialogStep === 'demo-select' && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center text-xl">
                  Choose Your Demo
                </DialogTitle>
                <DialogDescription className="text-center">
                  Pick a collection style to explore the app
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-6">
                {/* For Him */}
                <button
                  onClick={() => handleSelectDemoType('him')}
                  disabled={demoLoading}
                  className="group relative flex flex-col items-center gap-4 p-6 rounded-xl border-2 border-transparent hover:border-blue-500/50 bg-gradient-to-br from-blue-500/10 to-slate-500/10 hover:from-blue-500/20 hover:to-slate-500/20 transition-all disabled:opacity-50"
                >
                  <div className="text-5xl">⌚</div>
                  <div className="text-center">
                    <p className="font-bold text-lg text-foreground">For Him</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tech, gear & everyday essentials
                    </p>
                  </div>
                  <div className="absolute inset-0 rounded-xl ring-2 ring-transparent group-hover:ring-blue-500/30 transition-all" />
                </button>

                {/* For Her */}
                <button
                  onClick={() => handleSelectDemoType('her')}
                  disabled={demoLoading}
                  className="group relative flex flex-col items-center gap-4 p-6 rounded-xl border-2 border-transparent hover:border-pink-500/50 bg-gradient-to-br from-pink-500/10 to-rose-500/10 hover:from-pink-500/20 hover:to-rose-500/20 transition-all disabled:opacity-50"
                >
                  <div className="text-5xl">👠</div>
                  <div className="text-center">
                    <p className="font-bold text-lg text-foreground">For Her</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Fashion, accessories & style
                    </p>
                  </div>
                  <div className="absolute inset-0 rounded-xl ring-2 ring-transparent group-hover:ring-pink-500/30 transition-all" />
                </button>
              </div>
              {demoLoading && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading demo...
                </div>
              )}
              <p className="text-xs text-center text-muted-foreground">
                Explore freely — your data stays safe
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
