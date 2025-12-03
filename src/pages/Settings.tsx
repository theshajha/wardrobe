import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { exportAllData, exportWithImages, getStorageStats, importAllData, importWithImages } from '@/db'
import { formatBytes } from '@/lib/utils'
import {
  AlertTriangle,
  Calendar,
  Check,
  Database,
  DollarSign,
  Download,
  FolderOpen,
  FolderSync,
  HardDrive,
  ImageIcon,
  Loader2,
  Package,
  RefreshCw,
  Settings as SettingsIcon,
  Upload,
  User,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

const PREFERENCES_KEY = 'nomad-wardrobe-preferences'

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

const STORAGE_KEY = 'nomad-wardrobe-export-settings'

export default function Settings() {
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadStorageStats()
    loadExportSettings()
    setDefaultCurrencyState(getDefaultCurrency())
    setFolderSupported('showDirectoryPicker' in window)
  }, [])

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
      a.download = `wardrobe-backup-${new Date().toISOString().split('T')[0]}.json`
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

  const handleSelectFolder = async () => {
    try {
      // @ts-ignore - File System Access API
      const handle = await window.showDirectoryPicker({
        mode: 'readwrite',
      })
      saveExportSettings({
        exportFolderHandle: handle,
        exportFolderName: handle.name,
      })
      setExportSettings(prev => ({ ...prev, exportFolderHandle: handle }))
      setExportResult({ success: true, message: `Folder "${handle.name}" selected for exports` })
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setExportResult({ success: false, message: 'Failed to select folder' })
      }
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
      const fileName = `wardrobe-backup-${new Date().toISOString().split('T')[0]}.json`

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

  const getNextExportDate = () => {
    if (!exportSettings.lastExportDate) return 'Not scheduled'

    const last = new Date(exportSettings.lastExportDate)
    let next = new Date(last)

    switch (exportSettings.autoExportInterval) {
      case 'daily':
        next.setDate(next.getDate() + 1)
        break
      case 'weekly':
        next.setDate(next.getDate() + 7)
        break
      case 'monthly':
        next.setMonth(next.getMonth() + 1)
        break
    }

    return next.toLocaleDateString()
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
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

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">About</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p><strong className="text-foreground">Capsule</strong> v3.0.0</p>
                <p>Manage everything you own, without the overwhelm</p>
                <p className="text-xs mt-2">Built with React, Vite, IndexedDB & Tailwind</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup Tab */}
        <TabsContent value="backup" className="space-y-4 mt-4">
          {/* Main Backup Card */}
          <Card className="border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                Backup & Restore
              </CardTitle>
              <CardDescription>
                Export your data with images for complete backup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-secondary/50 text-sm space-y-1">
                <p className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Items with images:</span>
                  <strong>{storageStats?.itemsWithImages || 0}</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  Creates JSON backup + images folder for complete data portability
                </p>
              </div>

              {folderSupported ? (
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={handleExportWithImages} disabled={exporting} className="gap-2">
                    {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Export
                  </Button>
                  <Button onClick={handleImportFromFolder} disabled={importing} variant="outline" className="gap-2">
                    {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />}
                    Import
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={handleExport} disabled={exporting} variant="outline">
                    {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                    Export JSON
                  </Button>
                  <Button onClick={handleImportClick} disabled={importing} variant="outline">
                    {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
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

          {/* Auto Backup */}
          {folderSupported && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FolderSync className="h-4 w-4" />
                  Auto Backup
                </CardTitle>
                <CardDescription>Schedule automatic backups to a folder</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium">Export Folder</p>
                    <p className="text-sm text-muted-foreground">
                      {exportSettings.exportFolderName || 'No folder selected'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleSelectFolder}>
                    {exportSettings.exportFolderName ? 'Change' : 'Select Folder'}
                  </Button>
                </div>

                {exportSettings.exportFolderName && (
                  <>
                    <div className="h-px bg-border" />
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium">Schedule</p>
                        <p className="text-sm text-muted-foreground">
                          {exportSettings.autoExportEnabled ? `Next: ${getNextExportDate()}` : 'Disabled'}
                        </p>
                      </div>
                      <Select
                        value={exportSettings.autoExportInterval}
                        onValueChange={(value) => saveExportSettings({ autoExportInterval: value })}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant={exportSettings.autoExportEnabled ? "default" : "outline"}
                        onClick={() => saveExportSettings({
                          autoExportEnabled: !exportSettings.autoExportEnabled,
                          lastExportDate: exportSettings.autoExportEnabled ? exportSettings.lastExportDate : new Date().toISOString()
                        })}
                      >
                        {exportSettings.autoExportEnabled ? <><Check className="h-3 w-3 mr-1" />On</> : <><RefreshCw className="h-3 w-3 mr-1" />Off</>}
                      </Button>
                    </div>

                    <Button onClick={handleQuickExport} disabled={exporting} className="w-full">
                      {exporting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Exporting...</> : <><Download className="h-4 w-4 mr-2" />Export Now</>}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Backup Warning */}
          <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Data is stored in your browser. Clearing browser data deletes everything. Regular backups recommended.
            </p>
          </div>
        </TabsContent>

        {/* Storage Tab */}
        <TabsContent value="storage" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Usage
              </CardTitle>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
