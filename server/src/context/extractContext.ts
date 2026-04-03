import { UserProfile, ProfileItem, ValueItem, EmotionEntry, ConversationSummary, EMPTY_PROFILE } from './types'

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
 * After a conversation ends, extract/update the user profile.
 * Merges new observations into the existing profile.
 */
export async function extractUserProfile(
  existingProfile: UserProfile,
  conversationMessages: { role: string; content: string }[]
): Promise<UserProfile> {
  const existingJSON = JSON.stringify(existingProfile, null, 2)
  const convoText = conversationMessages
    .map(m => `${m.role}: ${m.content}`)
    .join('\n')

  const today = new Date().toISOString().slice(0, 10)

  const prompt = `你是一个用户画像分析师。根据以下对话内容，更新用户画像。

当前用户画像：
${existingJSON}

最新对话内容：
${convoText}

请分析对话，提取或更新以下字段。只更新有新信息的字段，保留已有的准确信息。
每个条目不仅要记录"是什么"，还要记录"为什么"——即这个兴趣/目标/模式对用户意味着什么。

返回严格的 JSON 格式（不要加 markdown 代码块标记）：
{
  "name": "用户的称呼（如果提到的话）",
  "emotionalPatterns": [
    {"text": "情绪模式描述", "why": "背后的原因或触发场景", "lastMentioned": "${today}"}
  ],
  "interests": [
    {"text": "兴趣", "why": "这个兴趣对用户的意义，比如'压力大时通过跑步释放'", "lastMentioned": "${today}"}
  ],
  "goals": [
    {"text": "目标", "why": "为什么这个目标重要", "lastMentioned": "${today}"}
  ],
  "values": [
    {"text": "价值观", "evidence": "从对话中观察到的具体证据", "lastMentioned": "${today}"}
  ],
  "communicationStyle": "沟通风格描述",
  "importantPeople": [{"name": "名字", "relation": "关系", "lastMentioned": "${today}"}],
  "preferredResponseStyle": "期望的回应风格"
}

关于 values（价值观）的提取指引：
- 价值观是用户深层看重的生活方向，不是具体目标。目标可以完成（"考上研"），价值观是持续的方向（"持续学习和成长"）
- 常见价值维度：亲密关系、家庭、成长、自由、创造力、健康、事业成就、助人、诚实、冒险等
- 不要直接问用户"你的价值观是什么"，而是从行为和情绪反应中推断：
  - 用户为什么事情投入最多精力？→ 可能的价值方向
  - 用户为什么事情感到最痛苦？→ 被威胁的价值
  - 用户反复提起什么？→ 内心看重的东西
- evidence 字段要引用对话中的具体线索，如"多次提到周末陪家人，拒绝加班邀请"
- 每个用户最多提取 5 个核心价值

注意：
- 如果对话中没有相关信息，保留原有值（包括原有的 why/evidence 和 lastMentioned）
- 如果用户明确表示不再有某个兴趣/目标，就移除它
- emotionalPatterns 是长期模式，不是单次情绪
- why 字段要具体，不要泛泛而谈。如果对话中没提到原因，可以留空字符串
- lastMentioned 对于本次对话提到的条目设为 "${today}"，未提到的保留原值
- 每个数组最多保留 5 个最相关的条目
- 合并而非替换已有信息`

  try {
    const result = await callLLM([{ role: 'user', content: prompt }])

    // Strip markdown code fences if present
    const cleaned = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(cleaned)

    // Normalize items: handle both old string[] format and new ProfileItem[] format
    const normalizeItems = (items: any[], fallback: ProfileItem[]): ProfileItem[] => {
      if (!items || items.length === 0) return fallback
      return items.map((item: any) => {
        if (typeof item === 'string') {
          return { text: item, why: '', lastMentioned: today }
        }
        return {
          text: item.text || '',
          why: item.why || '',
          lastMentioned: item.lastMentioned || today
        }
      }).slice(0, 5)
    }

    const normalizePeople = (people: any[], fallback: any[]): any[] => {
      if (!people || people.length === 0) return fallback
      return people.map((p: any) => ({
        name: p.name || '',
        relation: p.relation || '',
        lastMentioned: p.lastMentioned || today
      })).slice(0, 5)
    }

    const normalizeValues = (items: any[], fallback: ValueItem[]): ValueItem[] => {
      if (!items || items.length === 0) return fallback
      return items.map((item: any) => {
        if (typeof item === 'string') {
          return { text: item, evidence: '', lastMentioned: today }
        }
        return {
          text: item.text || '',
          evidence: item.evidence || '',
          lastMentioned: item.lastMentioned || today
        }
      }).slice(0, 5)
    }

    return {
      name: parsed.name || existingProfile.name,
      emotionalPatterns: normalizeItems(parsed.emotionalPatterns, existingProfile.emotionalPatterns),
      interests: normalizeItems(parsed.interests, existingProfile.interests),
      goals: normalizeItems(parsed.goals, existingProfile.goals),
      values: normalizeValues(parsed.values, existingProfile.values || []),
      communicationStyle: parsed.communicationStyle || existingProfile.communicationStyle,
      importantPeople: normalizePeople(parsed.importantPeople, existingProfile.importantPeople),
      preferredResponseStyle: parsed.preferredResponseStyle || existingProfile.preferredResponseStyle,
      updatedAt: Date.now()
    }
  } catch (err) {
    console.error('extractUserProfile error:', err)
    return existingProfile
  }
}

