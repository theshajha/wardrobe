import { ImageUpload } from '@/components/ImageUpload'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { db, generateId, type Item } from '@/db'
import {
  CATEGORIES,
  CLIMATES,
  cn,
  CONDITIONS,
  formatSize,
  getItemAge,
  getSizeType,
  LETTER_SIZES,
  LOCATIONS,
  OCCASIONS,
  SHOE_SYSTEMS,
  SUBCATEGORIES,
  type SizeInfo,
  type SizeType,
} from '@/lib/utils'
import { getDefaultCurrency } from '@/pages/Settings'
import {
  AlertTriangle,
  Briefcase,
  Copy,
  Footprints,
  Grid3X3,
  Laptop,
  List,
  Package,
  Pencil,
  Plus,
  Ruler,
  Search,
  Shirt,
  Star,
  Trash2,
  Watch
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

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

// Smart Size Input Component
function SizeInput({
  sizeType,
  value,
  onChange
}: {
  sizeType: SizeType
  value: SizeInfo | undefined
  onChange: (size: SizeInfo | undefined) => void
}) {
  if (sizeType === 'none') return null

  const updateSize = (updates: Partial<SizeInfo>) => {
    onChange({ ...value, type: sizeType, ...updates } as SizeInfo)
  }

  return (
    <div className="col-span-2 p-4 rounded-lg bg-secondary/30 border">
      <div className="flex items-center gap-2 mb-3">
        <Ruler className="h-4 w-4 text-primary" />
        <Label className="text-sm font-medium">Size</Label>
      </div>

      {sizeType === 'letter' && (
        <div className="flex flex-wrap gap-2">
          {LETTER_SIZES.map((size) => (
            <Button
              key={size}
              type="button"
              variant={value?.value === size ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateSize({ value: size })}
              className="min-w-[48px]"
            >
              {size}
            </Button>
          ))}
        </div>
      )}

      {sizeType === 'numeric' && (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="e.g., 32"
            value={value?.value || ''}
            onChange={(e) => updateSize({ value: e.target.value })}
            className="w-24"
          />
          <span className="text-sm text-muted-foreground">inches/cm</span>
        </div>
      )}

      {sizeType === 'waist-inseam' && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Waist</Label>
            <Input
              type="number"
              placeholder="32"
              value={value?.waist || ''}
              onChange={(e) => updateSize({ waist: e.target.value })}
              className="w-20"
            />
          </div>
          <span className="text-muted-foreground">×</span>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Inseam</Label>
            <Input
              type="number"
              placeholder="30"
              value={value?.inseam || ''}
              onChange={(e) => updateSize({ inseam: e.target.value })}
              className="w-20"
            />
          </div>
          <span className="text-sm text-muted-foreground">inches</span>
        </div>
      )}

      {sizeType === 'shoe' && (
        <div className="flex items-center gap-3">
          <Select
            value={value?.system || 'us'}
            onValueChange={(sys) => updateSize({ system: sys })}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHOE_SYSTEMS.map((sys) => (
                <SelectItem key={sys.id} value={sys.id}>{sys.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            step="0.5"
            placeholder="e.g., 10"
            value={value?.value || ''}
            onChange={(e) => updateSize({ value: e.target.value })}
            className="w-24"
          />
        </div>
      )}

      {sizeType === 'watch' && (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="e.g., 42"
            value={value?.value || ''}
            onChange={(e) => updateSize({ value: e.target.value })}
            className="w-24"
          />
          <span className="text-sm text-muted-foreground">mm case diameter</span>
        </div>
      )}

      {sizeType === 'dimensions' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="L"
              value={value?.dimensions?.length || ''}
              onChange={(e) => updateSize({
                dimensions: {
                  ...value?.dimensions,
                  length: e.target.value ? Number(e.target.value) : undefined
                }
              })}
              className="w-20"
            />
            <span className="text-muted-foreground">×</span>
            <Input
              type="number"
              placeholder="W"
              value={value?.dimensions?.width || ''}
              onChange={(e) => updateSize({
                dimensions: {
                  ...value?.dimensions,
                  width: e.target.value ? Number(e.target.value) : undefined
                }
              })}
              className="w-20"
            />
            <span className="text-muted-foreground">×</span>
            <Input
              type="number"
              placeholder="H"
              value={value?.dimensions?.height || ''}
              onChange={(e) => updateSize({
                dimensions: {
                  ...value?.dimensions,
                  height: e.target.value ? Number(e.target.value) : undefined
                }
              })}
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">cm</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">or Capacity:</span>
            <Input
              type="number"
              placeholder="e.g., 25"
              value={value?.capacity || ''}
              onChange={(e) => updateSize({ capacity: e.target.value ? Number(e.target.value) : undefined })}
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">liters</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Inventory() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all')
  const [conditionFilter, setConditionFilter] = useState<string>('all')

  // Get available subcategories based on category filter
  const availableSubcategories = useMemo(() => {
    if (categoryFilter === 'all') {
      // Get all subcategories from all categories
      return Object.entries(SUBCATEGORIES).flatMap(([cat, subs]) =>
        subs.map(sub => ({ category: cat, name: sub }))
      )
    }
    return (SUBCATEGORIES[categoryFilter] || []).map(sub => ({
      category: categoryFilter,
      name: sub
    }))
  }, [categoryFilter])

  // Reset subcategory filter when category changes
  useEffect(() => {
    setSubcategoryFilter('all')
  }, [categoryFilter])

  useEffect(() => {
    document.title = 'Inventory | Fitso.me'
  }, [])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [deleteItem, setDeleteItem] = useState<Item | null>(null)

  const getInitialFormData = () => ({
    name: '',
    category: '',
    subcategory: '',
    color: '',
    brand: '',
    purchaseDate: '',
    cost: undefined as number | undefined,
    currency: getDefaultCurrency(),
    condition: 'good',
    notes: '',
    location: 'home',
    climate: '',
    occasion: '',
    isPhaseOut: false,
    isFeatured: false,
    imageData: undefined as string | undefined,
    size: undefined as SizeInfo | undefined,
  })

  const [formData, setFormData] = useState(getInitialFormData())

  // Determine size type based on current category/subcategory
  const currentSizeType = useMemo(() => {
    return getSizeType(formData.category, formData.subcategory)
  }, [formData.category, formData.subcategory])

  // Track previous category/subcategory to detect actual changes
  const [prevCategory, setPrevCategory] = useState({ category: '', subcategory: '' })

  useEffect(() => {
    loadItems()
  }, [])

  // Reset size only when category/subcategory actually changes (not on initial load from edit)
  useEffect(() => {
    // Only reset if this is a genuine change, not initial form population
    if (prevCategory.category && prevCategory.subcategory !== undefined) {
      if (prevCategory.category !== formData.category || prevCategory.subcategory !== formData.subcategory) {
        setFormData(prev => ({ ...prev, size: undefined }))
      }
    }
    setPrevCategory({ category: formData.category, subcategory: formData.subcategory })
  }, [formData.category, formData.subcategory])

  const loadItems = async () => {
    const data = await db.items.toArray()
    setItems(data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const now = new Date().toISOString()

    if (editingItem) {
      const updated: Item = {
        ...editingItem,
        ...formData,
        updatedAt: now,
      }
      await db.items.put(updated)
    } else {
      const newItem: Item = {
        id: generateId(),
        ...formData,
        createdAt: now,
        updatedAt: now,
      }
      await db.items.add(newItem)
    }

    loadItems()
    handleCloseDialog()
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    await db.items.delete(deleteItem.id)
    loadItems()
    setDeleteItem(null)
  }

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false)
    setEditingItem(null)
    setPrevCategory({ category: '', subcategory: '' })
    setFormData(getInitialFormData())
  }

  const handleEdit = (item: Item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      category: item.category,
      subcategory: item.subcategory || '',
      color: item.color || '',
      brand: item.brand || '',
      purchaseDate: item.purchaseDate || '',
      cost: item.cost,
      currency: item.currency || getDefaultCurrency(),
      condition: item.condition || 'good',
      notes: item.notes || '',
      location: item.location || 'home',
      climate: item.climate || '',
      occasion: item.occasion || '',
      isPhaseOut: item.isPhaseOut || false,
      isFeatured: item.isFeatured || false,
      imageData: item.imageData,
      size: item.size,
    })
    setIsAddDialogOpen(true)
  }

  const handleDuplicate = (item: Item) => {
    // Don't set editingItem - this is a new item
    setEditingItem(null)
    setFormData({
      name: `${item.name} (copy)`,
      category: item.category,
      subcategory: item.subcategory || '',
      color: item.color || '',
      brand: item.brand || '',
      purchaseDate: '', // Don't copy purchase date - new item
      cost: item.cost, // Keep the cost for similar items
      currency: item.currency || getDefaultCurrency(),
      condition: item.condition || 'good',
      notes: item.notes || '',
      location: item.location || 'home',
      climate: item.climate || '',
      occasion: item.occasion || '',
      isPhaseOut: false, // New items shouldn't be phased out
      isFeatured: false, // New items aren't featured by default
      imageData: item.imageData, // Keep the image
      size: item.size, // Keep the size
    })
    setIsAddDialogOpen(true)
  }

  const toggleFeatured = async (item: Item, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = { ...item, isFeatured: !item.isFeatured, updatedAt: new Date().toISOString() }
    await db.items.put(updated)
    loadItems()
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.brand?.toLowerCase().includes(search.toLowerCase()) ||
      item.subcategory?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    const matchesSubcategory = subcategoryFilter === 'all' || item.subcategory === subcategoryFilter
    const matchesCondition = conditionFilter === 'all' || item.condition === conditionFilter
    return matchesSearch && matchesCategory && matchesSubcategory && matchesCondition
  })

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground text-sm md:text-base hidden sm:block">Manage all your belongings in one place</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Item</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {availableSubcategories.map((sub) => (
                <SelectItem key={`${sub.category}-${sub.name}`} value={sub.name}>
                  {sub.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={conditionFilter} onValueChange={setConditionFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Conditions</SelectItem>
              {CONDITIONS.map((cond) => (
                <SelectItem key={cond.id} value={cond.id}>{cond.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-1 border rounded-lg p-1 shrink-0">
            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')}>
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Items Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No items found</h3>
          <p className="text-muted-foreground mb-4">
            {search || categoryFilter !== 'all' || conditionFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Start by adding your first item'}
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {filteredItems.map((item) => {
            const Icon = categoryIcons[item.category] || Package
            const age = getItemAge(item.purchaseDate)
            const sizeDisplay = formatSize(item.size)

            return (
              <Card key={item.id} className={cn(
                "card-hover group relative overflow-hidden",
                item.isFeatured && "ring-2 ring-amber-500/50"
              )}>
                {/* Image or placeholder with action buttons overlay */}
                <div className="relative">
                  {item.imageData ? (
                    <div className="aspect-square overflow-hidden">
                      <img src={item.imageData} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className={cn(
                      "aspect-square flex items-center justify-center bg-gradient-to-br",
                      categoryColors[item.category] || 'from-gray-400 to-gray-500'
                    )}>
                      <Icon className="h-8 md:h-12 w-8 md:w-12 text-white/80" />
                    </div>
                  )}

                  {/* Action buttons overlay - always visible on mobile, hover on desktop */}
                  <div className="absolute inset-x-0 top-0 p-1.5 md:p-2 flex justify-between items-start md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    {/* Left: Star button */}
                    <Button
                      variant="secondary"
                      size="icon"
                      className={cn(
                        "h-7 w-7 md:h-8 md:w-8 bg-black/60 hover:bg-black/80 backdrop-blur-sm border-0",
                        item.isFeatured && "bg-amber-500 hover:bg-amber-600 text-black"
                      )}
                      onClick={(e) => toggleFeatured(item, e)}
                      title={item.isFeatured ? "Remove from showcase" : "Add to showcase"}
                    >
                      <Star className={cn("h-3.5 w-3.5 md:h-4 md:w-4", item.isFeatured && "fill-current")} />
                    </Button>

                    {/* Right: Copy and Edit buttons */}
                    <div className="flex gap-1">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7 md:h-8 md:w-8 bg-black/60 hover:bg-black/80 backdrop-blur-sm border-0"
                        onClick={(e) => { e.stopPropagation(); handleDuplicate(item); }}
                        title="Duplicate item"
                      >
                        <Copy className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7 md:h-8 md:w-8 bg-black/60 hover:bg-black/80 backdrop-blur-sm border-0"
                        onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                        title="Edit item"
                      >
                        <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Featured indicator (always visible when featured) */}
                  {item.isFeatured && (
                    <div className="absolute bottom-1.5 left-1.5 md:bottom-2 md:left-2">
                      <div className="h-5 w-5 md:h-6 md:w-6 rounded-full bg-amber-500 flex items-center justify-center shadow-lg">
                        <Star className="h-3 w-3 md:h-3.5 md:w-3.5 text-black fill-current" />
                      </div>
                    </div>
                  )}
                </div>

                <CardContent className="p-2.5 md:p-4">
                  <div className="mb-1.5 md:mb-2">
                    <h3 className="font-semibold truncate text-sm md:text-base">{item.name}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">
                      {item.subcategory || item.category}
                      {item.brand && ` • ${item.brand}`}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <Badge variant={age.status} className="text-[10px] md:text-xs">{age.label}</Badge>
                    {sizeDisplay !== '—' && (
                      <Badge variant="secondary" className="gap-0.5 text-[10px] md:text-xs hidden sm:flex">
                        <Ruler className="h-2.5 w-2.5 md:h-3 md:w-3" />
                        {sizeDisplay}
                      </Badge>
                    )}
                    {item.isPhaseOut && (
                      <Badge variant="destructive" className="gap-0.5 text-[10px] md:text-xs">
                        <AlertTriangle className="h-2.5 w-2.5 md:h-3 md:w-3" />
                        <span className="hidden sm:inline">Phase out</span>
                      </Badge>
                    )}
                    {item.location !== 'home' && (
                      <Badge variant="outline">{item.location}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => {
            const Icon = categoryIcons[item.category] || Package
            const age = getItemAge(item.purchaseDate)
            const sizeDisplay = formatSize(item.size)

            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg border hover:bg-secondary/50 transition-colors group",
                  item.isFeatured && "border-amber-500/50 bg-amber-500/5"
                )}
              >
                <div className="relative shrink-0">
                  {item.imageData ? (
                    <img src={item.imageData} alt={item.name} className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <div className={cn(
                      "h-12 w-12 rounded-lg bg-gradient-to-br flex items-center justify-center",
                      categoryColors[item.category] || 'from-gray-400 to-gray-500'
                    )}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  )}
                  {item.isFeatured && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center">
                      <Star className="h-3 w-3 text-black fill-current" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{item.name}</h3>
                    {item.isPhaseOut && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Phase out
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.subcategory || item.category}
                    {item.brand && ` • ${item.brand}`}
                    {item.color && ` • ${item.color}`}
                    {sizeDisplay !== '—' && ` • Size: ${sizeDisplay}`}
                  </p>
                </div>

                <Badge variant={age.status}>{age.label}</Badge>
                <Badge variant="outline">{item.location}</Badge>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => toggleFeatured(item, e)}
                    title={item.isFeatured ? "Remove from showcase" : "Add to showcase"}
                    className={cn(item.isFeatured && "text-amber-500")}
                  >
                    <Star className={cn("h-4 w-4", item.isFeatured && "fill-current")} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDuplicate(item)} title="Duplicate item">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} title="Edit item">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteItem(item)} title="Delete item">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the details of your item' : 'Add a new item to your inventory'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div>
              <Label>Photo</Label>
              <ImageUpload
                value={formData.imageData}
                onChange={(value) => setFormData({ ...formData, imageData: value })}
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Blue Oxford Shirt"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value, subcategory: '', size: undefined })}
                  required
                >
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subcategory">Subcategory</Label>
                <Select
                  value={formData.subcategory}
                  onValueChange={(value) => setFormData({ ...formData, subcategory: value, size: undefined })}
                  disabled={!formData.category}
                >
                  <SelectTrigger><SelectValue placeholder="Select subcategory" /></SelectTrigger>
                  <SelectContent>
                    {formData.category && SUBCATEGORIES[formData.category]?.map((sub) => (
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Smart Size Input */}
              {currentSizeType !== 'none' && (
                <SizeInput
                  sizeType={currentSizeType}
                  value={formData.size}
                  onChange={(size) => setFormData({ ...formData, size })}
                />
              )}

              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="e.g., Nike"
                />
              </div>

              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="e.g., Navy Blue"
                />
              </div>

              <div>
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                />
              </div>

              {/* Cost Field */}
              <div >
                <Label htmlFor="cost">Cost</Label>
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
                      <SelectItem value="CAD">CAD</SelectItem>
                      <SelectItem value="AUD">AUD</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="cost"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.cost ?? ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      cost: e.target.value ? parseFloat(e.target.value) : undefined
                    })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="condition">Condition</Label>
                <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((cond) => (
                      <SelectItem key={cond.id} value={cond.id}>{cond.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Select value={formData.location} onValueChange={(value) => setFormData({ ...formData, location: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="climate">Best for Climate</Label>
                <Select value={formData.climate} onValueChange={(value) => setFormData({ ...formData, climate: value })}>
                  <SelectTrigger><SelectValue placeholder="Any weather" /></SelectTrigger>
                  <SelectContent>
                    {CLIMATES.map((clim) => (
                      <SelectItem key={clim.id} value={clim.id}>{clim.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="occasion">Occasion</Label>
                <Select value={formData.occasion} onValueChange={(value) => setFormData({ ...formData, occasion: value })}>
                  <SelectTrigger><SelectValue placeholder="Any occasion" /></SelectTrigger>
                  <SelectContent>
                    {OCCASIONS.map((occ) => (
                      <SelectItem key={occ.id} value={occ.id}>{occ.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes..."
                  rows={3}
                />
              </div>

              <div className="col-span-2 flex items-center space-x-2">
                <Checkbox
                  id="phaseOut"
                  checked={formData.isPhaseOut}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPhaseOut: checked as boolean })}
                />
                <Label htmlFor="phaseOut" className="text-sm font-normal cursor-pointer">
                  Mark for phase out (time to replace this item)
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancel</Button>
              <Button type="submit">{editingItem ? 'Save Changes' : 'Add Item'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteItem?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
