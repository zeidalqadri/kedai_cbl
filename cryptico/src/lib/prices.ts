import type { CryptoSymbol, PriceMap } from '../types'
import { CRYPTO_ASSETS } from './constants'
import { config } from '../config'

const COINGECKO_API = 'https://api.coingecko.com/api/v3'

// Fallback prices (MYR) - used when API fails
const FALLBACK_PRICES: PriceMap = {
  USDT: 4.55,
  USDC: 4.55,
  BNB: 2850,
  MATIC: 2.2,
}

// Fetch current prices from CoinGecko
export async function fetchPrices(): Promise<PriceMap> {
  try {
    const ids = Object.values(CRYPTO_ASSETS)
      .map((a) => a.coingeckoId)
      .join(',')

    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=myr`
    )

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()

    const prices: PriceMap = {}
    for (const [symbol, asset] of Object.entries(CRYPTO_ASSETS)) {
      const price = data[asset.coingeckoId]?.myr
      if (price) {
        // Apply markup
        prices[symbol as CryptoSymbol] = price * (1 + config.rateMarkup)
      }
    }

    return prices
  } catch (error) {
    console.warn('Price fetch failed, using fallback rates:', error)
    // Return fallback prices with markup applied
    const prices: PriceMap = {}
    for (const [symbol, price] of Object.entries(FALLBACK_PRICES)) {
      if (price !== undefined) {
        prices[symbol as CryptoSymbol] = price * (1 + config.rateMarkup)
      }
    }
    return prices
  }
}

// Calculate crypto amount from MYR
export function calculateCryptoAmount(
  amountMYR: number,
  networkFee: number,
  price: number
): number {
  const netAmount = amountMYR - networkFee
  if (netAmount <= 0 || price <= 0) return 0
  return netAmount / price
}

// Price refresh interval (ms)
export const PRICE_REFRESH_INTERVAL = 30000 // 30 seconds
