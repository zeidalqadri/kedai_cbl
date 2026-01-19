import { layout, ui, cx, text, spinner } from '../../../lib/ui-primitives'
import { config } from '../../../config'
import type { useShop } from '../../../hooks/useShop'

interface ProcessingScreenProps {
  shop: ReturnType<typeof useShop>
}

export function ProcessingScreen({ shop }: ProcessingScreenProps) {
  const { orderId, currentOrder, resetFlow, setScreen } = shop

  return (
    <div className={layout.screenContent}>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {/* Success Animation */}
        <div className="mb-6">
          <div className="text-6xl mb-4" aria-hidden="true">🎉</div>
          <div className={cx(spinner.base, spinner.medium, 'mx-auto opacity-0')} />
        </div>

        <h2 className={text.h2}>Order Submitted!</h2>
        <p className={cx('mt-2 max-w-xs', text.secondary)}>
          Thank you for your order. We'll verify your payment and process your order soon.
        </p>

        {/* Order ID */}
        <div className={cx(ui.card, 'p-4 mt-6 w-full max-w-xs')}>
          <p className={cx('text-sm mb-1', text.secondary)}>Order ID</p>
          <p className={cx('text-xl font-bold', text.mono)}>{orderId}</p>
          <p className={cx('text-xs mt-2', text.disabled)}>
            Save this ID to track your order
          </p>
        </div>

        {/* Order Summary */}
        {currentOrder && (
          <div className={cx(ui.card, 'p-4 mt-4 w-full max-w-xs text-left')}>
            <p className={cx('text-sm mb-2 font-medium', text.secondary)}>
              Order Summary
            </p>
            {currentOrder.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm py-1">
                <span className="text-white/80">
                  {item.productName} ({item.size}) x{item.quantity}
                </span>
              </div>
            ))}
            <div className="border-t border-white/10 mt-2 pt-2">
              <div className="flex justify-between text-sm">
                <span className={text.secondary}>Total</span>
                <span className={cx(text.price)}>
                  RM {currentOrder.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* What's Next */}
        <div className={cx(ui.cardSoft, 'p-4 mt-4 w-full max-w-xs text-left')}>
          <p className={cx('text-sm font-medium mb-2', text.secondary)}>What's next?</p>
          <ol className={cx('text-sm space-y-2', text.tertiary)}>
            <li>1. We'll verify your payment</li>
            <li>2. Order will be processed</li>
            <li>3. You'll receive tracking info via email</li>
          </ol>
        </div>

        {/* Contact Support */}
        <p className={cx('text-xs mt-6', text.disabled)}>
          Questions? Contact us at{' '}
          <a
            href={`https://t.me/${config.supportTelegram.replace('@', '')}`}
            className="text-cbl-orange hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {config.supportTelegram}
          </a>
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-4">
        <button
          onClick={() => setScreen('lookup')}
          className={cx(ui.btnBase, ui.btnGhost, 'w-full')}
        >
          Track Order
        </button>
        <button
          onClick={resetFlow}
          className={cx(ui.btnBase, ui.btnPrimary, 'w-full')}
        >
          Continue Shopping
        </button>
      </div>
    </div>
  )
}
