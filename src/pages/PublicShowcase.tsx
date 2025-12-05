/**
 * Public Showcase Page
 * Displays a user's public inventory (no auth required)
 * Accessible at /:username
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getPublicShowcase, type PublicItem } from '@/lib/data/supabase/public';
import { getImageUrl } from '@/lib/imageUrl';
import { cn } from '@/lib/utils';
import { AlertTriangle, ArrowLeft, Package, Shirt, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

export default function PublicShowcase() {
  const { username } = useParams<{ username: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<PublicItem[]>([]);
  const [displayName, setDisplayName] = useState<string>('');
  const [stats, setStats] = useState({ totalItems: 0, totalOutfits: 0 });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    async function fetchShowcase() {
      if (!username) {
        setError('Username required');
        setLoading(false);
        return;
      }

      try {
        const data = await getPublicShowcase(username);

        if (!data) {
          setError('Showcase not available');
          setLoading(false);
          return;
        }

        setItems(data.items);
        setDisplayName(data.profile.display_name || data.profile.username);
        setStats(data.stats);
        setLoading(false);
      } catch (err) {
        console.error('Showcase fetch error:', err);
        setError('Failed to load showcase');
        setLoading(false);
      }
    }

    fetchShowcase();
  }, [username]);

  // Update page title and meta description
  useEffect(() => {
    if (displayName && items.length >= 0) {
      document.title = `${displayName}'s Fit | Fitso.me`;

      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      const description = `Check out ${displayName}'s wardrobe collection on Fitso.me - ${stats.totalItems} items curated with style.`;
      if (metaDescription) {
        metaDescription.setAttribute('content', description);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = description;
        document.head.appendChild(meta);
      }
    }

    // Cleanup: reset to default title when component unmounts
    return () => {
      document.title = 'Fitso.me - Your Wardrobe, Your Style, Your Way';
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', 'Manage your wardrobe, track your style, and showcase your fit. 100% private, all data stays in your browser.');
      }
    };
  }, [displayName, items, stats.totalItems]);

  // Get unique categories
  const categories = items.length > 0
    ? [...new Set(items.map(item => item.category))]
    : [];

  // Filter items by category
  const filteredItems = selectedCategory
    ? items.filter(item => item.category === selectedCategory)
    : items;

  // Build image URL from image_url (which is the imageRef in Supabase)
  const getItemImageUrl = (item: PublicItem) => {
    if (!item.image_url) return null;
    return getImageUrl(item.image_url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading showcase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
            <h1 className="text-xl font-semibold">Showcase Not Available</h1>
            <p className="text-muted-foreground">
              {error === 'User not found'
                ? `The user "${username}" doesn't exist.`
                : error === 'Showcase not available'
                  ? `This user hasn't enabled their public showcase yet.`
                  : error}
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Go to Fitso.me
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xl font-extrabold tracking-tight">
              <span className="text-amber-400">FIT</span>
              <span className="text-pink-400">·</span>
              <span className="text-pink-400">SO</span>
              <span className="text-violet-400">·</span>
              <span className="text-violet-400">ME</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">{username}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              {stats.totalItems} items
            </span>
            <span className="flex items-center gap-1">
              <Shirt className="h-4 w-4" />
              {stats.totalOutfits} outfits
            </span>
            <Link to="/">
              <Button
                size="sm"
                className="bg-gradient-to-r from-amber-500 via-pink-500 to-violet-600 hover:from-amber-600 hover:via-pink-600 hover:to-violet-700 text-white font-semibold"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Build Your Fit
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{displayName}'s Fit</h1>
          <p className="text-muted-foreground">
            A curated collection of {stats.totalItems} items
          </p>
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            <Badge
              variant={selectedCategory === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Badge>
            {categories.map(category => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer capitalize"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        )}

        {/* Items Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {filteredItems.map(item => (
            <Card
              key={item.id}
              className={cn(
                "overflow-hidden hover:shadow-lg transition-shadow",
                item.is_featured && "ring-2 ring-amber-500/50"
              )}
            >
              <div className="aspect-square relative">
                {getItemImageUrl(item) ? (
                  <img
                    src={getItemImageUrl(item)!}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center bg-muted"
                    style={item.color ? {
                      background: `linear-gradient(135deg, ${item.color}, ${item.color}dd)`
                    } : undefined}
                  >
                    <Shirt
                      className="h-12 w-12"
                      style={{
                        color: item.color ? 'rgba(255, 255, 255, 0.8)' : 'rgba(161, 161, 170, 0.3)'
                      }}
                    />
                  </div>
                )}
                {item.is_featured && (
                  <Badge className="absolute top-2 right-2 bg-amber-500">
                    Featured
                  </Badge>
                )}
              </div>
              <CardContent className="p-3 space-y-1">
                <p className="font-medium text-sm truncate">{item.name}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="capitalize">{item.category}</span>
                  {item.color && (
                    <span className="flex items-center gap-1">
                      <span
                        className="w-3 h-3 rounded-full border"
                        style={{ backgroundColor: item.color.toLowerCase() }}
                      />
                    </span>
                  )}
                </div>
                {item.brand && (
                  <p className="text-xs text-muted-foreground truncate">{item.brand}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No items to display</p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-2">
            <p className="text-sm text-muted-foreground">
              Showcase powered by{' '}
              <Link to="/" className="text-primary hover:underline font-medium">
                Fitso.me
              </Link>
            </p>
            <p className="text-sm text-muted-foreground">
              <a
                href={`mailto:shashank@fitso.me?subject=Report Inappropriate Content - ${username}'s Profile&body=Profile URL: ${window.location.href}%0A%0APlease describe the issue:%0A`}
                className="hover:text-foreground transition-colors"
              >
                Report Inappropriate Content
              </a>
              {' · '}
              <Link to="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
