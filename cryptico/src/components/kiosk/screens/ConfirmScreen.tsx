import { ChangeEvent } from 'react'
import { CRYPTO_ASSETS } from '../../../lib/constants'
import { BackIcon } from '../../icons'
import type { useKiosk } from '../../../hooks/useKiosk'

interface ConfirmScreenProps {
  kiosk: ReturnType<typeof useKiosk>
}

export function ConfirmScreen({ kiosk }: ConfirmScreenProps) {
  const {
    selectedCrypto,
    rateLockRemaining,
    paymentProof,
    setPaymentProof,
    paymentRef,
    setPaymentRef,
    error,
    setError,
    submitPaymentProof,
    setScreen,
  } = kiosk

  if (!selectedCrypto) return null

  const asset = CRYPTO_ASSETS[selectedCrypto]

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
    <div className="flex flex-col h-full px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setScreen('payment')}
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

      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white">Confirm Payment</h2>
        <p className="text-gray-400 text-sm mt-1">Help us verify your payment</p>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="w-full max-w-sm mx-auto space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">
              Payment Reference / Transaction ID
            </label>
            <input
              type="text"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="e.g., 2025011512345678"
              className="w-full bg-gray-800 border-2 border-gray-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
            />
            <p className="text-gray-600 text-xs mt-1">
              Found in your banking app's transaction history
            </p>
          </div>

          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 border-t border-gray-700" />
            <span className="text-gray-500 text-sm">or</span>
            <div className="flex-1 border-t border-gray-700" />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Upload Payment Screenshot</label>
            <label className="block w-full cursor-pointer">
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                  paymentProof
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                {paymentProof ? (
                  <div>
                    <div className="text-green-400 text-3xl mb-2">✓</div>
                    <p className="text-green-400 font-medium">Screenshot uploaded</p>
                    <p className="text-gray-500 text-xs mt-1">Tap to change</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-gray-400 text-3xl mb-2">📎</div>
                    <p className="text-gray-400">Tap to upload screenshot</p>
                    <p className="text-gray-600 text-xs mt-1">Max 5MB, JPG/PNG</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            onClick={submitPaymentProof}
            disabled={!paymentRef && !paymentProof}
            className="w-full py-4 rounded-2xl font-bold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: asset.color, color: 'white' }}
          >
            Submit for Verification
          </button>

          <p className="text-center text-gray-600 text-xs">
            Your order will be processed within minutes after verification
          </p>
        </div>
      </div>
    </div>
  )
}
