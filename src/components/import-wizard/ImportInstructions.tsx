import { getStoreInstructions, type StoreId } from '@/lib/importers'
import { ExternalLink, Sparkles } from 'lucide-react'
import { BookmarkletButton } from './BookmarkletButton'

interface ImportInstructionsProps {
  storeId: StoreId
}

export function ImportInstructions({ storeId }: ImportInstructionsProps) {
  const instructions = getStoreInstructions(storeId)
  const storeName = storeId.charAt(0).toUpperCase() + storeId.slice(1)

  return (
    <div className="p-4 space-y-6">
      <BookmarkletButton storeId={storeId} />

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center shrink-0 text-sm font-medium">
            1
          </div>
          <div className="flex-1 pt-0.5">
            <p className="text-sm">Drag the button above to your bookmarks bar</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              If bookmarks bar is hidden, press{' '}
              <kbd className="px-1 py-0.5 rounded bg-secondary text-[10px]">Ctrl+Shift+B</kbd>
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center shrink-0 text-sm font-medium">
            2
          </div>
          <div className="flex-1 pt-0.5">
            <p className="text-sm">Open your orders page in a new tab</p>
            <a
              href={instructions.orderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1"
            >
              Open {storeName} Orders
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center shrink-0 text-sm font-medium">
            3
          </div>
          <div className="flex-1 pt-0.5">
            <p className="text-sm">Scroll down to load all orders you want to import</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center shrink-0 text-sm font-medium">
            4
          </div>
          <div className="flex-1 pt-0.5">
            <p className="text-sm">Click your "Import to Fitsomee" bookmark</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              A widget will appear - click Scan, then Copy
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center shrink-0 text-sm font-medium">
            5
          </div>
          <div className="flex-1 pt-0.5">
            <p className="text-sm">
              Come back here and paste (
              <kbd className="px-1.5 py-0.5 rounded bg-secondary text-[10px]">Ctrl+V</kbd> or{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-secondary text-[10px]">Cmd+V</kbd>)
            </p>
          </div>
        </div>
      </div>

      {instructions.tips.length > 0 && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-amber-500 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Pro Tips</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {instructions.tips.map((tip, i) => (
                  <li key={i}>• {tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

