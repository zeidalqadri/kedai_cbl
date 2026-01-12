import { cn } from '../lib/utils'

interface SizeSelectorProps {
  sizes: string[]
  selectedSize: string | null
  onSelect: (size: string) => void
  category: 'basketball' | 'apparel'
}

export function SizeSelector({
  sizes,
  selectedSize,
  onSelect,
  category,
}: SizeSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-white/80">
        {category === 'basketball' ? 'Select Size' : 'Select Size'}
      </label>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Size selection">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => onSelect(size)}
            role="radio"
            aria-checked={selectedSize === size}
            className={cn(
              'size-button',
              selectedSize === size && 'size-button-active'
            )}
          >
            {category === 'basketball' ? `Size ${size}` : size}
          </button>
        ))}
      </div>
      {category === 'basketball' && (
        <p className="text-xs text-white/50">
          Size 5: Youth | Size 6: Women&apos;s | Size 7: Men&apos;s
        </p>
      )}
    </div>
  )
}
