import { UserProfile, ProfileItem, ValueItem, EmotionEntry, ConversationSummary, LifeEvent } from './types'

const BASE_PERSONA = `你是小知了，用户的AI情感伙伴。你温柔、真诚、善于倾听。

你的回应方式基于接纳承诺疗法（ACT）的理念：

【核心原则】
- 每一次倾诉，都值得被温柔以待
- 记住用户之前分享过的事情，适时关心进展
- 用自然、口语化的中文交流，像一个值得信赖的朋友
- 始终使用全角中文标点符号（，。！？、；：""''（）），不要使用半角英文标点

【ACT 回应框架】
1. 接纳（Acceptance）：不试图消除用户的负面情绪。"难过是正常的"而不是"别难过了"。所有情绪都有存在的意义，不需要被修复。
2. 认知解离（Defusion）：帮助用户看到"想法只是想法，不是事实"。当用户说"我就是个废物"时，温柔地引导："你注意到自己冒出了一个'我是废物'的想法——这个想法现在很响亮，但它不等于你这个人。"
3. 活在当下（Present Moment）：当用户被过去的后悔或未来的焦虑困住时，轻轻地把注意力引回此刻的感受和体验。
4. 价值连接（Values）：这是你最重要的工具。当用户痛苦时，帮助他们看到痛苦背后被触动的价值——"这件事让你这么难受，是不是因为XX对你来说真的很重要？"痛苦往往是价值的倒影。
5. 承诺行动（Committed Action）：鼓励用户带着不舒服去做对自己有意义的事，而不是等"准备好了"再行动。"你不需要等焦虑消失再去做，可以带着这份紧张去尝试。"

【什么时候不该用 ACT 技巧】
- 用户只是轻松地闲聊、分享日常时，做一个好朋友就好，不需要用任何技巧
- 用户明确要求实际建议时，先给建议，不要强行往情绪引导
- 用户处于危机状态（自伤、自杀意念）时，优先提供安全资源，而不是做 ACT 引导`

function formatProfileItems(items: ProfileItem[]): string {
  return items.map(item => {
    if (item.why) {
      return `${item.text}（${item.why}）`
    }
    return item.text
  }).join('、')
}

function buildProfileSection(profile: UserProfile): string {
  const parts: string[] = []

  if (profile.name) {
    parts.push(`称呼：${profile.name}`)
  }
  if (profile.emotionalPatterns.length > 0) {
    // Filter out stale items (>30 days not mentioned) for non-milestone context
    const active = filterActiveItems(profile.emotionalPatterns)
    if (active.length > 0) {
      parts.push(`情绪模式：${formatProfileItems(active)}`)
    }
  }
  if (profile.interests.length > 0) {
    const active = filterActiveItems(profile.interests)
    if (active.length > 0) {
      parts.push(`兴趣与关注：${formatProfileItems(active)}`)
    }
  }
  if (profile.goals.length > 0) {
    const active = filterActiveItems(profile.goals)
    if (active.length > 0) {
      parts.push(`当前目标：${formatProfileItems(active)}`)
    }
  }
  if (profile.communicationStyle) {
    parts.push(`沟通偏好：${profile.communicationStyle}`)
  }
  if (profile.importantPeople.length > 0) {
    const people = profile.importantPeople.map(p => `${p.name}（${p.relation}）`).join('、')
    parts.push(`重要的人：${people}`)
  }
  if (profile.preferredResponseStyle) {
    parts.push(`期望的回应风格：${profile.preferredResponseStyle}`)
  }

  if (profile.values && profile.values.length > 0) {
    const activeValues = profile.values.filter(v => {
      if (!v.lastMentioned) return true
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 60) // values decay slower: 60 days
      return v.lastMentioned >= cutoff.toISOString().slice(0, 10)
    })
    if (activeValues.length > 0) {
      const valuesText = activeValues.map(v => {
        if (v.evidence) return `${v.text}（${v.evidence}）`
        return v.text
      }).join('、')
      parts.push(`内心看重的价值：${valuesText}`)
    }
  }

  if (parts.length === 0) return ''

  return `\n\n【关于这位用户】\n${parts.join('\n')}`
}

/**
 * Filter out items not mentioned in the last 30 days.
 * Items without lastMentioned are kept (legacy data).
 */
function filterActiveItems(items: ProfileItem[]): ProfileItem[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  return items.filter(item => {
    if (!item.lastMentioned) return true
    return item.lastMentioned >= cutoffStr
  })
}

function buildEmotionSection(entries: EmotionEntry[]): string {
  if (!entries || entries.length === 0) return ''

  const recent = entries.slice(-7) // last 7 entries
  const lines = recent.map(e => {
    const triggers = e.triggers.length > 0 ? ` — ${e.triggers.join('、')}` : ''
    return `[${e.date}] ${e.dominantEmotion}（${e.intensity}/5）${triggers}`
  })

  // Generate trend analysis
  const trend = analyzeEmotionTrend(entries)

  let section = `\n\n【用户近期情绪轨迹】\n${lines.join('\n')}`
  if (trend) {
    section += `\n\n【情绪趋势】${trend}`
  }

  return section
}

/**
 * Analyze emotion entries to produce a trend summary.
 * Compares last 7 days vs previous 7 days.
 */
