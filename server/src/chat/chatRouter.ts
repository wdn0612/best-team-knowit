import express from 'express'
import { chatglm } from './chatglm'
import { agentChat } from './agentChat'
import { validateChatInput } from '../middleware/validate'
import { chatLimiter, agentLimiter } from '../middleware/rateLimiter'
import { sseTimeout, connectionLimit } from '../middleware/sseGuard'

const router = express.Router()

router.post('/chatglm', chatLimiter, validateChatInput, sseTimeout, connectionLimit, chatglm)
router.post('/agent', agentLimiter, validateChatInput, sseTimeout, connectionLimit, agentChat)

export default router
