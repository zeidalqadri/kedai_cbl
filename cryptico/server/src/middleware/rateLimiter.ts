import rateLimit from 'express-rate-limit'
import Redis from 'ioredis'
import { config } from '../config.js'

let redisClient: Redis | null = null

export function initRedis(): Redis | null {
  if (!config.redisUrl) {
    console.warn('Redis URL not configured, using memory-based rate limiting')
    return null
  }

  try {
    redisClient = new Redis(config.redisUrl)
    redisClient.on('error', (err) => {
      console.error('Redis error:', err)
    })
    redisClient.on('connect', () => {
      console.log('✅ Redis connected')
    })
    return redisClient
  } catch (error) {
    console.error('Failed to connect to Redis:', error)
    return null
  }
}

function createLimiter(options: {
  windowMs: number
  max: number
  message: string
}) {
  // Using memory store for simplicity
  // For production with multiple instances, add Redis store
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: { success: false, error: options.message },
    standardHeaders: true,
    legacyHeaders: false,
  })
}

// General API rate limit: 100 requests per minute
export const apiLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later',
})

// Auth rate limit: 5 attempts per 15 minutes
export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later',
})

// Order creation limit: 10 orders per hour per IP
export const orderLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Order limit reached, please try again later',
})

export function closeRedis(): void {
  if (redisClient) {
    redisClient.disconnect()
    redisClient = null
  }
}

// Export redis client for other uses (e.g., session storage)
export function getRedisClient(): Redis | null {
  return redisClient
}