function analyzeEmotionTrend(entries: EmotionEntry[]): string | null {
  if (entries.length < 2) return null

  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const fourteenDaysAgo = new Date(now)
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

  const recentWeek = entries.filter(e => e.date >= sevenDaysAgo.toISOString().slice(0, 10))
  const previousWeek = entries.filter(e =>
    e.date >= fourteenDaysAgo.toISOString().slice(0, 10) &&
    e.date < sevenDaysAgo.toISOString().slice(0, 10)
  )

  if (recentWeek.length === 0) return null

  // Dominant emotion this week
  const emotionCounts: Record<string, number> = {}
  for (const e of recentWeek) {
    emotionCounts[e.dominantEmotion] = (emotionCounts[e.dominantEmotion] || 0) + 1
  }
  const dominantEmotion = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])[0][0]

  const avgIntensity = recentWeek.reduce((sum, e) => sum + e.intensity, 0) / recentWeek.length

  // Collect all triggers
  const allTriggers = recentWeek.flatMap(e => e.triggers).filter(Boolean)
  const triggerCounts: Record<string, number> = {}
  for (const t of allTriggers) {
    triggerCounts[t] = (triggerCounts[t] || 0) + 1
  }
  const topTriggers = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([t]) => t)

  let trendText = `近一周情绪以「${dominantEmotion}」为主（平均强度 ${avgIntensity.toFixed(1)}/5）`

  if (topTriggers.length > 0) {
    trendText += `，主要因${topTriggers.join('、')}`
  }

  // Compare with previous week
  if (previousWeek.length > 0) {
    const prevAvg = previousWeek.reduce((sum, e) => sum + e.intensity, 0) / previousWeek.length
    const prevEmotionCounts: Record<string, number> = {}
    for (const e of previousWeek) {
      prevEmotionCounts[e.dominantEmotion] = (prevEmotionCounts[e.dominantEmotion] || 0) + 1
    }
    const prevDominant = Object.entries(prevEmotionCounts)
      .sort((a, b) => b[1] - a[1])[0][0]

    if (avgIntensity > prevAvg + 0.5) {
      trendText += `。相比上周（以「${prevDominant}」为主），情绪强度有所上升`
    } else if (avgIntensity < prevAvg - 0.5) {
      trendText += `。相比上周（以「${prevDominant}」为主），情绪有所缓和`
    } else if (dominantEmotion !== prevDominant) {
      trendText += `。上周主要情绪是「${prevDominant}」，本周有所变化`
    } else {
      trendText += `。与上周趋势基本一致`
    }
  }

  return trendText
}

function buildSummariesSection(summaries: ConversationSummary[]): string {
  if (!summaries || summaries.length === 0) return ''

  // Milestone summaries always show; routine summaries only within 7 days
  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const cutoffStr = sevenDaysAgo.toISOString().slice(0, 10)

  const filtered = summaries.filter(s => {
    if (s.significance === 'milestone') return true
    if (s.significance === 'notable') return true
    // routine: only keep if within 7 days
    return s.date >= cutoffStr
  })

  if (filtered.length === 0) return ''

  const lines = filtered.map(s => {
    const tag = s.significance === 'milestone' ? '⭐ '
      : s.significance === 'notable' ? '📌 '
      : ''
    const themes = s.themes && s.themes.length > 0 ? ` [${s.themes.join('、')}]` : ''
    return `${tag}[${s.date}] ${s.summary}${themes}`
  })

  return `\n\n【近期对话摘要】\n${lines.join('\n')}`
}

function buildEventsSection(events: LifeEvent[]): string {
  if (!events || events.length === 0) return ''

  const now = new Date()
  const lines = events.map(e => {
    const eventDate = new Date(e.eventTime)
    const diffHours = Math.round((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60))

    let timeDesc: string
    if (diffHours < 0) {
      timeDesc = `已过去 ${Math.abs(diffHours)} 小时`
    } else if (diffHours < 24) {
      timeDesc = `${diffHours} 小时后`
    } else {
      const days = Math.round(diffHours / 24)
      timeDesc = `${days} 天后`
    }

    const sentimentHint = e.sentiment === 'anxious' ? '（用户对此感到紧张）'
      : e.sentiment === 'excited' ? '（用户对此很期待）'
      : ''

    return `- ${e.description}：${timeDesc}${sentimentHint}`
  })

  return `\n\n【用户即将发生的事件】\n${lines.join('\n')}\n注意：不要主动提起这些事件，除非用户先聊到相关话题，或者你收到系统提示要求关心。在正常对话中，这些信息只用于你更好地理解用户当前的状态。`
}

export function buildSystemPrompt(
  profile?: UserProfile,
  emotionTrajectory?: EmotionEntry[],
  recentSummaries?: ConversationSummary[],
  pendingEvents?: LifeEvent[],
  localTime?: string
): string {
  // Put current time at the very top so the model always sees it before persona
  let prompt = ''
  if (localTime) {
    prompt += `【当前时间（用户本地时区）】${localTime}

严格遵守：
- 必须根据上面字符串末尾的时段标签（早上/上午/中午/下午/傍晚/晚上/深夜）来选择问候语与时段性表达。
- 时段与问候语对应：早上→"早上好"；上午→"上午好"；中午→"中午好"；下午→"下午好"；傍晚→"傍晚好"或"晚上好"；晚上→"晚上好"；深夜→"这么晚还没睡呀"。
- 绝对不要在非"早上/上午"的时段使用"早上好/早安"。不要凭空假设时间段。

`
  }

  prompt += BASE_PERSONA

  if (profile) {
    prompt += buildProfileSection(profile)
  }

  if (emotionTrajectory && emotionTrajectory.length > 0) {
    prompt += buildEmotionSection(emotionTrajectory)
  }

  if (recentSummaries && recentSummaries.length > 0) {
    prompt += buildSummariesSection(recentSummaries)
  }

  if (pendingEvents && pendingEvents.length > 0) {
    prompt += buildEventsSection(pendingEvents)
  }

  prompt += '\n\n请基于以上了解来回应用户，像一个记得过去对话的老朋友一样。当用户遇到困扰时，试着将他们的痛苦与他们看重的价值联系起来，帮助他们看到痛苦背后是什么在被触动。'

  return prompt
}
