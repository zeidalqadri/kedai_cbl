import { Router } from 'express'
import { prisma } from '../lib/db.js'
import { requireAuth } from '../middleware/index.js'

const router = Router()

// Get public settings (for kiosk)
router.get(
  '/public',
  async (_req, res, next) => {
    try {
      let settings = await prisma.settings.findUnique({
        where: { id: 'default' },
      })

      // Create default settings if not exist
      if (!settings) {
        settings = await prisma.settings.create({
          data: { id: 'default' },
        })
      }

      // Return only public fields
      res.json({
        success: true,
        data: {
          businessName: settings.businessName,
          businessTagline: settings.businessTagline,
          supportTelegram: settings.supportTelegram,
          supportEmail: settings.supportEmail,
          minAmount: settings.minAmount,
          maxAmount: settings.maxAmount,
          rateLockDuration: settings.rateLockDuration,
          networkFees: {
            'TRC-20': settings.feeTRC20,
            'BEP-20': settings.feeBEP20,
            'ERC-20': settings.feeERC20,
            'POLYGON': settings.feePOLYGON,
          },
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

// Get all settings (admin)
router.get(
  '/',
  requireAuth,
  async (_req, res, next) => {
    try {
      let settings = await prisma.settings.findUnique({
        where: { id: 'default' },
      })

      if (!settings) {
        settings = await prisma.settings.create({
          data: { id: 'default' },
        })
      }

      res.json({
        success: true,
        data: settings,
      })
    } catch (error) {
      next(error)
    }
  }
)

// Update settings (admin)
router.patch(
  '/',
  requireAuth,
  async (req, res, next) => {
    try {
      const allowedFields = [
        'businessName',
        'businessTagline',
        'supportTelegram',
        'supportEmail',
        'minAmount',
        'maxAmount',
        'rateMarkup',
        'rateLockDuration',
        'feeTRC20',
        'feeBEP20',
        'feeERC20',
        'feePOLYGON',
      ]

      // Filter to only allowed fields
      const updates: Record<string, unknown> = {}
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field]
        }
      }

      const settings = await prisma.settings.upsert({
        where: { id: 'default' },
        update: updates,
        create: { id: 'default', ...updates },
      })

      // Log audit
      await prisma.auditLog.create({
        data: {
          action: 'SETTINGS_CHANGED',
          adminId: req.admin!.adminId,
          details: JSON.stringify(updates),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      })

      res.json({
        success: true,
        data: settings,
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
