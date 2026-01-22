import { useState, useEffect, useMemo } from 'react'
import type { ProductInventory, StockFilter, InventorySummary } from '../../../types/admin'
import { formatMYR } from '../../../lib/utils'
import { inventoryApi } from '../../../lib/api'
import { RefreshIcon, XIcon } from '../../icons'

export function InventoryTab() {
  const [products, setProducts] = useState<ProductInventory[]>([])
  const [summary, setSummary] = useState<InventorySummary>({ total_value: 0, low_stock_count: 0, out_of_stock_count: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<StockFilter>('all')
  const [editingItem, setEditingItem] = useState<{ productId: string; sizeId: string } | null>(null)
  const [editQuantity, setEditQuantity] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const loadInventory = async () => {
    setLoading(true)
    setError('')
    const result = await inventoryApi.getAll()
    if (result.success && result.data) {
      setProducts(result.data.products)
      setSummary(result.data.summary)
    } else {
      setError(result.error || 'Failed to load inventory')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadInventory()
  }, [])

  const filteredProducts = useMemo(() => {
    if (filter === 'all') return products
    return products.map(p => ({
      ...p,
      inventory: p.inventory.filter(inv => {
        if (filter === 'out_of_stock') return inv.is_out_of_stock
        if (filter === 'low_stock') return inv.is_low_stock && !inv.is_out_of_stock
        return true
      })
    })).filter(p => p.inventory.length > 0)
  }, [products, filter])

  const handleEditStart = (productId: string, sizeId: string, currentQuantity: number) => {
    setEditingItem({ productId, sizeId })
    setEditQuantity(String(currentQuantity))
  }

  const handleEditCancel = () => {
    setEditingItem(null)
    setEditQuantity('')
  }

  const handleEditSave = async () => {
    if (!editingItem) return
    const quantity = parseInt(editQuantity)
    if (isNaN(quantity) || quantity < 0) {
      setError('Please enter a valid quantity')
      return
    }

    setActionLoading(true)
    setError('')
    const result = await inventoryApi.updateStock({
      product_id: editingItem.productId,
      size_id: editingItem.sizeId,
      quantity,
      update_type: 'set',
      notes: 'Admin manual update',
    })

    if (result.success) {
      await loadInventory()
      handleEditCancel()
    } else {
      setError(result.error || 'Failed to update stock')
    }
    setActionLoading(false)
  }

  const handleQuickRestock = async (productId: string, sizeId: string, amount: number) => {
    setActionLoading(true)
    setError('')
    const result = await inventoryApi.updateStock({
      product_id: productId,
      size_id: sizeId,
      quantity: amount,
      update_type: 'add',
      notes: `Quick restock +${amount}`,
    })

    if (result.success) {
      await loadInventory()
    } else {
      setError(result.error || 'Failed to restock')
    }
    setActionLoading(false)
  }

  const getStockStyle = (inv: { is_out_of_stock: boolean; is_low_stock: boolean }) => {
    if (inv.is_out_of_stock) return 'bg-red-500/20 text-red-400 border-red-500/50'
    if (inv.is_low_stock) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
    return 'bg-green-500/20 text-green-400 border-green-500/50'
  }

  const getStockIndicator = (inv: { is_out_of_stock: boolean; is_low_stock: boolean }) => {
    if (inv.is_out_of_stock) return '🔴'
    if (inv.is_low_stock) return '🟡'
    return '🟢'
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Inventory Value</div>
          <div className="text-2xl font-bold text-cbl-orange">{formatMYR(summary.total_value)}</div>
          <div className="text-gray-500 text-xs mt-1">Based on cost price</div>
        </div>
        <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/30">
          <div className="text-yellow-400 text-sm mb-1">Low Stock Items</div>
          <div className="text-2xl font-bold text-yellow-400">{summary.low_stock_count}</div>
          <div className="text-gray-500 text-xs mt-1">Below threshold</div>
        </div>
        <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
          <div className="text-red-400 text-sm mb-1">Out of Stock</div>
          <div className="text-2xl font-bold text-red-400">{summary.out_of_stock_count}</div>
          <div className="text-gray-500 text-xs mt-1">Needs restocking</div>
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

      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['all', 'low_stock', 'out_of_stock'] as StockFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-cbl-orange text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {f === 'all' ? 'All' : f === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
            </button>
          ))}
        </div>
        <button
          onClick={loadInventory}
          disabled={loading}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshIcon />
        </button>
      </div>

      {/* Product List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-gray-700 border-t-cbl-orange rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-500">Loading inventory...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
          <div className="text-4xl mb-3">📦</div>
          <p className="text-gray-500">No inventory items found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
              {/* Product Header */}
              <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">{product.name}</h3>
                  <div className="text-sm text-gray-400 mt-0.5">
                    Price: {formatMYR(product.base_price)} | Cost: {formatMYR(product.cost_price)}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {product.inventory.length} size{product.inventory.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Size Grid */}
              <div className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {product.inventory.map(inv => (
                    <div
                      key={inv.size_id}
                      className={`rounded-lg border p-3 ${getStockStyle(inv)}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Size {inv.size_id}</span>
                        <span>{getStockIndicator(inv)}</span>
                      </div>

                      {editingItem?.productId === product.id && editingItem?.sizeId === inv.size_id ? (
                        <div className="space-y-2">
                          <input
                            type="number"
                            value={editQuantity}
                            onChange={e => setEditQuantity(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                            min="0"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleEditSave}
                              disabled={actionLoading}
                              className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-500 rounded text-xs text-white disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleEditCancel}
                              className="flex-1 px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs text-white"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="text-2xl font-bold mb-1">{inv.quantity}</div>
                          <div className="text-xs opacity-75 mb-2">
                            {inv.reserved > 0 && <span>({inv.reserved} reserved) </span>}
                            Avail: {inv.available}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditStart(product.id, inv.size_id, inv.quantity)}
                              className="flex-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleQuickRestock(product.id, inv.size_id, 10)}
                              disabled={actionLoading}
                              className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white disabled:opacity-50"
                            >
                              +10
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
