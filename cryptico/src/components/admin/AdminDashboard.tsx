import { useState, useEffect, useMemo } from 'react'
import type { Order, OrderStatus } from '../../types'
import { CRYPTO_ASSETS, NETWORKS } from '../../lib/constants'
import { config } from '../../config'
import { formatMYR, formatCrypto, formatDate, copyToClipboard } from '../../lib/utils'
import { orderStorage } from '../../lib/storage'
import { notifyStatusUpdate } from '../../lib/telegram'
import { RefreshIcon, XIcon, CopyIcon, ExternalLinkIcon } from '../icons'

interface AdminDashboardProps {
  onExit: () => void
}

type FilterType = 'all' | OrderStatus

export function AdminDashboard({ onExit }: AdminDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [txHash, setTxHash] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const loadOrders = async () => {
    setLoading(true)
    const data = await orderStorage.getAll()
    setOrders(data)
    setLoading(false)
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders
    return orders.filter((o) => o.status === filter)
  }, [orders, filter])

  const stats = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0)
    const todayOrders = orders.filter((o) => o.createdAt >= today)
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      approved: orders.filter((o) => o.status === 'approved' || o.status === 'completed').length,
      rejected: orders.filter((o) => o.status === 'rejected').length,
      todayCount: todayOrders.length,
      todayVolume: todayOrders.reduce((sum, o) => sum + o.amountMYR, 0),
    }
  }, [orders])

  const handleApprove = async (order: Order) => {
    setActionLoading(true)
    const updated = await orderStorage.update(order.id, { status: 'approved' })
    if (updated) {
      await notifyStatusUpdate(updated, 'approved')
      await loadOrders()
      setSelectedOrder(updated)
    }
    setActionLoading(false)
  }

  const handleComplete = async (order: Order) => {
    if (!txHash.trim()) return
    setActionLoading(true)
    const updated = await orderStorage.update(order.id, {
      status: 'completed',
      txHash: txHash.trim(),
    })
    if (updated) {
      await notifyStatusUpdate(updated, 'completed', txHash.trim())
      await loadOrders()
      setSelectedOrder(updated)
      setTxHash('')
    }
    setActionLoading(false)
  }

  const handleReject = async (order: Order) => {
    setActionLoading(true)
    const updated = await orderStorage.update(order.id, { status: 'rejected' })
    if (updated) {
      await notifyStatusUpdate(updated, 'rejected')
      await loadOrders()
      setSelectedOrder(updated)
    }
    setActionLoading(false)
  }

  const filters: FilterType[] = ['all', 'pending', 'approved', 'completed', 'rejected']

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-2xl">🏧</span>
            <div>
              <h1 className="text-xl font-bold">{config.businessName} Admin</h1>
              <p className="text-gray-500 text-sm">Order Management Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadOrders}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              title="Refresh"
            >
              <RefreshIcon />
            </button>
            <button
              onClick={onExit}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-sm"
            >
              Exit Admin
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-400 text-sm mb-1">Total Orders</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/30">
            <div className="text-yellow-400 text-sm mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
          </div>
          <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
            <div className="text-green-400 text-sm mb-1">Approved</div>
            <div className="text-2xl font-bold text-green-400">{stats.approved}</div>
          </div>
          <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30">
            <div className="text-blue-400 text-sm mb-1">Today's Volume</div>
            <div className="text-2xl font-bold text-blue-400">{formatMYR(stats.todayVolume)}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'pending' && stats.pending > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-black text-xs rounded-full">
                  {stats.pending}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Order List */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-300 mb-3">
              Orders ({filteredOrders.length})
            </h3>

            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-gray-500">Loading orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-gray-500">No orders found</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {filteredOrders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedOrder?.id === order.id
                        ? 'bg-blue-500/20 border-blue-500'
                        : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-mono text-sm font-medium">{order.id}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          order.status === 'completed'
                            ? 'bg-green-500/20 text-green-400'
                            : order.status === 'approved'
                              ? 'bg-blue-500/20 text-blue-400'
                              : order.status === 'rejected'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{order.customer.name}</span>
                      <span
                        className="font-mono"
                        style={{ color: CRYPTO_ASSETS[order.crypto]?.color }}
                      >
                        {formatCrypto(order.amountCrypto, 2)} {order.crypto}
                      </span>
                    </div>
                    <div className="text-gray-500 text-xs mt-1">{formatDate(order.createdAt)}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Order Detail */}
          <div>
            {selectedOrder ? (
              <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-5 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Order Details</h3>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <XIcon />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xl">{selectedOrder.id}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedOrder.status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : selectedOrder.status === 'approved'
                            ? 'bg-blue-500/20 text-blue-400'
                            : selectedOrder.status === 'rejected'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {selectedOrder.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 mb-1">Amount Paid</div>
                      <div className="text-white font-medium">
                        {formatMYR(selectedOrder.amountMYR)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Crypto Amount</div>
                      <div
                        className="font-mono"
                        style={{ color: CRYPTO_ASSETS[selectedOrder.crypto]?.color }}
                      >
                        {formatCrypto(selectedOrder.amountCrypto, 6)} {selectedOrder.crypto}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Network</div>
                      <div className="text-white">{selectedOrder.network}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Rate</div>
                      <div className="text-white">{formatMYR(selectedOrder.rate)}</div>
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-4">
                    <div className="text-gray-500 text-sm mb-2">Customer</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Name</span>
                        <span className="text-white">{selectedOrder.customer.name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">{selectedOrder.customer.contactType}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white">{selectedOrder.customer.contact}</span>
                          <button
                            onClick={() => copyToClipboard(selectedOrder.customer.contact)}
                            className="text-gray-500 hover:text-white"
                          >
                            <CopyIcon />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-4">
                    <div className="text-gray-500 text-sm mb-2">Wallet Address</div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-gray-900 p-2 rounded break-all">
                        {selectedOrder.customer.walletAddress}
                      </code>
                      <button
                        onClick={() => copyToClipboard(selectedOrder.customer.walletAddress)}
                        className="text-gray-500 hover:text-white shrink-0"
                      >
                        <CopyIcon />
                      </button>
                    </div>
                  </div>

                  {selectedOrder.paymentRef && (
                    <div className="border-t border-gray-700 pt-4">
                      <div className="text-gray-500 text-sm mb-2">Payment Reference</div>
                      <div className="text-white font-mono">{selectedOrder.paymentRef}</div>
                    </div>
                  )}

                  {selectedOrder.txHash && (
                    <div className="border-t border-gray-700 pt-4">
                      <div className="text-gray-500 text-sm mb-2">Transaction Hash</div>
                      <a
                        href={`${NETWORKS[selectedOrder.network]?.explorer}${selectedOrder.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 text-sm font-mono hover:underline flex items-center gap-1"
                      >
                        {selectedOrder.txHash.slice(0, 20)}...
                        <ExternalLinkIcon />
                      </a>
                    </div>
                  )}

                  <div className="text-gray-500 text-xs">
                    Created: {formatDate(selectedOrder.createdAt)}
                    {selectedOrder.updatedAt !== selectedOrder.createdAt && (
                      <> • Updated: {formatDate(selectedOrder.updatedAt)}</>
                    )}
                  </div>

                  {/* Actions */}
                  {selectedOrder.status === 'pending' && (
                    <div className="border-t border-gray-700 pt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleApprove(selectedOrder)}
                          disabled={actionLoading}
                          className="py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-medium transition-colors disabled:opacity-50"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleReject(selectedOrder)}
                          disabled={actionLoading}
                          className="py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition-colors disabled:opacity-50"
                        >
                          ✗ Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedOrder.status === 'approved' && (
                    <div className="border-t border-gray-700 pt-4 space-y-3">
                      <div className="text-gray-400 text-sm">Mark as completed with TX hash:</div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={txHash}
                          onChange={(e) => setTxHash(e.target.value)}
                          placeholder="Transaction hash..."
                          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:border-blue-500 focus:outline-none"
                        />
                        <button
                          onClick={() => handleComplete(selectedOrder)}
                          disabled={actionLoading || !txHash.trim()}
                          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-50"
                        >
                          Complete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-8 text-center">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-gray-500">Select an order to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
