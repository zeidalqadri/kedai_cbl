import { useState } from 'react'
import { getProductPrice } from '../../lib/constants'
import { formatMYR } from '../../lib/utils'
import { ui, cx, text } from '../../lib/ui-primitives'
import type { Product } from '../../types'

// Product-specific details
const PRODUCT_DETAILS: Record<string, { features: string[], specs: Record<string, string> }> = {
  'cbl-jingga-tshirt': {
    features: [
      'Official CBL team jersey',
      'Premium breathable fabric',
      'Vibrant Jingga (orange) colorway',
      'Embroidered CBL logo',
      'Regular fit design',
    ],
    specs: {
      'Material': '100% Polyester',
      'Fit': 'Regular',
      'Care': 'Machine wash cold',
      'Origin': 'Made in Malaysia',
    },
  },
  'cbl-basketball': {
    features: [
      'Official CBL game ball',
      'Premium composite leather',
      'Indoor/outdoor use',
      'Superior grip and control',
      'Official size and weight',
    ],
    specs: {
      'Size 5': '27.5" - Youth (ages 9-11)',
      'Size 6': '28.5" - Women / Youth (12+)',
      'Size 7': '29.5" - Men (Official)',
      'Material': 'Composite leather',
      'Use': 'Indoor / Outdoor',
    },
  },
}

interface ProductCardProps {
  product: Product
  onAddToCart: (productId: string, size: string) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [addedFeedback, setAddedFeedback] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const hasMultipleImages = product.images.length > 1

  const details = PRODUCT_DETAILS[product.id]
  const currentPrice = selectedSize
    ? getProductPrice(product.id, selectedSize)
    : product.price

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!selectedSize) return
    onAddToCart(product.id, selectedSize)
    setAddedFeedback(true)
    setTimeout(() => {
      setAddedFeedback(false)
      setSelectedSize(null)
    }, 1500)
  }

  const handleSizeClick = (e: React.MouseEvent, sizeId: string) => {
    e.stopPropagation()
    setSelectedSize(selectedSize === sizeId ? null : sizeId)
  }

  return (
    <div className={cx(ui.productCard, 'w-full text-left flex flex-col max-h-[680px]')}>
      {/* Image Area - shrinks when details expanded */}
      <div className={cx(
        'flex bg-white overflow-hidden flex-shrink-0 transition-all duration-300',
        showDetails ? 'aspect-[3/1]' : 'aspect-[4/3]'
      )}>
        {/* Main Image */}
        <div className="flex-1 flex items-center justify-center p-3">
          <img
            src={product.images[activeImageIndex]}
            alt={product.name}
            className="w-full h-full object-contain transition-opacity duration-200"
            loading="lazy"
          />
        </div>

        {/* Thumbnail Strip on right - hidden when details expanded */}
        {hasMultipleImages && !showDetails && (
          <div className="flex flex-col gap-1.5 p-2 bg-black/5 justify-center">
            {product.images.slice(0, 5).map((image, index) => (
              <div
                key={index}
                onMouseEnter={() => setActiveImageIndex(index)}
                onMouseLeave={() => setActiveImageIndex(0)}
                className={cx(
                  'w-12 h-12 rounded overflow-hidden border-2 transition-all cursor-pointer',
                  'bg-white',
                  activeImageIndex === index
                    ? 'border-cbl-orange'
                    : 'border-transparent hover:border-gray-400'
                )}
              >
                <img
                  src={image}
                  alt={`${product.name} view ${index + 1}`}
                  className="w-full h-full object-contain"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Product Info - scrollable when details expanded */}
        <div className={cx('p-4 pb-2 flex flex-col gap-2 overflow-y-auto', showDetails ? 'flex-1' : '')}>
          {/* Title & Description */}
          <div>
            <h3 className={cx(text.h3, 'text-lg')}>{product.name}</h3>
            <p className={cx('text-sm mt-1', text.secondary)}>
              {product.description}
            </p>
          </div>

          {/* Collapsible Details */}
          {details && (
            <div className="border-t border-white/10 pt-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center justify-between w-full text-sm text-white/60 hover:text-white/80 transition-colors"
              >
                <span>{showDetails ? 'Hide Details' : 'View Details'}</span>
                <svg
                  className={cx('w-4 h-4 transition-transform', showDetails && 'rotate-180')}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showDetails && (
                <div className="mt-3 space-y-3 text-sm">
                  {/* Features */}
                  <div>
                    <h4 className="text-white/80 font-medium mb-1.5">Features</h4>
                    <ul className="space-y-1">
                      {details.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-white/60">
                          <span className="text-cbl-orange mt-0.5">•</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Specs */}
                  <div>
                    <h4 className="text-white/80 font-medium mb-1.5">Specifications</h4>
                    <dl className="space-y-1">
                      {Object.entries(details.specs).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <dt className="text-white/40 min-w-[80px]">{key}</dt>
                          <dd className="text-white/60">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky CTA Area - always visible */}
        <div className="p-4 pt-2 border-t border-white/10 bg-gradient-to-t from-black/20 to-transparent flex-shrink-0">
          {/* Price */}
          <div className={cx(text.price, 'text-xl mb-2')}>
            {formatMYR(currentPrice)}
            {product.id === 'cbl-basketball' && !selectedSize && (
              <span className={cx('text-sm ml-1', text.secondary)}>and up</span>
            )}
          </div>

          {/* Size Selector */}
          <div className="flex flex-wrap gap-2 mb-3">
            {product.sizes.map(size => (
              <button
                key={size.id}
                onClick={(e) => handleSizeClick(e, size.id)}
                disabled={!size.available}
                className={cx(
                  'px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all',
                  selectedSize === size.id
                    ? 'border-cbl-orange bg-cbl-orange/15 text-cbl-orange'
                    : 'border-white/20 text-white/70 hover:border-white/40',
                  !size.available && 'opacity-40 cursor-not-allowed line-through'
                )}
              >
                {size.label}
              </button>
            ))}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={!selectedSize}
            className={cx(
              'w-full py-3 rounded-xl font-semibold transition-all',
              addedFeedback
                ? 'bg-emerald-500 text-white'
                : selectedSize
                  ? 'bg-cbl-orange hover:bg-cbl-orange-dark text-white'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
            )}
          >
            {addedFeedback ? 'Added!' : selectedSize ? `Add to Cart - ${formatMYR(currentPrice)}` : 'Select Size'}
          </button>
        </div>
      </div>
    </div>
  )
}
