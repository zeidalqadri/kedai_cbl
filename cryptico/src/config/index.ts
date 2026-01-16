import type { NetworkType } from '../types'

// Environment-based configuration
// All sensitive values come from environment variables

// Use /api proxy in both dev (Vite) and production (Cloudflare Pages Function)
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  return '/api'
}

export const config = {
  // API Configuration (n8n webhooks)
  apiUrl: getApiUrl(),
  apiKey: import.meta.env.VITE_API_KEY || '77768a4aa5da6d70a1cd5e5adc7e28ef59858a320b1a0b5133fc5f1ad5c5165d',
  adminApiKey: import.meta.env.VITE_ADMIN_API_KEY || '7749a10b62c81a4c9b8f429b80fc9b797997506345a26ca802857b7049c5165d',

  // Telegram Bot Setup (for client-side notifications - legacy)
  telegramBotToken: import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '',
  telegramChatId: import.meta.env.VITE_TELEGRAM_CHAT_ID || '',

  // Business Info
  businessName: import.meta.env.VITE_BUSINESS_NAME || 'CryptoKiosk',
  businessTagline: import.meta.env.VITE_BUSINESS_TAGLINE || 'Buy crypto instantly with DuitNow',
  supportTelegram: import.meta.env.VITE_SUPPORT_TELEGRAM || '@cryptokiosk_support',
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'support@cryptokiosk.my',

  // DuitNow QR Code (base64 or URL)
  duitNowQrImage: import.meta.env.VITE_DUITNOW_QR_IMAGE || null,

  // Transaction Limits (MYR)
  minAmount: Number(import.meta.env.VITE_MIN_AMOUNT) || 50,
  maxAmount: Number(import.meta.env.VITE_MAX_AMOUNT) || 10000,

  // Network Fees (MYR)
  networkFees: {
    'TRC-20': 1.0,
    'ERC-20': 15.0,
    BTC: 10.0,
    ETH: 15.0,
    SOL: 0.5,
    ICP: 1.0,
  } as Record<NetworkType, number>,

  // Rate markup (percentage added to market rate)
  rateMarkup: Number(import.meta.env.VITE_RATE_MARKUP) || 0.02,

  // Rate lock duration (seconds)
  rateLockDuration: Number(import.meta.env.VITE_RATE_LOCK_DURATION) || 300,

  // Admin password (in production, use proper auth backend)
  adminPassword: import.meta.env.VITE_ADMIN_PASSWORD || 'admin123',
} as const

// Type for the config object
export type Config = typeof config

// Helper to check if Telegram is configured
export const isTelegramConfigured = (): boolean => {
  return (
    config.telegramBotToken !== '' &&
    config.telegramBotToken !== 'your_bot_token_here' &&
    config.telegramChatId !== ''
  )
}

// Helper to check if API is configured
export const isApiConfigured = (): boolean => {
  return config.apiUrl !== '' && config.apiKey !== ''
}
