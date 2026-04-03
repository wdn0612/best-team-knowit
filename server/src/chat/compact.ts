import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'

const GLM_API = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'

export const compact = asyncHandler(async (req: Request, res: Response) => {
  const { messages } = req.body

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages array is required' })
    return
  }

  const convoText = messages
    .map((m: any) => `${m.role}: ${m.content}`)
    .join('\n')

  const prompt = `你是一个对话压缩器。请将以下对话压缩成一段结构化摘要，供 AI 在后续对话中作为上下文使用。

对话内容：
${convoText}

压缩要求：
1. 保留用户表达的核心情绪和感受（不只是事件，更重要的是情绪）
2. 保留用户提到的对他重要的人、事、物
3. 保留 AI 给出的关键回应，以及用户对这些回应的态度（认可/不认可）
4. 保留任何与用户价值观相关的线索（什么对用户来说真的很重要）
5. 用第三人称描述，如"用户分享了……"、"用户表达了……"
6. 控制在 300 字以内
7. 直接输出摘要文本，不要加任何标题或 markdown 格式`

  try {
    const response = await fetch(GLM_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ZHIPUAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'glm-5',
        messages: [{ role: 'user', content: prompt }],
        stream: false
      })
    })

    const data = await response.json()
    const summary = data.choices?.[0]?.message?.content || ''

    console.log(`[COMPACT] Compressed ${messages.length} messages → ${summary.length} chars`)

    res.json({ summary })
  } catch (err) {
    console.error('compact error:', err)
    res.status(500).json({ error: 'Compaction failed' })
  }
})
