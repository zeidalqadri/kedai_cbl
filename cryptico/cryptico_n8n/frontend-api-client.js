// ============================================================================
// CRYPTICO ATM - FRONTEND API CLIENT
// This replaces the browser-based storage with n8n backend calls
// ============================================================================

const API_CONFIG = {
  // Base URL for your n8n webhooks
  baseUrl: process.env.REACT_APP_API_URL || 'https://your-n8n.com/webhook',
  
  // API key for authenticated requests
  apiKey: process.env.REACT_APP_API_KEY || '',
  
  // Admin API key (only used in admin dashboard)
  adminKey: process.env.REACT_APP_ADMIN_KEY || '',
  
  // Timeout for requests (ms)
  timeout: 30000,
};

// ============================================================================
// API CLIENT
// ============================================================================

class CrypticoAPI {
  constructor(config = API_CONFIG) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.adminKey = config.adminKey;
    this.timeout = config.timeout;
  }

  // Base request method
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add API key if provided
    if (this.apiKey && !options.skipAuth) {
      headers['X-API-Key'] = this.apiKey;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new APIError(
          data.message || 'Request failed',
          data.error_code || 'UNKNOWN_ERROR',
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new APIError('Request timeout', 'TIMEOUT', 408);
      }
      
      if (error instanceof APIError) {
        throw error;
      }
      
      throw new APIError(
        error.message || 'Network error',
        'NETWORK_ERROR',
        0
      );
    }
  }

  // ========== PUBLIC ENDPOINTS ==========

  // Get current crypto prices
  async getPrices() {
    // Prices can be fetched directly from Supabase for lower latency
    // Or through a dedicated n8n endpoint if you create one
    const response = await fetch(
      `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/crypto_prices?select=symbol,rate_with_markup,updated_at`,
      {
        headers: {
          'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
        },
      }
    );
    
    const data = await response.json();
    
    // Transform to the format the frontend expects
    const prices = {};
    data.forEach(item => {
      prices[item.symbol] = item.rate_with_markup;
    });
    
    return prices;
  }

  // Submit a new order
  async submitOrder(orderData) {
    return this.request('/order/submit', {
      method: 'POST',
      body: JSON.stringify({
        crypto: orderData.crypto,
        network: orderData.network,
        amountMYR: orderData.amountMYR,
        customerName: orderData.customer.name,
        contactType: orderData.customer.contactType,
        contact: orderData.customer.contact,
        walletAddress: orderData.customer.walletAddress,
        rateLockTimestamp: orderData.rateLockTimestamp,
        paymentRef: orderData.paymentRef || null,
        proofImageBase64: orderData.proofImage || null,
        kioskId: orderData.kioskId || 'default',
      }),
    });
  }

  // Lookup order status (public - no auth required)
  async lookupOrder(orderId) {
    return this.request(`/order/lookup/${orderId}`, {
      method: 'GET',
      skipAuth: true,
    });
  }

  // ========== ADMIN ENDPOINTS ==========

  // Update order status (admin only)
  async updateOrderStatus(orderId, action, txHash = null, note = null) {
    return this.request('/order/status', {
      method: 'POST',
      headers: {
        'X-Admin-Key': this.adminKey,
      },
      body: JSON.stringify({
        orderId,
        action,
        txHash,
        note,
      }),
    });
  }

  // Approve order (convenience method)
  async approveOrder(orderId, note = null) {
    return this.updateOrderStatus(orderId, 'approve', null, note);
  }

  // Reject order (convenience method)
  async rejectOrder(orderId, note = null) {
    return this.updateOrderStatus(orderId, 'reject', null, note);
  }

  // Complete order (convenience method)
  async completeOrder(orderId, txHash, note = null) {
    return this.updateOrderStatus(orderId, 'complete', txHash, note);
  }

  // Cancel order (convenience method)
  async cancelOrder(orderId, note = null) {
    return this.updateOrderStatus(orderId, 'cancel', null, note);
  }

  // Get orders list (admin only)
  async getOrders(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.crypto) params.append('crypto', filters.crypto);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.kioskId) params.append('kioskId', filters.kioskId);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    const endpoint = `/admin/orders${queryString ? '?' + queryString : ''}`;

    return this.request(endpoint, {
      method: 'GET',
      headers: {
        'X-Admin-Key': this.adminKey,
      },
    });
  }

  // Get dashboard stats (admin only)
  async getStats() {
    return this.request('/admin/stats', {
      method: 'GET',
      headers: {
        'X-Admin-Key': this.adminKey,
      },
    });
  }
}

// ============================================================================
// CUSTOM ERROR CLASS
// ============================================================================

