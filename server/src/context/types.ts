export type ProfileItem = {
  text: string
  why?: string           // 背后的原因或意义
  lastMentioned: string  // ISO date, e.g. "2026-03-18"
}

export type ValueItem = {
  text: string            // 价值观描述，如"亲密关系"、"持续成长"
  evidence: string        // 从对话中观察到的证据，如"反复提到家人的重要性"
  lastMentioned: string   // ISO date
}

export type UserProfile = {
  name?: string
  emotionalPatterns: ProfileItem[]
  interests: ProfileItem[]
  goals: ProfileItem[]
  values: ValueItem[]
  communicationStyle?: string
  importantPeople: { name: string; relation: string; lastMentioned: string }[]
  preferredResponseStyle?: string
  updatedAt: number
}

export type EmotionEntry = {
  date: string
  dominantEmotion: string
  intensity: number  // 1-5
  triggers: string[]
  conversationId: string
}

export type ConversationSummary = {
  id: string
  date: string
  summary: string
  significance: 'routine' | 'notable' | 'milestone'
  themes: string[]
  createdAt: number
}

export type LifeEvent = {
  id: string
  description: string
  eventTime: string
  checkInTime: string
  checkInType: 'before' | 'after'
  sentiment: 'excited' | 'anxious' | 'neutral'
  status: 'pending' | 'checked_in' | 'expired'
  conversationId: string
  extractedAt: number
}

export type ContextPayload = {
  userProfile?: UserProfile
  emotionTrajectory?: EmotionEntry[]
  recentSummaries?: ConversationSummary[]
  pendingEvents?: LifeEvent[]
}

export const EMPTY_PROFILE: UserProfile = {
  emotionalPatterns: [],
  interests: [],
  goals: [],
  values: [],
  importantPeople: [],
  updatedAt: 0
}

export type EmotionTrend = {
  summary: string          // e.g. "近一周情绪以焦虑为主，主要因工作压力"
  dominantEmotion: string  // 这段时间的主导情绪
  trend: 'improving' | 'declining' | 'stable' | 'fluctuating'
  avgIntensity: number
}
