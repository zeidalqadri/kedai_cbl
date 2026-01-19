import { useState, useEffect, useMemo } from 'react'
import type { Order, OrderStatus } from '../../types'
import { config } from '../../config'
import { formatMYR } from '../../lib/utils'
import { adminApi, adminOrderToOrder } from '../../lib/api'
import { RefreshIcon, XIcon, TruckIcon } from '../icons'

interface AdminDashboardProps {
  onExit: () => void
}

type FilterType = 'all' | OrderStatus

// Common courier options in Malaysia
const COURIERS = ['Pos Laju', 'J&T Express', 'DHL', 'Ninja Van', 'GDex', 'City-Link', 'ABX Express']

export function AdminDashboard({ onExit }: AdminDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [courier, setCourier] = useState(COURIERS[0])
  const [actionLoading, setActionLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const loadOrders = async () => {
    setLoading(true)
    setApiError('')
    const result = await adminApi.getOrders({ limit: 100 })
    if (result.success && result.data) {
      setOrders(result.data.orders.map(adminOrderToOrder))
    } else {
      setApiError(result.error || 'Failed to load orders')
      setOrders([])
    }
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
      processing: orders.filter((o) => o.status === 'confirmed' || o.status === 'processing').length,
      shipped: orders.filter((o) => o.status === 'shipped').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
      todayCount: todayOrders.length,
      todayRevenue: todayOrders.reduce((sum, o) => sum + o.total, 0),
    }
  }, [orders])

  const handleStatusUpdate = async (
    order: Order,
    newStatus: OrderStatus,
    data?: { trackingNumber?: string; courier?: string }
  ) => {
    setActionLoading(true)
    setApiError('')
    const result = await adminApi.updateStatus(order.id, newStatus, data)
    if (result.success) {
      await loadOrders()
      // Update selected order
      if (selectedOrder?.id === order.id) {
        setSelectedOrder({ ...order, status: newStatus, trackingNumber: data?.trackingNumber })
      }
      setTrackingNumber('')
      setCourier(COURIERS[0])
    } else {
      setApiError(result.error || 'Failed to update order')
    }
    setActionLoading(false)
  }

  const filters: FilterType[] = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-MY', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-500/20 text-green-400'
      case 'shipped':
        return 'bg-purple-500/20 text-purple-400'
      case 'processing':
        return 'bg-blue-500/20 text-blue-400'
      case 'confirmed':
        return 'bg-teal-500/20 text-teal-400'
      case 'cancelled':
        return 'bg-red-500/20 text-red-400'
      case 'refunded':
        return 'bg-gray-500/20 text-gray-400'
      default:
        return 'bg-yellow-500/20 text-yellow-400'
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-2xl">🏀</span>
            <div>
              <h1 className="text-xl font-bold">{config.businessName} Admin</h1>
              <p className="text-gray-500 text-sm">Order Management</p>
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
          <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/30">
            <div className="text-purple-400 text-sm mb-1">Shipped</div>
            <div className="text-2xl font-bold text-purple-400">{stats.shipped}</div>
          </div>
          <div className="bg-cbl-orange/10 rounded-xl p-4 border border-cbl-orange/30">
            <div className="text-cbl-orange text-sm mb-1">Today's Revenue</div>
            <div className="text-2xl font-bold text-cbl-orange">{formatMYR(stats.todayRevenue)}</div>
          </div>
        </div>

        {/* API Error */}
        {apiError && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-red-400">{apiError}</span>
              <button onClick={() => setApiError('')} className="text-red-400 hover:text-red-300">
                <XIcon />
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f
                  ? 'bg-cbl-orange text-white'
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

        {/* Orders Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Order List */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-300 mb-3">
              Orders ({filteredOrders.length})
            </h3>

            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-gray-700 border-t-cbl-orange rounded-full animate-spin mx-auto mb-2" />
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
                        ? 'bg-cbl-orange/20 border-cbl-orange'
                        : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-mono text-sm font-medium">{order.id}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{order.customer.name}</span>
                      <span className="font-mono text-cbl-orange">{formatMYR(order.total)}</span>
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''} • {formatDate(order.createdAt)}
                    </div>
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
                  <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-white">
                    <XIcon />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xl">{selectedOrder.id}</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(selectedOrder.status)}`}>
                      {selectedOrder.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="border-t border-gray-700 pt-4">
                    <div className="text-gray-500 text-sm mb-2">Items</div>
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between py-2 text-sm border-b border-gray-700/50 last:border-0">
                        <span className="text-white">
                          {item.productName} ({item.size}) x{item.quantity}
                        </span>
                        <span className="text-gray-400">{formatMYR(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 font-medium">
                      <span>Total</span>
                      <span className="text-cbl-orange">{formatMYR(selectedOrder.total)}</span>
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="border-t border-gray-700 pt-4">
                    <div className="text-gray-500 text-sm mb-2">Customer</div>
                    <div className="space-y-1 text-sm">
                      <div className="text-white font-medium">{selectedOrder.customer.name}</div>
                      <div className="text-gray-400">{selectedOrder.customer.phone}</div>
                      <div className="text-gray-400">{selectedOrder.customer.email}</div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="border-t border-gray-700 pt-4">
                    <div className="text-gray-500 text-sm mb-2">Shipping Address</div>
                    <div className="text-sm text-gray-300">
                      {selectedOrder.customer.address.line1}
                      {selectedOrder.customer.address.line2 && <>, {selectedOrder.customer.address.line2}</>}
                      <br />
                      {selectedOrder.customer.address.postcode} {selectedOrder.customer.address.city}
                      <br />
                      {selectedOrder.customer.address.state}
                    </div>
                  </div>

                  {/* Tracking */}
                  {selectedOrder.trackingNumber && (
                    <div className="border-t border-gray-700 pt-4">
                      <div className="text-gray-500 text-sm mb-2">Tracking Number</div>
                      <div className="flex items-center gap-2">
                        <TruckIcon className="text-purple-400" />
                        <span className="text-purple-400 font-mono">{selectedOrder.trackingNumber}</span>
                      </div>
                    </div>
                  )}

                  {/* Payment Ref */}
                  {selectedOrder.paymentRef && (
                    <div className="border-t border-gray-700 pt-4">
                      <div className="text-gray-500 text-sm mb-2">Payment Reference</div>
                      <div className="text-white font-mono">{selectedOrder.paymentRef}</div>
                    </div>
                  )}

                  <div className="text-gray-500 text-xs">
                    Created: {formatDate(selectedOrder.createdAt)}
                  </div>

                  {/* Actions based on current status */}
                  {selectedOrder.status === 'pending' && (
                    <div className="border-t border-gray-700 pt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleStatusUpdate(selectedOrder, 'confirmed')}
                          disabled={actionLoading}
                          className="py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-medium transition-colors disabled:opacity-50"
                        >
                          Confirm Payment
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(selectedOrder, 'cancelled')}
                          disabled={actionLoading}
                          className="py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedOrder.status === 'confirmed' && (
                    <div className="border-t border-gray-700 pt-4">
                      <button
                        onClick={() => handleStatusUpdate(selectedOrder, 'processing')}
                        disabled={actionLoading}
                        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-50"
                      >
                        Mark as Processing
                      </button>
                    </div>
                  )}

                  {selectedOrder.status === 'processing' && (
                    <div className="border-t border-gray-700 pt-4 space-y-3">
                      <div className="text-gray-400 text-sm">Ship with tracking:</div>
                      <div className="space-y-2">
                        <select
                          value={courier}
                          onChange={(e) => setCourier(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-cbl-orange focus:outline-none"
                        >
                          {COURIERS.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            placeholder="Tracking number..."
                            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:border-cbl-orange focus:outline-none"
                          />
                          <button
                            onClick={() => handleStatusUpdate(selectedOrder, 'shipped', { trackingNumber, courier })}
                            disabled={actionLoading || !trackingNumber.trim()}
                            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors disabled:opacity-50"
                          >
                            Ship
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedOrder.status === 'shipped' && (
                    <div className="border-t border-gray-700 pt-4">
                      <button
                        onClick={() => handleStatusUpdate(selectedOrder, 'delivered')}
                        disabled={actionLoading}
                        className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-medium transition-colors disabled:opacity-50"
                      >
                        Mark as Delivered
                      </button>
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
