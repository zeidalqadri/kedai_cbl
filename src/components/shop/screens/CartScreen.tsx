import { getProductById } from '../../../lib/constants'
import { formatMYR } from '../../../lib/utils'
import { config } from '../../../config'
import { layout, ui, cx, text } from '../../../lib/ui-primitives'
import { BackIcon, MinusIcon, PlusIcon, TrashIcon, TruckIcon } from '../../icons'
import type { useShop } from '../../../hooks/useShop'

interface CartScreenProps {
  shop: ReturnType<typeof useShop>
}

export function CartScreen({ shop }: CartScreenProps) {
  const { setScreen, cart } = shop

  const amountToFreeShipping = config.freeShippingThreshold - cart.cart.subtotal
  const hasFreeShipping = amountToFreeShipping <= 0

  return (
    <div className={layout.screenContent}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setScreen('catalog')}
          className={ui.backBtn}
          aria-label="Back to catalog"
        >
          <BackIcon aria-hidden="true" /> <span>Back</span>
        </button>
        <h2 className={text.h3}>Your Cart</h2>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      {cart.isEmpty ? (
        /* Empty Cart */
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="text-6xl mb-4" aria-hidden="true">🛒</div>
          <h3 className={text.h3}>Your cart is empty</h3>
          <p className={cx('mt-2 mb-6', text.secondary)}>
            Add some items to get started
          </p>
          <button
            onClick={() => setScreen('catalog')}
            className={cx(ui.btnBase, ui.btnPrimary)}
          >
            Browse Products
          </button>
        </div>
      ) : (
        <>
          {/* Cart Items */}
          <div className="flex-1 overflow-auto -mx-4 px-4">
            <div className="space-y-3">
              {cart.items.map(item => {
                const product = getProductById(item.productId)
                if (!product) return null

                return (
                  <div
                    key={`${item.productId}-${item.size}`}
                    className={cx(ui.card, 'p-4')}
                  >
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white truncate">
                          {product.name}
                        </h4>
                        <p className={cx('text-sm', text.secondary)}>
                          Size: {item.size}
                        </p>
                        <p className={cx(text.price, 'text-sm mt-1')}>
                          {formatMYR(item.price)}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => cart.removeItem(item.productId, item.size)}
                        className={cx(ui.btnBase, ui.btnQuiet, 'p-2 min-h-0')}
                        aria-label="Remove item"
                      >
                        <TrashIcon className="w-4 h-4 text-red-400" />
                      </button>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => cart.updateQuantity(item.productId, item.size, item.quantity - 1)}
                          className={ui.quantityBtn}
                          aria-label="Decrease quantity"
                        >
                          <MinusIcon className="w-4 h-4 mx-auto" />
                        </button>
                        <span className={cx('w-8 text-center font-medium', text.numeric)}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => cart.updateQuantity(item.productId, item.size, item.quantity + 1)}
                          className={ui.quantityBtn}
                          aria-label="Increase quantity"
                        >
                          <PlusIcon className="w-4 h-4 mx-auto" />
                        </button>
                      </div>
                      <span className={cx(text.price)}>
                        {formatMYR(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Free Shipping Progress */}
            <div className={cx(ui.card, 'p-4 mt-4')}>
              <div className="flex items-center gap-3">
                <TruckIcon className={hasFreeShipping ? 'text-emerald-400' : 'text-white/40'} />
                <div className="flex-1">
                  {hasFreeShipping ? (
                    <p className="text-emerald-400 font-medium">Free shipping unlocked!</p>
                  ) : (
                    <p className={text.secondary}>
                      Add <span className="text-cbl-orange font-medium">{formatMYR(amountToFreeShipping)}</span> more for free shipping
                    </p>
                  )}
                </div>
              </div>
              {!hasFreeShipping && (
                <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cbl-orange rounded-full transition-all"
                    style={{ width: `${Math.min(100, (cart.cart.subtotal / config.freeShippingThreshold) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="pt-4 border-t border-white/10 mt-4">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className={text.secondary}>Subtotal</span>
                <span className={cx('text-white', text.numeric)}>{formatMYR(cart.cart.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className={text.secondary}>Shipping</span>
                <span className={cx(cart.cart.shippingFee === 0 ? 'text-emerald-400' : 'text-white', text.numeric)}>
                  {cart.cart.shippingFee === 0 ? 'Free' : formatMYR(cart.cart.shippingFee)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10">
                <span>Total</span>
                <span className={cx(text.price)}>{formatMYR(cart.cart.total)}</span>
              </div>
            </div>

            <button
              onClick={() => setScreen('customer')}
              className={cx(ui.btnBase, ui.btnPrimary, 'w-full py-4 font-bold text-lg')}
            >
              Checkout
            </button>
          </div>
        </>
      )}
    </div>
  )
}
