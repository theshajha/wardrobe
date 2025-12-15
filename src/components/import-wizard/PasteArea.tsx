import { Clipboard } from 'lucide-react'
import { forwardRef } from 'react'

interface PasteAreaProps {
  value: string
  onChange: (value: string) => void
}

export const PasteArea = forwardRef<HTMLTextAreaElement, PasteAreaProps>(
  function PasteArea({ value, onChange }, ref) {
    return (
      <div className="p-4 space-y-4">
        <div className="text-center py-8">
          <div className="h-16 w-16 rounded-full bg-secondary mx-auto flex items-center justify-center mb-4">
            <Clipboard className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Paste your order data</h3>
          <p className="text-sm text-muted-foreground mb-4">
            After running the script on your orders page, come back here and press{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-secondary text-xs">Ctrl+V</kbd> or{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-secondary text-xs">Cmd+V</kbd>
          </p>

          <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste here... (or just press Ctrl+V anywhere)"
            className="w-full h-32 p-3 rounded-lg border bg-secondary/50 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
    )
  }
)

