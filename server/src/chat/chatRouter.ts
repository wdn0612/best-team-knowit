import express from 'express'
import { claude } from './claude'
import { gpt } from './gpt'
import { gemini } from './gemini'
import { chatglm } from './chatglm'
import { agentChat } from './agentChat'

const router = express.Router()

router.post('/claude', claude)
router.post('/gpt', gpt)
router.post('/gemini', gemini)
router.post('/chatglm', chatglm)
router.post('/agent', agentChat)

export default router