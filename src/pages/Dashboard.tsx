import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/contexts/AuthContext'
// Item and Trip types are inferred from hooks
import { useItems } from '@/hooks/useItems'
import { useTrips } from '@/hooks/useTrips'
import { getImageUrl } from '@/lib/imageUrl'
import { formatCurrency, formatDate, getItemAge } from '@/lib/utils'
import {
  AlertTriangle,
  Briefcase,
  Calendar,
  DollarSign,
  Footprints,
  Laptop,
  MapPin,
  Package,
  Shirt,
  TrendingUp,
  Watch,
} from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'

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

export default function Dashboard() {
  // Use unified hooks for Supabase
  const { items, isLoading: itemsLoading } = useItems()
  const { trips, isLoading: tripsLoading } = useTrips()
  const { username } = useAuth()

  const loading = itemsLoading || tripsLoading

  useEffect(() => {
    document.title = 'Dashboard | Fitso.me'
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  // Calculate stats
  const categoryCounts: Record<string, number> = {}
  let phaseOutCount = 0
  let needsReplacementCount = 0
  const worthByCurrency: Record<string, number> = {}
  let itemsWithCost = 0

  items.forEach((item) => {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1
    if (item.isPhaseOut) phaseOutCount++
    if (item.condition === 'needs-replacement') needsReplacementCount++
    if (item.cost && item.cost > 0) {
      const currency = item.currency || 'USD'
      worthByCurrency[currency] = (worthByCurrency[currency] || 0) + item.cost
      itemsWithCost++
    }
  })

  // Format total worth - group by currency if multiple, otherwise show single value
  const currencies = Object.keys(worthByCurrency)
  const totalWorthDisplay = currencies.length === 0
    ? '—'
    : currencies.length === 1
      ? formatCurrency(worthByCurrency[currencies[0]], currencies[0])
      : currencies.map(c => formatCurrency(worthByCurrency[c], c)).join(' + ')

  const recentItems = [...items]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const activeTrips = trips.filter(
    (trip) => trip.status === 'planning' || trip.status === 'packing'
  )

  const conditionCounts = {
    new: items.filter((i) => i.condition === 'new').length,
    good: items.filter((i) => i.condition === 'good').length,
    worn: items.filter((i) => i.condition === 'worn').length,
    'needs-replacement': needsReplacementCount,
  }

  const oldItems = items
    .filter((item) => {
      if (!item.purchaseDate) return false
      const age = getItemAge(item.purchaseDate)
      return age.status === 'old' || age.status === 'aging'
    })
    .slice(0, 5)

  const greeting = username ? `Welcome back, ${username}` : 'Welcome back'

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-1 md:space-y-2">
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight">{greeting}</h1>
        <p className="text-muted-foreground text-sm md:text-lg">
          Your wardrobe at a glance. {items.length} items tracked.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="card-hover">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl md:text-3xl font-bold">{items.length}</p>
              </div>
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Package className="h-5 w-5 md:h-6 md:w-6 text-black" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Phase Out</p>
                <p className="text-2xl md:text-3xl font-bold">{phaseOutCount}</p>
              </div>
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Total Worth</p>
                <p className={`font-bold ${currencies.length > 1 ? 'text-base md:text-xl' : 'text-2xl md:text-3xl'}`}>
                  {totalWorthDisplay}
                </p>
                {itemsWithCost > 0 && (
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-1 hidden md:block">
                    {itemsWithCost} of {items.length} priced
                  </p>
                )}
              </div>
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Active Trips</p>
                <p className="text-2xl md:text-3xl font-bold">{activeTrips.length}</p>
              </div>
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                <MapPin className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Overview + Recently Added */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              By Category
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(categoryIcons).map(([category, Icon]) => {
              const count = categoryCounts[category] || 0
              const percentage = items.length > 0 ? (count / items.length) * 100 : 0

              return (
                <Link key={category} to={`/inventory?category=${category}`} className="block group">
                  <div className="flex items-center gap-4 p-3 rounded-lg transition-colors hover:bg-secondary">
                    <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${categoryColors[category]} flex items-center justify-center`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium capitalize">{category}</span>
                        <span className="text-sm text-muted-foreground">{count} items</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </CardContent>
        </Card>

        {/* Recently Added - Moved up */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recently Added
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No items yet</p>
                <Link to="/inventory" className="text-primary hover:underline text-sm">
                  Add your first item
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentItems.map((item) => {
                  const Icon = categoryIcons[item.category] || Package
                  return (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors">
                      {(item.imageData || item.imageRef) ? (
                        <img src={item.imageData || getImageUrl(item.imageRef) || ''} alt={item.name} className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${categoryColors[item.category] || 'from-gray-400 to-gray-500'} flex items-center justify-center`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.subcategory || item.category}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Item Condition + Consider Replacing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Item Condition - Moved down */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Item Condition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-2xl font-bold text-emerald-500">{conditionCounts.new}</p>
                <p className="text-sm text-muted-foreground">New</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-2xl font-bold text-blue-500">{conditionCounts.good}</p>
                <p className="text-sm text-muted-foreground">Good</p>
              </div>
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-2xl font-bold text-amber-500">{conditionCounts.worn}</p>
                <p className="text-sm text-muted-foreground">Worn</p>
              </div>
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-2xl font-bold text-red-500">{conditionCounts['needs-replacement']}</p>
                <p className="text-sm text-muted-foreground">Replace</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Consider Replacing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Consider Replacing
            </CardTitle>
          </CardHeader>
          <CardContent>
            {oldItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>All items are in good shape!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {oldItems.map((item) => {
                  const age = getItemAge(item.purchaseDate)
                  const Icon = categoryIcons[item.category] || Package
                  return (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors">
                      {(item.imageData || item.imageRef) ? (
                        <img src={item.imageData || getImageUrl(item.imageRef) || ''} alt={item.name} className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${categoryColors[item.category] || 'from-gray-400 to-gray-500'} flex items-center justify-center`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.subcategory || item.category}</p>
                      </div>
                      <Badge variant={age.status}>{age.label} old</Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

