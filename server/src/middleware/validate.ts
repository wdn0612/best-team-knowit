import { Request, Response, NextFunction } from 'express'

const MAX_PROMPT_LENGTH = 10000
const MAX_MESSAGES = 50

function isValidRole(role: string): boolean {
  return ['user', 'assistant', 'system'].includes(role)
}

export function validateChatInput(req: Request, res: Response, next: NextFunction) {
  const { prompt, messages, model } = req.body

  if (prompt !== undefined) {
    if (typeof prompt !== 'string' || prompt.length > MAX_PROMPT_LENGTH) {
      return res.status(400).json({ error: 'Invalid prompt: must be a string with max 10000 characters' })
    }
  }

  if (messages !== undefined) {
    if (!Array.isArray(messages) || messages.length > MAX_MESSAGES) {
      return res.status(400).json({ error: `Invalid messages: must be an array with max ${MAX_MESSAGES} items` })
    }
    for (const msg of messages) {
      if (!msg || typeof msg.role !== 'string' || !isValidRole(msg.role)) {
        return res.status(400).json({ error: 'Invalid message: each message must have a valid role (user/assistant/system)' })
      }
      if (typeof msg.content !== 'string' || msg.content.length > MAX_PROMPT_LENGTH) {
        return res.status(400).json({ error: 'Invalid message: content must be a string with max 10000 characters' })
      }
    }
  }

  if (model !== undefined && typeof model !== 'string') {
    return res.status(400).json({ error: 'Invalid model: must be a string' })
  }

  next()
}

export function validateImageInput(req: Request, res: Response, next: NextFunction) {
  const { prompt, model } = req.body

  if (prompt !== undefined && typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Invalid prompt: must be a string' })
  }

  if (model !== undefined && typeof model !== 'string') {
    return res.status(400).json({ error: 'Invalid model: must be a string' })
  }

  next()
}
