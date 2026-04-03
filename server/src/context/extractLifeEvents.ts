import { LifeEvent } from './types'

const GLM_API = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'

async function callLLM(messages: any[]): Promise<string> {
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

/**
 * Extract time-anchored life events from a conversation.
 * Returns an empty array if no events are found — this is the expected common case.
 */
export async function extractLifeEvents(
  conversationId: string,
  conversationMessages: { role: string; content: string }[],
  currentTimestamp: string // ISO string, e.g. "2026-03-14T15:30:00+08:00"
): Promise<LifeEvent[]> {
  const convoText = conversationMessages
    .map(m => `${m.role}: ${m.content}`)
    .join('\n')

  const prompt = `你是一个时间事件提取器。分析以下对话，判断用户是否提到了有明确时间的未来事件。

当前时间：${currentTimestamp}

对话内容：
${convoText}

【重要规则】
1. 只提取有明确时间信号的未来事件。时间信号包括：
   - 具体日期：明天、后天、下周一、3月20号、下个月
   - 具体时间：下午3点、晚上8点、今天傍晚
   - 相对时间：两小时后、三天后、半小时后、一会儿

2. 以下情况不算生活事件，必须忽略：
   - 模糊的未来愿望："以后想去旅行"、"有机会想试试"
   - 过去的事件："昨天我去了"、"上周发生了"
   - 没有时间的计划："我想学画画"、"打算减肥"
   - 纯情绪表达："明天又要上班好烦" — 这是情绪不是事件

3. 时间解析规则（精确到分钟）：
   - "今天下午" → 当天 14:00
   - "明天" → 第二天 09:00（默认上午）
   - "明天晚上" → 第二天 20:00
   - "后天" → 第三天 09:00
   - "下周X" → 对应日期 09:00
   - "X点" → 对应小时 :00
   - "X分钟后" → 当前时间 + X分钟（精确到分钟）
   - "半小时后" → 当前时间 + 30分钟
   - "两小时后" → 当前时间 + 2小时
   - "一会儿" → 忽略，太模糊

4. checkInType 规则：
   - 面试、演讲、考试等有压力的事 → "both"（事前鼓励 + 事后关心）
   - 约会、聚会等社交活动 → "after"（事后问感受）
   - 截止日期、提交任务 → "before"（事前提醒）

5. checkInTime 规则：
   - "before" 的 checkIn：事件前 5 分钟
   - "after" 的 checkIn：事件后 5 分钟
   - "both"：返回两个事件条目，一个 before 一个 after

如果对话中没有任何符合条件的事件，返回空数组 []。
大多数对话都不会有事件，返回空数组是完全正常的。

返回严格的 JSON 格式（不要加 markdown 代码块标记）：
[
  {
    "description": "事件描述",
    "eventTime": "ISO 8601 时间字符串",
    "checkInTime": "ISO 8601 时间字符串",
    "checkInType": "before 或 after",
    "sentiment": "excited 或 anxious 或 neutral"
  }
]`

  try {
    const result = await callLLM([{ role: 'user', content: prompt }])

    console.log(`[LIFE_EVENTS] Raw LLM response: "${result}"`)

    if (!result || result.trim().length === 0) {
      console.log(`[LIFE_EVENTS] Empty response, returning []`)
      return []
    }

    const cleaned = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    console.log(`[LIFE_EVENTS] Cleaned for parsing: "${cleaned}"`)

    const parsed = JSON.parse(cleaned)

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return []
    }

    // Validate and transform each event
    const events: LifeEvent[] = []
    const now = new Date(currentTimestamp)

    for (const item of parsed) {
      if (!item.description || !item.eventTime || !item.checkInTime) continue

      const eventTime = new Date(item.eventTime)
      const checkInTime = new Date(item.checkInTime)

      // Skip events in the past
      if (eventTime <= now) continue

      // Skip events too far in the future (> 30 days)
      const thirtyDays = 30 * 24 * 60 * 60 * 1000
      if (eventTime.getTime() - now.getTime() > thirtyDays) continue

      events.push({
        id: `${conversationId}-${events.length}`,
        description: item.description,
        eventTime: eventTime.toISOString(),
        checkInTime: checkInTime.toISOString(),
        checkInType: item.checkInType === 'before' ? 'before' : 'after',
        sentiment: ['excited', 'anxious', 'neutral'].includes(item.sentiment)
          ? item.sentiment
          : 'neutral',
        status: 'pending',
        conversationId,
        extractedAt: Date.now()
      })
    }

    return events
  } catch (err) {
    console.error('extractLifeEvents error:', err)
    return []
  }
}
