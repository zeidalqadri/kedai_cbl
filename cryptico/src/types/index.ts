// Crypto Asset Types
export interface CryptoAsset {
  name: string
  symbol: string
  icon: string
  color: string
  coingeckoId: string
  networks: NetworkType[]
}

export type CryptoSymbol = 'USDT' | 'USDC' | 'BTC' | 'ETH' | 'SOL' | 'ICP'

// Network Types
export interface Network {
  name: string
  icon: string
  addressPrefix: string | string[]
  addressLength: number | [number, number] // single length or [min, max] range
  explorer: string
  confirmations: string
}

export type NetworkType = 'TRC-20' | 'ERC-20' | 'BTC' | 'ETH' | 'SOL' | 'ICP'

// Order Types
export type OrderStatus = 'pending' | 'approved' | 'completed' | 'rejected'

export interface Customer {
  name: string
  contactType: 'telegram' | 'email'
  contact: string
  walletAddress: string
}

export interface Order {
  id: string
  crypto: CryptoSymbol
  network: NetworkType
  amountMYR: number
  amountCrypto: number
  networkFee: number
  rate: number
  customer: Customer
  paymentRef: string
  hasProofImage: boolean
  status: OrderStatus
  txHash?: string
  createdAt: number
  updatedAt: number
}

// User Details Form State
export interface UserDetails {
  name: string
  contactType: 'telegram' | 'email'
  contact: string
  walletAddress: string
}

// Kiosk Screen Types
export type KioskScreen =
  | 'welcome'
  | 'network'
  | 'amount'
  | 'details'
  | 'payment'
  | 'confirm'
  | 'processing'
  | 'lookup'

// Price Map Type
export type PriceMap = Partial<Record<CryptoSymbol, number>>

// Validation Result
export interface ValidationResult {
  valid: boolean
  error?: string
}

// Telegram Response
export interface TelegramResponse {
  ok: boolean
  demo?: boolean
  error?: unknown
}
