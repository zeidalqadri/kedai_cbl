import { Router, type Request } from 'express'
import { prisma } from '../lib/db.js'
import { requireAuth, validate, orderLimiter, createError } from '../middleware/index.js'
import {
  CreateOrderSchema,
  UpdateOrderSchema,
  OrderQuerySchema,
  OrderLookupSchema,
  ApproveOrderSchema,
  RejectOrderSchema,
  CompleteOrderSchema,
  type OrderQueryInput,
} from '../lib/validators.js'
import { sendTelegramNotification, formatOrderNotification, formatStatusUpdateNotification } from '../lib/telegram.js'
import type { AuditAction } from '@prisma/client'

const router = Router()

// Helper to safely get user agent string
function getUserAgent(req: Request): string | undefined {
  const ua = req.headers['user-agent']
  return Array.isArray(ua) ? ua[0] : ua
}

// Helper to log audit events
async function logAudit(
  action: AuditAction,
  orderId: string | undefined,
  adminId: string | undefined,
  details: object | undefined,
  req: Request
) {
  await prisma.auditLog.create({
    data: {
      action,
      orderId,
      adminId,
      details: details ? JSON.stringify(details) : undefined,
      ipAddress: req.ip,
      userAgent: getUserAgent(req),
    },
  })
}

// ============================================================================
// PUBLIC ROUTES (Customer-facing)
// ============================================================================

// Create new order
router.post(
  '/',
  orderLimiter,
  validate(CreateOrderSchema),
  async (req, res, next) => {
    try {
      const order = await prisma.order.create({
        data: req.body,
      })

      // Log audit
      await logAudit('ORDER_CREATED', order.id, undefined, { amountMYR: order.amountMYR }, req)

      // Send Telegram notification
      await sendTelegramNotification(formatOrderNotification(order))

      res.status(201).json({
        success: true,
        data: {
          id: order.id,
          status: order.status,
          createdAt: order.createdAt,
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

// Lookup order by ID (public - customer can check status)
router.get(
  '/lookup/:orderId',
  validate(OrderLookupSchema, 'params'),
  async (req, res, next) => {
    try {
      const orderId = req.params.orderId as string
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          crypto: true,
          network: true,
          amountMYR: true,
          amountCrypto: true,
          status: true,
          txHash: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      if (!order) {
        return next(createError('Order not found', 404))
      }

      res.json({
        success: true,
        data: order,
      })
    } catch (error) {
      next(error)
    }
  }
)

// Update order payment info (customer submits proof)
router.patch(
  '/:orderId/payment',
  validate(OrderLookupSchema, 'params'),
  validate(UpdateOrderSchema),
  async (req, res, next) => {
    try {
      const orderId = req.params.orderId as string
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      })

      if (!order) {
        return next(createError('Order not found', 404))
      }

      if (order.status !== 'pending') {
        return next(createError('Order cannot be updated', 400))
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: req.body,
      })

      res.json({
        success: true,
        data: { id: updated.id, status: updated.status },
      })
    } catch (error) {
      next(error)
    }
  }
)

// ============================================================================
// ADMIN ROUTES (Protected)
// ============================================================================

// List all orders (admin)
router.get(
  '/',
  requireAuth,
  validate(OrderQuerySchema, 'query'),
  async (req, res, next) => {
    try {
      const query = req.query as unknown as OrderQueryInput

      const where = query.status ? { status: query.status } : {}

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          orderBy: { [query.sortBy]: query.sortOrder },
          take: query.limit,
          skip: query.offset,
        }),
        prisma.order.count({ where }),
      ])

      res.json({
        success: true,
        data: orders,
        pagination: {
          total,
          limit: query.limit,
          offset: query.offset,
          hasMore: query.offset + orders.length < total,
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

// Get single order (admin)
router.get(
  '/:orderId',
  requireAuth,
  validate(OrderLookupSchema, 'params'),
  async (req, res, next) => {
    try {
      const orderId = req.params.orderId as string
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          auditLogs: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      })

      if (!order) {
        return next(createError('Order not found', 404))
      }

      res.json({
        success: true,
        data: order,
      })
    } catch (error) {
      next(error)
    }
  }
)

// Approve order (admin)
router.post(
  '/approve',
  requireAuth,
  validate(ApproveOrderSchema),
  async (req, res, next) => {
    try {
      const { orderId } = req.body

      const order = await prisma.order.findUnique({
        where: { id: orderId },
      })

      if (!order) {
        return next(createError('Order not found', 404))
      }

      if (order.status !== 'pending') {
        return next(createError('Order cannot be approved', 400))
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status: 'approved' },
      })

      await logAudit('ORDER_APPROVED', orderId, req.admin?.adminId, {}, req)
      await sendTelegramNotification(formatStatusUpdateNotification(updated))

      res.json({
        success: true,
        data: { id: updated.id, status: updated.status },
      })
    } catch (error) {
      next(error)
    }
  }
)

// Reject order (admin)
router.post(
  '/reject',
  requireAuth,
  validate(RejectOrderSchema),
  async (req, res, next) => {
    try {
      const { orderId, reason } = req.body

      const order = await prisma.order.findUnique({
        where: { id: orderId },
      })

      if (!order) {
        return next(createError('Order not found', 404))
      }

      if (order.status !== 'pending') {
        return next(createError('Order cannot be rejected', 400))
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status: 'rejected' },
      })

      await logAudit('ORDER_REJECTED', orderId, req.admin?.adminId, { reason }, req)
      await sendTelegramNotification(formatStatusUpdateNotification(updated))

      res.json({
        success: true,
        data: { id: updated.id, status: updated.status },
      })
    } catch (error) {
      next(error)
    }
  }
)

// Complete order with TX hash (admin)
router.post(
  '/complete',
  requireAuth,
  validate(CompleteOrderSchema),
  async (req, res, next) => {
    try {
      const { orderId, txHash } = req.body

      const order = await prisma.order.findUnique({
        where: { id: orderId },
      })

      if (!order) {
        return next(createError('Order not found', 404))
      }

      if (order.status !== 'approved') {
        return next(createError('Order must be approved before completion', 400))
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'completed',
          txHash,
        },
      })

      await logAudit('ORDER_COMPLETED', orderId, req.admin?.adminId, { txHash }, req)
      await sendTelegramNotification(formatStatusUpdateNotification(updated))

      res.json({
        success: true,
        data: { id: updated.id, status: updated.status, txHash: updated.txHash },
      })
    } catch (error) {
      next(error)
    }
  }
)

// Get order statistics (admin)
router.get(
  '/stats/summary',
  requireAuth,
  async (_req, res, next) => {
    try {
      const [pending, approved, completed, rejected, totalVolume] = await Promise.all([
        prisma.order.count({ where: { status: 'pending' } }),
        prisma.order.count({ where: { status: 'approved' } }),
        prisma.order.count({ where: { status: 'completed' } }),
        prisma.order.count({ where: { status: 'rejected' } }),
        prisma.order.aggregate({
          where: { status: 'completed' },
          _sum: { amountMYR: true },
        }),
      ])

      res.json({
        success: true,
        data: {
          counts: { pending, approved, completed, rejected },
          totalVolumeMYR: totalVolume._sum.amountMYR || 0,
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
