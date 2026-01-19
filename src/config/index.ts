// Environment-based configuration for CBL Popshop
// All sensitive values come from environment variables

// Use /api proxy in both dev (Vite) and production (Cloudflare Pages Function)
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  return '/api'
}

export const config = {
  // API Configuration (n8n webhooks)
  apiUrl: getApiUrl(),
  apiKey: import.meta.env.VITE_API_KEY || '',
  adminApiKey: import.meta.env.VITE_ADMIN_API_KEY || '',

  // Business Info
  businessName: import.meta.env.VITE_BUSINESS_NAME || 'CBL Popshop',
  businessTagline: import.meta.env.VITE_BUSINESS_TAGLINE || 'Official CBL Merchandise',
  supportTelegram: import.meta.env.VITE_SUPPORT_TELEGRAM || '@cbl_support',
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'support@cbl.my',

  // DuitNow QR Code (base64 or URL)
  duitNowQrImage: import.meta.env.VITE_DUITNOW_QR_IMAGE || '/duitnow-qr.png',

  // Shipping Configuration
  freeShippingThreshold: Number(import.meta.env.VITE_FREE_SHIPPING_THRESHOLD) || 150,
  standardShippingFee: 15, // MYR

  // Admin password (in production, use proper auth backend)
  adminPassword: import.meta.env.VITE_ADMIN_PASSWORD || 'admin123',
} as const

// Type for the config object
export type Config = typeof config

// Helper to check if API is configured
export const isApiConfigured = (): boolean => {
  return config.apiUrl !== '' && config.apiKey !== ''
}