/**
 * After a conversation ends, classify the user's emotion and generate a summary.
 */
export async function extractEmotionAndSummary(
  conversationId: string,
  conversationMessages: { role: string; content: string }[]
): Promise<{ emotion: EmotionEntry; summary: ConversationSummary }> {
  const convoText = conversationMessages
    .map(m => `${m.role}: ${m.content}`)
    .join('\n')

  const today = new Date().toISOString().slice(0, 10)

  const prompt = `分析以下对话，提取用户的情绪状态并生成摘要。

对话内容：
${convoText}

返回严格的 JSON 格式（不要加 markdown 代码块标记）：
{
  "dominantEmotion": "主要情绪（如：开心、平静、焦虑、难过、愤怒、兴奋、疲惫、迷茫）",
  "intensity": 3,
  "triggers": ["触发因素1", "触发因素2"],
  "summary": "一两句话概括这次对话的核心内容和用户的状态",
  "significance": "routine 或 notable 或 milestone",
  "themes": ["主题标签1", "主题标签2"]
}

注意：
- intensity 为 1-5 的整数，1 最轻，5 最强烈
- triggers 是导致该情绪的具体事件或原因
- summary 要简洁但信息量足够，未来用于提醒 AI 这次对话聊了什么
- significance 判断标准：
  - "routine"：日常闲聊、普通分享
  - "notable"：有情绪波动、提到重要的人或事、表达了困惑或需要帮助
  - "milestone"：人生重大事件（分手、换工作、考试结果、重大决定、家人生病等）
- themes：2-4 个关键主题标签，如 ["工作压力", "人际关系"]`

  try {
    const result = await callLLM([{ role: 'user', content: prompt }])

    const cleaned = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(cleaned)

    const emotion: EmotionEntry = {
      date: today,
      dominantEmotion: parsed.dominantEmotion || '平静',
      intensity: Math.max(1, Math.min(5, parsed.intensity || 3)),
      triggers: parsed.triggers || [],
      conversationId
    }

    const validSignificance = ['routine', 'notable', 'milestone']
    const significance = validSignificance.includes(parsed.significance) ? parsed.significance : 'routine'

    const summary: ConversationSummary = {
      id: conversationId,
      date: today,
      summary: parsed.summary || '',
      significance,
      themes: parsed.themes || [],
      createdAt: Date.now()
    }

    return { emotion, summary }
  } catch (err) {
    console.error('extractEmotionAndSummary error:', err)
    return {
      emotion: {
        date: today,
        dominantEmotion: '未知',
        intensity: 3,
        triggers: [],
        conversationId
      },
      summary: {
        id: conversationId,
        date: today,
        summary: '对话内容未能成功总结',
        significance: 'routine' as const,
        themes: [],
        createdAt: Date.now()
      }
    }
  }
}
