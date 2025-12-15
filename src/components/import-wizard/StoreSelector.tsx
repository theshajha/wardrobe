import { Badge } from '@/components/ui/badge'
import { getEnabledStores, type StoreId } from '@/lib/importers'
import { Check } from 'lucide-react'

interface StoreSelectorProps {
    selectedStore: StoreId | null
    onSelectStore: (storeId: StoreId) => void
}

// Brand colors and gradients for each store
const STORE_STYLES: Record<string, { gradient: string; hoverGradient: string; icon: string; bgPattern?: string }> = {
    myntra: {
        gradient: 'from-[#ff3f6c] to-[#ff527b]',
        hoverGradient: 'hover:from-[#ff527b] hover:to-[#ff6b8a]',
        icon: '🛍️',
        bgPattern: 'bg-[radial-gradient(circle_at_top_right,rgba(255,63,108,0.15),transparent_50%)]'
    },
    ajio: {
        gradient: 'from-[#1a1a2e] to-[#2d2d44]',
        hoverGradient: 'hover:from-[#2d2d44] hover:to-[#3d3d5c]',
        icon: '👔',
        bgPattern: 'bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_50%)]'
    },
    amazon: {
        gradient: 'from-[#ff9900] to-[#ffad33]',
        hoverGradient: 'hover:from-[#ffad33] hover:to-[#ffc266]',
        icon: '📦'
    },
    flipkart: {
        gradient: 'from-[#2874f0] to-[#4a8df0]',
        hoverGradient: 'hover:from-[#4a8df0] hover:to-[#6ba3f0]',
        icon: '🛒'
    }
}

export function StoreSelector({ selectedStore, onSelectStore }: StoreSelectorProps) {
    const enabledStores = getEnabledStores()

    return (
        <div className="p-6">
            <div className="grid grid-cols-3 gap-4">
                {enabledStores.map((store) => {
                    const styles = STORE_STYLES[store.id] || { gradient: 'from-gray-600 to-gray-700', hoverGradient: '', icon: '🏪' }
                    const isSelected = selectedStore === store.id

                    return (
                        <button
                            key={store.id}
                            className={`
                                relative group p-5 rounded-xl text-left transition-all duration-300
                                bg-gradient-to-br ${styles.gradient} ${styles.hoverGradient}
                                ${styles.bgPattern || ''}
                                ${isSelected
                                    ? 'ring-2 ring-white ring-offset-2 ring-offset-background scale-[1.02] shadow-xl'
                                    : 'hover:scale-[1.02] hover:shadow-lg opacity-90 hover:opacity-100'
                                }
                            `}
                            onClick={() => onSelectStore(store.id)}
                        >
                            {/* Selection indicator */}
                            {isSelected && (
                                <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                                    <Check className="w-4 h-4 text-green-600" />
                                </div>
                            )}

                            {/* Icon */}
                            <div className="text-3xl mb-3 filter drop-shadow-md">
                                {styles.icon}
                            </div>

                            {/* Store name */}
                            <div className="font-bold text-white text-lg tracking-wide">
                                {store.name}
                            </div>

                            {/* Status */}
                            <div className="text-white/70 text-xs mt-1">
                                {store.enabled ? 'Ready to import' : 'Coming soon'}
                            </div>

                            {/* Subtle shine effect */}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none" />
                        </button>
                    )
                })}

                {/* More stores - Coming Soon */}
                <button
                    className="relative p-5 rounded-xl text-left transition-all duration-300
                        bg-gradient-to-br from-gray-800/50 to-gray-900/50
                        border-2 border-dashed border-gray-600/50
                        opacity-60 cursor-not-allowed"
                    disabled
                >
                    <div className="text-3xl mb-3 opacity-50">➕</div>
                    <div className="font-bold text-gray-400 text-lg">More Stores</div>
                    <Badge variant="secondary" className="mt-2 text-[10px]">
                        Coming Soon
                    </Badge>
                </button>
            </div>
        </div>
    )
}

