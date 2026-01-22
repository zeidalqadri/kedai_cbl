import { useState, useEffect } from 'react'
import type { PnLData, OrderStats, DailyBreakdown, DatePreset } from '../../../types/admin'
import { formatMYR } from '../../../lib/utils'
import { reportsApi } from '../../../lib/api'
import { RefreshIcon, XIcon } from '../../icons'

function getDateRange(preset: DatePreset): { from: string; to: string } {
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  switch (preset) {
    case 'today':
      return { from: today, to: today }
    case '7days': {
      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
      return { from: sevenDaysAgo.toISOString().split('T')[0], to: today }
    }
    case '30days': {
      const thirtyDaysAgo = new Date(now)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
      return { from: thirtyDaysAgo.toISOString().split('T')[0], to: today }
    }
    case 'this_month': {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      return { from: firstOfMonth.toISOString().split('T')[0], to: today }
    }
    default:
      return { from: today, to: today }
  }
}

export function ReportsTab() {
  const [preset, setPreset] = useState<DatePreset>('30days')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [pnl, setPnL] = useState<PnLData | null>(null)
  const [orders, setOrders] = useState<OrderStats | null>(null)
  const [daily, setDaily] = useState<DailyBreakdown[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReport = async (fromDate?: string, toDate?: string) => {
    setLoading(true)
    setError('')

    let from = fromDate
    let to = toDate

    if (preset !== 'custom') {
      const range = getDateRange(preset)
      from = range.from
      to = range.to
    } else {
      from = customFrom
      to = customTo
    }

    const result = await reportsApi.getPnL(from, to)
    if (result.success && result.data) {
      setPnL(result.data.pnl)
      setOrders(result.data.orders)
      setDaily(result.data.daily_breakdown)
    } else {
      setError(result.error || 'Failed to load report')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadReport()
  }, [preset])

  const handleApplyCustom = () => {
    if (!customFrom || !customTo) {
      setError('Please select both start and end dates')
      return
    }
    loadReport(customFrom, customTo)
  }

  const presets: { value: DatePreset; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: '7days', label: '7 Days' },
    { value: '30days', label: '30 Days' },
    { value: 'this_month', label: 'This Month' },
    { value: 'custom', label: 'Custom' },
  ]

  const formatPercent = (value: number) => `${value.toFixed(1)}%`

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-gray-400 text-sm">Date Range:</div>
          <div className="flex gap-2">
            {presets.map(p => (
              <button
                key={p.value}
                onClick={() => setPreset(p.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  preset === p.value
                    ? 'bg-cbl-orange text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {preset === 'custom' && (
            <div className="flex items-center gap-2 ml-4">
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:border-cbl-orange focus:outline-none"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:border-cbl-orange focus:outline-none"
              />
              <button
                onClick={handleApplyCustom}
                className="px-4 py-1.5 rounded-lg bg-cbl-orange hover:bg-cbl-orange/90 text-white text-sm font-medium transition-colors"
              >
                Apply
              </button>
            </div>
          )}

          <button
            onClick={() => loadReport()}
            disabled={loading}
            className="ml-auto p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshIcon />
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-red-400">{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">
              <XIcon />
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-gray-700 border-t-cbl-orange rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-500">Loading report...</p>
        </div>
      ) : pnl && orders ? (
        <>
          {/* P&L Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="text-gray-400 text-sm mb-1">Gross Revenue</div>
              <div className="text-2xl font-bold text-white">{formatMYR(pnl.gross_revenue)}</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="text-gray-400 text-sm mb-1">COGS</div>
              <div className="text-2xl font-bold text-red-400">-{formatMYR(pnl.total_cogs)}</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="text-gray-400 text-sm mb-1">Shipping Costs</div>
              <div className="text-2xl font-bold text-red-400">-{formatMYR(pnl.shipping_costs)}</div>
            </div>
            <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
              <div className="text-green-400 text-sm mb-1">Gross Profit</div>
              <div className="text-2xl font-bold text-green-400">{formatMYR(pnl.gross_profit)}</div>
              <div className="text-green-400/70 text-sm mt-0.5">
                Margin: {formatPercent(pnl.profit_margin)}
              </div>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="text-gray-400 text-sm mb-1">Average Order Value</div>
              <div className="text-xl font-bold text-cbl-orange">{formatMYR(pnl.avg_order_value)}</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="text-gray-400 text-sm mb-1">Completed Orders</div>
              <div className="text-xl font-bold text-white">{orders.completed}</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="text-gray-400 text-sm mb-1">Total Orders</div>
              <div className="text-xl font-bold text-white">{orders.total}</div>
            </div>
          </div>

          {/* Order Status Breakdown */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-5">
            <h3 className="text-lg font-medium text-white mb-4">Order Status Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <div>
                  <div className="text-white font-medium">{orders.delivered}</div>
                  <div className="text-gray-500 text-sm">Delivered</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <div>
                  <div className="text-white font-medium">{orders.shipped}</div>
                  <div className="text-gray-500 text-sm">Shipped</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <div>
                  <div className="text-white font-medium">{orders.processing}</div>
                  <div className="text-gray-500 text-sm">Processing</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-teal-500" />
                <div>
                  <div className="text-white font-medium">{orders.confirmed}</div>
                  <div className="text-gray-500 text-sm">Confirmed</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div>
                  <div className="text-white font-medium">{orders.pending}</div>
                  <div className="text-gray-500 text-sm">Pending</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div>
                  <div className="text-white font-medium">{orders.cancelled}</div>
                  <div className="text-gray-500 text-sm">Cancelled</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gray-500" />
                <div>
                  <div className="text-white font-medium">{orders.refunded}</div>
                  <div className="text-gray-500 text-sm">Refunded</div>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Breakdown Table */}
          {daily.length > 0 && (
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-700">
                <h3 className="text-lg font-medium text-white">Daily Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-900/50 text-gray-400 text-sm">
                      <th className="text-left px-5 py-3 font-medium">Date</th>
                      <th className="text-right px-5 py-3 font-medium">Orders</th>
                      <th className="text-right px-5 py-3 font-medium">Revenue</th>
                      <th className="text-right px-5 py-3 font-medium">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {daily.slice(0, 14).map(d => (
                      <tr key={d.date} className="border-t border-gray-700/50 hover:bg-gray-700/30">
                        <td className="px-5 py-3 text-gray-300">
                          {new Date(d.date).toLocaleDateString('en-MY', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </td>
                        <td className="px-5 py-3 text-right text-white">{d.orders}</td>
                        <td className="px-5 py-3 text-right text-white font-mono">{formatMYR(d.revenue)}</td>
                        <td className="px-5 py-3 text-right text-green-400 font-mono">{formatMYR(d.profit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-gray-500">No data available for the selected period</p>
        </div>
      )}
    </div>
  )
}
