import { useState, useEffect } from 'react'
import type { Order } from '../../../types'
import { CRYPTO_ASSETS, NETWORKS } from '../../../lib/constants'
import { config } from '../../../config'
import { formatMYR, formatCrypto } from '../../../lib/utils'
import { orderApi } from '../../../lib/api'
import { ui, cx, text, spinner } from '../../../lib/ui-primitives'
import { ExternalLinkIcon } from '../../icons'
import type { useKiosk } from '../../../hooks/useKiosk'

interface ProcessingScreenProps {
  kiosk: ReturnType<typeof useKiosk>
}

export function ProcessingScreen({ kiosk }: ProcessingScreenProps) {
  const { selectedCrypto, selectedNetwork, currentOrder, userDetails, orderId, resetFlow } = kiosk
  const [polledOrder, setPolledOrder] = useState<Order | null>(null)

  // Poll for status updates via API
  useEffect(() => {
    let alive = true

    const poll = async () => {
      if (!orderId) return

      const result = await orderApi.lookup(orderId)
      if (!alive) return

      if (result.success && result.data?.order) {
        const apiOrder = result.data.order
        // Convert API response to Order format
        if (apiOrder.status !== 'pending') {
          setPolledOrder({
            id: apiOrder.id,
            crypto: apiOrder.crypto,
            network: apiOrder.network,
            amountMYR: apiOrder.amountMYR,
            amountCrypto: apiOrder.amountCrypto,
            networkFee: apiOrder.networkFee,
            rate: apiOrder.rate,
            customer: {
              name: apiOrder.customerName,
              contactType: 'telegram',
              contact: '',
              walletAddress: apiOrder.walletAddress,
            },
            paymentRef: '',
            hasProofImage: false,
            status: apiOrder.status,
            txHash: apiOrder.txHash,
            createdAt: new Date(apiOrder.createdAt).getTime(),
            updatedAt: new Date(apiOrder.updatedAt).getTime(),
          })
        }
      }
    }

    poll()
    const interval = setInterval(poll, 5000)
    return () => {
      alive = false
      clearInterval(interval)
    }
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
                style={{ backgroundColor: `${asset.color}33` }}
              >
                <span className="text-4xl" aria-hidden>✓</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Payment Confirmed!</h2>
              <p className={cx("mb-8", text.secondary)}>
                {polledOrder.status === 'completed'
                  ? 'Your crypto has been sent'
                  : 'Processing your crypto transfer'}
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-red-500/20 border border-red-500/20 flex items-center justify-center mb-6 mx-auto">
                <span className="text-4xl" aria-hidden>✗</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Order Declined</h2>
              <p className={cx("mb-8", text.secondary)}>Please contact support for assistance</p>
            </>
          )}

          <div className={cx(ui.card, "p-5 mb-6 text-left")}>
            <div className="text-sm space-y-3">
              <div className="flex justify-between">
                <span className={text.secondary}>Order ID</span>
                <span className="text-white font-mono">{polledOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span className={text.secondary}>Amount Paid</span>
                <span className="text-white">{formatMYR(polledOrder.amountMYR)}</span>
              </div>
              {isApproved && (
                <>
                  <div className="flex justify-between">
                    <span className={text.secondary}>
                      Crypto {polledOrder.status === 'completed' ? 'Sent' : 'Amount'}
                    </span>
                    <span className="font-mono" style={{ color: asset.color }}>
                      {formatCrypto(polledOrder.amountCrypto, 4)} {polledOrder.crypto}
                    </span>
                  </div>
                  {polledOrder.txHash && (
                    <div className="pt-2 border-t border-white/10">
                      <span className={cx("text-xs block mb-1", text.tertiary)}>Transaction Hash</span>
                      <a
                        href={`${NETWORKS[polledOrder.network].explorer}${polledOrder.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-200 text-xs font-mono break-all hover:underline inline-flex items-center gap-1"
                      >
                        {polledOrder.txHash.slice(0, 20)}...{polledOrder.txHash.slice(-10)}
                        <ExternalLinkIcon />
                      </a>
                    </div>
                  )}
                  <div className="pt-2 border-t border-white/10">
                    <span className={cx("text-xs block mb-1", text.tertiary)}>To Wallet</span>
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
            className={cx(ui.btnBase, "w-full py-4 rounded-2xl font-bold text-lg bg-white/10 hover:bg-white/15")}
          >
            Done
          </button>

          <p className={cx("text-xs mt-4", text.disabled)}>
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
          <div className={cx(spinner.large, spinner.base, "mx-auto")} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl" aria-hidden>⏳</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Verifying Payment</h2>
        <p className={cx("mb-8", text.secondary)}>We're checking your payment</p>

        <div className={cx(ui.card, "p-5 mb-6")}>
          <div className="text-sm space-y-3">
            <div className="flex justify-between">
              <span className={text.secondary}>Order ID</span>
              <span className="text-white font-mono">{orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className={text.secondary}>Amount</span>
              <span className="text-white">{formatMYR(currentOrder?.amountMYR || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className={text.secondary}>Crypto</span>
              <span className="font-mono" style={{ color: asset.color }}>
                {formatCrypto(currentOrder?.amountCrypto || 0, 4)} {selectedCrypto}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={text.secondary}>Network</span>
              <span className="text-white">{selectedNetwork}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <p className={text.tertiary}>
            We'll contact you via {userDetails.contactType === 'telegram' ? 'Telegram' : 'email'}
          </p>
          <p className={cx("text-xs", text.disabled)}>
            Need help? Contact {config.supportTelegram}
          </p>
        </div>

        <button
          onClick={resetFlow}
          className={cx(ui.btnBase, ui.btnGhost, "mt-8 px-6 py-3")}
        >
          Start New Order
        </button>
      </div>
    </div>
  )
}
