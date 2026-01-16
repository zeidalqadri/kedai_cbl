import { CRYPTO_ASSETS, NETWORKS } from '../../../lib/constants'
import { formatMYR, formatCrypto, validateWalletAddress } from '../../../lib/utils'
import { BackIcon } from '../../icons'
import type { useKiosk } from '../../../hooks/useKiosk'

interface DetailsScreenProps {
  kiosk: ReturnType<typeof useKiosk>
}

export function DetailsScreen({ kiosk }: DetailsScreenProps) {
  const {
    selectedCrypto,
    selectedNetwork,
    amount,
    cryptoAmount,
    rateLockRemaining,
    userDetails,
    setUserDetails,
    error,
    submitDetails,
    setScreen,
  } = kiosk

  if (!selectedCrypto || !selectedNetwork) return null

  const asset = CRYPTO_ASSETS[selectedCrypto]
  const network = NETWORKS[selectedNetwork]
  const addressValidation = validateWalletAddress(userDetails.walletAddress, selectedNetwork)

  return (
    <div className="flex flex-col h-full px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setScreen('amount')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <BackIcon /> Back
        </button>
        {rateLockRemaining > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm">
            <span>⏱</span>
            <span>
              Rate locked: {Math.floor(rateLockRemaining / 60)}:
              {(rateLockRemaining % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white">Your Details</h2>
        <p className="text-gray-400 text-sm mt-1">We'll contact you for verification</p>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="w-full max-w-sm mx-auto space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Full Name *</label>
            <input
              type="text"
              value={userDetails.name}
              onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
              placeholder="Ahmad bin Abdullah"
              className="w-full bg-gray-800 border-2 border-gray-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Contact Method *</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                onClick={() =>
                  setUserDetails({ ...userDetails, contactType: 'telegram', contact: '' })
                }
                className={`py-3 rounded-xl font-medium transition-colors ${
                  userDetails.contactType === 'telegram'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                📱 Telegram
              </button>
              <button
                onClick={() =>
                  setUserDetails({ ...userDetails, contactType: 'email', contact: '' })
                }
                className={`py-3 rounded-xl font-medium transition-colors ${
                  userDetails.contactType === 'email'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                ✉️ Email
              </button>
            </div>
            <input
              type={userDetails.contactType === 'email' ? 'email' : 'text'}
              value={userDetails.contact}
              onChange={(e) => setUserDetails({ ...userDetails, contact: e.target.value })}
              placeholder={
                userDetails.contactType === 'telegram' ? '@your_username' : 'you@email.com'
              }
              className="w-full bg-gray-800 border-2 border-gray-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">
              {selectedCrypto} Wallet Address ({selectedNetwork}) *
            </label>
            <textarea
              value={userDetails.walletAddress}
              onChange={(e) =>
                setUserDetails({ ...userDetails, walletAddress: e.target.value.trim() })
              }
              placeholder={`${network.addressPrefix}...`}
              rows={2}
              className="w-full bg-gray-800 border-2 border-gray-700 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-blue-500 focus:outline-none transition-colors resize-none"
            />
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  addressValidation.valid
                    ? 'bg-green-500'
                    : userDetails.walletAddress
                      ? 'bg-red-500'
                      : 'bg-gray-600'
                }`}
              />
              <span className="text-gray-500 text-xs">{network.name} address</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Amount</span>
                <span className="text-white">{formatMYR(amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">You receive</span>
                <span className="font-mono" style={{ color: asset.color }}>
                  {formatCrypto(cryptoAmount, 4)} {selectedCrypto}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={submitDetails}
            className="w-full py-4 rounded-2xl font-bold text-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: asset.color, color: 'white' }}
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  )
}
