import { Request, Response } from "express"
import asyncHandler from 'express-async-handler'

const GLM_API = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
const MAX_ROUNDS = 5

const SYSTEM_PROMPT = `你是一个智能生活助手，可以帮助用户记录日记和制定计划。

当用户分享了日常经历、感受或心情时，你应该调用 generate_diary 工具来生成一篇结构化的日记。
当用户请求制定某种计划（如学习计划、健身计划、旅行计划等）时，你应该调用 create_plan 工具来生成一个详细的行动计划。
对于普通的聊天对话，直接回复即可，不需要调用任何工具。

请用中文回复用户。`

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'generate_diary',
      description: '根据用户分享的内容生成一篇结构化的日记。当用户描述了自己的日常经历、活动、感受时调用此工具。',
      parameters: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: '用户分享的原始内容，包括经历和感受'
          },
          mood: {
            type: 'string',
            description: '用户的心情，如开心、平静、难过等'
          },
          date: {
            type: 'string',
            description: '日记的日期，格式为 YYYY-MM-DD'
          }
        },
        required: ['content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_plan',
      description: '根据用户的目标生成一个详细的行动计划。当用户请求制定某种计划时调用此工具。',
      parameters: {
        type: 'object',
        properties: {
          goal: {
            type: 'string',
            description: '用户想要达成的目标'
          },
          timeframe: {
            type: 'string',
            description: '计划的时间范围，如一周、一个月等'
          }
        },
        required: ['goal']
      }
    }
  }
]

async function callGlmNonStreaming(messages: any[]): Promise<string> {
  const response = await fetch(GLM_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ZHIPUAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'glm-5',
      messages,
      stream: false
    })
  })
  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

async function executeTool(name: string, args: Record<string, any>): Promise<string> {
  if (name === 'generate_diary') {
    const { content, mood, date } = args
    const prompt = `请根据以下内容生成一篇精美的日记，使用 Markdown 格式。

用户分享的内容：${content}
${mood ? `心情：${mood}` : ''}
${date ? `日期：${date}` : `日期：${new Date().toISOString().slice(0, 10)}`}

要求：
1. 使用标题、正文段落的结构
2. 适当添加 emoji 表情
3. 语言优美、有文采
4. 在末尾添加"今日心情"标签`

    return await callGlmNonStreaming([
      { role: 'user', content: prompt }
    ])
  }

  if (name === 'create_plan') {
    const { goal, timeframe } = args
    const prompt = `请为以下目标制定一个详细的行动计划，使用 Markdown 格式。

目标：${goal}
${timeframe ? `时间范围：${timeframe}` : ''}

要求：
1. 包含清晰的阶段划分
2. 每个阶段有具体的执行步骤
3. 包含可衡量的里程碑
4. 给出实用的建议和注意事项
5. 使用列表和标题组织内容`

    return await callGlmNonStreaming([
      { role: 'user', content: prompt }
    ])
  }

  return `未知工具: ${name}`
}

function sseWrite(res: Response, payload: object) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`)
}

async function readStream(
  response: globalThis.Response,
  res: Response,
  messages: any[]
): Promise<{ hasToolCalls: boolean }> {
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let hasToolCalls = false
  let toolCalls: Record<number, { id: string; name: string; arguments: string }> = {}

  if (!reader) return { hasToolCalls: false }

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
        const choice = parsed.choices?.[0]
        if (!choice) continue
        const delta = choice.delta

        // Handle reasoning/thinking content
        if (delta?.reasoning_content) {
          sseWrite(res, { type: 'thinking', content: delta.reasoning_content })
        }

        // Handle tool calls
        if (delta?.tool_calls) {
          hasToolCalls = true
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0
            if (!toolCalls[idx]) {
              toolCalls[idx] = { id: tc.id || '', name: '', arguments: '' }
            }
            if (tc.id) toolCalls[idx].id = tc.id
            if (tc.function?.name) toolCalls[idx].name = tc.function.name
            if (tc.function?.arguments) toolCalls[idx].arguments += tc.function.arguments
          }
        }

        // Handle text content
        if (delta?.content) {
          sseWrite(res, { type: 'text', content: delta.content })
        }
      } catch (err) {
        // skip malformed chunks
      }
    }
  }

  // Process tool calls after stream ends
  if (hasToolCalls) {
    // Build assistant message with tool_calls for context
    const assistantMsg: any = { role: 'assistant', content: null, tool_calls: [] }
    for (const idx of Object.keys(toolCalls).map(Number).sort()) {
      const tc = toolCalls[idx]
      assistantMsg.tool_calls.push({
        id: tc.id,
        type: 'function',
        function: { name: tc.name, arguments: tc.arguments }
      })
    }
    messages.push(assistantMsg)

    // Execute each tool
    for (const idx of Object.keys(toolCalls).map(Number).sort()) {
      const tc = toolCalls[idx]
      const toolLabel = tc.name === 'generate_diary' ? '生成日记' : tc.name === 'create_plan' ? '制定计划' : tc.name
      sseWrite(res, { type: 'tool_start', name: tc.name, label: toolLabel, args: tc.arguments })

      let args: Record<string, any> = {}
      try {
        args = JSON.parse(tc.arguments)
      } catch {}

      const result = await executeTool(tc.name, args)
      sseWrite(res, { type: 'tool_result', name: tc.name, label: toolLabel, result })

      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: result
      })
    }
  }

  return { hasToolCalls }
}

export const agentChat = asyncHandler(async (req: Request, res: Response) => {
  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    })

    const { messages: userMessages } = req.body

    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...userMessages
    ]

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const response = await fetch(GLM_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ZHIPUAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'glm-5',
          messages,
          stream: true,
          tools: TOOLS
        })
      })

      const { hasToolCalls } = await readStream(response, res, messages)

      if (!hasToolCalls) break
    }

    res.write('data: [DONE]\n\n')
  } catch (err) {
    console.log('agentChat error: ', err)
    res.write('data: [DONE]\n\n')
  }
})
