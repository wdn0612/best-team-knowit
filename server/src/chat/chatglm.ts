import { Request, Response } from "express"
import asyncHandler from 'express-async-handler'

export const chatglm = asyncHandler(async (req: Request, res: Response) => {
  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    })
    const { messages } = req.body

    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ZHIPUAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'glm-5',
        messages,
        stream: true
      })
    })
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue
          const data = trimmed.slice(6)
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`)
            }
          } catch (err) {
            // skip malformed chunks
          }
        }
      }
    }

    res.write('data: [DONE]\n\n')
  } catch (err) {
    console.log('chatglm error: ', err)
    res.write('data: [DONE]\n\n')
  }
})
