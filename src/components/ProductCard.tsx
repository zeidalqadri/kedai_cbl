import { useState } from 'react'
import { ShoppingBag, Check } from 'lucide-react'
import { cn, formatPrice } from '../lib/utils'
import type { Product } from '../lib/types'
import { SizeSelector } from './SizeSelector'

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product, size: string) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [isAdded, setIsAdded] = useState(false)

  const handleAddToCart = () => {
    if (!selectedSize) return
    onAddToCart(product, selectedSize)
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
  }

  return (
    <article className="group relative bg-cbl-gray/50 rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 transition-colors duration-300">
      {/* Product Image */}
      <div className="relative aspect-square bg-gradient-to-br from-white/5 to-white/0 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          width={400}
          height={400}
          className="w-full h-full object-contain p-8 transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Category Badge */}
        <span className="absolute top-4 left-4 px-3 py-1 bg-cbl-orange/90 text-white text-xs font-semibold rounded-full uppercase tracking-wide">
          {product.category === 'basketball' ? 'Equipment' : 'Apparel'}
        </span>
      </div>

      {/* Product Info */}
      <div className="p-6 space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white text-balance">
            {product.name}
          </h2>
          <p className="mt-2 text-sm text-white/60 text-pretty leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-cbl-orange tabular-nums">
            {formatPrice(product.price)}
          </span>
        </div>

        {/* Size Selection */}
        <SizeSelector
          sizes={product.sizes}
          selectedSize={selectedSize}
          onSelect={setSelectedSize}
          category={product.category}
        />

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={!selectedSize || isAdded}
          className={cn(
            'btn-primary w-full flex items-center justify-center gap-2',
            isAdded && 'bg-green-600 hover:bg-green-600'
          )}
        >
          {isAdded ? (
            <>
              <Check className="size-5" />
              <span>Added to Cart</span>
            </>
          ) : (
            <>
              <ShoppingBag className="size-5" />
              <span>{selectedSize ? 'Add to Cart' : 'Select a Size'}</span>
            </>
          )}
        </button>
      </div>
    </article>
  )
}
