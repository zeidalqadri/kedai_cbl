import { useState } from 'react'
import { config } from '../../config'
import { formatMYR } from '../../lib/utils'
import type { AdminTab } from '../../types/admin'
import { OrdersTab, InventoryTab, ReportsTab } from './tabs'

interface AdminDashboardProps {
  onExit: () => void
}

interface Stats {
  total: number
  pending: number
  shipped: number
  todayRevenue: number
}

export function AdminDashboard({ onExit }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('orders')
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    shipped: 0,
    todayRevenue: 0,
  })

  const tabs: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'orders', label: 'Orders', icon: '📦' },
    { id: 'inventory', label: 'Inventory', icon: '📊' },
    { id: 'reports', label: 'Reports', icon: '📈' },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-2xl">🏀</span>
            <div>
              <h1 className="text-xl font-bold">{config.businessName} Admin</h1>
              <p className="text-gray-500 text-sm">Dashboard</p>
            </div>
          </div>
          <button
            onClick={onExit}
            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-sm"
          >
            Exit Admin
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Stats Row - Only show on Orders tab */}
        {activeTab === 'orders' && (
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
        )}

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-gray-800/50 rounded-xl p-1 border border-gray-700">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-cbl-orange text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === 'orders' && stats.pending > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-yellow-500 text-black text-xs rounded-full">
                  {stats.pending}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'orders' && <OrdersTab onStatsUpdate={setStats} />}
        {activeTab === 'inventory' && <InventoryTab />}
        {activeTab === 'reports' && <ReportsTab />}
      </div>
    </div>
  )
}
