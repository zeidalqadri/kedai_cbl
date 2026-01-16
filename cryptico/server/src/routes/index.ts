import { Router } from 'express'
import ordersRouter from './orders.js'
import authRouter from './auth.js'
import settingsRouter from './settings.js'
import pricesRouter from './prices.js'

const router = Router()

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Mount route modules
router.use('/orders', ordersRouter)
router.use('/auth', authRouter)
router.use('/settings', settingsRouter)
router.use('/prices', pricesRouter)

export default router
