import { layout, ui, cx, text, statusStyles, spinner } from '../../../lib/ui-primitives'
import { BackIcon } from '../../icons'
import { formatMYR } from '../../../lib/utils'
import type { useShop } from '../../../hooks/useShop'

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

export function LookupScreen({ shop }: LookupScreenProps) {
  const {
    setScreen,
    lookupOrderId,
    setLookupOrderId,
    lookupResult,
    lookupLoading,
    lookupOrder,
    error,
    setError,
  } = shop

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    lookupOrder()
  }

  return (
    <div className={layout.screenContent}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            setError('')
            setScreen('catalog')
          }}
          className={ui.backBtn}
          aria-label="Back to shop"
        >
          <BackIcon aria-hidden="true" /> <span>Back</span>
        </button>
        <h2 className={text.h3}>Track Order</h2>
        <div className="w-16" />
      </div>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="mb-6">
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
      </form>

      {/* Error */}
      {error && (
        <div className={cx(ui.error, 'mb-4')} role="alert">
          {error}
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-auto">
        {lookupResult && (
          <div className={cx(ui.card, 'p-4')}>
            {/* Status Badge */}
            <div className="flex items-center justify-between mb-4">
              <span className={cx('text-sm', text.secondary)}>Status</span>
              <span
                className={cx(
                  'px-3 py-1 rounded-full text-sm font-medium',
                  statusStyles[lookupResult.status] || statusStyles.pending
                )}
              >
                {STATUS_DISPLAY[lookupResult.status]?.emoji}{' '}
                {STATUS_DISPLAY[lookupResult.status]?.label || lookupResult.status}
              </span>
            </div>

            {/* Order Details */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className={text.secondary}>Order ID</span>
                <span className={cx('text-white', text.mono)}>{lookupResult.id}</span>
              </div>
              <div className="flex justify-between">
                <span className={text.secondary}>Order Date</span>
                <span className="text-white">
                  {new Date(lookupResult.createdAt).toLocaleDateString('en-MY', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              {lookupResult.trackingNumber && (
                <div className="flex justify-between">
                  <span className={text.secondary}>Tracking</span>
                  <span className={cx('text-cbl-orange', text.mono)}>
                    {lookupResult.trackingNumber}
                  </span>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className={cx('text-sm mb-2', text.secondary)}>Items</p>
              {lookupResult.items.map((item, index) => (
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
                <span className={cx(text.price)}>{formatMYR(lookupResult.total)}</span>
              </div>
            </div>

            {/* Status Timeline */}
            {lookupResult.status !== 'cancelled' && (
              <div className="mt-6 pt-4 border-t border-white/10">
                <p className={cx('text-sm mb-4', text.secondary)}>Progress</p>
                <div className="flex justify-between">
                  {['pending', 'paid', 'processing', 'shipped', 'completed'].map((status, index) => {
                    const statusOrder = ['pending', 'paid', 'processing', 'shipped', 'completed']
                    const currentIndex = statusOrder.indexOf(lookupResult.status)
                    const isActive = index <= currentIndex
                    const isCurrent = status === lookupResult.status

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
          </div>
        )}

        {/* Empty State */}
        {!lookupResult && !error && !lookupLoading && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4" aria-hidden="true">🔍</div>
            <p className={text.secondary}>
              Enter your order ID to track your order
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
