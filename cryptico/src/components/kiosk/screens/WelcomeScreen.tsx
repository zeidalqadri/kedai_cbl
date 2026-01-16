import type { CryptoSymbol } from '../../../types'
import { config } from '../../../config'
import { CRYPTO_ASSETS } from '../../../lib/constants'
import { formatMYR } from '../../../lib/utils'
import { ui, cx, text, spinner } from '../../../lib/ui-primitives'
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
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{config.businessName}</h1>
          <p className={text.secondary}>{config.businessTagline}</p>
        </div>

        <div className="w-full max-w-sm space-y-3">
          <p className={cx("text-center text-sm mb-4", text.secondary)}>
            Select cryptocurrency to buy
          </p>

          {pricesLoading ? (
            <div className="text-center py-8">
              <div className={cx(spinner.medium, spinner.base, "mx-auto mb-2")} />
              <p className={cx("text-sm", text.tertiary)}>Loading rates...</p>
            </div>
          ) : (
            Object.entries(CRYPTO_ASSETS).map(([key, asset]) => (
              <button
                key={key}
                onClick={() => selectCrypto(key as CryptoSymbol)}
                className={ui.selectionCard}
                style={{
                  background: `linear-gradient(135deg, ${asset.color}18, rgba(255,255,255,0.02) 55%, rgba(255,255,255,0.01))`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl" aria-hidden>{asset.icon}</span>
                    <div className="text-left">
                      <div className="text-white font-bold tracking-tight">{asset.symbol}</div>
                      <div className={cx("text-sm", text.tertiary)}>{asset.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-mono">
                      {prices[key as CryptoSymbol]
                        ? formatMYR(prices[key as CryptoSymbol]!)
                        : '—'}
                    </div>
                    <div className={cx("text-xs", text.disabled)}>{asset.networks.length} networks</div>
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
          className={cx(ui.btnBase, ui.btnGhost, "w-full py-3 text-sm")}
        >
          🔍 Track Existing Order
        </button>
      </div>
    </div>
  )
}
