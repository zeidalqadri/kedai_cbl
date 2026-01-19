import { PRODUCT_LIST } from '../../../lib/constants'
import { formatMYR } from '../../../lib/utils'
import { layout, ui, cx, text } from '../../../lib/ui-primitives'
import { CartIcon, SearchIcon } from '../../icons'
import type { useShop } from '../../../hooks/useShop'

interface CatalogScreenProps {
  shop: ReturnType<typeof useShop>
  onAdminClick: () => void
}

export function CatalogScreen({ shop, onAdminClick }: CatalogScreenProps) {
  const { selectProduct, cart, setScreen } = shop

  return (
    <div className={layout.screenContent}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={text.h2}>CBL Shop</h1>
          <p className={cx('text-sm mt-0.5', text.secondary)}>Official Merchandise</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Cart Button */}
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
          {/* Track Order */}
          <button
            onClick={() => setScreen('lookup')}
            className={cx(ui.btnBase, ui.btnGhost, 'px-3')}
            aria-label="Track order"
          >
            <SearchIcon />
          </button>
        </div>
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-auto -mx-4 px-4">
        <div className="grid grid-cols-1 gap-4 pb-4">
          {PRODUCT_LIST.map(product => (
            <button
              key={product.id}
              onClick={() => selectProduct(product.id)}
              className={cx(ui.productCard, 'w-full text-left')}
            >
              {/* Product Image */}
              <div className="aspect-[4/3] bg-white/5 overflow-hidden">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
              {/* Product Info */}
              <div className="p-4">
                <h3 className={cx(text.h3, 'text-lg')}>{product.name}</h3>
                <p className={cx('text-sm mt-1 line-clamp-2', text.secondary)}>
                  {product.description}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className={cx(text.price, 'text-lg')}>
                    {formatMYR(product.price)}
                    {product.id === 'cbl-basketball' && (
                      <span className={cx('text-sm ml-1', text.secondary)}>and up</span>
                    )}
                  </span>
                  <span className={cx(ui.badgeOrange)}>
                    {product.sizes.length} sizes
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer with Admin Link */}
      <div className="pt-4 border-t border-white/10">
        <button
          onClick={onAdminClick}
          className={cx('text-xs', text.disabled, 'hover:text-white/40 transition-colors')}
        >
          Admin
        </button>
      </div>
    </div>
  )
}
