import { CRYPTO_ASSETS, QUICK_AMOUNTS } from '../../../lib/constants'
import { config } from '../../../config'
import { formatMYR, formatCrypto } from '../../../lib/utils'
import { BackIcon } from '../../icons'
import type { useKiosk } from '../../../hooks/useKiosk'

interface AmountScreenProps {
  kiosk: ReturnType<typeof useKiosk>
}

export function AmountScreen({ kiosk }: AmountScreenProps) {
  const {
    selectedCrypto,
    selectedNetwork,
    amount,
    setAmount,
    prices,
    networkFee,
    cryptoAmount,
    error,
    setError,
    submitAmount,
    setScreen,
  } = kiosk

  if (!selectedCrypto || !selectedNetwork) return null

  const asset = CRYPTO_ASSETS[selectedCrypto]

  const goBack = () => {
    if (asset.networks.length > 1) {
      setScreen('network')
    } else {
      setScreen('welcome')
    }
  }

  return (
    <div className="flex flex-col h-full px-6 py-8">
      <button
        onClick={goBack}
        className="flex items-center gap-2 text-gray-400 mb-6 self-start hover:text-white transition-colors"
      >
        <BackIcon /> Back
      </button>

      <div className="text-center mb-6">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3"
          style={{ backgroundColor: `${asset.color}20` }}
        >
          <span>{asset.icon}</span>
          <span className="text-white font-medium">{selectedCrypto}</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-400 text-sm">{selectedNetwork}</span>
        </div>
        <h2 className="text-2xl font-bold text-white">Enter Amount</h2>
      </div>

      <div className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-sm">
          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-medium">
              RM
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                setError('')
              }}
              placeholder="0.00"
              className="w-full bg-gray-800 border-2 border-gray-700 rounded-2xl px-4 pl-14 py-5 text-white text-2xl font-mono text-center focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {QUICK_AMOUNTS.map((qa) => (
              <button
                key={qa}
                onClick={() => setAmount(qa.toString())}
                className="py-2 px-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-sm font-medium transition-colors"
              >
                {qa}
              </button>
            ))}
          </div>

          {amount && parseFloat(amount) > networkFee && (
            <div className="bg-gray-800/50 rounded-2xl p-4 mb-4 border border-gray-700">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>You pay</span>
                  <span className="text-white">{formatMYR(amount)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Network fee ({selectedNetwork})</span>
                  <span>-{formatMYR(networkFee)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Rate</span>
                  <span>
                    1 {selectedCrypto} = {formatMYR(prices[selectedCrypto] || 0)}
                  </span>
                </div>
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-white font-medium">You receive</span>
                    <span
                      className="font-mono font-bold text-lg"
                      style={{ color: asset.color }}
                    >
                      {formatCrypto(cryptoAmount, 4)} {selectedCrypto}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 mb-4 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            onClick={submitAmount}
            disabled={!amount || parseFloat(amount) <= networkFee}
            className="w-full py-4 rounded-2xl font-bold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: asset.color, color: 'white' }}
          >
            Continue
          </button>

          <p className="text-center text-gray-500 text-xs mt-4">
            Min: {formatMYR(config.minAmount)} • Max: {formatMYR(config.maxAmount)}
          </p>
        </div>
      </div>
    </div>
  )
}
