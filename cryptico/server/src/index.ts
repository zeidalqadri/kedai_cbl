import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { config } from './config.js'
import { connectDatabase, disconnectDatabase } from './lib/db.js'
import { errorHandler, notFoundHandler, apiLimiter, initRedis, closeRedis } from './middleware/index.js'
import routes from './routes/index.js'
import { seedInitialAdmin } from './seed.js'

const app = express()

// Security middleware
app.use(helmet())
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}))

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1)

// Rate limiting
app.use('/api', apiLimiter)

// API routes
app.use('/api', routes)

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

// Graceful shutdown
async function shutdown(signal: string) {
  console.log(`\n${signal} received, shutting down gracefully...`)
  closeRedis()
  await disconnectDatabase()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

// Start server
async function main() {
  try {
    // Connect to database
    await connectDatabase()

    // Initialize Redis (optional)
    initRedis()

    // Seed initial admin if configured
    await seedInitialAdmin()

    // Start listening
    app.listen(config.port, () => {
      console.log(`
🚀 CryptoKiosk API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 URL:     http://localhost:${config.port}
🔧 Mode:    ${config.nodeEnv}
📊 Health:  http://localhost:${config.port}/api/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

main()
