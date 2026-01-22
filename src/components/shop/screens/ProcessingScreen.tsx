import { useState, useEffect } from 'react'
import { layout, ui, cx, text, spinner } from '../../../lib/ui-primitives'
import { config } from '../../../config'
import { orderApi } from '../../../lib/api'
import type { Order } from '../../../types'
import type { useShop } from '../../../hooks/useShop'

interface ProcessingScreenProps {
  shop: ReturnType<typeof useShop>
}

export function ProcessingScreen({ shop }: ProcessingScreenProps) {
  const { orderId, currentOrder, resetFlow, setScreen } = shop
  const [copied, setCopied] = useState(false)
  const [polledOrder, setPolledOrder] = useState<Order | null>(null)

  const customerEmail = currentOrder?.customer?.email || ''

  // Poll for status updates via API
  useEffect(() => {
    let alive = true

    const poll = async () => {
      if (!orderId) return

      const result = await orderApi.lookup(orderId)
      if (!alive) return

      if (result.success && result.data?.order) {
        const apiOrder = result.data.order
        // Update polled order when status changes from pending
        if (apiOrder.status !== 'pending') {
          setPolledOrder({
            id: apiOrder.id,
            items: apiOrder.items,
            subtotal: apiOrder.subtotal,
            shippingFee: apiOrder.shippingFee,
            total: apiOrder.total,
            customer: {
              name: apiOrder.customerName,
              phone: '',
              email: '',
              address: { line1: '', city: '', state: '', postcode: '' },
            },
            paymentRef: '',
            hasProofImage: false,
            status: apiOrder.status,
            trackingNumber: apiOrder.trackingNumber,
            createdAt: new Date(apiOrder.createdAt).getTime(),
            updatedAt: new Date(apiOrder.updatedAt).getTime(),
          })
        }
      }
    }

    poll()
    const interval = setInterval(poll, 5000) // Poll every 5 seconds
    return () => {
      alive = false
      clearInterval(interval)
    }
  }, [orderId])

  const copyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(orderId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = orderId
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Show result screen if order status changed from 'pending'
  if (polledOrder && polledOrder.status !== 'pending') {
    const isConfirmed = polledOrder.status === 'confirmed' ||
                        polledOrder.status === 'processing' ||
                        polledOrder.status === 'shipped' ||
                        polledOrder.status === 'delivered'
    const isCancelled = polledOrder.status === 'cancelled' || polledOrder.status === 'refunded'

    return (
      <div className={layout.screenContent}>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          {isConfirmed ? (
            <>
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6">
                <span className="text-4xl" aria-hidden="true">✓</span>
              </div>
              <h2 className={text.h2}>Payment Verified!</h2>
              <p className={cx('mt-2 max-w-xs', text.secondary)}>
                {polledOrder.status === 'shipped'
                  ? 'Your order has been shipped!'
                  : polledOrder.status === 'delivered'
                  ? 'Your order has been delivered!'
                  : 'Your order is being processed'}
              </p>
            </>
          ) : isCancelled ? (
            <>
              <div className="w-20 h-20 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mb-6">
                <span className="text-4xl" aria-hidden="true">✗</span>
              </div>
              <h2 className={text.h2}>Order {polledOrder.status === 'refunded' ? 'Refunded' : 'Cancelled'}</h2>
              <p className={cx('mt-2 max-w-xs', text.secondary)}>
                Please contact support for assistance
              </p>
            </>
          ) : null}

          {/* Order Details Card */}
          <div className={cx(ui.card, 'p-4 mt-6 w-full max-w-xs')}>
            <div className="text-sm space-y-3">
              <div className="flex justify-between">
                <span className={text.secondary}>Order ID</span>
                <span className={cx('text-white', text.mono)}>{polledOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span className={text.secondary}>Status</span>
                <span className={isConfirmed ? 'text-emerald-400' : 'text-red-400'}>
                  {polledOrder.status.charAt(0).toUpperCase() + polledOrder.status.slice(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={text.secondary}>Total</span>
                <span className={cx(text.price)}>RM {polledOrder.total.toFixed(2)}</span>
              </div>
              {polledOrder.trackingNumber && (
                <div className="pt-2 border-t border-white/10">
                  <span className={cx('text-xs block mb-1', text.tertiary)}>Tracking Number</span>
                  <span className={cx('text-white', text.mono)}>{polledOrder.trackingNumber}</span>
                </div>
              )}
            </div>
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

  // Processing/Waiting state (order is still pending)
  return (
    <div className={layout.screenContent}>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {/* Spinner with hourglass */}
        <div className="relative mb-6">
          <div className={cx(spinner.base, spinner.large, 'mx-auto')} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl" aria-hidden="true">⏳</span>
          </div>
        </div>

        <h2 className={text.h2}>Verifying Payment</h2>
        <p className={cx('mt-2 max-w-xs', text.secondary)}>
          We're checking your payment. This usually takes a few minutes.
        </p>

        {/* Email Confirmation */}
        {customerEmail && (
          <div className={cx(ui.cardSoft, 'p-3 mt-4 w-full max-w-xs')}>
            <p className={cx('text-sm', text.secondary)}>
              📧 Confirmation sent to <span className="text-white font-medium">{customerEmail}</span>
            </p>
          </div>
        )}

        {/* Order ID */}
        <div className={cx(ui.card, 'p-4 mt-4 w-full max-w-xs')}>
          <p className={cx('text-sm mb-1', text.secondary)}>Order ID</p>
          <div className="flex items-center justify-between gap-2">
            <p className={cx('text-xl font-bold', text.mono)}>{orderId}</p>
            <button
              onClick={copyOrderId}
              className={cx(
                'px-3 py-1.5 text-xs rounded-md transition-colors',
                copied
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
              )}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <p className={cx('text-xs mt-2', text.disabled)}>
            Use this ID to track your order status
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
            <li>1. Check your email for order confirmation</li>
            <li>2. We'll verify your payment</li>
            <li>3. You'll receive tracking info when shipped</li>
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
          Start New Order
        </button>
      </div>
    </div>
  )
}