class APIError extends Error {
  constructor(message, code, status, data = null) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.status = status;
    this.data = data;
  }

  isValidation() {
    return this.code === 'VALIDATION_ERROR';
  }

  isUnauthorized() {
    return this.code === 'UNAUTHORIZED' || this.status === 401;
  }

  isNotFound() {
    return this.code === 'NOT_FOUND' || this.status === 404;
  }

  isConflict() {
    return this.status === 409;
  }

  isRateLockExpired() {
    return this.code === 'RATE_LOCK_EXPIRED';
  }
}

// ============================================================================
// REACT HOOKS
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

// Create singleton API instance
const api = new CrypticoAPI();

// Hook for fetching prices with auto-refresh
export function usePrices(refreshInterval = 30000) {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrices = useCallback(async () => {
    try {
      const data = await api.getPrices();
      setPrices(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      // Keep existing prices on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchPrices, refreshInterval]);

  return { prices, loading, error, refresh: fetchPrices };
}

// Hook for order submission
export function useSubmitOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const submitOrder = useCallback(async (orderData) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.submitOrder(orderData);
      setResult(response);
      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setResult(null);
  }, []);

  return { submitOrder, loading, error, result, reset };
}

// Hook for order lookup
export function useOrderLookup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);

  const lookupOrder = useCallback(async (orderId) => {
    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const response = await api.lookupOrder(orderId);
      setOrder(response.order);
      return response.order;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { lookupOrder, loading, error, order };
}

// Hook for admin orders (with pagination)
export function useAdminOrders(initialFilters = {}) {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async (newFilters = null) => {
    setLoading(true);
    setError(null);

    const activeFilters = newFilters || filters;
    if (newFilters) setFilters(newFilters);

    try {
      const response = await api.getOrders(activeFilters);
      setOrders(response.orders);
      setPagination(response.pagination);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const nextPage = useCallback(() => {
    if (pagination?.hasMore) {
      fetchOrders({
        ...filters,
        offset: (filters.offset || 0) + (filters.limit || 50),
      });
    }
  }, [pagination, filters, fetchOrders]);

  const prevPage = useCallback(() => {
    if ((filters.offset || 0) > 0) {
      fetchOrders({
        ...filters,
        offset: Math.max(0, (filters.offset || 0) - (filters.limit || 50)),
      });
    }
  }, [filters, fetchOrders]);

  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    orders,
    pagination,
    filters,
    loading,
    error,
    refresh: fetchOrders,
    setFilters: (newFilters) => fetchOrders(newFilters),
    nextPage,
    prevPage,
  };
}

// Hook for admin stats
export function useAdminStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.getStats();
      setStats(response.stats);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refresh: fetchStats };
}

// Hook for admin actions
export function useAdminActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const executeAction = useCallback(async (action, orderId, params = {}) => {
    setLoading(true);
    setError(null);

    try {
      let response;
      switch (action) {
        case 'approve':
          response = await api.approveOrder(orderId, params.note);
          break;
        case 'reject':
          response = await api.rejectOrder(orderId, params.note);
          break;
        case 'complete':
          response = await api.completeOrder(orderId, params.txHash, params.note);
          break;
        case 'cancel':
          response = await api.cancelOrder(orderId, params.note);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    approve: (orderId, note) => executeAction('approve', orderId, { note }),
    reject: (orderId, note) => executeAction('reject', orderId, { note }),
    complete: (orderId, txHash, note) => executeAction('complete', orderId, { txHash, note }),
    cancel: (orderId, note) => executeAction('cancel', orderId, { note }),
    loading,
    error,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export { CrypticoAPI, APIError, api as default };

// ============================================================================
// USAGE EXAMPLE IN REACT COMPONENT
// ============================================================================

/*
import { usePrices, useSubmitOrder, useOrderLookup } from './api-client';

function KioskMode() {
  const { prices, loading: pricesLoading } = usePrices();
  const { submitOrder, loading: submitting, error } = useSubmitOrder();
  
  const handleSubmit = async (orderData) => {
    try {
      const result = await submitOrder({
        crypto: 'USDT',
        network: 'TRC-20',
        amountMYR: 500,
        customer: {
          name: 'Test User',
          contactType: 'telegram',
          contact: '@test',
          walletAddress: 'T...',
        },
        rateLockTimestamp: Date.now(),
        paymentRef: '12345',
      });
      
      console.log('Order created:', result.orderId);
      // Navigate to confirmation screen
    } catch (err) {
      if (err.isRateLockExpired()) {
        // Handle rate lock expiry
      }
      console.error('Submit failed:', err.message);
    }
  };
  
  // ... rest of component
}

function AdminDashboard() {
  const { orders, pagination, loading, setFilters, nextPage } = useAdminOrders();
  const { stats } = useAdminStats();
  const { approve, reject, complete } = useAdminActions();
  
  const handleApprove = async (orderId) => {
    try {
      await approve(orderId);
      // Refresh orders list
    } catch (err) {
      console.error('Approve failed:', err.message);
    }
  };
  
  // ... rest of component
}
*/
