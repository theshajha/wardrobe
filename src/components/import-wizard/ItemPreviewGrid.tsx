import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type ImportedItem } from '@/lib/importers'
import { CATEGORIES, SUBCATEGORIES } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

interface ItemPreviewGridProps {
  items: ImportedItem[]
  selectedItems: Set<number>
  onToggleItem: (index: number) => void
  onToggleAll: () => void
  onUpdateItem: (index: number, updates: Partial<ImportedItem>) => void
  duplicateIndices: Set<number>
}

export function ItemPreviewGrid({
  items,
  selectedItems,
  onToggleItem,
  onToggleAll,
  onUpdateItem,
  duplicateIndices,
}: ItemPreviewGridProps) {
  const allSelected = selectedItems.size === items.length
  const someSelected = selectedItems.size > 0 && selectedItems.size < items.length

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={onToggleAll}
            className={someSelected ? 'data-[state=checked]:bg-primary/50' : ''}
          />
          <span className="text-sm">
            {selectedItems.size} of {items.length} items selected
          </span>
        </div>
        {duplicateIndices.size > 0 && (
          <Badge variant="outline" className="text-amber-500 border-amber-500/50">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {duplicateIndices.size} potential duplicates
          </Badge>
        )}
      </div>

      <ScrollArea className="h-[450px]">
        <div className="space-y-3 pr-4">
          {items.map((item, index) => (
            <Card
              key={index}
              className={`relative overflow-hidden transition-all duration-200 cursor-pointer
                ${selectedItems.has(index)
                  ? 'shadow-md border-primary bg-card'
                  : 'opacity-50 hover:opacity-70 border-border'
                } 
                ${duplicateIndices.has(index) ? 'border-amber-500' : ''}`}
              onClick={() => onToggleItem(index)}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Checkbox and Image */}
                  <div className="relative shrink-0">
                    <Checkbox
                      checked={selectedItems.has(index)}
                      onCheckedChange={() => onToggleItem(index)}
                      className="absolute -top-1 -left-1 z-10 h-5 w-5"
                    />
                    <div className="h-24 w-24 rounded-lg bg-secondary overflow-hidden ml-3">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-image.png'
                          }}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground text-2xl">
                          ?
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <p className="font-medium text-base leading-snug line-clamp-2">{item.name}</p>
                      {item.brand && (
                        <p className="text-sm text-muted-foreground mt-0.5">{item.brand}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {item.price && (
                        <Badge variant="secondary" className="text-xs px-2 py-0.5 font-medium">
                          ₹{item.price.toLocaleString()}
                        </Badge>
                      )}
                      {item.size && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5">
                          Size: {item.size}
                        </Badge>
                      )}
                      {item.orderDate && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5 text-muted-foreground">
                          {item.orderDate}
                        </Badge>
                      )}
                    </div>

                    {/* Category Selection (always visible when selected) */}
                    {selectedItems.has(index) && (
                      <div className="flex gap-2 pt-2">
                        <Select
                          value={item.category}
                          onValueChange={(value) => onUpdateItem(index, { category: value })}
                        >
                          <SelectTrigger className="h-9 text-sm flex-1">
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id} className="text-sm">
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {item.category && SUBCATEGORIES[item.category] && (
                          <Select
                            value={item.subcategory || ''}
                            onValueChange={(value) => onUpdateItem(index, { subcategory: value })}
                          >
                            <SelectTrigger className="h-9 text-sm flex-1">
                              <SelectValue placeholder="Subcategory" />
                            </SelectTrigger>
                            <SelectContent>
                              {SUBCATEGORIES[item.category].map((sub) => (
                                <SelectItem key={sub} value={sub} className="text-sm">
                                  {sub}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {duplicateIndices.has(index) && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="outline" className="text-amber-500 border-amber-500/50 text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      May be duplicate
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

