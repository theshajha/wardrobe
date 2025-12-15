import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  blobToBase64,
  checkForDuplicates,
  compressImageIfNeeded,
  parseClipboardData,
  processScrapedItems,
  type ImportedItem,
  type ImportProgress,
  type StoreId,
} from '@/lib/importers'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Package, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  ImportInstructions,
  ImportProgressView,
  ItemPreviewGrid,
  PasteArea,
  StoreSelector,
} from './import-wizard'

const SYNC_API_URL = import.meta.env.VITE_SYNC_API_URL || ''

type WizardStep = 'select-store' | 'instructions' | 'paste' | 'preview' | 'importing' | 'complete'

interface ImportWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (items: Array<{
    name: string
    category: string
    subcategory?: string
    brand?: string
    color?: string
    purchaseDate?: string
    cost?: number
    currency?: string
    size?: string
    imageData?: string
  }>) => Promise<void>
  existingItems: Array<{ name: string; brand?: string; id: string }>
}

export function ImportWizard({ open, onOpenChange, onImport, existingItems }: ImportWizardProps) {
  const [step, setStep] = useState<WizardStep>('select-store')
  const [selectedStore, setSelectedStore] = useState<StoreId | null>(null)
  const [pastedData, setPastedData] = useState('')
  const [importedItems, setImportedItems] = useState<ImportedItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [duplicateIndices, setDuplicateIndices] = useState<Set<number>>(new Set())
  const [importProgress, setImportProgress] = useState<ImportProgress>({ total: 0, completed: 0, failed: 0, failedImages: 0 })
  const [failedImageItems, setFailedImageItems] = useState<string[]>([])
  const pasteAreaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep('select-store')
        setSelectedStore(null)
        setPastedData('')
        setImportedItems([])
        setSelectedItems(new Set<number>())
        setDuplicateIndices(new Set<number>())
        setImportProgress({ total: 0, completed: 0, failed: 0, failedImages: 0 })
        setFailedImageItems([])
      }, 300)
    }
  }, [open])

  useEffect(() => {
    if (step === 'paste' && pasteAreaRef.current) {
      pasteAreaRef.current.focus()
    }
  }, [step])

  const handlePaste = useCallback(async (text: string) => {
    try {
      setPastedData(text)
      const data = parseClipboardData(text)

      if (!data) {
        toast.error('Invalid data format', {
          description: 'Please make sure you copied the data from the import script'
        })
        return
      }

      const items = processScrapedItems(data)

      if (!items || items.length === 0) {
        toast.error('No items found in the data', {
          description: 'The copied data did not contain any valid items'
        })
        return
      }

      setImportedItems(items)
      setSelectedItems(new Set<number>(items.map((_, i) => i)))

      const duplicateIndicesArray = checkForDuplicates(items, existingItems)
      setDuplicateIndices(new Set<number>(duplicateIndicesArray))

      if (duplicateIndicesArray.length > 0) {
        toast.warning(`${duplicateIndicesArray.length} items may already be in your inventory`, {
          description: 'Review the highlighted items before importing'
        })
      }

      toast.success(`Found ${items.length} items to import`)
      setStep('preview')
    } catch (error) {
      console.error('Error processing pasted data:', error)
      toast.error('Error processing data', {
        description: 'Please try copying the data again from the store'
      })
    }
  }, [existingItems])

  useEffect(() => {
    if (step !== 'paste') return

    const handleGlobalPaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text')
      if (text) {
        handlePaste(text)
      }
    }

    document.addEventListener('paste', handleGlobalPaste)
    return () => document.removeEventListener('paste', handleGlobalPaste)
  }, [step, handlePaste])

  const handleToggleItem = (index: number) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const handleToggleAll = () => {
    if (selectedItems.size === importedItems.length) {
      setSelectedItems(new Set<number>())
    } else {
      setSelectedItems(new Set<number>(importedItems.map((_, i) => i)))
    }
  }

  const handleUpdateItem = (index: number, updates: Partial<ImportedItem>) => {
    setImportedItems(prev => prev.map((item, i) =>
      i === index ? { ...item, ...updates } : item
    ))
  }

  const downloadAndProcessImage = async (imageUrl: string, itemName: string, maxRetries = 3): Promise<string | undefined> => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        let response: Response;

        try {
          response = await fetch(imageUrl, { mode: 'cors' })
        } catch (directError) {
          if (!SYNC_API_URL) {
            return imageUrl
          }

          const proxyUrl = `${SYNC_API_URL}/proxy?url=${encodeURIComponent(imageUrl)}`
          response = await fetch(proxyUrl)
        }

        if (!response.ok) {
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
            continue
          }
          return imageUrl
        }

        const blob = await response.blob()
        const compressedBlob = await compressImageIfNeeded(blob)
        const base64 = await blobToBase64(compressedBlob)

        return base64
      } catch (error) {
        if (attempt === maxRetries - 1) {
          console.error('Failed to process image:', itemName, error)
          return imageUrl
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
      }
    }

    return imageUrl
  }

  const handleImport = async () => {
    const itemsToImport = importedItems.filter((_, i) => selectedItems.has(i))
    if (itemsToImport.length === 0) {
      toast.error('Please select at least one item to import')
      return
    }

    setStep('importing')
    setImportProgress({ total: itemsToImport.length, completed: 0, failed: 0, failedImages: 0 })
    setFailedImageItems([])

    const processedItems: Array<{
      name: string
      category: string
      subcategory?: string
      brand?: string
      color?: string
      purchaseDate?: string
      cost?: number
      currency?: string
      size?: string
      imageData?: string
    }> = []

    for (let i = 0; i < itemsToImport.length; i++) {
      const item = itemsToImport[i]

      try {
        setImportProgress(prev => ({ ...prev, current: item.name }))

        let imageData: string | undefined
        if (item.imageUrl) {
          imageData = await downloadAndProcessImage(item.imageUrl, item.name)

          if (!imageData) {
            setFailedImageItems(prev => [...prev, item.name])
            setImportProgress(prev => ({ ...prev, failedImages: prev.failedImages + 1 }))
          }
        }

        processedItems.push({
          name: item.name,
          category: item.category,
          subcategory: item.subcategory,
          brand: item.brand,
          color: item.color,
          purchaseDate: item.orderDate,
          cost: item.price,
          currency: item.currency,
          size: item.size,
          imageData,
        })

        setImportProgress(prev => ({ ...prev, completed: prev.completed + 1 }))
      } catch (error) {
        console.error('Failed to import item:', item.name, error)
        setImportProgress(prev => ({ ...prev, failed: prev.failed + 1, completed: prev.completed + 1 }))
      }
    }

    try {
      await onImport(processedItems)

      if (failedImageItems.length > 0) {
        toast.warning(`${failedImageItems.length} image${failedImageItems.length > 1 ? 's' : ''} could not be processed`, {
          description: 'Using original image URLs. Items imported successfully!'
        })
      } else {
        toast.success(`Successfully imported ${processedItems.length} items!`)
      }

      setStep('complete')
    } catch (error) {
      console.error('Failed to save items:', error)
      toast.error('Failed to save items', {
        description: error instanceof Error ? error.message : 'Please try again'
      })
    }
  }

  const getStepTitle = () => {
    switch (step) {
      case 'select-store': return 'Select Store'
      case 'instructions': return `Import from ${selectedStore?.charAt(0).toUpperCase()}${selectedStore?.slice(1)}`
      case 'paste': return 'Paste Data'
      case 'preview': return 'Review Items'
      case 'importing': return 'Importing...'
      case 'complete': return 'Import Complete!'
      default: return 'Import'
    }
  }

  const canGoBack = step !== 'select-store' && step !== 'importing' && step !== 'complete'
  const canGoNext = step === 'instructions' || (step === 'preview' && selectedItems.size > 0)

  const handleBack = () => {
    switch (step) {
      case 'instructions': setStep('select-store'); break
      case 'paste': setStep('instructions'); break
      case 'preview': setStep('paste'); break
    }
  }

  const handleNext = () => {
    switch (step) {
      case 'instructions': setStep('paste'); break
      case 'preview': handleImport(); break
    }
  }

  const dialogWidth = step === 'preview' ? 'sm:max-w-3xl' : 'sm:max-w-2xl'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${dialogWidth} max-h-[90vh] flex flex-col transition-all duration-200 backdrop-blur-sm`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {getStepTitle()}
          </DialogTitle>
          <DialogDescription>
            {step === 'select-store' && 'Choose where to import your wardrobe from'}
            {step === 'instructions' && 'Follow these steps to import your orders'}
            {step === 'paste' && 'Paste the copied data from the script'}
            {step === 'preview' && `${selectedItems.size} items selected for import`}
            {step === 'importing' && 'Please wait while we import your items'}
            {step === 'complete' && 'Your items have been imported successfully!'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {step === 'select-store' && (
            <StoreSelector
              selectedStore={selectedStore}
              onSelectStore={(storeId) => {
                setSelectedStore(storeId)
                setStep('instructions')
              }}
            />
          )}

          {step === 'instructions' && selectedStore && (
            <ImportInstructions storeId={selectedStore} />
          )}

          {step === 'paste' && (
            <PasteArea
              ref={pasteAreaRef}
              value={pastedData}
              onChange={handlePaste}
            />
          )}

          {step === 'preview' && (
            <ItemPreviewGrid
              items={importedItems}
              selectedItems={selectedItems}
              onToggleItem={handleToggleItem}
              onToggleAll={handleToggleAll}
              onUpdateItem={handleUpdateItem}
              duplicateIndices={duplicateIndices}
            />
          )}

          {step === 'importing' && (
            <ImportProgressView progress={importProgress} />
          )}

          {step === 'complete' && (
            <div className="p-4 text-center py-8">
              <div className="h-16 w-16 rounded-full bg-green-500/10 mx-auto flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">All done!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Successfully imported {importProgress.completed - importProgress.failed} items
                {importProgress.failed > 0 && ` (${importProgress.failed} failed)`}
              </p>
              <Button onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        {step !== 'complete' && step !== 'importing' && (
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="ghost"
              onClick={canGoBack ? handleBack : () => onOpenChange(false)}
            >
              {canGoBack ? (
                <>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </>
              )}
            </Button>

            {canGoNext && (
              <Button onClick={handleNext}>
                {step === 'preview' ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Import {selectedItems.size} Items
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
