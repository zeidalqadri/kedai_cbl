import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { cn, formatPrice } from '../lib/utils'
import type { CartItem } from '../lib/types'

interface CartProps {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  onUpdateQuantity: (productId: string, size: string, quantity: number) => void
  onRemoveItem: (productId: string, size: string) => void
  total: number
}

export function Cart({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  total,
}: CartProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Cart Panel */}
      <aside
        className={cn(
          'fixed top-0 right-0 h-dvh w-full max-w-md bg-cbl-dark border-l border-white/10 z-40',
          'flex flex-col transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-label="Shopping cart"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="size-5" />
            Your Cart
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-cbl-orange"
            aria-label="Close cart"
          >
            <X className="size-5 text-white" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="size-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <ShoppingBag className="size-10 text-white/30" />
              </div>
              <p className="text-white/60 text-lg">Your cart is empty</p>
              <p className="text-white/40 text-sm mt-1">Add some items to get started</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={`${item.product.id}-${item.size}`}
                  className="flex gap-4 p-4 bg-white/5 rounded-xl"
                >
                  {/* Item Image */}
                  <div className="size-20 flex-shrink-0 bg-white/5 rounded-lg overflow-hidden">
                    <img
                      src={item.product.image}
                      alt=""
                      className="w-full h-full object-contain p-2"
                    />
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">
                      {item.product.name}
                    </h3>
                    <p className="text-sm text-white/60">
                      Size: {item.product.category === 'basketball' ? `Size ${item.size}` : item.size}
                    </p>
                    <p className="text-cbl-orange font-semibold mt-1 tabular-nums">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() =>
                          onUpdateQuantity(
                            item.product.id,
                            item.size,
                            item.quantity - 1
                          )
                        }
                        className="size-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-cbl-orange"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="w-8 text-center font-semibold tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          onUpdateQuantity(
                            item.product.id,
                            item.size,
                            item.quantity + 1
                          )
                        }
                        className="size-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-cbl-orange"
                        aria-label="Increase quantity"
                      >
                        <Plus className="size-4" />
                      </button>
                      <button
                        onClick={() => onRemoveItem(item.product.id, item.size)}
                        className="ml-auto size-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                        aria-label="Remove item"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 sm:p-6 border-t border-white/10 space-y-4">
            <div className="flex items-center justify-between text-lg">
              <span className="text-white/80">Total</span>
              <span className="text-2xl font-bold text-white tabular-nums">
                {formatPrice(total)}
              </span>
            </div>
            <button className="btn-primary w-full">
              Proceed to Checkout
            </button>
            <p className="text-xs text-white/40 text-center">
              Shipping calculated at checkout
            </p>
          </div>
        )}
      </aside>
    </>
  )
}
