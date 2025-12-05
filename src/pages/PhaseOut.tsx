import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Item } from '@/db'
import { useItems } from '@/hooks/useItems'
import { getImageUrl } from '@/lib/imageUrl'
import { cn, formatDate, getItemAge } from '@/lib/utils'
import { AlertTriangle, Briefcase, Check, Clock, Footprints, Laptop, Package, RefreshCw, Shirt, Trash2, Watch } from 'lucide-react'
import { useEffect, useState } from 'react'
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

export default function PhaseOut() {
  // Use unified items hook for Supabase/local storage
  const { items, isLoading: loading, updateItem, deleteItem: deleteItemFromStore } = useItems()
  const [deleteItemState, setDeleteItemState] = useState<Item | null>(null)

  useEffect(() => {
    document.title = 'Phase Out | Fitso.me'
  }, [])

  const handleTogglePhaseOut = async (item: Item) => {
    try {
      await updateItem(item.id, { isPhaseOut: !item.isPhaseOut })
      toast.success(item.isPhaseOut ? 'Removed from phase out list' : 'Added to phase out list')
    } catch (error) {
      console.error('Error updating item:', error)
      toast.error('Failed to update item')
    }
  }

  const handleDelete = async () => {
    if (!deleteItemState) return
    try {
      await deleteItemFromStore(deleteItemState.id)
      toast.success('Item deleted')
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Failed to delete item')
    }
    setDeleteItemState(null)
  }

  const phaseOutItems = items.filter((item) => item.isPhaseOut)
  const needsReplacementItems = items.filter((item) => item.condition === 'needs-replacement' && !item.isPhaseOut)
  const agingItems = items.filter((item) => {
    if (item.isPhaseOut || item.condition === 'needs-replacement') return false
    const age = getItemAge(item.purchaseDate)
    return age.status === 'old' || age.status === 'aging'
  })

  const renderItemCard = (item: Item, showRemoveFromList = false) => {
    const Icon = categoryIcons[item.category] || Package
    const age = getItemAge(item.purchaseDate)

    return (
      <div key={item.id} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg border hover:bg-secondary/50 transition-colors group">
        {(item.imageData || item.imageRef) ? (
          <img src={item.imageData || getImageUrl(item.imageRef) || ''} alt={item.name} className="h-10 w-10 md:h-12 md:w-12 rounded-xl object-cover shrink-0" />
        ) : (
          <div className={cn('h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0', categoryColors[item.category] || 'from-gray-400 to-gray-500')}>
            <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate text-sm md:text-base">{item.name}</p>
          <p className="text-xs md:text-sm text-muted-foreground truncate">
            {item.subcategory || item.category}
            {item.brand && ` • ${item.brand}`}
          </p>
          {item.purchaseDate && (
            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
              <Clock className="h-3 w-3 inline mr-1" />
              {formatDate(item.purchaseDate)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          <Badge variant={age.status} className="text-[10px] md:text-xs hidden sm:inline-flex">{age.label}</Badge>

          {showRemoveFromList ? (
            <Button variant="outline" size="sm" onClick={() => handleTogglePhaseOut(item)} className="h-8 px-2 md:px-3 text-xs md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <RefreshCw className="h-3.5 w-3.5 md:mr-1" />
              <span className="hidden md:inline">Keep</span>
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => handleTogglePhaseOut(item)} className="h-8 px-2 md:px-3 text-xs md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <AlertTriangle className="h-3.5 w-3.5 md:mr-1" />
              <span className="hidden md:inline">Phase Out</span>
            </Button>
          )}

          <Button variant="ghost" size="icon" onClick={() => setDeleteItemState(item)} className="h-8 w-8 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2 md:gap-3">
          <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-amber-500" />
          Phase Out
        </h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base hidden sm:block">Track items that need replacement</p>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="p-3 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-red-500" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Replace</p>
                <p className="text-2xl md:text-3xl font-bold text-red-500">{phaseOutItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-3 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 md:h-6 md:w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Needs Work</p>
                <p className="text-2xl md:text-3xl font-bold text-amber-500">{needsReplacementItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-500/5 border-orange-500/20">
          <CardContent className="p-3 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
                <RefreshCw className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Aging</p>
                <p className="text-2xl md:text-3xl font-bold text-orange-500">{agingItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Items to Phase Out
          </CardTitle>
        </CardHeader>
        <CardContent>
          {phaseOutItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Check className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No items marked for phase out</p>
              <p className="text-sm">Mark items from your inventory when you're ready to replace them</p>
            </div>
          ) : (
            <div className="space-y-2">{phaseOutItems.map((item) => renderItemCard(item, true))}</div>
          )}
        </CardContent>
      </Card>

      {needsReplacementItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Condition: Needs Replacement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">{needsReplacementItems.map((item) => renderItemCard(item))}</div>
          </CardContent>
        </Card>
      )}

      {agingItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-orange-500" />
              Aging Items (3+ years old)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">{agingItems.map((item) => renderItemCard(item))}</div>
          </CardContent>
        </Card>
      )}

      {phaseOutItems.length === 0 && needsReplacementItems.length === 0 && agingItems.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <Check className="h-16 w-16 mx-auto mb-4 text-emerald-500" />
            <h3 className="text-xl font-semibold mb-2">Everything looks good!</h3>
            <p className="text-muted-foreground">All your items are in great condition. No replacements needed right now.</p>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deleteItemState} onOpenChange={() => setDeleteItemState(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete "{deleteItemState?.name}"? This action cannot be undone.
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

