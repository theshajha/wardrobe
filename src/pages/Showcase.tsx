import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { db, type Item } from '@/db'
import { useShowcase } from '@/hooks/useShowcase'
import { useSync } from '@/hooks/useSync'
import { cn, formatSize } from '@/lib/utils'
import {
    AlertCircle,
    Briefcase,
    Check,
    Copy,
    ExternalLink,
    Footprints,
    Laptop,
    Package,
    Shirt,
    Sparkles,
    Star,
    Watch
} from 'lucide-react'
import { useEffect, useState } from 'react'

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
    const [items, setItems] = useState<Item[]>([])
    const [featuredItems, setFeaturedItems] = useState<Item[]>([])
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState(false)

    // Sync and showcase state
    const [syncState] = useSync()
    const showcase = useShowcase(syncState.isAuthenticated)

    useEffect(() => {
        loadItems()
    }, [])

    useEffect(() => {
        document.title = 'Showcase | Fitso.me'
    }, [])

    const loadItems = async () => {
        const data = await db.items.toArray()
        setItems(data)
        setFeaturedItems(data.filter(item => item.isFeatured))
        setLoading(false)
    }

    const toggleFeatured = async (item: Item) => {
        const updated = { ...item, isFeatured: !item.isFeatured, updatedAt: new Date().toISOString() }
        await db.items.put(updated)
        loadItems()
    }

    const handleCopyUrl = async () => {
        const url = showcase.getPublicUrl()
        if (url) {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleEnableProfile = async () => {
        await showcase.toggle()
    }

    const nonFeaturedItems = items.filter(item => !item.isFeatured)

    return (
        <div className="p-4 md:p-8 space-y-4 md:space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2 md:gap-3">
                        <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-amber-400" />
                        Showcase
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-base">Feature your best items and share them publicly</p>
                </div>

                {/* Public Profile Card */}
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h3 className="font-semibold flex items-center gap-2 mb-1">
                                    <ExternalLink className="h-4 w-4" />
                                    Public Profile
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Share your featured items with the world
                                </p>
                            </div>
                        </div>

                        {!syncState.isAuthenticated ? (
                            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-amber-500" />
                                    Enable sync in Settings to share your public profile
                                </p>
                            </div>
                        ) : showcase.enabled ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                    <span className="text-sm text-muted-foreground">Your public profile is live!</span>
                                </div>

                                {showcase.getPublicUrl() && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 text-xs p-2 rounded bg-secondary truncate">
                                                {showcase.getPublicUrl()}
                                            </code>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleCopyUrl}
                                            >
                                                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                            >
                                                <a href={showcase.getPublicUrl()!} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            💡 Only items marked as Featured will be visible on your public profile
                                        </p>
                                    </div>
                                )}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleEnableProfile}
                                    disabled={showcase.loading}
                                >
                                    Disable Public Profile
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    Enable your public profile to share your featured items with a unique URL.
                                    Only items marked as Featured will be visible.
                                </p>
                                <Button
                                    size="sm"
                                    onClick={handleEnableProfile}
                                    disabled={showcase.loading || featuredItems.length === 0}
                                    className="gap-2"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Enable Public Profile
                                </Button>
                                {featuredItems.length === 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        Add some featured items first before enabling your profile
                                    </p>
                                )}
                            </div>
                        )}

                        {showcase.error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                <p className="text-sm text-red-500">{showcase.error}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Featured Items */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                        Featured Items
                        <Badge variant="secondary">{featuredItems.length}</Badge>
                    </h2>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                ) : featuredItems.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <Sparkles className="h-12 w-12 mb-4 text-muted-foreground opacity-50" />
                            <h3 className="text-lg font-semibold mb-2">No featured items yet</h3>
                            <p className="text-muted-foreground mb-4 max-w-md">
                                Click the star icon on any item below to add it to your showcase.
                                Featured items will appear on your public profile.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {featuredItems.map((item) => {
                            const Icon = categoryIcons[item.category] || Package
                            const sizeDisplay = formatSize(item.size)

                            return (
                                <Card key={item.id} className="group relative overflow-hidden border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
                                    <div className="absolute top-2 right-2 z-10">
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="h-8 w-8 bg-amber-500 hover:bg-amber-600 text-black"
                                            onClick={() => toggleFeatured(item)}
                                        >
                                            <Star className="h-4 w-4 fill-current" />
                                        </Button>
                                    </div>

                                    {item.imageData ? (
                                        <div className="aspect-square overflow-hidden">
                                            <img src={item.imageData} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className={cn(
                                            "aspect-square flex items-center justify-center bg-gradient-to-br",
                                            categoryColors[item.category] || 'from-gray-400 to-gray-500'
                                        )}>
                                            <Icon className="h-16 w-16 text-white/80" />
                                        </div>
                                    )}

                                    <CardContent className="p-4">
                                        <h3 className="font-semibold truncate">{item.name}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {item.subcategory || item.category}
                                            {item.brand && ` • ${item.brand}`}
                                        </p>
                                        {sizeDisplay !== '—' && (
                                            <Badge variant="secondary" className="mt-2 text-xs">
                                                Size: {sizeDisplay}
                                            </Badge>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* All Items (to select for featuring) */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    All Items
                    <Badge variant="outline">{nonFeaturedItems.length}</Badge>
                </h2>

                {nonFeaturedItems.length === 0 && !loading ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                            <Check className="h-8 w-8 mb-2 text-green-500" />
                            <p className="text-muted-foreground">All items are featured!</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                        {nonFeaturedItems.map((item) => {
                            const Icon = categoryIcons[item.category] || Package

                            return (
                                <Card
                                    key={item.id}
                                    className="group relative cursor-pointer hover:border-amber-500/50 transition-colors overflow-hidden"
                                    onClick={() => toggleFeatured(item)}
                                >
                                    {item.imageData ? (
                                        <div className="aspect-square overflow-hidden rounded-t-lg">
                                            <img src={item.imageData} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className={cn(
                                            "aspect-square flex items-center justify-center rounded-t-lg bg-gradient-to-br",
                                            categoryColors[item.category] || 'from-gray-400 to-gray-500'
                                        )}>
                                            <Icon className="h-8 w-8 text-white/80" />
                                        </div>
                                    )}
                                    <CardContent className="p-2">
                                        <p className="text-xs font-medium truncate">{item.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {item.subcategory || item.category}
                                        </p>
                                    </CardContent>
                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex flex-col items-center gap-1">
                                            <Star className="h-6 w-6 text-amber-400" />
                                            <span className="text-white text-xs font-medium">Add to Showcase</span>
                                        </div>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
