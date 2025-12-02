import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { db, generateId, type WishlistItem } from '@/db'
import { CATEGORIES, cn, formatCurrency } from '@/lib/utils'
import { getDefaultCurrency } from '@/pages/Settings'
import {
  Check,
  ExternalLink,
  Link2,
  Package,
  Pencil,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'

const priorityColors = {
  low: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  high: 'bg-red-500/10 text-red-500 border-red-500/20',
}

const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export default function Wishlist() {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null)
  const [showPurchased, setShowPurchased] = useState(false)

  const getInitialFormData = () => ({
    name: '',
    category: '',
    quantity: 1,
    priority: 'medium' as 'low' | 'medium' | 'high',
    estimatedCost: undefined as number | undefined,
    currency: getDefaultCurrency(),
    link: '',
    notes: '',
  })

  const [formData, setFormData] = useState(getInitialFormData())

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    const data = await db.wishlist.toArray()
    // Sort: unpurchased first, then by priority (high > medium > low), then by date
    const sorted = data.sort((a, b) => {
      if (a.isPurchased !== b.isPurchased) return a.isPurchased ? 1 : -1
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    setItems(sorted)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const now = new Date().toISOString()

    if (editingItem) {
      const updated: WishlistItem = {
        ...editingItem,
        ...formData,
        updatedAt: now,
      }
      await db.wishlist.put(updated)
    } else {
      const newItem: WishlistItem = {
        id: generateId(),
        ...formData,
        isPurchased: false,
        createdAt: now,
        updatedAt: now,
      }
      await db.wishlist.add(newItem)
    }

    loadItems()
    handleCloseDialog()
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingItem(null)
    setFormData(getInitialFormData())
  }

  const handleEdit = (item: WishlistItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      category: item.category || '',
      quantity: item.quantity,
      priority: item.priority,
      estimatedCost: item.estimatedCost,
      currency: item.currency || getDefaultCurrency(),
      link: item.link || '',
      notes: item.notes || '',
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (item: WishlistItem) => {
    await db.wishlist.delete(item.id)
    loadItems()
  }

  const handleTogglePurchased = async (item: WishlistItem) => {
    const updated: WishlistItem = {
      ...item,
      isPurchased: !item.isPurchased,
      purchasedAt: !item.isPurchased ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    }
    await db.wishlist.put(updated)
    loadItems()
  }

  const unpurchasedItems = items.filter(i => !i.isPurchased)
  const purchasedItems = items.filter(i => i.isPurchased)

  const totalEstimated = unpurchasedItems.reduce((sum, item) => {
    return sum + (item.estimatedCost || 0) * item.quantity
  }, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2 md:gap-3">
            <ShoppingBag className="h-6 w-6 md:h-8 md:w-8 text-primary shrink-0" />
            <span>Wishlist</span>
          </h1>
          <p className="text-muted-foreground text-sm hidden sm:block">Track items you want to buy</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">To Buy</p>
                <p className="text-xl md:text-2xl font-bold">{unpurchasedItems.length}</p>
              </div>
              <ShoppingBag className="h-6 w-6 md:h-8 md:w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Purchased</p>
                <p className="text-xl md:text-2xl font-bold">{purchasedItems.length}</p>
              </div>
              <Check className="h-6 w-6 md:h-8 md:w-8 text-emerald-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Est. Cost</p>
                <p className="text-lg md:text-xl font-bold truncate">
                  {totalEstimated > 0 ? formatCurrency(totalEstimated, unpurchasedItems[0]?.currency) : '—'}
                </p>
              </div>
              <Package className="h-6 w-6 md:h-8 md:w-8 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unpurchased Items */}
      {unpurchasedItems.length === 0 && purchasedItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 md:py-16 text-center">
            <ShoppingBag className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg md:text-xl font-semibold mb-2">Your wishlist is empty</h3>
            <p className="text-muted-foreground mb-4 text-sm md:text-base">Add items you want to buy</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Unpurchased */}
          {unpurchasedItems.length > 0 && (
            <div className="space-y-2">
              {unpurchasedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg border bg-card hover:bg-secondary/50 transition-colors group"
                >
                  <button
                    onClick={() => handleTogglePurchased(item)}
                    className="h-5 w-5 md:h-6 md:w-6 rounded-full border-2 border-muted-foreground/50 hover:border-primary hover:bg-primary/10 transition-colors flex items-center justify-center shrink-0"
                  >
                    <Check className="h-3 w-3 text-transparent group-hover:text-primary/50" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm md:text-base">{item.name}</span>
                      {item.quantity > 1 && (
                        <Badge variant="secondary" className="text-xs">×{item.quantity}</Badge>
                      )}
                      <Badge variant="outline" className={cn('text-xs', priorityColors[item.priority])}>
                        {priorityLabels[item.priority]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground mt-0.5">
                      {item.category && <span>{CATEGORIES.find(c => c.id === item.category)?.name || item.category}</span>}
                      {item.estimatedCost && (
                        <span>• {formatCurrency(item.estimatedCost * item.quantity, item.currency)}</span>
                      )}
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span className="hidden sm:inline">Link</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Purchased Section */}
          {purchasedItems.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => setShowPurchased(!showPurchased)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Check className="h-4 w-4 text-emerald-500" />
                <span>Purchased ({purchasedItems.length})</span>
                <span className="text-xs">{showPurchased ? '▼' : '▶'}</span>
              </button>

              {showPurchased && (
                <div className="space-y-2 pl-6 border-l-2 border-emerald-500/20">
                  {purchasedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 md:p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 group"
                    >
                      <button
                        onClick={() => handleTogglePurchased(item)}
                        className="h-5 w-5 md:h-6 md:w-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0"
                      >
                        <Check className="h-3 w-3 text-white" />
                      </button>

                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm md:text-base line-through text-muted-foreground">
                          {item.name}
                          {item.quantity > 1 && ` ×${item.quantity}`}
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(item)}
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add to Wishlist'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update item details' : 'What do you want to buy?'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., White Socks, New Watch..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: 'low' | 'medium' | 'high') => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estimated Cost</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="JPY">JPY</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.estimatedCost ?? ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    estimatedCost: e.target.value ? parseFloat(e.target.value) : undefined
                  })}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="link" className="flex items-center gap-1">
                <Link2 className="h-3 w-3" />
                Product Link
              </Label>
              <Input
                id="link"
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Size, color, or other details..."
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {editingItem ? 'Save' : 'Add to List'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

