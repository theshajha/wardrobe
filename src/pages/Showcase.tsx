import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { db, type Item } from '@/db'
import { cn, formatSize } from '@/lib/utils'
import {
    Briefcase,
    Check,
    Copy,
    Download,
    Footprints,
    Laptop,
    Link2,
    Package,
    Share2,
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

// Compress data for URL sharing
function compressForUrl(data: object): string {
    const json = JSON.stringify(data)
    // Use base64 encoding (in production you might want to use a compression library)
    return btoa(encodeURIComponent(json))
}

// Decompress data from URL
function decompressFromUrl(encoded: string): object | null {
    try {
        const json = decodeURIComponent(atob(encoded))
        return JSON.parse(json)
    } catch {
        return null
    }
}

// Generate standalone HTML page
function generateShowcaseHTML(items: Item[], title: string, description: string): string {
    const itemsHtml = items.map(item => {
        const sizeDisplay = formatSize(item.size)
        return `
      <div class="item-card">
        ${item.imageData
                ? `<div class="item-image"><img src="${item.imageData}" alt="${item.name}" /></div>`
                : `<div class="item-placeholder">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>`
            }
        <div class="item-content">
          <h3 class="item-name">${item.name}</h3>
          <p class="item-details">
            ${item.subcategory || item.category}
            ${item.brand ? ` • ${item.brand}` : ''}
            ${item.color ? ` • ${item.color}` : ''}
          </p>
          ${sizeDisplay !== '—' ? `<span class="item-size">Size: ${sizeDisplay}</span>` : ''}
        </div>
      </div>
    `
    }).join('')

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Wardrobe Showcase</title>
  <style>
    :root {
      --bg: #0a0a0a;
      --card-bg: #171717;
      --text: #fafafa;
      --text-muted: #a1a1aa;
      --accent: #f59e0b;
      --border: #27272a;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      padding: 2rem;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    header {
      text-align: center;
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid var(--border);
    }
    
    header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--accent), #fb923c);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.5rem;
    }
    
    header p {
      color: var(--text-muted);
      font-size: 1.1rem;
      max-width: 600px;
      margin: 0 auto;
    }
    
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    
    .item-card {
      background: var(--card-bg);
      border-radius: 1rem;
      overflow: hidden;
      border: 1px solid var(--border);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .item-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.4);
    }
    
    .item-image {
      aspect-ratio: 1;
      overflow: hidden;
    }
    
    .item-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .item-placeholder {
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #27272a, #18181b);
      color: var(--text-muted);
    }
    
    .item-content {
      padding: 1rem;
    }
    
    .item-name {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    
    .item-details {
      color: var(--text-muted);
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }
    
    .item-size {
      display: inline-block;
      background: var(--border);
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    
    footer {
      text-align: center;
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border);
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    
    footer a {
      color: var(--accent);
      text-decoration: none;
    }
    
    @media (max-width: 640px) {
      body {
        padding: 1rem;
      }
      header h1 {
        font-size: 1.75rem;
      }
      .grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>✨ ${title}</h1>
      ${description ? `<p>${description}</p>` : ''}
    </header>
    
    <div class="grid">
      ${itemsHtml}
    </div>
    
    <footer>
      <p>Created with <a href="#">Nomad Wardrobe</a> • ${new Date().toLocaleDateString()}</p>
    </footer>
  </div>
</body>
</html>`
}

export default function Showcase() {
    const [items, setItems] = useState<Item[]>([])
    const [featuredItems, setFeaturedItems] = useState<Item[]>([])
    const [loading, setLoading] = useState(true)
    const [showExportDialog, setShowExportDialog] = useState(false)
    const [showShareDialog, setShowShareDialog] = useState(false)
    const [exportTitle, setExportTitle] = useState('My Wardrobe Showcase')
    const [exportDescription, setExportDescription] = useState('')
    const [shareUrl, setShareUrl] = useState('')
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        loadItems()
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

    const handleExportHTML = () => {
        const html = generateShowcaseHTML(featuredItems, exportTitle, exportDescription)
        const blob = new Blob([html], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${exportTitle.toLowerCase().replace(/\s+/g, '-')}-showcase.html`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setShowExportDialog(false)
    }

    const handleGenerateShareUrl = () => {
        // Create shareable data (without images to keep URL short)
        const shareData = {
            title: exportTitle,
            description: exportDescription,
            items: featuredItems.map(item => ({
                name: item.name,
                category: item.category,
                subcategory: item.subcategory,
                brand: item.brand,
                color: item.color,
                size: item.size,
            }))
        }

        const encoded = compressForUrl(shareData)
        const url = `${window.location.origin}/showcase?share=${encoded}`
        setShareUrl(url)
        setShowShareDialog(true)
    }

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Check for shared showcase in URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const shareParam = params.get('share')
        if (shareParam) {
            const data = decompressFromUrl(shareParam) as { title: string; description: string; items: Partial<Item>[] } | null
            if (data) {
                // Display shared showcase (read-only mode)
                console.log('Shared showcase data:', data)
                // You could set a "viewing shared" state here
            }
        }
    }, [])

    const nonFeaturedItems = items.filter(item => !item.isFeatured)

    return (
        <div className="p-4 md:p-8 space-y-4 md:space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2 md:gap-3">
                        <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-amber-400" />
                        Showcase
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-base hidden sm:block">Feature your best items and share them</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateShareUrl}
                        disabled={featuredItems.length === 0}
                        className="gap-2"
                    >
                        <Link2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Share</span>
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => setShowExportDialog(true)}
                        disabled={featuredItems.length === 0}
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Export</span>
                    </Button>
                </div>
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
                                Featured items can be exported as a beautiful HTML page or shared via link.
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

            {/* Export HTML Dialog */}
            <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Download className="h-5 w-5" />
                            Export Showcase as HTML
                        </DialogTitle>
                        <DialogDescription>
                            Create a beautiful standalone HTML page with your featured items.
                            Share it anywhere or host it on any website.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Showcase Title</Label>
                            <Input
                                id="title"
                                value={exportTitle}
                                onChange={(e) => setExportTitle(e.target.value)}
                                placeholder="My Wardrobe Showcase"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description (optional)</Label>
                            <Textarea
                                id="description"
                                value={exportDescription}
                                onChange={(e) => setExportDescription(e.target.value)}
                                placeholder="A collection of my favorite wardrobe items..."
                                rows={3}
                            />
                        </div>

                        <div className="p-3 rounded-lg bg-secondary/50 text-sm">
                            <p className="text-muted-foreground">
                                <strong className="text-foreground">{featuredItems.length} items</strong> will be included.
                                Images are embedded directly in the HTML file.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleExportHTML} className="gap-2">
                            <Download className="h-4 w-4" />
                            Download HTML
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Share Link Dialog */}
            <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Share2 className="h-5 w-5" />
                            Share Your Showcase
                        </DialogTitle>
                        <DialogDescription>
                            Share this link with others to show off your featured items.
                            Note: Images are not included in the link (only item details).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="flex gap-2">
                            <Input
                                value={shareUrl}
                                readOnly
                                className="font-mono text-xs"
                            />
                            <Button variant="outline" size="icon" onClick={copyToClipboard}>
                                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>

                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
                            <p className="text-amber-200">
                                <strong>💡 Tip:</strong> For a richer showcase with images, use the "Export HTML" option instead.
                                You can host the HTML file on GitHub Pages, Netlify, or any web server.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                            Close
                        </Button>
                        <Button onClick={copyToClipboard} className="gap-2">
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {copied ? 'Copied!' : 'Copy Link'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

