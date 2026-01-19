import { config } from '../../../config'
import { formatMYR } from '../../../lib/utils'
import { layout, ui, cx, text } from '../../../lib/ui-primitives'
import { BackIcon } from '../../icons'
import type { useShop } from '../../../hooks/useShop'

interface PaymentScreenProps {
  shop: ReturnType<typeof useShop>
}

export function PaymentScreen({ shop }: PaymentScreenProps) {
  const { setScreen, cart, customer } = shop

  return (
    <div className={layout.screenContent}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setScreen('customer')}
          className={ui.backBtn}
          aria-label="Back to details"
        >
          <BackIcon aria-hidden="true" /> <span>Back</span>
        </button>
      </div>

      <div className="text-center mb-4">
        <h2 className={text.h2}>Scan to Pay</h2>
        <p className={cx('text-sm mt-1', text.secondary)}>
          Pay via DuitNow
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center overflow-auto">
        <div className="w-full max-w-sm">
          {/* QR Code Card */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 mb-4">
            <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
              {config.duitNowQrImage ? (
                <img
                  src={config.duitNowQrImage}
                  alt="DuitNow QR Code for payment"
                  className="w-full h-full object-contain"
                  width={300}
                  height={300}
                />
              ) : (
                <div className="text-center p-4">
                  <div className="text-5xl mb-3" aria-hidden="true">📱</div>
                  <p className="text-gray-600 font-medium">DuitNow QR</p>
                  <p className="text-gray-400 text-xs mt-1">Configure your QR code</p>
                </div>
              )}
            </div>
            <div className="mt-4 text-center">
              <div className={cx('text-3xl font-bold text-gray-800', text.numeric)}>
                {formatMYR(cart.cart.total)}
              </div>
              <p className="text-gray-500 text-sm mt-1">
                Scan with any Malaysian banking app
              </p>
            </div>
          </div>

          {/* Order Summary */}
          <div className={cx(ui.card, 'p-4 mb-4 text-sm')}>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className={text.secondary}>Items</span>
                <span className="text-white">
                  {cart.itemCount} item{cart.itemCount !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={text.secondary}>Shipping to</span>
                <span className="text-white text-right max-w-[180px] truncate">
                  {customer.address.city}, {customer.address.state}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10">
                <span className={text.secondary}>Total</span>
                <span className={cx('text-white font-medium', text.numeric)}>
                  {formatMYR(cart.cart.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Confirm Payment Button */}
          <button
            onClick={() => setScreen('confirm')}
            className={cx(ui.btnBase, ui.btnPrimary, 'w-full py-4 font-bold text-lg')}
          >
            I've Made Payment
          </button>
        </div>
      </div>
    </div>
  )
}
