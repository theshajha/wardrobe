import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Trip, TripItem } from '@/db'
import { useItems } from '@/hooks/useItems'
import { useTripItems, useTrips } from '@/hooks/useTrips'
import { getImageUrl } from '@/lib/imageUrl'
import { CLIMATES, cn, formatDate } from '@/lib/utils'
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Circle,
  Cloud,
  Footprints,
  Laptop,
  Loader2,
  MapPin,
  Package,
  Pencil,
  Plane,
  Plus,
  Shirt,
  Trash2,
  Watch,
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

const statusColors: Record<string, string> = {
  planning: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  packing: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  traveling: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  completed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
}

interface TripWithItems extends Trip {
  tripItems: TripItem[]
}

export default function Packing() {
  // Use unified hooks for Supabase/local storage
  const { trips: rawTrips, isLoading: tripsLoading, addTrip, updateTrip, deleteTrip: deleteTripFromStore } = useTrips()
  const { items, isLoading: itemsLoading } = useItems()

  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)
  const [isTripDialogOpen, setIsTripDialogOpen] = useState(false)
  const [isAddItemsDialogOpen, setIsAddItemsDialogOpen] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [deleteTripState, setDeleteTripState] = useState<Trip | null>(null)

  // Get trip items for the selected trip
  const { tripItems: selectedTripItems, addTripItem, updateTripItem, removeTripItem } = useTripItems(selectedTripId || undefined)

  const [tripForm, setTripForm] = useState({
    name: '',
    destination: '',
    startDate: '',
    endDate: '',
    climate: '',
    notes: '',
    status: 'planning',
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    document.title = 'Packing | Fitso.me'
  }, [])

  // Compute trips with their items
  const trips = useMemo(() => {
    return rawTrips.map((trip) => ({
      ...trip,
      tripItems: trip.id === selectedTripId ? selectedTripItems : [],
    }))
  }, [rawTrips, selectedTripId, selectedTripItems])

  // Get selected trip with items
  const selectedTrip = useMemo(() => {
    if (!selectedTripId) return null
    const trip = rawTrips.find(t => t.id === selectedTripId)
    if (!trip) return null
    return { ...trip, tripItems: selectedTripItems }
  }, [rawTrips, selectedTripId, selectedTripItems])

  const loading = tripsLoading || itemsLoading

  const handleTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      if (editingTrip) {
        await updateTrip(editingTrip.id, tripForm)
        toast.success('Trip updated')
      } else {
        await addTrip(tripForm)
        toast.success('Trip created')
      }
      handleCloseTripDialog()
    } catch (error) {
      console.error('Error saving trip:', error)
      toast.error('Failed to save trip')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTrip = async () => {
    if (!deleteTripState) return
    try {
      await deleteTripFromStore(deleteTripState.id)
      if (selectedTripId === deleteTripState.id) setSelectedTripId(null)
      toast.success('Trip deleted')
    } catch (error) {
      console.error('Error deleting trip:', error)
      toast.error('Failed to delete trip')
    }
    setDeleteTripState(null)
  }

  const handleCloseTripDialog = () => {
    setIsTripDialogOpen(false)
    setEditingTrip(null)
    setTripForm({ name: '', destination: '', startDate: '', endDate: '', climate: '', notes: '', status: 'planning' })
    setIsSaving(false)
  }

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip)
    setTripForm({
      name: trip.name,
      destination: trip.destination || '',
      startDate: trip.startDate || '',
      endDate: trip.endDate || '',
      climate: trip.climate || '',
      notes: trip.notes || '',
      status: trip.status || 'planning',
    })
    setIsTripDialogOpen(true)
  }

  const handleAddItemToTrip = async (itemId: string) => {
    if (!selectedTripId) return
    await addTripItem({
      tripId: selectedTripId,
      itemId,
      packed: false,
      quantity: 1,
    })
  }

  const handleRemoveItemFromTrip = async (tripItemId: string) => {
    await removeTripItem(tripItemId)
  }

  const handleTogglePacked = async (tripItem: TripItem) => {
    await updateTripItem(tripItem.id, { packed: !tripItem.packed })
  }

  const getPackingProgress = (trip: TripWithItems) => {
    if (trip.tripItems.length === 0) return 0
    const packed = trip.tripItems.filter((i) => i.packed).length
    return Math.round((packed / trip.tripItems.length) * 100)
  }

  const tripItemIds = selectedTripItems.map((ti) => ti.itemId) || []
  const availableItems = items.filter((item) => !tripItemIds.includes(item.id))

  // Mobile: show trip list or trip detail based on selection
  const [showTripList, setShowTripList] = useState(true)

  // On mobile, when a trip is selected, show the detail view
  const handleSelectTrip = (trip: TripWithItems) => {
    setSelectedTripId(trip.id)
    setShowTripList(false)
  }

  // On mobile, go back to trip list
  const handleBackToList = () => {
    setShowTripList(true)
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-3.5rem)] md:h-screen">
      {/* Trips List Sidebar - hidden on mobile when viewing a trip */}
      <div className={cn(
        "w-full md:w-80 border-b md:border-b-0 md:border-r bg-card/50 flex flex-col",
        !showTripList && "hidden md:flex"
      )}>
        <div className="p-3 md:p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Trips</h2>
            <Button size="sm" onClick={() => setIsTripDialogOpen(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : trips.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Plane className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No trips yet</p>
                <Button variant="link" size="sm" onClick={() => setIsTripDialogOpen(true)}>
                  Create your first trip
                </Button>
              </div>
            ) : (
              trips.map((trip) => {
                const progress = getPackingProgress(trip)
                const isSelected = selectedTrip?.id === trip.id

                return (
                  <div
                    key={trip.id}
                    onClick={() => handleSelectTrip(trip)}
                    className={cn(
                      'p-3 rounded-lg cursor-pointer transition-all group',
                      isSelected ? 'bg-primary/10 border border-primary/50' : 'hover:bg-secondary border border-transparent'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{trip.name}</p>
                        {trip.destination && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {trip.destination}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" className={cn('text-xs', statusColors[trip.status || 'planning'])}>
                        {trip.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{trip.tripItems.length} items</span>
                    </div>

                    {trip.tripItems.length > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Packing progress</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content - full width on mobile */}
      <div className={cn(
        "flex-1 overflow-auto",
        showTripList && "hidden md:block"
      )}>
        {selectedTrip ? (
          <div className="p-4 md:p-8 space-y-4 md:space-y-6">
            {/* Mobile back button */}
            <button
              onClick={handleBackToList}
              className="md:hidden flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2"
            >
              ← Back to trips
            </button>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{selectedTrip.name}</h1>
                <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2 text-sm text-muted-foreground">
                  {selectedTrip.destination && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {selectedTrip.destination}
                    </span>
                  )}
                  {selectedTrip.startDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(selectedTrip.startDate)}
                      {selectedTrip.endDate && ` - ${formatDate(selectedTrip.endDate)}`}
                    </span>
                  )}
                  {selectedTrip.climate && (
                    <span className="flex items-center gap-1">
                      <Cloud className="h-4 w-4" />
                      {CLIMATES.find((c) => c.id === selectedTrip.climate)?.name}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => handleEditTrip(selectedTrip)}>
                  <Pencil className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
                <Button size="sm" onClick={() => setIsAddItemsDialogOpen(true)}>
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Add Items</span>
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Packing Progress</p>
                    <p className="text-lg md:text-2xl font-bold">
                      {selectedTrip.tripItems.filter((i) => i.packed).length} / {selectedTrip.tripItems.length} packed
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl md:text-4xl font-bold text-primary">{getPackingProgress(selectedTrip)}%</p>
                  </div>
                </div>
                <Progress value={getPackingProgress(selectedTrip)} className="h-2 md:h-3" />
              </CardContent>
            </Card>

            {selectedTrip.tripItems.length === 0 ? (
              <div className="text-center py-16">
                <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No items added yet</h3>
                <p className="text-muted-foreground mb-4">Start adding items to your packing list</p>
                <Button onClick={() => setIsAddItemsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Items
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedTrip.tripItems.map((tripItem) => {
                  const item = items.find((i) => i.id === tripItem.itemId)
                  if (!item) return null
                  const Icon = categoryIcons[item.category] || Package

                  return (
                    <div
                      key={tripItem.id}
                      className={cn(
                        'flex items-center gap-4 p-4 rounded-lg border transition-all',
                        tripItem.packed ? 'bg-emerald-500/5 border-emerald-500/20' : 'hover:bg-secondary/50'
                      )}
                    >
                      <button onClick={() => handleTogglePacked(tripItem)} className="shrink-0">
                        {tripItem.packed ? (
                          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                        ) : (
                          <Circle className="h-6 w-6 text-muted-foreground" />
                        )}
                      </button>

                      {(item.imageData || item.imageRef) ? (
                        <img src={item.imageData || getImageUrl(item.imageRef) || ''} alt={item.name} className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className={cn('font-medium', tripItem.packed && 'line-through text-muted-foreground')}>
                          {item.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.subcategory || item.category}
                          {item.brand && ` • ${item.brand}`}
                        </p>
                      </div>

                      <Badge variant="outline">{item.location}</Badge>

                      <Button variant="ghost" size="icon" onClick={() => handleRemoveItemFromTrip(tripItem.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Plane className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Select a trip</h3>
              <p className="text-muted-foreground">Choose a trip from the sidebar or create a new one</p>
            </div>
          </div>
        )}
      </div>

      {/* Trip Dialog */}
      <Dialog open={isTripDialogOpen} onOpenChange={(open) => !open && handleCloseTripDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTrip ? 'Edit Trip' : 'New Trip'}</DialogTitle>
            <DialogDescription>{editingTrip ? 'Update your trip details' : 'Plan a new trip'}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleTripSubmit} className="space-y-4">
            <div>
              <Label htmlFor="tripName">Trip Name *</Label>
              <Input
                id="tripName"
                value={tripForm.name}
                onChange={(e) => setTripForm({ ...tripForm, name: e.target.value })}
                placeholder="e.g., Weekend in Goa"
                required
              />
            </div>

            <div>
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                value={tripForm.destination}
                onChange={(e) => setTripForm({ ...tripForm, destination: e.target.value })}
                placeholder="e.g., Goa, India"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={tripForm.startDate}
                  onChange={(e) => setTripForm({ ...tripForm, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={tripForm.endDate}
                  onChange={(e) => setTripForm({ ...tripForm, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Climate</Label>
                <Select value={tripForm.climate} onValueChange={(value) => setTripForm({ ...tripForm, climate: value })}>
                  <SelectTrigger><SelectValue placeholder="Select climate" /></SelectTrigger>
                  <SelectContent>
                    {CLIMATES.map((clim) => (
                      <SelectItem key={clim.id} value={clim.id}>{clim.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={tripForm.status} onValueChange={(value) => setTripForm({ ...tripForm, status: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="packing">Packing</SelectItem>
                    <SelectItem value="traveling">Traveling</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="tripNotes">Notes</Label>
              <Textarea
                id="tripNotes"
                value={tripForm.notes}
                onChange={(e) => setTripForm({ ...tripForm, notes: e.target.value })}
                placeholder="Any notes about the trip..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseTripDialog} disabled={isSaving}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editingTrip ? 'Saving...' : 'Creating...'}
                  </>
                ) : (
                  editingTrip ? 'Save Changes' : 'Create Trip'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Items Dialog */}
      <Dialog open={isAddItemsDialogOpen} onOpenChange={setIsAddItemsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Items to Pack</DialogTitle>
            <DialogDescription>Select items to add to your packing list</DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[400px] pr-4">
            {availableItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>All items have been added to this trip</p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableItems.map((item) => {
                  const Icon = categoryIcons[item.category] || Package

                  return (
                    <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-secondary/50 transition-colors">
                      {(item.imageData || item.imageRef) ? (
                        <img src={item.imageData || getImageUrl(item.imageRef) || ''} alt={item.name} className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.subcategory || item.category}</p>
                      </div>

                      <Badge variant="outline">{item.location}</Badge>

                      <Button size="sm" onClick={() => handleAddItemToTrip(item.id)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddItemsDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Trip Confirmation */}
      <AlertDialog open={!!deleteTripState} onOpenChange={() => setDeleteTripState(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trip</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTripState?.name}"? This will also remove all packed items from this trip.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTrip} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

