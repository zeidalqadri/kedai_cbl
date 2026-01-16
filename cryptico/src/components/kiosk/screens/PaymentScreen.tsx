import { CRYPTO_ASSETS } from '../../../lib/constants'
import { config } from '../../../config'
import { formatMYR, formatCrypto, truncateAddress } from '../../../lib/utils'
import { BackIcon } from '../../icons'
import type { useKiosk } from '../../../hooks/useKiosk'

interface PaymentScreenProps {
  kiosk: ReturnType<typeof useKiosk>
}

export function PaymentScreen({ kiosk }: PaymentScreenProps) {
  const {
    selectedCrypto,
    selectedNetwork,
    amount,
    cryptoAmount,
    rateLockRemaining,
    userDetails,
    orderId,
    setScreen,
  } = kiosk

  if (!selectedCrypto || !selectedNetwork) return null

  const asset = CRYPTO_ASSETS[selectedCrypto]

  return (
    <div className="flex flex-col h-full px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setScreen('details')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <BackIcon /> Back
        </button>
        {rateLockRemaining > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm">
            <span>⏱</span>
            <span>
              {Math.floor(rateLockRemaining / 60)}:
              {(rateLockRemaining % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-white">Scan to Pay</h2>
        <p className="text-gray-400 text-sm mt-1">Order #{orderId}</p>
      </div>

      <div className="flex-1 flex flex-col items-center overflow-auto">
        <div className="w-full max-w-sm">
          {/* QR Code */}
          <div className="bg-white rounded-3xl p-5 mb-4">
            <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
              {config.duitNowQrImage ? (
                <img
                  src={config.duitNowQrImage}
                  alt="DuitNow QR"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-4">
                  <div className="text-5xl mb-3">📱</div>
                  <p className="text-gray-600 font-medium">DuitNow QR</p>
                  <p className="text-gray-400 text-xs mt-1">Configure your QR code</p>
                </div>
              )}
            </div>
            <div className="mt-4 text-center">
              <div className="text-3xl font-bold text-gray-800">{formatMYR(amount)}</div>
              <p className="text-gray-500 text-sm mt-1">Scan with any Malaysian banking app</p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-800/50 rounded-xl p-4 mb-4 border border-gray-700 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Buying</span>
                <span className="text-white font-mono">
                  {formatCrypto(cryptoAmount, 4)} {selectedCrypto}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Network</span>
                <span className="text-white">{selectedNetwork}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">To</span>
                <span className="text-white font-mono text-xs">
                  {truncateAddress(userDetails.walletAddress, 10, 8)}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setScreen('confirm')}
            className="w-full py-4 rounded-2xl font-bold text-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: asset.color, color: 'white' }}
          >
            I've Made Payment ✓
          </button>
        </div>
      </div>
    </div>
  )
}
