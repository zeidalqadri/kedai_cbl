import type { CryptoSymbol } from '../../../types'
import { config } from '../../../config'
import { CRYPTO_ASSETS } from '../../../lib/constants'
import { formatMYR } from '../../../lib/utils'
import { SpinnerIcon } from '../../icons'
import type { useKiosk } from '../../../hooks/useKiosk'

interface WelcomeScreenProps {
  kiosk: ReturnType<typeof useKiosk>
  onLogoPress: () => void
  onLogoRelease: () => void
  onLogoLeave: () => void
}

export function WelcomeScreen({
  kiosk,
  onLogoPress,
  onLogoRelease,
  onLogoLeave,
}: WelcomeScreenProps) {
  const { prices, pricesLoading, selectCrypto, setScreen } = kiosk

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div
          className="text-center mb-10 cursor-pointer select-none"
          onMouseDown={onLogoPress}
          onMouseUp={onLogoRelease}
          onMouseLeave={onLogoLeave}
          onTouchStart={onLogoPress}
          onTouchEnd={onLogoRelease}
        >
          <div className="text-6xl mb-4">🏧</div>
          <h1 className="text-3xl font-bold text-white mb-2">{config.businessName}</h1>
          <p className="text-gray-400">{config.businessTagline}</p>
        </div>

        <div className="w-full max-w-sm space-y-3">
          <p className="text-center text-gray-400 text-sm mb-4">
            Select cryptocurrency to buy
          </p>

          {pricesLoading ? (
            <div className="text-center py-8">
              <SpinnerIcon className="w-8 h-8 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Loading rates...</p>
            </div>
          ) : (
            Object.entries(CRYPTO_ASSETS).map(([key, asset]) => (
              <button
                key={key}
                onClick={() => selectCrypto(key as CryptoSymbol)}
                className="w-full p-5 rounded-2xl border-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  borderColor: `${asset.color}50`,
                  background: `linear-gradient(135deg, ${asset.color}10, transparent)`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{asset.icon}</span>
                    <div className="text-left">
                      <div className="text-white font-bold">{asset.symbol}</div>
                      <div className="text-gray-500 text-sm">{asset.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-mono">
                      {prices[key as CryptoSymbol]
                        ? formatMYR(prices[key as CryptoSymbol]!)
                        : '—'}
                    </div>
                    <div className="text-gray-600 text-xs">{asset.networks.length} networks</div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="px-6 pb-6">
        <button
          onClick={() => setScreen('lookup')}
          className="w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors text-sm"
        >
          🔍 Track Existing Order
        </button>
      </div>
    </div>
  )
}
