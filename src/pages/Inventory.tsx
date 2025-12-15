import { ImageUpload } from '@/components/ImageUpload'
import { ImportWizard } from '@/components/ImportWizard'
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
import { type Item } from '@/db'
import { useItems } from '@/hooks/useItems'
import { isDemoMode } from '@/lib/demo'
import { getImageUrl } from '@/lib/imageUrl'
import { detectSizeType } from '@/lib/importers'
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
  ArrowRight,
  Briefcase,
  Camera,
  Copy,
  Download,
  Footprints,
  Grid3X3,
  ImageIcon,
  Laptop,
  Lightbulb,
  List,
  Loader2,
  Package,
  Pencil,
  Plus,
  Ruler,
  Search,
  Shirt,
  Sparkles,
  Star,
  Trash2,
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
  // Use the unified items hook that handles both Supabase and local storage
  const { items, isLoading: loading, addItem: addItemToStore, updateItem: updateItemInStore, deleteItem: deleteItemFromStore } = useItems()
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
  const [isImportWizardOpen, setIsImportWizardOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [deleteItem, setDeleteItem] = useState<Item | null>(null)
  const isDemo = isDemoMode()

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
    imageData: undefined as string | undefined, // New image data (base64)
    imageRef: undefined as string | undefined, // Existing image reference (R2 path)
    size: undefined as SizeInfo | undefined,
  })

  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState(getInitialFormData())

  // Determine size type based on current category/subcategory
  const currentSizeType = useMemo(() => {
    return getSizeType(formData.category, formData.subcategory)
  }, [formData.category, formData.subcategory])

  // Track previous category/subcategory to detect actual changes
  const [prevCategory, setPrevCategory] = useState({ category: '', subcategory: '' })

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      if (editingItem) {
        // Update existing item
        await updateItemInStore(editingItem.id, {
          ...formData,
          // Only include imageRef if we don't have new imageData
          imageRef: formData.imageData ? undefined : formData.imageRef,
        })
        toast.success('Item updated successfully')
      } else {
        // Create new item
        await addItemToStore({
          ...formData,
        })
        toast.success('Item added successfully')
      }

      handleCloseDialog()
    } catch (error) {
      console.error('Error saving item:', error)
      toast.error(editingItem ? 'Failed to update item' : 'Failed to add item')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      await deleteItemFromStore(deleteItem.id)
      toast.success('Item deleted')
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Failed to delete item')
    }
    setDeleteItem(null)
  }

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false)
    setEditingItem(null)
    setPrevCategory({ category: '', subcategory: '' })
    setFormData(getInitialFormData())
    setIsSaving(false)
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
      imageData: undefined, // Clear any previous base64 data
      imageRef: item.imageRef, // Keep existing image reference
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
      imageData: undefined, // Don't copy image for duplicates
      imageRef: item.imageRef, // But keep the reference if it exists
      size: item.size, // Keep the size
    })
    setIsAddDialogOpen(true)
  }

  const toggleFeatured = async (item: Item, e: React.MouseEvent) => {
    e.stopPropagation()
    await updateItemInStore(item.id, { isFeatured: !item.isFeatured })
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsImportWizardOpen(true)}
            className="gap-2 shrink-0"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Import</span>
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Item</span>
          </Button>
        </div>
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
        search || categoryFilter !== 'all' || subcategoryFilter !== 'all' || conditionFilter !== 'all' ? (
          // Filtered empty state - keep it simple
          <div className="text-center py-20">
            <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No items match your filters</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button variant="outline" onClick={() => {
              setSearch('')
              setCategoryFilter('all')
              setSubcategoryFilter('all')
              setConditionFilter('all')
            }} className="gap-2">
              Clear Filters
            </Button>
          </div>
        ) : (
          // True empty state - show onboarding hints
          <div className="py-12 md:py-16">
            {/* Main empty state header */}
            <div className="text-center mb-10 md:mb-12">
              <div className="relative inline-block mb-6">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-amber-500/10 flex items-center justify-center">
                  <Package className="h-10 w-10 text-primary/60" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-secondary border-2 border-background flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold mb-2">Your wardrobe awaits</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {!isDemo
                  ? "The fastest way to build your inventory? Import from your order history."
                  : "Building your inventory takes a moment, but pays off forever. Here's how to start:"}
              </p>
            </div>

            {!isDemo && (
              <div className="max-w-2xl mx-auto mb-8">
                <div
                  className="group p-6 rounded-xl border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10 cursor-pointer hover:border-primary/80 hover:shadow-lg transition-all"
                  onClick={() => setIsImportWizardOpen(true)}
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 shadow-sm">
                      <Download className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground text-lg">Import from Myntra or Ajio</h4>
                        <Badge variant="secondary" className="text-[10px] px-2 py-0">Recommended</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        Automatically import dozens of items in minutes. We'll pull product images, names, brands, sizes, and prices directly from your order history.
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-sm text-primary font-medium group-hover:gap-2 transition-all">
                          Start importing <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 mb-6">
              <Lightbulb className="h-4 w-4 text-muted-foreground/50" />
              <span className="text-xs uppercase tracking-wider text-muted-foreground/50 font-medium">
                {!isDemo ? "Other ways to add items" : "Quick start ideas"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto mb-10">
              <div
                className="group p-5 rounded-xl border border-muted-foreground/20 bg-secondary/10 hover:bg-secondary/20 hover:border-muted-foreground/30 transition-all cursor-pointer"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                    <Plus className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Add items manually</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Perfect for unique pieces. Upload photos from your camera roll or paste image URLs.
                    </p>
                  </div>
                </div>
              </div>

              <div className="group p-5 rounded-xl border border-dashed border-muted-foreground/20 bg-secondary/10 hover:bg-secondary/20 transition-opacity">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                    <ImageIcon className="h-5 w-5 text-muted-foreground/60" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground/70 mb-1">Search product images</h4>
                    <p className="text-sm text-muted-foreground/60 leading-relaxed">
                      Google "Nike Air Max 90 White" to find official product photos in seconds.
                    </p>
                  </div>
                </div>
              </div>

              <div className="group p-5 rounded-xl border border-dashed border-muted-foreground/20 bg-secondary/10 hover:bg-secondary/20 transition-opacity">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                    <Camera className="h-5 w-5 text-muted-foreground/60" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground/70 mb-1">Take your own photos</h4>
                    <p className="text-sm text-muted-foreground/60 leading-relaxed">
                      Lay items flat with good lighting. A simple phone photo works great!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-lg mx-auto mb-8 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <p className="text-sm text-center text-muted-foreground">
                <span className="text-amber-600 dark:text-amber-400 font-medium">💡 Pro tip:</span> Start with items you wear most often.
                Even a partial inventory helps with outfit planning — you can always add more later.
              </p>
            </div>

            <div className="text-center flex flex-col sm:flex-row items-center justify-center gap-3">
              {!isDemo && (
                <Button onClick={() => setIsImportWizardOpen(true)} size="lg" className="gap-2">
                  <Download className="h-4 w-4" />
                  Import Items
                </Button>
              )}
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                size="lg"
                variant={!isDemo ? "outline" : "default"}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Manually
              </Button>
            </div>
          </div>
        )
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
                  {(item.imageData || item.imageRef) ? (
                    <div className="aspect-square overflow-hidden">
                      <img src={item.imageData || getImageUrl(item.imageRef) || ''} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className={cn(
                      "aspect-square flex items-center justify-center bg-gradient-to-br",
                      categoryColors[item.category] || 'from-gray-400 to-gray-500'
                    )}>
                      <Icon className="h-8 md:h-12 w-8 md:w-12 text-white/80" />
                    </div>
                  )}

                  <div className="absolute inset-x-0 top-0 p-1.5 md:p-2 flex justify-between items-start md:opacity-0 md:group-hover:opacity-100 transition-opacity">
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
                  {(item.imageData || item.imageRef) ? (
                    <img src={item.imageData || getImageUrl(item.imageRef) || ''} alt={item.name} className="h-12 w-12 rounded-lg object-cover" />
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
                value={formData.imageData || (formData.imageRef ? (getImageUrl(formData.imageRef) ?? undefined) : undefined)}
                onChange={(value) => setFormData({ ...formData, imageData: value, imageRef: value ? undefined : formData.imageRef })}
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
              <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isSaving}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editingItem ? 'Saving...' : 'Adding...'}
                  </>
                ) : (
                  editingItem ? 'Save Changes' : 'Add Item'
                )}
              </Button>
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

      <ImportWizard
        open={isImportWizardOpen}
        onOpenChange={setIsImportWizardOpen}
        existingItems={items.map(item => ({ name: item.name, brand: item.brand, id: item.id }))}
        onImport={async (importedItems) => {
          for (const item of importedItems) {
            await addItemToStore({
              name: item.name,
              category: item.category,
              subcategory: item.subcategory,
              brand: item.brand,
              color: item.color,
              purchaseDate: item.purchaseDate,
              cost: item.cost,
              currency: item.currency || 'INR',
              condition: 'good',
              location: 'home',
              isPhaseOut: false,
              isFeatured: false,
              imageData: item.imageData,
              size: item.size ? detectSizeType(item.size, item.category) : undefined,
            })
          }
          toast.success(`Imported ${importedItems.length} items to your inventory!`)
        }}
      />
    </div>
  )
}
