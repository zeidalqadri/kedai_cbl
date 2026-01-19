import { ChangeEvent } from 'react'
import { layout, ui, cx, text } from '../../../lib/ui-primitives'
import { BackIcon } from '../../icons'
import type { useShop } from '../../../hooks/useShop'

interface ConfirmScreenProps {
  shop: ReturnType<typeof useShop>
}

export function ConfirmScreen({ shop }: ConfirmScreenProps) {
  const {
    setScreen,
    paymentProof,
    setPaymentProof,
    paymentRef,
    setPaymentRef,
    error,
    setError,
    submitOrder,
  } = shop

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File too large. Max 5MB.')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => setPaymentProof(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className={layout.screenContent}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <button
          onClick={() => setScreen('payment')}
          className={ui.backBtn}
          aria-label="Back to payment"
        >
          <BackIcon aria-hidden="true" /> <span>Back</span>
        </button>
      </div>

      <div className="text-center mb-4 sm:mb-6">
        <h2 className={text.h2}>Confirm Payment</h2>
        <p className={cx('text-sm mt-1', text.secondary)}>
          Help us verify your payment
        </p>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="w-full max-w-sm mx-auto space-y-4">
          {/* Payment Reference Input */}
          <div>
            <label
              htmlFor="payment-ref"
              className={cx('text-sm mb-2 block', text.secondary)}
            >
              Payment Reference / Transaction ID
            </label>
            <input
              id="payment-ref"
              type="text"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="e.g., 2025011512345678"
              className={ui.input}
            />
            <p className={cx('text-xs mt-1', text.disabled)}>
              Found in your banking app's transaction history
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 py-2">
            <div className={cx('flex-1', ui.divider)} />
            <span className={cx('text-sm', text.tertiary)}>or</span>
            <div className={cx('flex-1', ui.divider)} />
          </div>

          {/* Screenshot Upload */}
          <div>
            <label className={cx('text-sm mb-2 block', text.secondary)}>
              Upload Payment Screenshot
            </label>
            <label className="block w-full cursor-pointer">
              <div
                className={cx(
                  'border-2 border-dashed rounded-xl p-6 text-center transition-colors min-h-[120px] flex items-center justify-center',
                  paymentProof
                    ? 'border-emerald-500/50 bg-emerald-500/10'
                    : 'border-white/20 hover:border-white/30 bg-white/[0.02]'
                )}
              >
                {paymentProof ? (
                  <div>
                    <div className="text-emerald-400 text-3xl mb-2" aria-hidden="true">✓</div>
                    <p className="text-emerald-400 font-medium">Screenshot uploaded</p>
                    <p className={cx('text-xs mt-1', text.tertiary)}>Tap to change</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-3xl mb-2" aria-hidden="true">📎</div>
                    <p className={text.secondary}>Tap to upload screenshot</p>
                    <p className={cx('text-xs mt-1', text.disabled)}>Max 5MB, JPG/PNG</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="sr-only"
                aria-label="Upload payment screenshot"
              />
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className={ui.error} role="alert">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={submitOrder}
            disabled={!paymentRef && !paymentProof}
            className={cx(ui.btnBase, ui.btnPrimary, 'w-full py-4 font-bold text-lg')}
          >
            Submit Order
          </button>

          <p className={cx('text-center text-xs', text.disabled)}>
            Your order will be processed within 24 hours after verification
          </p>
        </div>
      </div>
    </div>
  )
}
