import { layout, ui, cx, text, statusStyles, spinner } from '../../../lib/ui-primitives'
import { BackIcon } from '../../icons'
import { formatMYR } from '../../../lib/utils'
import type { useShop } from '../../../hooks/useShop'
import type { Order } from '../../../types'

interface LookupScreenProps {
  shop: ReturnType<typeof useShop>
}

const STATUS_DISPLAY: Record<string, { label: string; emoji: string }> = {
  pending: { label: 'Pending Verification', emoji: '⏳' },
  confirmed: { label: 'Payment Confirmed', emoji: '✅' },
  processing: { label: 'Processing', emoji: '📦' },
  shipped: { label: 'Shipped', emoji: '🚚' },
  delivered: { label: 'Delivered', emoji: '🎉' },
  cancelled: { label: 'Cancelled', emoji: '❌' },
  refunded: { label: 'Refunded', emoji: '💸' },
}

function OrderCard({ order, onSelect }: { order: Order; onSelect?: () => void }) {
  const isSelectable = !!onSelect

  return (
    <div
      className={cx(
        ui.card,
        'p-4',
        isSelectable && 'cursor-pointer hover:border-cbl-orange/50 transition-colors'
      )}
      onClick={onSelect}
      role={isSelectable ? 'button' : undefined}
      tabIndex={isSelectable ? 0 : undefined}
      onKeyDown={isSelectable ? (e) => e.key === 'Enter' && onSelect() : undefined}
    >
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-4">
        <span className={cx('text-sm', text.secondary)}>Status</span>
        <span
          className={cx(
            'px-3 py-1 rounded-full text-sm font-medium',
            statusStyles[order.status] || statusStyles.pending
          )}
        >
          {STATUS_DISPLAY[order.status]?.emoji}{' '}
          {STATUS_DISPLAY[order.status]?.label || order.status}
        </span>
      </div>

      {/* Order Details */}
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className={text.secondary}>Order ID</span>
          <span className={cx('text-white', text.mono)}>{order.id}</span>
        </div>
        <div className="flex justify-between">
          <span className={text.secondary}>Order Date</span>
          <span className="text-white">
            {new Date(order.createdAt).toLocaleDateString('en-MY', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
        {order.trackingNumber && (
          <div className="flex justify-between">
            <span className={text.secondary}>Tracking</span>
            <span className={cx('text-cbl-orange', text.mono)}>
              {order.trackingNumber}
            </span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className={cx('text-sm mb-2', text.secondary)}>Items</p>
        {order.items.map((item, index) => (
          <div
            key={index}
            className="flex justify-between py-2 text-sm border-b border-white/5 last:border-0"
          >
            <span className="text-white/80">
              {item.productName} ({item.size}) x{item.quantity}
            </span>
            <span className={text.numeric}>
              {formatMYR(item.price * item.quantity)}
            </span>
          </div>
        ))}
        <div className="flex justify-between pt-3 font-medium">
          <span className={text.secondary}>Total</span>
          <span className={cx(text.price)}>{formatMYR(order.total)}</span>
        </div>
      </div>

      {/* Status Timeline */}
      {order.status !== 'cancelled' && (
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className={cx('text-sm mb-4', text.secondary)}>Progress</p>
          <div className="flex justify-between">
            {['pending', 'paid', 'processing', 'shipped', 'completed'].map((status, index) => {
              const statusOrder = ['pending', 'paid', 'processing', 'shipped', 'completed']
              const currentIndex = statusOrder.indexOf(order.status)
              const isActive = index <= currentIndex
              const isCurrent = status === order.status

              return (
                <div key={status} className="flex flex-col items-center">
                  <div
                    className={cx(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm',
                      isActive
                        ? 'bg-cbl-orange text-white'
                        : 'bg-white/10 text-white/40',
                      isCurrent && 'ring-2 ring-cbl-orange/50'
                    )}
                  >
                    {STATUS_DISPLAY[status]?.emoji}
                  </div>
                  <span className={cx('text-xs mt-1', isActive ? text.secondary : text.disabled)}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {isSelectable && (
        <div className="mt-4 pt-4 border-t border-white/10 text-center">
          <span className={cx('text-sm', 'text-cbl-orange')}>
            Tap to view details
          </span>
        </div>
      )}
    </div>
  )
}

export function LookupScreen({ shop }: LookupScreenProps) {
  const {
    setScreen,
    lookupMode,
    setLookupMode,
    lookupOrderId,
    setLookupOrderId,
    lookupEmail,
    setLookupEmail,
    lookupPostcode,
    setLookupPostcode,
    lookupResult,
    lookupResults,
    lookupLoading,
    lookupOrder,
    lookupByEmailPostcode,
    selectedLookupOrder,
    setSelectedLookupOrder,
    error,
    setError,
  } = shop

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (lookupMode === 'order_id') {
      lookupOrder()
    } else {
      lookupByEmailPostcode()
    }
  }

  const handleModeChange = (mode: 'order_id' | 'email_postcode') => {
    setLookupMode(mode)
    setError('')
    setSelectedLookupOrder(null)
  }

  // Determine what to display
  const showSingleOrder = lookupMode === 'order_id' && lookupResult
  const showMultipleOrders = lookupMode === 'email_postcode' && lookupResults.length > 0 && !selectedLookupOrder
  const showSelectedOrder = lookupMode === 'email_postcode' && selectedLookupOrder
  const hasResults = showSingleOrder || showMultipleOrders || showSelectedOrder

  return (
    <div className={layout.screenContent}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            if (selectedLookupOrder) {
              setSelectedLookupOrder(null)
            } else {
              setError('')
              setScreen('catalog')
            }
          }}
          className={ui.backBtn}
          aria-label={selectedLookupOrder ? 'Back to results' : 'Back to shop'}
        >
          <BackIcon aria-hidden="true" /> <span>Back</span>
        </button>
        <h2 className={text.h3}>Track Order</h2>
        <div className="w-16" />
      </div>

      {/* Mode Toggle */}
      <div className="flex mb-6 bg-white/5 rounded-lg p-1">
        <button
          onClick={() => handleModeChange('order_id')}
          className={cx(
            'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
            lookupMode === 'order_id'
              ? 'bg-cbl-orange text-white'
              : 'text-white/60 hover:text-white'
          )}
        >
          Order ID
        </button>
        <button
          onClick={() => handleModeChange('email_postcode')}
          className={cx(
            'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
            lookupMode === 'email_postcode'
              ? 'bg-cbl-orange text-white'
              : 'text-white/60 hover:text-white'
          )}
        >
          Email + Postcode
        </button>
      </div>

      {/* Search Form */}
      {!selectedLookupOrder && (
        <form onSubmit={handleSubmit} className="mb-6">
          {lookupMode === 'order_id' ? (
            <>
              <label htmlFor="order-id" className={cx('text-sm mb-2 block', text.secondary)}>
                Enter your Order ID
              </label>
              <div className="flex gap-2">
                <input
                  id="order-id"
                  type="text"
                  value={lookupOrderId}
                  onChange={(e) => setLookupOrderId(e.target.value.toUpperCase())}
                  placeholder="PS1A2B3C4D"
                  className={cx(ui.input, 'flex-1 font-mono')}
                />
                <button
                  type="submit"
                  disabled={lookupLoading || !lookupOrderId.trim()}
                  className={cx(ui.btnBase, ui.btnPrimary, 'px-6')}
                >
                  {lookupLoading ? (
                    <div className={cx(spinner.base, spinner.small)} />
                  ) : (
                    'Search'
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <label htmlFor="lookup-email" className={cx('text-sm mb-2 block', text.secondary)}>
                    Email Address
                  </label>
                  <input
                    id="lookup-email"
                    type="email"
                    value={lookupEmail}
                    onChange={(e) => setLookupEmail(e.target.value.toLowerCase())}
                    placeholder="your@email.com"
                    className={cx(ui.input, 'w-full')}
                  />
                </div>
                <div>
                  <label htmlFor="lookup-postcode" className={cx('text-sm mb-2 block', text.secondary)}>
                    Postcode
                  </label>
                  <input
                    id="lookup-postcode"
                    type="text"
                    inputMode="numeric"
                    value={lookupPostcode}
                    onChange={(e) => setLookupPostcode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    placeholder="47500"
                    maxLength={5}
                    className={cx(ui.input, 'w-full font-mono')}
                  />
                </div>
                <button
                  type="submit"
                  disabled={lookupLoading || !lookupEmail.trim() || !lookupPostcode.trim()}
                  className={cx(ui.btnBase, ui.btnPrimary, 'w-full')}
                >
                  {lookupLoading ? (
                    <div className={cx(spinner.base, spinner.small)} />
                  ) : (
                    'Find My Orders'
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      )}

      {/* Error */}
      {error && (
        <div className={cx(ui.error, 'mb-4')} role="alert">
          {error}
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-auto">
        {/* Single Order Result (Order ID lookup) */}
        {showSingleOrder && lookupResult && (
          <OrderCard order={lookupResult} />
        )}

        {/* Multiple Orders List (Email+Postcode lookup) */}
        {showMultipleOrders && (
          <div className="space-y-4">
            <p className={cx('text-sm', text.secondary)}>
              Found {lookupResults.length} order{lookupResults.length > 1 ? 's' : ''}
            </p>
            {lookupResults.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onSelect={() => setSelectedLookupOrder(order)}
              />
            ))}
          </div>
        )}

        {/* Selected Order Detail (Email+Postcode lookup) */}
        {showSelectedOrder && selectedLookupOrder && (
          <OrderCard order={selectedLookupOrder} />
        )}

        {/* Empty State */}
        {!hasResults && !error && !lookupLoading && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4" aria-hidden="true">
              {lookupMode === 'order_id' ? '🔍' : '📧'}
            </div>
            <p className={text.secondary}>
              {lookupMode === 'order_id'
                ? 'Enter your order ID to track your order'
                : 'Enter your email and postcode to find your orders'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
