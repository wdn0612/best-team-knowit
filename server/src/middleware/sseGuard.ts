import { Request, Response, NextFunction } from 'express'

const SSE_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

export function sseTimeout(req: Request, res: Response, next: NextFunction) {
  const timer = setTimeout(() => {
    if (!res.writableEnded) {
      res.end()
    }
  }, SSE_TIMEOUT_MS)

  res.on('close', () => clearTimeout(timer))
  res.on('finish', () => clearTimeout(timer))

  next()
}

const connections = new Map<string, number>()
const MAX_CONNECTIONS_PER_IP = 5

export function connectionLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  const current = connections.get(ip) || 0

  if (current >= MAX_CONNECTIONS_PER_IP) {
    return res.status(429).json({ error: 'Too many concurrent SSE connections' })
  }

  connections.set(ip, current + 1)

  const cleanup = () => {
    const count = connections.get(ip) || 0
    if (count <= 1) {
      connections.delete(ip)
    } else {
      connections.set(ip, count - 1)
    }
  }

  res.on('close', cleanup)
  res.on('finish', cleanup)

  next()
}
