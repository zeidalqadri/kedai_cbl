import { CRYPTO_ASSETS, NETWORKS } from '../../../lib/constants'
import { config } from '../../../config'
import { formatMYR } from '../../../lib/utils'
import { BackIcon } from '../../icons'
import type { useKiosk } from '../../../hooks/useKiosk'

interface NetworkScreenProps {
  kiosk: ReturnType<typeof useKiosk>
}

export function NetworkScreen({ kiosk }: NetworkScreenProps) {
  const { selectedCrypto, selectNetwork, setScreen } = kiosk

  if (!selectedCrypto) return null

  const asset = CRYPTO_ASSETS[selectedCrypto]

  return (
    <div className="flex flex-col h-full px-6 py-8">
      <button
        onClick={() => setScreen('welcome')}
        className="flex items-center gap-2 text-gray-400 mb-6 self-start hover:text-white transition-colors"
      >
        <BackIcon /> Back
      </button>

      <div className="text-center mb-8">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
          style={{ backgroundColor: `${asset.color}20` }}
        >
          <span>{asset.icon}</span>
          <span className="text-white font-medium">{selectedCrypto}</span>
        </div>
        <h2 className="text-2xl font-bold text-white">Select Network</h2>
        <p className="text-gray-400 text-sm mt-1">Choose blockchain network for receiving</p>
      </div>

      <div className="flex-1">
        <div className="space-y-3 max-w-sm mx-auto">
          {asset.networks.map((network) => (
            <button
              key={network}
              onClick={() => selectNetwork(network)}
              className="w-full p-5 rounded-2xl border-2 border-gray-700 hover:border-gray-600 bg-gray-800/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{NETWORKS[network].icon}</span>
                  <div className="text-left">
                    <div className="text-white font-medium">{network}</div>
                    <div className="text-gray-500 text-sm">{NETWORKS[network].name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-mono text-sm">
                    {formatMYR(config.networkFees[network])}
                  </div>
                  <div className="text-gray-600 text-xs">network fee</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-gray-600 text-xs mt-6 max-w-sm mx-auto">
          Lower fees = longer confirmation. Choose based on your preference.
        </p>
      </div>
    </div>
  )
}
