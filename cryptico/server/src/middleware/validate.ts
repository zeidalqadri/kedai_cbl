import type { Request, Response, NextFunction } from 'express'
import type { ZodSchema } from 'zod'

type RequestPart = 'body' | 'query' | 'params'

export function validate(schema: ZodSchema, part: RequestPart = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[part])
      req[part] = data // Replace with parsed/coerced data
      next()
    } catch (error) {
      next(error)
    }
  }
}
