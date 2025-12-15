import { generateBookmarkletCode, type StoreId } from '@/lib/importers'
import { ShoppingBag } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

interface BookmarkletButtonProps {
    storeId: StoreId
}

export function BookmarkletButton({ storeId }: BookmarkletButtonProps) {
    const linkRef = useRef<HTMLAnchorElement>(null)
    const bookmarkletCode = generateBookmarkletCode(storeId)
    const storeName = storeId.charAt(0).toUpperCase() + storeId.slice(1)

    useEffect(() => {
        if (linkRef.current) {
            linkRef.current.setAttribute('href', bookmarkletCode)
        }
    }, [bookmarkletCode])

    return (
        <div className="p-4 rounded-lg bg-primary/5 border-2 border-primary/30">
            <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium mb-2">
                        Drag this button to your bookmarks bar
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                        This creates a <strong>{storeName}-specific</strong> bookmark. You'll need separate bookmarks for each store.
                    </p>
                    <a
                        ref={linkRef}
                        href="#"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-medium text-sm cursor-grab active:cursor-grabbing shadow-lg hover:shadow-xl transition-all hover:scale-105"
                        onClick={(e) => {
                            e.preventDefault()
                            toast.info('Drag this button to your bookmarks bar!', {
                                description: 'Or right-click and select "Bookmark this link"'
                            })
                        }}
                        title={`Fitsomee - ${storeName}`}
                    >
                        <ShoppingBag className="h-4 w-4" />
                        Fitsomee - {storeName}
                    </a>
                </div>
            </div>
        </div>
    )
}

