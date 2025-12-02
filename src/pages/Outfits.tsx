import { useState, useEffect } from 'react'
import { Shirt, Plus, Sparkles, Package, Watch, Laptop, Briefcase, Footprints, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { db, generateId, type Item, type Outfit } from '@/db'
import { cn, OCCASIONS } from '@/lib/utils'

const categoryIcons: Record<string, typeof Package> = {
  clothing: Shirt,
  accessories: Watch,
  gadgets: Laptop,
  bags: Briefcase,
  footwear: Footprints,
}

export default function Outfits() {
  const [items, setItems] = useState<Item[]>([])
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [deleteOutfit, setDeleteOutfit] = useState<Outfit | null>(null)

  const [outfitForm, setOutfitForm] = useState({
    name: '',
    occasion: '',
    selectedItems: [] as string[],
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [itemsData, outfitsData] = await Promise.all([db.items.toArray(), db.outfits.toArray()])
    setItems(itemsData)
    setOutfits(outfitsData)
    setLoading(false)
  }

  const handleCreateOutfit = async () => {
    if (!outfitForm.name || outfitForm.selectedItems.length === 0) return

    const newOutfit: Outfit = {
      id: generateId(),
      name: outfitForm.name,
      occasion: outfitForm.occasion || undefined,
      itemIds: outfitForm.selectedItems,
      createdAt: new Date().toISOString(),
    }

    await db.outfits.add(newOutfit)
    loadData()
    handleCloseDialog()
  }

  const handleDeleteOutfit = async () => {
    if (!deleteOutfit) return
    await db.outfits.delete(deleteOutfit.id)
    loadData()
    setDeleteOutfit(null)
  }

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false)
    setOutfitForm({ name: '', occasion: '', selectedItems: [] })
  }

  const toggleItemSelection = (itemId: string) => {
    setOutfitForm((prev) => ({
      ...prev,
      selectedItems: prev.selectedItems.includes(itemId)
        ? prev.selectedItems.filter((id) => id !== itemId)
        : [...prev.selectedItems, itemId],
    }))
  }

  const suggestOutfit = () => {
    const suggestion: string[] = []
    const clothingItems = items.filter((i) => i.category === 'clothing')
    const footwearItems = items.filter((i) => i.category === 'footwear')
    const accessoryItems = items.filter((i) => i.category === 'accessories')

    const tops = clothingItems.filter((i) => ['T-Shirts', 'Shirts', 'Hoodies', 'Sweaters'].includes(i.subcategory || ''))
    const bottoms = clothingItems.filter((i) => ['Pants', 'Shorts', 'Skirts'].includes(i.subcategory || ''))

    if (tops.length > 0) suggestion.push(tops[Math.floor(Math.random() * tops.length)].id)
    if (bottoms.length > 0) suggestion.push(bottoms[Math.floor(Math.random() * bottoms.length)].id)
    if (footwearItems.length > 0) suggestion.push(footwearItems[Math.floor(Math.random() * footwearItems.length)].id)
    if (accessoryItems.length > 0 && Math.random() > 0.5) {
      suggestion.push(accessoryItems[Math.floor(Math.random() * accessoryItems.length)].id)
    }

    setOutfitForm((prev) => ({ ...prev, selectedItems: suggestion }))
  }

  const clothingItems = items.filter((i) => i.category === 'clothing')
  const accessoryItems = items.filter((i) => i.category === 'accessories')
  const footwearItems = items.filter((i) => i.category === 'footwear')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2 md:gap-3">
            <Shirt className="h-6 w-6 md:h-8 md:w-8 text-primary shrink-0" />
            <span className="truncate">Outfits</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm hidden sm:block">Create and save outfit combinations from your wardrobe</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Create</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Outfits</p>
                <p className="text-xl md:text-2xl font-bold">{outfits.length}</p>
              </div>
              <Shirt className="h-6 w-6 md:h-8 md:w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Tops</p>
                <p className="text-xl md:text-2xl font-bold">
                  {clothingItems.filter((i) => ['T-Shirts', 'Shirts', 'Hoodies', 'Sweaters'].includes(i.subcategory || '')).length}
                </p>
              </div>
              <Shirt className="h-6 w-6 md:h-8 md:w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Bottoms</p>
                <p className="text-xl md:text-2xl font-bold">
                  {clothingItems.filter((i) => ['Pants', 'Shorts', 'Skirts'].includes(i.subcategory || '')).length}
                </p>
              </div>
              <Package className="h-6 w-6 md:h-8 md:w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Accessories</p>
                <p className="text-xl md:text-2xl font-bold">{accessoryItems.length}</p>
              </div>
              <Watch className="h-6 w-6 md:h-8 md:w-8 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {outfits.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Sparkles className="h-16 w-16 mx-auto mb-4 text-primary opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No outfits saved yet</h3>
            <p className="text-muted-foreground mb-4">Create your first outfit combination to get started</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Outfit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {outfits.map((outfit) => {
            const outfitItems = items.filter((i) => outfit.itemIds.includes(i.id))
            return (
              <Card key={outfit.id} className="card-hover group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{outfit.name}</CardTitle>
                      {outfit.occasion && (
                        <Badge variant="outline" className="mt-1">
                          {OCCASIONS.find((o) => o.id === outfit.occasion)?.name || outfit.occasion}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setDeleteOutfit(outfit)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {outfitItems.map((item) => {
                      const Icon = categoryIcons[item.category] || Package
                      return (
                        <div key={item.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-sm">
                          {item.imageData ? (
                            <img src={item.imageData} alt={item.name} className="h-4 w-4 rounded-full object-cover" />
                          ) : (
                            <Icon className="h-3.5 w-3.5" />
                          )}
                          <span className="truncate max-w-[120px]">{item.name}</span>
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">{outfitItems.length} items</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Outfit Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Create New Outfit</DialogTitle>
            <DialogDescription>Select items from your wardrobe to create an outfit combination</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="outfitName">Outfit Name *</Label>
                <Input
                  id="outfitName"
                  value={outfitForm.name}
                  onChange={(e) => setOutfitForm({ ...outfitForm, name: e.target.value })}
                  placeholder="e.g., Casual Friday"
                />
              </div>
              <div>
                <Label>Occasion</Label>
                <Select value={outfitForm.occasion} onValueChange={(value) => setOutfitForm({ ...outfitForm, occasion: value })}>
                  <SelectTrigger><SelectValue placeholder="Select occasion" /></SelectTrigger>
                  <SelectContent>
                    {OCCASIONS.map((occ) => (
                      <SelectItem key={occ.id} value={occ.id}>{occ.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Select Items ({outfitForm.selectedItems.length} selected)</Label>
              <Button variant="outline" size="sm" onClick={suggestOutfit}>
                <Sparkles className="h-4 w-4 mr-1" />
                Suggest
              </Button>
            </div>

            <ScrollArea className="h-[300px] border rounded-lg p-4">
              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No items in your inventory</p>
                  <p className="text-sm">Add items first to create outfits</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clothingItems.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Clothing</p>
                      <div className="space-y-1">
                        {clothingItems.map((item) => (
                          <label
                            key={item.id}
                            className={cn(
                              'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                              outfitForm.selectedItems.includes(item.id) ? 'bg-primary/10' : 'hover:bg-secondary'
                            )}
                          >
                            <Checkbox checked={outfitForm.selectedItems.includes(item.id)} onCheckedChange={() => toggleItemSelection(item.id)} />
                            {item.imageData && <img src={item.imageData} alt={item.name} className="h-8 w-8 rounded object-cover" />}
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.subcategory}{item.color && ` • ${item.color}`}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {footwearItems.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Footwear</p>
                      <div className="space-y-1">
                        {footwearItems.map((item) => (
                          <label
                            key={item.id}
                            className={cn(
                              'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                              outfitForm.selectedItems.includes(item.id) ? 'bg-primary/10' : 'hover:bg-secondary'
                            )}
                          >
                            <Checkbox checked={outfitForm.selectedItems.includes(item.id)} onCheckedChange={() => toggleItemSelection(item.id)} />
                            {item.imageData && <img src={item.imageData} alt={item.name} className="h-8 w-8 rounded object-cover" />}
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.subcategory}{item.color && ` • ${item.color}`}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {accessoryItems.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Accessories</p>
                      <div className="space-y-1">
                        {accessoryItems.map((item) => (
                          <label
                            key={item.id}
                            className={cn(
                              'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                              outfitForm.selectedItems.includes(item.id) ? 'bg-primary/10' : 'hover:bg-secondary'
                            )}
                          >
                            <Checkbox checked={outfitForm.selectedItems.includes(item.id)} onCheckedChange={() => toggleItemSelection(item.id)} />
                            {item.imageData && <img src={item.imageData} alt={item.name} className="h-8 w-8 rounded object-cover" />}
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.subcategory}{item.color && ` • ${item.color}`}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleCreateOutfit} disabled={!outfitForm.name || outfitForm.selectedItems.length === 0}>
              Create Outfit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteOutfit} onOpenChange={() => setDeleteOutfit(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Outfit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteOutfit?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOutfit} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

