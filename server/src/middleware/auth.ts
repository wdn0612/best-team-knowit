import { Request, Response, NextFunction } from 'express'

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const apiKey = process.env.APP_API_KEY
  if (!apiKey) {
    // No API key configured — skip auth (local dev)
    return next()
  }

  const header = req.headers['x-api-key'] as string | undefined
  const authHeader = req.headers['authorization'] as string | undefined
  const token = header || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined)

  if (token === apiKey) {
    return next()
  }

  res.status(401).json({ error: 'Unauthorized' })
}
