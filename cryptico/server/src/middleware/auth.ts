import type { Request, Response, NextFunction } from 'express'
import { extractBearerToken, verifyToken, type JWTPayload } from '../lib/auth.js'
import { createError } from './errorHandler.js'

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      admin?: JWTPayload
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req.headers.authorization)

  if (!token) {
    return next(createError('Authentication required', 401, 'UNAUTHORIZED'))
  }

  const payload = verifyToken(token)

  if (!payload) {
    return next(createError('Invalid or expired token', 401, 'INVALID_TOKEN'))
  }

  req.admin = payload
  next()
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req.headers.authorization)

  if (token) {
    const payload = verifyToken(token)
    if (payload) {
      req.admin = payload
    }
  }

  next()
}
