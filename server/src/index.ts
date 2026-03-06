import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import chatRouter from './chat/chatRouter'
import 'dotenv/config'
import { authMiddleware } from './middleware/auth'
import { globalLimiter } from './middleware/rateLimiter'

const app = express()

app.use(helmet())

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : undefined

app.use(cors(allowedOrigins
  ? { origin: allowedOrigins }
  : undefined // allow all in dev when not configured
))

app.use(express.urlencoded({ extended: true }))
app.use(express.json({ limit: '1mb' }))

app.use(globalLimiter)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use('/chat', authMiddleware, chatRouter)

app.listen(3050, () => {
  console.log('Server started on port 3050')
})
