import { CRYPTO_ASSETS, NETWORKS } from '../../../lib/constants'
import { formatMYR, formatCrypto, formatDate } from '../../../lib/utils'
import { BackIcon, ExternalLinkIcon } from '../../icons'
import type { useKiosk } from '../../../hooks/useKiosk'

interface LookupScreenProps {
  kiosk: ReturnType<typeof useKiosk>
}

export function LookupScreen({ kiosk }: LookupScreenProps) {
  const {
    lookupOrderId,
    setLookupOrderId,
    lookupResult,
    lookupLoading,
    error,
    setError,
    lookupOrder,
    setScreen,
  } = kiosk

  const handleBack = () => {
    setScreen('welcome')
    setLookupOrderId('')
    setError('')
  }

  return (
    <div className="flex flex-col h-full px-6 py-8">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-gray-400 mb-6 self-start hover:text-white transition-colors"
      >
        <BackIcon /> Back
      </button>

      <div className="text-center mb-8">
        <div className="text-4xl mb-3">🔍</div>
        <h2 className="text-2xl font-bold text-white">Track Order</h2>
        <p className="text-gray-400 text-sm mt-1">Enter your order ID to check status</p>
      </div>

      <div className="flex-1">
        <div className="w-full max-w-sm mx-auto">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={lookupOrderId}
              onChange={(e) => {
                setLookupOrderId(e.target.value.toUpperCase())
                setError('')
              }}
              placeholder="e.g., CKL4NXYZ"
              className="flex-1 bg-gray-800 border-2 border-gray-700 rounded-xl px-4 py-3 text-white font-mono uppercase focus:border-blue-500 focus:outline-none transition-colors"
            />
            <button
              onClick={lookupOrder}
              disabled={lookupLoading}
              className="px-5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-medium transition-colors disabled:opacity-50"
            >
              {lookupLoading ? '...' : 'Search'}
            </button>
          </div>

          {error && !lookupResult && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-400 text-sm text-center mb-4">
              {error}
            </div>
          )}

          {lookupResult && (
            <div className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-mono font-bold">{lookupResult.id}</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    lookupResult.status === 'completed'
                      ? 'bg-green-500/20 text-green-400'
                      : lookupResult.status === 'approved'
                        ? 'bg-blue-500/20 text-blue-400'
                        : lookupResult.status === 'rejected'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {lookupResult.status.toUpperCase()}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount</span>
                  <span className="text-white">{formatMYR(lookupResult.amountMYR)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Crypto</span>
                  <span
                    className="text-white font-mono"
                    style={{ color: CRYPTO_ASSETS[lookupResult.crypto]?.color }}
                  >
                    {formatCrypto(lookupResult.amountCrypto, 4)} {lookupResult.crypto}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Network</span>
                  <span className="text-white">{lookupResult.network}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date</span>
                  <span className="text-white">{formatDate(lookupResult.createdAt)}</span>
                </div>

                {lookupResult.txHash && (
                  <div className="pt-3 border-t border-gray-700">
                    <span className="text-gray-400 text-xs block mb-1">Transaction</span>
                    <a
                      href={`${NETWORKS[lookupResult.network].explorer}${lookupResult.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 text-xs font-mono hover:underline flex items-center gap-1"
                    >
                      View on explorer <ExternalLinkIcon />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
