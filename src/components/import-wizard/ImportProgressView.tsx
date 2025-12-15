import { Progress } from '@/components/ui/progress'
import { type ImportProgress } from '@/lib/importers'
import { AlertCircle, Download } from 'lucide-react'

interface ImportProgressViewProps {
  progress: ImportProgress
}

export function ImportProgressView({ progress }: ImportProgressViewProps) {
  const percentage = progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0

  return (
    <div className="p-4 space-y-4">
      <div className="text-center py-8">
        <div className="h-16 w-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
          <Download className="h-8 w-8 text-primary animate-pulse" />
        </div>
        <h3 className="text-lg font-medium mb-2">Importing items...</h3>

        {progress.current && (
          <p className="text-sm text-muted-foreground mb-2 flex items-center justify-center gap-2">
            <Download className="h-4 w-4" />
            {progress.current}
          </p>
        )}

        <p className="text-sm text-muted-foreground mb-4">
          Please wait while we process your items
        </p>

        <div className="space-y-2 max-w-xs mx-auto">
          <Progress value={percentage} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {progress.completed} of {progress.total} items
            {progress.failed > 0 && (
              <span className="text-destructive ml-2">
                ({progress.failed} failed)
              </span>
            )}
          </p>
        </div>

        {progress.failedImages > 0 && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg max-w-sm mx-auto">
            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {progress.failedImages} image{progress.failedImages > 1 ? 's' : ''} failed to download
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

