/**
 * Public Showcase Page
 * Displays a user's public inventory (no auth required)
 * Accessible at /showcase/:username
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SYNC_API_URL } from '@/lib/sync/types';
import { cn } from '@/lib/utils';
import { AlertTriangle, ArrowLeft, Package, Shirt } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

interface ShowcaseItem {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  color?: string;
  brand?: string;
  imageRef?: string;
  imageHash?: string;
  condition: string;
  isFeatured?: boolean;
}

interface ShowcaseOutfit {
  id: string;
  name: string;
  occasion?: string;
  season?: string;
  itemIds: string[];
}

interface ShowcaseData {
  items: ShowcaseItem[];
  outfits: ShowcaseOutfit[];
  stats: {
    totalItems: number;
    totalOutfits: number;
  };
}

export default function PublicShowcase() {
  const { username } = useParams<{ username: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ShowcaseData | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    async function fetchShowcase() {
      if (!username) {
        setError('Username required');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${SYNC_API_URL}/public/showcase/${username}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          setError(result.error || 'Failed to load showcase');
          setLoading(false);
          return;
        }

        setData(result.data);
        setDisplayName(result.displayName || username);
        setLoading(false);
      } catch (err) {
        console.error('Showcase fetch error:', err);
        setError('Failed to load showcase');
        setLoading(false);
      }
    }

    fetchShowcase();
  }, [username]);

  // Get unique categories
  const categories = data?.items
    ? [...new Set(data.items.map(item => item.category))]
    : [];

  // Filter items by category
  const filteredItems = selectedCategory
    ? data?.items.filter(item => item.category === selectedCategory)
    : data?.items;

  // Build image URL
  const getImageUrl = (item: ShowcaseItem) => {
    // Extract hash from imageHash or imageRef
    let hash: string | null = null;

    if (item.imageHash) {
      hash = item.imageHash;
    } else if (item.imageRef) {
      // imageRef format: "{username}/images/{hash}" or "images/{hash}"
      const parts = item.imageRef.split('/');
      hash = parts[parts.length - 1]; // Get last part (the hash)
    }

    if (!hash) return null;

    return `${SYNC_API_URL}/public/showcase/${username}/image/${hash}`;
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
                : error === 'Showcase not enabled'
                ? `This user hasn't enabled their public showcase.`
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
              {data?.stats.totalItems || 0} items
            </span>
            <span className="flex items-center gap-1">
              <Shirt className="h-4 w-4" />
              {data?.stats.totalOutfits || 0} outfits
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{displayName}'s Fit</h1>
          <p className="text-muted-foreground">
            A curated collection of {data?.stats.totalItems || 0} items
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
                className="cursor-pointer"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        )}

        {/* Items Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {filteredItems?.map(item => (
            <Card 
              key={item.id} 
              className={cn(
                "overflow-hidden hover:shadow-lg transition-shadow",
                item.isFeatured && "ring-2 ring-amber-500/50"
              )}
            >
              <div className="aspect-square relative">
                {getImageUrl(item) ? (
                  <img
                    src={getImageUrl(item)!}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
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
                {item.isFeatured && (
                  <Badge className="absolute top-2 right-2 bg-amber-500">
                    Featured
                  </Badge>
                )}
              </div>
              <CardContent className="p-3 space-y-1">
                <p className="font-medium text-sm truncate">{item.name}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item.category}</span>
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

        {(!filteredItems || filteredItems.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No items to display</p>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Showcase powered by{' '}
            <Link to="/" className="text-primary hover:underline font-medium">
              Fitso.me
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}

