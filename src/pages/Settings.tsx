import { SyncSettings } from '@/components/SyncSettings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { exportAllData, exportWithImages, getSyncMeta, getStorageStats, importAllData, importWithImages } from '@/db'
import { hasOptedOut, isAnalyticsEnabled, optIn, optOut, trackDataExported, trackDataImported, trackDemoEntered } from '@/lib/analytics'
import { enterDemoMode, exitDemoMode, getDemoType, getDemoTypeLabel, isDemoMode, type DemoType } from '@/lib/demo'
import { SYNC_API_URL } from '@/lib/sync/types'
import { formatBytes } from '@/lib/utils'
import { useShowcase } from '@/hooks/useShowcase'
import { useSync } from '@/hooks/useSync'
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  Check,
  Cloud,
  Copy,
  Database,
  DollarSign,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FlaskConical,
  FolderOpen,
  HardDrive,
  ImageIcon,
  Info,
  Loader2,
  Package,
  Settings as SettingsIcon,
  Star,
  Upload,
  User,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const PREFERENCES_KEY = 'fitsome-preferences'

const CURRENCIES = [
  { id: 'USD', name: 'US Dollar', symbol: '$' },
  { id: 'EUR', name: 'Euro', symbol: '€' },
  { id: 'GBP', name: 'British Pound', symbol: '£' },
  { id: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { id: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { id: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { id: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
]

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

interface StorageStats {
  totalItems: number
  itemsWithImages: number
  totalImageSize: number
  metadataSize: number
  totalEstimatedSize: number
  averageImageSize: number
}

interface ExportSettings {
  autoExportEnabled: boolean
  autoExportInterval: string // 'daily', 'weekly', 'monthly'
  lastExportDate: string | null
  exportFolderHandle: FileSystemDirectoryHandle | null
  exportFolderName: string | null
}

const STORAGE_KEY = 'fitsome-export-settings'

export default function Settings() {
  const navigate = useNavigate()
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null)
  const [exportResult, setExportResult] = useState<{ success: boolean; message: string } | null>(null)
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null)
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    autoExportEnabled: false,
    autoExportInterval: 'weekly',
    lastExportDate: null,
    exportFolderHandle: null,
    exportFolderName: null,
  })
  const [folderSupported, setFolderSupported] = useState(false)
  const [defaultCurrency, setDefaultCurrencyState] = useState('USD')
  const [isDemo, setIsDemo] = useState(false)
  const [currentDemoType, setCurrentDemoType] = useState<DemoType | null>(null)
  const [demoLoading, setDemoLoading] = useState(false)
  const [showDemoDialog, setShowDemoDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Showcase (Public Profile) state
  const [syncState] = useSync()
  const showcase = useShowcase(syncState.isAuthenticated)
  const [showcaseCopied, setShowcaseCopied] = useState(false)
  const [showShowcaseInfo, setShowShowcaseInfo] = useState(false)

  // Display name state
  const [displayName, setDisplayName] = useState('')
  const [displayNameSaved, setDisplayNameSaved] = useState(false)

  useEffect(() => {
    loadStorageStats()
    loadExportSettings()
    setDefaultCurrencyState(getDefaultCurrency())
    setFolderSupported('showDirectoryPicker' in window)
    setIsDemo(isDemoMode())
    setCurrentDemoType(getDemoType())
  }, [])

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
      // Show selection dialog
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

  const handleCopyShowcaseUrl = () => {
    const url = showcase.getPublicUrl()
    if (url) {
      navigator.clipboard.writeText(url)
      setShowcaseCopied(true)
      setTimeout(() => setShowcaseCopied(false), 2000)
    }
  }

  const handleDisplayNameSave = async () => {
    if (!syncState.isAuthenticated || !displayName.trim()) return

    try {
      const meta = await getSyncMeta()
      const response = await fetch(`${SYNC_API_URL}/auth/display-name`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${meta.sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ displayName: displayName.trim() }),
      })
      const result = await response.json()
      if (result.success) {
        setDisplayNameSaved(true)
        setTimeout(() => setDisplayNameSaved(false), 2000)
        showcase.refresh() // Refresh showcase to update display name
      }
    } catch (error) {
      console.error('Failed to update display name:', error)
    }
  }

  // Load display name from showcase
  useEffect(() => {
    if (syncState.isAuthenticated && showcase.username) {
      // Get display name from showcase API
      const fetchDisplayName = async () => {
        try {
          const meta = await getSyncMeta()
          const response = await fetch(`${SYNC_API_URL}/auth/showcase`, {
            headers: { 'Authorization': `Bearer ${meta.sessionToken}` },
          })
          const data = await response.json()
          if (data.success && data.displayName) {
            setDisplayName(data.displayName)
          }
        } catch (error) {
          console.error('Failed to fetch display name:', error)
        }
      }
      fetchDisplayName()
    }
  }, [syncState.isAuthenticated, showcase.username])

  // Auto-export check on mount and interval
  useEffect(() => {
    if (exportSettings.autoExportEnabled && exportSettings.exportFolderHandle) {
      checkAndRunAutoExport()

      // Check every hour while app is open
      const interval = setInterval(checkAndRunAutoExport, 60 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [exportSettings.autoExportEnabled, exportSettings.exportFolderHandle, exportSettings.autoExportInterval])

  const loadStorageStats = async () => {
    const stats = await getStorageStats()
    setStorageStats(stats)
  }

  const loadExportSettings = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setExportSettings(prev => ({
          ...prev,
          autoExportEnabled: parsed.autoExportEnabled || false,
          autoExportInterval: parsed.autoExportInterval || 'weekly',
          lastExportDate: parsed.lastExportDate || null,
          exportFolderName: parsed.exportFolderName || null,
          // Note: FileSystemDirectoryHandle can't be serialized, need to re-select folder
        }))
      }
    } catch (e) {
      console.error('Failed to load export settings:', e)
    }
  }

  const saveExportSettings = (settings: Partial<ExportSettings>) => {
    const newSettings = { ...exportSettings, ...settings }
    setExportSettings(newSettings)

    // Save to localStorage (excluding handle which can't be serialized)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      autoExportEnabled: newSettings.autoExportEnabled,
      autoExportInterval: newSettings.autoExportInterval,
      lastExportDate: newSettings.lastExportDate,
      exportFolderName: newSettings.exportFolderName,
    }))
  }

  const checkAndRunAutoExport = useCallback(async () => {
    if (!exportSettings.lastExportDate || !exportSettings.exportFolderHandle) return

    const lastExport = new Date(exportSettings.lastExportDate)
    const now = new Date()
    const daysSinceExport = Math.floor((now.getTime() - lastExport.getTime()) / (1000 * 60 * 60 * 24))

    let shouldExport = false
    switch (exportSettings.autoExportInterval) {
      case 'daily':
        shouldExport = daysSinceExport >= 1
        break
      case 'weekly':
        shouldExport = daysSinceExport >= 7
        break
      case 'monthly':
        shouldExport = daysSinceExport >= 30
        break
    }

    if (shouldExport) {
      await handleQuickExport()
    }
  }, [exportSettings])

  const handleExport = async () => {
    setExporting(true)
    setExportResult(null)
    try {
      const data = await exportAllData()

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fitsome-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      saveExportSettings({ lastExportDate: new Date().toISOString() })
      setExportResult({ success: true, message: 'Backup downloaded successfully!' })
    } catch (error) {
      console.error('Export failed:', error)
      setExportResult({ success: false, message: 'Export failed. Please try again.' })
    } finally {
      setExporting(false)
    }
  }

  const handleQuickExport = async () => {
    if (!exportSettings.exportFolderHandle) {
      setExportResult({ success: false, message: 'Please select a folder first' })
      return
    }

    setExporting(true)
    setExportResult(null)
    try {
      const data = await exportAllData()
      const fileName = `fitsome-backup-${new Date().toISOString().split('T')[0]}.json`

      // Create file in selected folder
      const fileHandle = await exportSettings.exportFolderHandle.getFileHandle(fileName, { create: true })
      const writable = await fileHandle.createWritable()
      await writable.write(JSON.stringify(data, null, 2))
      await writable.close()

      saveExportSettings({ lastExportDate: new Date().toISOString() })
      setExportResult({ success: true, message: `Exported to ${exportSettings.exportFolderName}/${fileName}` })
      loadStorageStats()
    } catch (e) {
      console.error('Quick export failed:', e)
      // Permission might have been revoked, clear the handle
      if ((e as Error).name === 'NotAllowedError') {
        saveExportSettings({ exportFolderHandle: null, exportFolderName: null })
        setExportResult({ success: false, message: 'Folder permission expired. Please select folder again.' })
      } else {
        setExportResult({ success: false, message: 'Export failed. Please try again.' })
      }
    } finally {
      setExporting(false)
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportResult(null)

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const results = await importAllData(data)

      setImportResult({
        success: true,
        message: `Successfully imported: ${results.items} items, ${results.trips} trips, ${results.outfits} outfits`,
      })
      loadStorageStats()
    } catch (error) {
      setImportResult({
        success: false,
        message: 'Failed to parse import file. Make sure it\'s a valid JSON backup.',
      })
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleCurrencyChange = (currency: string) => {
    setDefaultCurrencyState(currency)
    setDefaultCurrency(currency)
  }

  const handleExportWithImages = async () => {
    try {
      // @ts-ignore - File System Access API
      const handle = await window.showDirectoryPicker({
        mode: 'readwrite',
      })

      setExporting(true)
      setExportResult(null)

      const result = await exportWithImages(handle)

      setExportResult({
        success: true,
        message: `Exported ${result.jsonFileName} with ${result.imageCount} images to ${handle.name}/`
      })
      saveExportSettings({ lastExportDate: new Date().toISOString() })
      loadStorageStats()

      // Track export
      trackDataExported(true)
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setExportResult({ success: false, message: 'Export failed: ' + (e as Error).message })
      }
    } finally {
      setExporting(false)
    }
  }

  const handleImportFromFolder = async () => {
    try {
      // @ts-ignore - File System Access API
      const handle = await window.showDirectoryPicker({
        mode: 'read',
      })

      setImporting(true)
      setImportResult(null)

      const results = await importWithImages(handle)

      setImportResult({
        success: true,
        message: `Imported: ${results.items} items, ${results.trips} trips, ${results.outfits} outfits, ${results.images} images`
      })
      loadStorageStats()

      // Track import
      trackDataImported(results.items, results.images > 0)
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setImportResult({ success: false, message: 'Import failed: ' + (e as Error).message })
      }
    } finally {
      setImporting(false)
    }
  }

  // Estimate capacity (conservative: 500MB usable for this app)
  const estimatedCapacity = 500 * 1024 * 1024 // 500 MB
  const usagePercentage = storageStats ? (storageStats.totalEstimatedSize / estimatedCapacity) * 100 : 0
  const estimatedItemsCapacity = storageStats && storageStats.averageImageSize > 0
    ? Math.floor(estimatedCapacity / (storageStats.averageImageSize + 1024))
    : 5000

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

      {/* Tabs for organized settings */}
      <Tabs defaultValue="preferences" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="storage" className="gap-1">
            <Cloud className="h-3 w-3" />
            Storage & Backup
          </TabsTrigger>
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
              {/* Display Name */}
              {syncState.isAuthenticated && (
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
                    />
                    <Button
                      size="sm"
                      onClick={handleDisplayNameSave}
                      disabled={!displayName.trim()}
                    >
                      {displayNameSaved ? <Check className="h-4 w-4" /> : 'Save'}
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
                </Label>
                <Select value={defaultCurrency} onValueChange={handleCurrencyChange}>
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
                      // Force re-render
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
                {showcase.enabled ? (
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
              {!syncState.isAuthenticated ? (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-600">Sync Required</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Enable Cloud Sync in the Storage & Backup tab to use Public Profile
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                      <p className="text-sm font-medium">Share Your Showcase</p>
                      <p className="text-xs text-muted-foreground">
                        {showcase.enabled
                          ? 'Your featured items are visible to anyone with the link'
                          : 'Let others see your featured items via a public link'
                        }
                      </p>
                    </div>
                    <Button
                      variant={showcase.enabled ? 'default' : 'outline'}
                      size="sm"
                      onClick={showcase.toggle}
                      disabled={showcase.loading}
                    >
                      {showcase.loading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : showcase.enabled ? (
                        'Disable'
                      ) : (
                        'Enable'
                      )}
                    </Button>
                  </div>

                  {showcase.enabled && showcase.username && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 border">
                        <code className="flex-1 text-xs truncate">
                          {showcase.getPublicUrl()}
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
                            href={`/${showcase.username}`}
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

                  {showcase.error && (
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-600">{showcase.error}</p>
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
                <p className="text-xs mt-2 text-muted-foreground/70">Built with React, Vite, IndexedDB & Tailwind</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Storage & Backup Tab */}
        <TabsContent value="storage" className="space-y-4 mt-4">
          {/* Cloud Sync Section */}
          <SyncSettings />

          {/* Local Storage Section */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Local Storage
              </CardTitle>
              <CardDescription>
                Data stored in your browser
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {storageStats && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Package className="h-3 w-3" />
                        <span className="text-xs">Items</span>
                      </div>
                      <p className="text-xl font-bold">{storageStats.totalItems}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <ImageIcon className="h-3 w-3" />
                        <span className="text-xs">With Images</span>
                      </div>
                      <p className="text-xl font-bold">{storageStats.itemsWithImages}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Storage Used</span>
                      <span className="font-medium">{formatBytes(storageStats.totalEstimatedSize)} / ~500 MB</span>
                    </div>
                    <Progress value={Math.min(usagePercentage, 100)} className="h-1.5" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2 rounded bg-secondary/30">
                      <span className="text-muted-foreground">Images:</span>{' '}
                      <span className="font-medium">{formatBytes(storageStats.totalImageSize)}</span>
                    </div>
                    <div className="p-2 rounded bg-secondary/30">
                      <span className="text-muted-foreground">Avg/Image:</span>{' '}
                      <span className="font-medium">{formatBytes(storageStats.averageImageSize)}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-blue-500">Capacity:</strong> ~{estimatedItemsCapacity.toLocaleString()} items with images
                    </p>
                  </div>
                </>
              )}

              <div className="p-2 rounded bg-secondary/30 text-xs">
                <span className="text-muted-foreground">Type:</span>{' '}
                <span className="font-mono">IndexedDB (Browser)</span>
              </div>
            </CardContent>
          </Card>

          {/* Backup & Restore Section */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-4 w-4" />
                Backup & Restore
              </CardTitle>
              <CardDescription>
                Export your data with images for complete backup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {folderSupported ? (
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={handleExportWithImages} disabled={exporting} className="gap-2">
                    {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Export All
                  </Button>
                  <Button onClick={handleImportFromFolder} disabled={importing} variant="outline" className="gap-2">
                    {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />}
                    Import
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={handleExport} disabled={exporting} variant="outline" className="gap-2">
                    {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Export JSON
                  </Button>
                  <Button onClick={handleImportClick} disabled={importing} variant="outline" className="gap-2">
                    {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Import JSON
                  </Button>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />

              {(exportResult || importResult) && (
                <div className={`p-2 rounded text-xs flex items-center gap-2 ${(exportResult?.success || importResult?.success) ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                  {(exportResult?.success || importResult?.success) ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  {exportResult?.message || importResult?.message}
                </div>
              )}

              {exportSettings.lastExportDate && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Last export: {new Date(exportSettings.lastExportDate).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Warning about local storage */}
          <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Local data is stored in your browser. Clearing browser data deletes everything. Use Cloud Sync or regular backups to protect your data.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
