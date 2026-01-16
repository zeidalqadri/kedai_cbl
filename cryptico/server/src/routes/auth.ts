import { Router } from 'express'
import { prisma } from '../lib/db.js'
import { hashPassword, verifyPassword, generateToken } from '../lib/auth.js'
import { requireAuth, validate, authLimiter, createError } from '../middleware/index.js'
import { LoginSchema } from '../lib/validators.js'
import type { AuditAction } from '@prisma/client'

const router = Router()

// Helper to log audit events
async function logAudit(
  action: AuditAction,
  adminId?: string,
  req?: { ip?: string; headers?: { 'user-agent'?: string } }
) {
  await prisma.auditLog.create({
    data: {
      action,
      adminId,
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    },
  })
}

// Login
router.post(
  '/login',
  authLimiter,
  validate(LoginSchema),
  async (req, res, next) => {
    try {
      const { username, password } = req.body

      const admin = await prisma.adminUser.findUnique({
        where: { username },
      })

      if (!admin || !admin.isActive) {
        return next(createError('Invalid credentials', 401))
      }

      const isValid = await verifyPassword(password, admin.passwordHash)

      if (!isValid) {
        return next(createError('Invalid credentials', 401))
      }

      // Update last login
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() },
      })

      // Generate token
      const token = generateToken({
        adminId: admin.id,
        username: admin.username,
      })

      // Log audit
      await logAudit('ADMIN_LOGIN', admin.id, req)

      res.json({
        success: true,
        data: {
          token,
          admin: {
            id: admin.id,
            username: admin.username,
          },
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

// Get current admin info
router.get(
  '/me',
  requireAuth,
  async (req, res, next) => {
    try {
      const admin = await prisma.adminUser.findUnique({
        where: { id: req.admin!.adminId },
        select: {
          id: true,
          username: true,
          lastLoginAt: true,
          createdAt: true,
        },
      })

      if (!admin) {
        return next(createError('Admin not found', 404))
      }

      res.json({
        success: true,
        data: admin,
      })
    } catch (error) {
      next(error)
    }
  }
)

// Logout (just log the event, token invalidation would require token blacklist)
router.post(
  '/logout',
  requireAuth,
  async (req, res, next) => {
    try {
      await logAudit('ADMIN_LOGOUT', req.admin!.adminId, req)

      res.json({
        success: true,
        message: 'Logged out successfully',
      })
    } catch (error) {
      next(error)
    }
  }
)

// Change password
router.post(
  '/change-password',
  requireAuth,
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body

      if (!currentPassword || !newPassword) {
        return next(createError('Current and new password required', 400))
      }

      if (newPassword.length < 8) {
        return next(createError('Password must be at least 8 characters', 400))
      }

      const admin = await prisma.adminUser.findUnique({
        where: { id: req.admin!.adminId },
      })

      if (!admin) {
        return next(createError('Admin not found', 404))
      }

      const isValid = await verifyPassword(currentPassword, admin.passwordHash)

      if (!isValid) {
        return next(createError('Current password is incorrect', 401))
      }

      const newHash = await hashPassword(newPassword)

      await prisma.adminUser.update({
        where: { id: admin.id },
        data: { passwordHash: newHash },
      })

      res.json({
        success: true,
        message: 'Password changed successfully',
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
