import { useState } from 'react'
import { getProductById, getProductPrice } from '../../../lib/constants'
import { formatMYR } from '../../../lib/utils'
import { layout, ui, cx, text } from '../../../lib/ui-primitives'
import { BackIcon, CartIcon } from '../../icons'
import type { useShop } from '../../../hooks/useShop'

interface ProductScreenProps {
  shop: ReturnType<typeof useShop>
}

export function ProductScreen({ shop }: ProductScreenProps) {
  const { selectedProductId, setScreen, cart } = shop
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [addedFeedback, setAddedFeedback] = useState(false)

  const product = selectedProductId ? getProductById(selectedProductId) : null

  if (!product) {
    return (
      <div className={layout.screenContent}>
        <p className={text.secondary}>Product not found</p>
      </div>
    )
  }

  const currentPrice = selectedSize
    ? getProductPrice(product.id, selectedSize)
    : product.price

  const handleAddToCart = () => {
    if (!selectedSize) return

    cart.addItem(product.id, selectedSize, 1)
    setAddedFeedback(true)
    setTimeout(() => setAddedFeedback(false), 1500)
  }

  return (
    <div className={layout.screenContent}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setScreen('catalog')}
          className={ui.backBtn}
          aria-label="Back to catalog"
        >
          <BackIcon aria-hidden="true" /> <span>Back</span>
        </button>
        <button
          onClick={() => setScreen('cart')}
          className={cx(ui.btnBase, ui.btnGhost, 'relative px-3')}
          aria-label={`Cart with ${cart.itemCount} items`}
        >
          <CartIcon />
          {cart.itemCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-cbl-orange text-white text-xs font-bold flex items-center justify-center">
              {cart.itemCount}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto -mx-4 px-4">
        {/* Main Image */}
        <div className="bg-white rounded-2xl overflow-hidden mb-4">
          <div className="aspect-square">
            <img
              src={product.images[selectedImageIndex]}
              alt={product.name}
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Image Thumbnails */}
        {product.images.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={cx(
                  'flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all',
                  selectedImageIndex === index
                    ? 'border-cbl-orange'
                    : 'border-white/10 hover:border-white/20'
                )}
              >
                <img
                  src={image}
                  alt={`${product.name} view ${index + 1}`}
                  className="w-full h-full object-cover bg-white"
                />
              </button>
            ))}
          </div>
        )}

        {/* Product Info */}
        <div className="mb-6">
          <h2 className={text.h2}>{product.name}</h2>
          <p className={cx('mt-2', text.secondary)}>{product.description}</p>
          <div className={cx(text.price, 'text-2xl mt-3')}>
            {formatMYR(currentPrice)}
          </div>
        </div>

        {/* Size Selector */}
        <div className="mb-6">
          <label className={cx('text-sm mb-3 block', text.secondary)}>
            Select Size
          </label>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map(size => (
              <button
                key={size.id}
                onClick={() => setSelectedSize(size.id)}
                disabled={!size.available}
                className={cx(
                  ui.sizeBtn,
                  'px-4',
                  selectedSize === size.id && ui.sizeBtnSelected,
                  !size.available && ui.sizeBtnDisabled
                )}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Add to Cart Button */}
      <div className="pt-4">
        <button
          onClick={handleAddToCart}
          disabled={!selectedSize}
          className={cx(
            ui.btnBase,
            ui.btnPrimary,
            'w-full py-4 font-bold text-lg',
            addedFeedback && 'bg-emerald-500 hover:bg-emerald-500'
          )}
        >
          {addedFeedback ? (
            <>Added to Cart!</>
          ) : selectedSize ? (
            <>Add to Cart - {formatMYR(currentPrice)}</>
          ) : (
            <>Select a Size</>
          )}
        </button>
      </div>
    </div>
  )
}
