import { useState, useEffect } from 'react'
import type { Order } from '../../../types'
import { CRYPTO_ASSETS, NETWORKS } from '../../../lib/constants'
import { config } from '../../../config'
import { formatMYR, formatCrypto } from '../../../lib/utils'
import { orderStorage } from '../../../lib/storage'
import { ExternalLinkIcon } from '../../icons'
import type { useKiosk } from '../../../hooks/useKiosk'

interface ProcessingScreenProps {
  kiosk: ReturnType<typeof useKiosk>
}

export function ProcessingScreen({ kiosk }: ProcessingScreenProps) {
  const { selectedCrypto, selectedNetwork, currentOrder, userDetails, orderId, resetFlow } = kiosk
  const [polledOrder, setPolledOrder] = useState<Order | null>(null)

  // Poll for status updates
  useEffect(() => {
    const poll = async () => {
      const order = await orderStorage.getById(orderId)
      if (order && order.status !== 'pending') {
        setPolledOrder(order)
      }
    }

    poll()
    const interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  }, [orderId])

  if (!selectedCrypto || !selectedNetwork) return null

  const asset = CRYPTO_ASSETS[selectedCrypto]

  // Show result screen if order status changed
  if (polledOrder && polledOrder.status !== 'pending') {
    const isApproved = polledOrder.status === 'approved' || polledOrder.status === 'completed'

    return (
      <div className="flex flex-col items-center justify-center h-full px-6 py-8">
        <div className="text-center max-w-sm">
          {isApproved ? (
            <>
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-6 mx-auto"
                style={{ backgroundColor: `${asset.color}30` }}
              >
                <span className="text-4xl">✓</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Payment Confirmed!</h2>
              <p className="text-gray-400 mb-8">
                {polledOrder.status === 'completed'
                  ? 'Your crypto has been sent'
                  : 'Processing your crypto transfer'}
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-red-500/30 flex items-center justify-center mb-6 mx-auto">
                <span className="text-4xl">✗</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Order Declined</h2>
              <p className="text-gray-400 mb-8">Please contact support for assistance</p>
            </>
          )}

          <div className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700 mb-6 text-left">
            <div className="text-sm space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Order ID</span>
                <span className="text-white font-mono">{polledOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Amount Paid</span>
                <span className="text-white">{formatMYR(polledOrder.amountMYR)}</span>
              </div>
              {isApproved && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      Crypto {polledOrder.status === 'completed' ? 'Sent' : 'Amount'}
                    </span>
                    <span className="font-mono" style={{ color: asset.color }}>
                      {formatCrypto(polledOrder.amountCrypto, 4)} {polledOrder.crypto}
                    </span>
                  </div>
                  {polledOrder.txHash && (
                    <div className="pt-2 border-t border-gray-700">
                      <span className="text-gray-400 text-xs block mb-1">Transaction Hash</span>
                      <a
                        href={`${NETWORKS[polledOrder.network].explorer}${polledOrder.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 text-xs font-mono break-all hover:underline flex items-center gap-1"
                      >
                        {polledOrder.txHash.slice(0, 20)}...{polledOrder.txHash.slice(-10)}
                        <ExternalLinkIcon />
                      </a>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-700">
                    <span className="text-gray-400 text-xs block mb-1">To Wallet</span>
                    <span className="text-white font-mono text-xs break-all">
                      {polledOrder.customer.walletAddress}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <button
            onClick={resetFlow}
            className="w-full py-4 rounded-2xl font-bold text-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          >
            Done
          </button>

          <p className="text-gray-600 text-xs mt-4">
            Questions? Contact {config.supportTelegram}
          </p>
        </div>
      </div>
    )
  }

  // Processing state
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8">
      <div className="text-center max-w-sm">
        <div className="relative mb-8">
          <div className="w-20 h-20 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">⏳</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Verifying Payment</h2>
        <p className="text-gray-400 mb-8">We're checking your payment</p>

        <div className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700 mb-6">
          <div className="text-sm space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Order ID</span>
              <span className="text-white font-mono">{orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Amount</span>
              <span className="text-white">{formatMYR(currentOrder?.amountMYR || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Crypto</span>
              <span className="font-mono" style={{ color: asset.color }}>
                {formatCrypto(currentOrder?.amountCrypto || 0, 4)} {selectedCrypto}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Network</span>
              <span className="text-white">{selectedNetwork}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <p className="text-gray-500">
            We'll contact you via {userDetails.contactType === 'telegram' ? 'Telegram' : 'email'}
          </p>
          <p className="text-gray-600 text-xs">
            Need help? Contact {config.supportTelegram}
          </p>
        </div>

        <button
          onClick={resetFlow}
          className="mt-8 px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
        >
          Start New Order
        </button>
      </div>
    </div>
  )
}
