import { Router } from 'express'
import { prisma } from '../lib/db.js'

const router = Router()

// CoinGecko ID mappings
const COINGECKO_IDS: Record<string, string> = {
  USDT: 'tether',
  USDC: 'usd-coin',
  BNB: 'binancecoin',
  MATIC: 'matic-network',
}

// Fallback prices (when API fails)
const FALLBACK_PRICES: Record<string, number> = {
  USDT: 4.7,
  USDC: 4.7,
  BNB: 2800,
  MATIC: 3.5,
}

// Cache prices for 30 seconds
let priceCache: { prices: Record<string, number>; timestamp: number } | null = null
const CACHE_TTL = 30 * 1000

async function fetchPricesFromCoinGecko(): Promise<Record<string, number>> {
  const ids = Object.values(COINGECKO_IDS).join(',')
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=myr`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`)
  }

  const data = (await response.json()) as Record<string, { myr: number }>

  const prices: Record<string, number> = {}
  for (const [symbol, geckoId] of Object.entries(COINGECKO_IDS)) {
    prices[symbol] = data[geckoId]?.myr || FALLBACK_PRICES[symbol]
  }

  return prices
}

async function getPrices(): Promise<Record<string, number>> {
  const now = Date.now()

  // Return cached prices if fresh
  if (priceCache && now - priceCache.timestamp < CACHE_TTL) {
    return priceCache.prices
  }

  try {
    const prices = await fetchPricesFromCoinGecko()
    priceCache = { prices, timestamp: now }
    return prices
  } catch (error) {
    console.error('Failed to fetch prices:', error)

    // Return stale cache if available
    if (priceCache) {
      return priceCache.prices
    }

    // Return fallback prices
    return FALLBACK_PRICES
  }
}

// Get current prices
router.get(
  '/',
  async (_req, res, next) => {
    try {
      const prices = await getPrices()

      // Get rate markup from settings
      const settings = await prisma.settings.findUnique({
        where: { id: 'default' },
        select: { rateMarkup: true },
      })

      const markup = settings?.rateMarkup || 3

      // Apply markup to prices
      const adjustedPrices: Record<string, number> = {}
      for (const [symbol, price] of Object.entries(prices)) {
        adjustedPrices[symbol] = price * (1 + markup / 100)
      }

      res.json({
        success: true,
        data: {
          prices: adjustedPrices,
          basePrices: prices,
          markup,
          updatedAt: new Date().toISOString(),
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
