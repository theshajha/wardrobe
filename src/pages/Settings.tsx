import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/hooks/useProfile'
import { hasOptedOut, isAnalyticsEnabled, optIn, optOut, trackDemoEntered } from '@/lib/analytics'
import { enterDemoMode, exitDemoMode, getDemoType, getDemoTypeLabel, isDemoMode, type DemoType } from '@/lib/demo'
import {
  AlertTriangle,
  BarChart3,
  Check,
  Copy,
  DollarSign,
  ExternalLink,
  Eye,
  EyeOff,
  FlaskConical,
  Info,
  Loader2,
  Settings as SettingsIcon,
  Star,
  User,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CURRENCIES = [
  { id: 'USD', name: 'US Dollar', symbol: '$' },
  { id: 'EUR', name: 'Euro', symbol: '€' },
  { id: 'GBP', name: 'British Pound', symbol: '£' },
  { id: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { id: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { id: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { id: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
]

// Fallback for non-authenticated users (localStorage)
const PREFERENCES_KEY = 'fitsome-preferences'

export function getDefaultCurrency(): string {
  try {
    const prefs = localStorage.getItem(PREFERENCES_KEY)
    if (prefs) {
      const parsed = JSON.parse(prefs)
      return parsed.defaultCurrency || 'USD'
    }
  } catch (e) {
    console.error('Failed to load preferences:', e)
  }
  return 'USD'
}

export function setDefaultCurrency(currency: string): void {
  try {
    const prefs = localStorage.getItem(PREFERENCES_KEY)
    const parsed = prefs ? JSON.parse(prefs) : {}
    parsed.defaultCurrency = currency
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(parsed))
  } catch (e) {
    console.error('Failed to save preferences:', e)
  }
}

export default function Settings() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const profile = useProfile()

  // Local state for form inputs
  const [displayName, setDisplayName] = useState('')
  const [displayNameSaved, setDisplayNameSaved] = useState(false)
  const [defaultCurrency, setDefaultCurrencyState] = useState('USD')
  const [currencySaved, setCurrencySaved] = useState(false)
  const [showcaseToggling, setShowcaseToggling] = useState(false)
  const [showcaseCopied, setShowcaseCopied] = useState(false)
  const [showShowcaseInfo, setShowShowcaseInfo] = useState(false)

  // Demo mode state
  const [isDemo, setIsDemo] = useState(false)
  const [currentDemoType, setCurrentDemoType] = useState<DemoType | null>(null)
  const [demoLoading, setDemoLoading] = useState(false)
  const [showDemoDialog, setShowDemoDialog] = useState(false)

  useEffect(() => {
    document.title = 'Settings | Fitso.me'
    setIsDemo(isDemoMode())
    setCurrentDemoType(getDemoType())
  }, [])

  // Sync form state with profile data when it loads
  useEffect(() => {
    if (profile.profile) {
      setDisplayName(profile.profile.display_name || '')
      setDefaultCurrencyState(profile.profile.default_currency || 'USD')
    } else if (!isAuthenticated) {
      // Fallback to localStorage for non-authenticated users
      setDefaultCurrencyState(getDefaultCurrency())
    }
  }, [profile.profile, isAuthenticated])

  const handleDemoToggle = async () => {
    if (isDemo) {
      setDemoLoading(true)
      const success = await exitDemoMode()
      if (success) {
        navigate('/', { replace: true })
        window.location.reload()
      }
      setDemoLoading(false)
    } else {
      setShowDemoDialog(true)
    }
  }

  const handleSelectDemoType = async (type: DemoType) => {
    setShowDemoDialog(false)
    setDemoLoading(true)
    trackDemoEntered(type)
    const success = await enterDemoMode(type)
    if (success) {
      navigate('/dashboard', { replace: true })
      window.location.reload()
    }
    setDemoLoading(false)
  }

  const handleDisplayNameSave = async () => {
    if (!displayName.trim()) return

    const success = await profile.updateDisplayName(displayName)
    if (success) {
      setDisplayNameSaved(true)
      setTimeout(() => setDisplayNameSaved(false), 2000)
    }
  }

  const handleCurrencyChange = async (currency: string) => {
    setDefaultCurrencyState(currency)

    if (isAuthenticated) {
      const success = await profile.updateCurrency(currency)
      if (success) {
        setCurrencySaved(true)
        setTimeout(() => setCurrencySaved(false), 2000)
      }
    } else {
      // Fallback to localStorage for non-authenticated users
      setDefaultCurrency(currency)
    }
  }

  const handleShowcaseToggle = async () => {
    setShowcaseToggling(true)
    await profile.toggleShowcase()
    setShowcaseToggling(false)
  }

  const handleCopyShowcaseUrl = () => {
    const url = profile.getPublicUrl()
    if (url) {
      navigator.clipboard.writeText(url)
      setShowcaseCopied(true)
      setTimeout(() => setShowcaseCopied(false), 2000)
    }
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <SettingsIcon className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage preferences and data</p>
      </div>

      {/* Settings Content */}
      <Tabs defaultValue="preferences" className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Display Name - Only show for authenticated users */}
              {isAuthenticated && (
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Display Name
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      maxLength={50}
                      className="max-w-xs"
                      disabled={profile.loading}
                    />
                    <Button
                      size="sm"
                      onClick={handleDisplayNameSave}
                      disabled={!displayName.trim() || profile.saving}
                    >
                      {profile.saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : displayNameSaved ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        'Save'
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This name appears on your public profile as "{displayName || 'Your Name'}'s Fit"
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="currency" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Default Currency
                  {currencySaved && (
                    <span className="text-xs text-emerald-500 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Saved
                    </span>
                  )}
                </Label>
                <Select
                  value={defaultCurrency}
                  onValueChange={handleCurrencyChange}
                  disabled={profile.loading}
                >
                  <SelectTrigger id="currency" className="w-full max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((curr) => (
                      <SelectItem key={curr.id} value={curr.id}>
                        {curr.symbol} {curr.name} ({curr.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Used as default when adding new items
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Demo Mode Card */}
          <Card className={isDemo ? 'border-pink-500/50 bg-gradient-to-r from-amber-500/5 via-pink-500/5 to-violet-500/5' : ''}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FlaskConical className={isDemo ? 'h-4 w-4 text-pink-400' : 'h-4 w-4'} />
                Demo Mode
                {isDemo && currentDemoType && (
                  <span className="text-[10px] bg-pink-500/20 text-pink-400 px-2 py-0.5 rounded-full font-normal">
                    {getDemoTypeLabel(currentDemoType).emoji} {getDemoTypeLabel(currentDemoType).title.toUpperCase()}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">
                    {isDemo && currentDemoType
                      ? `Viewing ${getDemoTypeLabel(currentDemoType).title} collection`
                      : 'Explore with sample data'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isDemo
                      ? 'Exit to return to your own inventory'
                      : 'Choose a demo to see the app in action'
                    }
                  </p>
                </div>
                <Button
                  variant={isDemo ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleDemoToggle}
                  disabled={demoLoading}
                  className={isDemo ? 'bg-gradient-to-r from-amber-500 via-pink-500 to-violet-600 hover:from-amber-600 hover:via-pink-600 hover:to-violet-700' : ''}
                >
                  {demoLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isDemo ? (
                    'Exit Demo'
                  ) : (
                    'Enter Demo'
                  )}
                </Button>
              </div>
              {isDemo && (
                <p className="text-xs text-amber-600 bg-amber-500/10 p-2 rounded">
                  Changes made in demo mode are temporary and won't affect your real data.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Demo Selection Dialog */}
          <Dialog open={showDemoDialog} onOpenChange={setShowDemoDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center">Choose Your Demo</DialogTitle>
                <DialogDescription className="text-center">
                  Pick a collection style to explore the app
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                {/* For Him */}
                <button
                  onClick={() => handleSelectDemoType('him')}
                  className="group relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-transparent hover:border-blue-500/50 bg-gradient-to-br from-blue-500/5 to-slate-500/5 hover:from-blue-500/10 hover:to-slate-500/10 transition-all"
                >
                  <div className="text-4xl">⌚</div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground">For Him</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tech, gear & everyday essentials
                    </p>
                  </div>
                  <div className="absolute inset-0 rounded-xl ring-2 ring-transparent group-hover:ring-blue-500/30 transition-all" />
                </button>

                {/* For Her */}
                <button
                  onClick={() => handleSelectDemoType('her')}
                  className="group relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-transparent hover:border-pink-500/50 bg-gradient-to-br from-pink-500/5 to-rose-500/5 hover:from-pink-500/10 hover:to-rose-500/10 transition-all"
                >
                  <div className="text-4xl">👠</div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground">For Her</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Fashion, accessories & style
                    </p>
                  </div>
                  <div className="absolute inset-0 rounded-xl ring-2 ring-transparent group-hover:ring-pink-500/30 transition-all" />
                </button>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Your data will be safely backed up and restored when you exit demo mode
              </p>
            </DialogContent>
          </Dialog>

          {isAnalyticsEnabled() && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Privacy & Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Usage Analytics</p>
                    <p className="text-xs text-muted-foreground">
                      Help improve FITSO.ME by sharing anonymous usage data
                    </p>
                  </div>
                  <Button
                    variant={hasOptedOut() ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => {
                      if (hasOptedOut()) {
                        optIn()
                      } else {
                        optOut()
                      }
                      window.location.reload()
                    }}
                  >
                    {hasOptedOut() ? 'Enable' : 'Disable'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground/70">
                  We only collect anonymous usage patterns. Your inventory data never leaves your device.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Public Profile Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                {profile.profile?.showcase_enabled ? (
                  <Eye className="h-4 w-4 text-emerald-500" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
                Public Profile
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 ml-auto"
                  onClick={() => setShowShowcaseInfo(true)}
                >
                  <Info className="h-4 w-4 text-muted-foreground" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isAuthenticated ? (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-600">Account Required</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Create an account or sign in to use Public Profile
                    </p>
                  </div>
                </div>
              ) : profile.loading ? (
                <div className="flex items-center gap-2 py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading profile...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                      <p className="text-sm font-medium">Share Your Showcase</p>
                      <p className="text-xs text-muted-foreground">
                        {profile.profile?.showcase_enabled
                          ? 'Your featured items are visible to anyone with the link'
                          : 'Let others see your featured items via a public link'
                        }
                      </p>
                    </div>
                    <Button
                      variant={profile.profile?.showcase_enabled ? 'default' : 'outline'}
                      size="sm"
                      onClick={handleShowcaseToggle}
                      disabled={showcaseToggling}
                    >
                      {showcaseToggling ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : profile.profile?.showcase_enabled ? (
                        'Disable'
                      ) : (
                        'Enable'
                      )}
                    </Button>
                  </div>

                  {profile.profile?.showcase_enabled && profile.username && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 border">
                        <code className="flex-1 text-xs truncate">
                          {profile.getPublicUrl()}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={handleCopyShowcaseUrl}
                        >
                          {showcaseCopied ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          asChild
                        >
                          <a
                            href={`/${profile.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <Star className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground">
                          Only items you've marked as <strong>Featured</strong> in your Showcase are visible
                        </p>
                      </div>
                    </div>
                  )}

                  {profile.error && (
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-600">{profile.error}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Public Profile Info Modal */}
          <Dialog open={showShowcaseInfo} onOpenChange={setShowShowcaseInfo}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-emerald-500" />
                  How Public Profile Works
                </DialogTitle>
                <DialogDescription>
                  Share your style with a public showcase link
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Star className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Only Showcase Items</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Only items you've explicitly marked as <strong>Featured</strong> in your Showcase page are visible to others. Your entire inventory remains private.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                    <EyeOff className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">What's Private</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Purchase costs, purchase dates, locations, notes, and condition details are never shared. Only item names, photos, categories, and brands are visible.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0">
                    <ExternalLink className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Share Anytime</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      You get a unique URL (e.g., <code className="text-xs bg-secondary px-1 py-0.5 rounded">fitso.me/yourname</code>) that you can share with anyone. Enable or disable at any time.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Empty by Default</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      If you haven't featured any items, visitors will see an empty showcase - not your entire inventory. You're in control of what's shared.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setShowShowcaseInfo(false)}>
                  Got it
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">About</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <span className="font-extrabold">
                    <span className="text-amber-400">FIT</span>
                    <span className="text-pink-400">·</span>
                    <span className="text-pink-400">SO</span>
                    <span className="text-violet-400">·</span>
                    <span className="text-violet-400">ME</span>
                  </span>
                  <span className="text-xs bg-secondary px-2 py-0.5 rounded">v1.0.0</span>
                </p>
                <p>Your stuff. Your style. Your way.</p>
                <p className="text-xs mt-2 text-muted-foreground/70">Built with React, Vite, Supabase & Tailwind</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
