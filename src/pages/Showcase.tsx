import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { type Item } from '@/db'
import { useItems } from '@/hooks/useItems'
import { useProfile } from '@/hooks/useProfile'
import { getImageUrl } from '@/lib/imageUrl'
import { cn } from '@/lib/utils'
import {
    AlertCircle,
    Briefcase,
    Check,
    Copy,
    ExternalLink,
    Footprints,
    Laptop,
    Loader2,
    Package,
    Shirt,
    Sparkles,
    Star,
    Watch
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

const categoryIcons: Record<string, typeof Package> = {
    clothing: Shirt,
    accessories: Watch,
    gadgets: Laptop,
    bags: Briefcase,
    footwear: Footprints,
}

const categoryColors: Record<string, string> = {
    clothing: 'from-blue-500 to-cyan-500',
    accessories: 'from-purple-500 to-pink-500',
    gadgets: 'from-emerald-500 to-green-500',
    bags: 'from-amber-500 to-orange-500',
    footwear: 'from-red-500 to-rose-500',
}

export default function Showcase() {
    // Use unified items hook for Supabase
    const { items, isLoading: loading, updateItem } = useItems()
    const { isAuthenticated, username } = useAuth()
    const { profile, toggleShowcase, saving } = useProfile()
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        document.title = 'Showcase | Fitso.me'
    }, [])

    // Compute featured items from items
    const featuredItems = useMemo(() => items.filter(item => item.isFeatured), [items])

    const toggleFeatured = async (item: Item) => {
        try {
            await updateItem(item.id, { isFeatured: !item.isFeatured })
            toast.success(item.isFeatured ? 'Removed from showcase' : 'Added to showcase')
        } catch (error) {
            console.error('Error updating item:', error)
            toast.error('Failed to update item')
        }
    }

    const getPublicUrl = () => {
        if (!username) return null
        return `${window.location.origin}/${username}`
    }

    const handleCopyUrl = async () => {
        const url = getPublicUrl()
        if (url) {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            toast.success('Link copied to clipboard')
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleEnableProfile = async () => {
        const success = await toggleShowcase()
        if (success) {
            toast.success(profile?.showcase_enabled ? 'Public profile disabled' : 'Public profile enabled')
        } else {
            toast.error('Failed to update profile')
        }
    }

    const nonFeaturedItems = items.filter(item => !item.isFeatured)

    return (
        <div className="p-4 md:p-8 space-y-4 md:space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2 md:gap-3">
                        <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-amber-500 shrink-0" />
                        <span>Showcase</span>
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Feature your best items for public display
                    </p>
                </div>

                {/* Public Profile Status */}
                {isAuthenticated && (
                    <Card className={profile?.showcase_enabled ? 'border-emerald-500/50' : ''}>
                        <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className={cn(
                                        "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                                        profile?.showcase_enabled ? "bg-emerald-500/10" : "bg-secondary"
                                    )}>
                                        {profile?.showcase_enabled ? (
                                            <Check className="h-5 w-5 text-emerald-500" />
                                        ) : (
                                            <AlertCircle className="h-5 w-5 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium">
                                            {profile?.showcase_enabled ? 'Public Profile Active' : 'Public Profile Disabled'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {profile?.showcase_enabled
                                                ? 'Anyone with your link can see your featured items'
                                                : 'Enable to share your showcase with others'
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {profile?.showcase_enabled && username && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleCopyUrl}
                                                className="gap-1.5"
                                            >
                                                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                                {copied ? 'Copied!' : 'Copy Link'}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                            >
                                                <a href={`/${username}`} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                </a>
                                            </Button>
                                        </>
                                    )}
                                    <Button
                                        variant={profile?.showcase_enabled ? 'outline' : 'default'}
                                        size="sm"
                                        onClick={handleEnableProfile}
                                        disabled={saving}
                                    >
                                        {saving ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : profile?.showcase_enabled ? (
                                            'Disable'
                                        ) : (
                                            'Enable'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Featured Items */}
            <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500" />
                    Featured Items ({featuredItems.length})
                </h2>

                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                ) : featuredItems.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                        {featuredItems.map(item => {
                            const Icon = categoryIcons[item.category] || Package

                            return (
                                <Card
                                    key={item.id}
                                    className="overflow-hidden group cursor-pointer ring-2 ring-amber-500/50"
                                    onClick={() => toggleFeatured(item)}
                                >
                                    <div className="aspect-square relative">
                                        {item.imageRef ? (
                                            <img
                                                src={getImageUrl(item.imageRef) || ''}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className={cn(
                                                "w-full h-full flex items-center justify-center bg-gradient-to-br",
                                                categoryColors[item.category] || 'from-gray-400 to-gray-500'
                                            )}>
                                                <Icon className="h-10 w-10 text-white/80" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                            <Badge className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 text-foreground">
                                                Click to remove
                                            </Badge>
                                        </div>
                                        <Badge className="absolute top-2 right-2 bg-amber-500">
                                            <Star className="h-3 w-3 mr-1 fill-current" />
                                            Featured
                                        </Badge>
                                    </div>
                                    <CardContent className="p-2 md:p-3">
                                        <p className="font-medium text-xs md:text-sm truncate">{item.name}</p>
                                        <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                                            {item.subcategory || item.category}
                                        </p>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                            <p className="text-muted-foreground">No featured items yet</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Click on items below to add them to your showcase
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* All Items */}
            <div>
                <h2 className="text-lg font-semibold mb-4">
                    All Items ({nonFeaturedItems.length})
                </h2>

                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                ) : nonFeaturedItems.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                        {nonFeaturedItems.map(item => {
                            const Icon = categoryIcons[item.category] || Package

                            return (
                                <Card
                                    key={item.id}
                                    className="overflow-hidden group cursor-pointer hover:ring-2 hover:ring-amber-500/50 transition-all"
                                    onClick={() => toggleFeatured(item)}
                                >
                                    <div className="aspect-square relative">
                                        {item.imageRef ? (
                                            <img
                                                src={getImageUrl(item.imageRef) || ''}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className={cn(
                                                "w-full h-full flex items-center justify-center bg-gradient-to-br",
                                                categoryColors[item.category] || 'from-gray-400 to-gray-500'
                                            )}>
                                                <Icon className="h-10 w-10 text-white/80" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                            <Badge className="opacity-0 group-hover:opacity-100 transition-opacity bg-amber-500">
                                                <Star className="h-3 w-3 mr-1" />
                                                Add to Featured
                                            </Badge>
                                        </div>
                                    </div>
                                    <CardContent className="p-2 md:p-3">
                                        <p className="font-medium text-xs md:text-sm truncate">{item.name}</p>
                                        <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                                            {item.subcategory || item.category}
                                        </p>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                            <p className="text-muted-foreground">No items in inventory</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Add items to your inventory to feature them here
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
