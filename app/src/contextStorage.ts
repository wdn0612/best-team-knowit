import AsyncStorage from '@react-native-async-storage/async-storage'
import { DOMAIN } from '../constants'

const PROFILE_KEY = 'rnai-user-profile'
const EMOTIONS_KEY = 'rnai-emotion-trajectory'
const SUMMARIES_KEY = 'rnai-conversation-summaries'
const EVENTS_KEY = 'rnai-life-events'

// --- Types (mirrored from server) ---

export type ProfileItem = {
  text: string
  why?: string           // 背后的原因或意义
  lastMentioned: string  // ISO date
}

export type ValueItem = {
  text: string
  evidence: string
  lastMentioned: string
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
  intensity: number
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
  notificationId?: string
}

export type ContextPayload = {
  userProfile?: UserProfile
  emotionTrajectory?: EmotionEntry[]
  recentSummaries?: ConversationSummary[]
  pendingEvents?: LifeEvent[]
  localTime?: string  // client's local datetime string, e.g. "2026-04-11 18:00 Saturday 傍晚"
}

const EMPTY_PROFILE: UserProfile = {
  emotionalPatterns: [],
  interests: [],
  goals: [],
  values: [],
  importantPeople: [],
  updatedAt: 0
}

// --- Load ---

export async function loadUserProfile(): Promise<UserProfile> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY)
    return raw ? JSON.parse(raw) : EMPTY_PROFILE
  } catch {
    return EMPTY_PROFILE
  }
}

export async function loadEmotionTrajectory(): Promise<EmotionEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(EMOTIONS_KEY)
    const all: EmotionEntry[] = raw ? JSON.parse(raw) : []
    // Keep last 14 days
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 14)
    const cutoffStr = cutoff.toISOString().slice(0, 10)
    return all.filter(e => e.date >= cutoffStr)
  } catch {
    return []
  }
}

export async function loadRecentSummaries(count: number = 5): Promise<ConversationSummary[]> {
  try {
    const raw = await AsyncStorage.getItem(SUMMARIES_KEY)
    const all: ConversationSummary[] = raw ? JSON.parse(raw) : []
    const sorted = all.sort((a, b) => b.createdAt - a.createdAt)

    // Always include milestones + most recent notable/routine up to count
    const milestones = sorted.filter(s => s.significance === 'milestone')
    const others = sorted.filter(s => s.significance !== 'milestone')
    const remaining = Math.max(0, count - milestones.length)
    const selected = [...milestones, ...others.slice(0, remaining)]

    // Deduplicate and sort chronologically
    const uniqueIds = new Set<string>()
    const deduped = selected.filter(s => {
      if (uniqueIds.has(s.id)) return false
      uniqueIds.add(s.id)
      return true
    })

    return deduped.sort((a, b) => a.createdAt - b.createdAt)
  } catch {
    return []
  }
}

// --- Save ---

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  } catch (e) {
    console.error('saveUserProfile error:', e)
  }
}

export async function addEmotionEntry(entry: EmotionEntry): Promise<void> {
  try {
    const all = await loadEmotionTrajectory()
    all.push(entry)
    await AsyncStorage.setItem(EMOTIONS_KEY, JSON.stringify(all))
  } catch (e) {
    console.error('addEmotionEntry error:', e)
  }
}

export async function addConversationSummary(summary: ConversationSummary): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(SUMMARIES_KEY)
    const all: ConversationSummary[] = raw ? JSON.parse(raw) : []
    // Replace if same conversation id exists
    const idx = all.findIndex(s => s.id === summary.id)
    if (idx >= 0) {
      all[idx] = summary
    } else {
      all.push(summary)
    }
    // Keep max 20 summaries
    const trimmed = all
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 20)
    await AsyncStorage.setItem(SUMMARIES_KEY, JSON.stringify(trimmed))
  } catch (e) {
    console.error('addConversationSummary error:', e)
  }
}

// --- Life Events ---

export async function loadLifeEvents(): Promise<LifeEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(EVENTS_KEY)
    const all: LifeEvent[] = raw ? JSON.parse(raw) : []
    return all
  } catch {
    return []
  }
}

export async function loadPendingEvents(): Promise<LifeEvent[]> {
  const all = await loadLifeEvents()
  return all.filter(e => e.status === 'pending')
}

/**
 * Find events that are due for check-in:
 * - checkInTime has passed, OR
 * - eventTime is within the next 30 minutes
 * Only returns events with status 'pending'.
 */
export async function loadDueCheckInEvents(): Promise<LifeEvent[]> {
  const all = await loadLifeEvents()
  const now = new Date()
  return all.filter(e => {
    if (e.status !== 'pending') return false
    const checkInTime = new Date(e.checkInTime)
    const eventTime = new Date(e.eventTime)
    return checkInTime <= now || (eventTime.getTime() - now.getTime() < 30 * 60 * 1000)
  })
}

export async function saveLifeEvents(events: LifeEvent[]): Promise<void> {
  try {
    await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(events))
  } catch (e) {
    console.error('saveLifeEvents error:', e)
  }
}

export async function addLifeEvents(newEvents: LifeEvent[]): Promise<void> {
  if (newEvents.length === 0) return
  try {
    const all = await loadLifeEvents()
    // Deduplicate by id
    const existingIds = new Set(all.map(e => e.id))
    const toAdd = newEvents.filter(e => !existingIds.has(e.id))
    const merged = [...all, ...toAdd]
    // Clean up: remove expired events older than 7 days
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 7)
    const cleaned = merged.filter(e =>
      e.status === 'pending' || new Date(e.extractedAt) > cutoff
    )
    await saveLifeEvents(cleaned)
  } catch (e) {
    console.error('addLifeEvents error:', e)
  }
}

export async function markEventCheckedIn(eventId: string): Promise<void> {
  const all = await loadLifeEvents()
  const idx = all.findIndex(e => e.id === eventId)
  if (idx >= 0) {
    all[idx].status = 'checked_in'
    await saveLifeEvents(all)
  }
}

// --- Local time helper ---

const WEEKDAY_ZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function getTimeOfDayLabel(hour: number): string {
  if (hour >= 5 && hour < 9) return '早上'
  if (hour >= 9 && hour < 12) return '上午'
  if (hour >= 12 && hour < 14) return '中午'
  if (hour >= 14 && hour < 18) return '下午'
  if (hour >= 18 && hour < 21) return '傍晚'
  if (hour >= 21 && hour < 24) return '晚上'
  return '深夜'
}

function buildLocalTimeString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = now.getHours()
  const minute = String(now.getMinutes()).padStart(2, '0')
  const weekday = WEEKDAY_ZH[now.getDay()]
  const timeLabel = getTimeOfDayLabel(hour)
  const hourStr = String(hour).padStart(2, '0')
  return `${year}-${month}-${day} ${hourStr}:${minute} ${weekday} ${timeLabel}`
}

// --- Build context for API call ---

export async function buildContextPayload(): Promise<ContextPayload> {
  const [userProfile, emotionTrajectory, recentSummaries, pendingEvents] = await Promise.all([
    loadUserProfile(),
    loadEmotionTrajectory(),
    loadRecentSummaries(3),
    loadPendingEvents()
  ])

  return {
    userProfile,
    emotionTrajectory,
    recentSummaries,
    pendingEvents,
    localTime: buildLocalTimeString()
  }
}

// --- Post-conversation extraction ---

export async function extractAndSaveContext(
  conversationId: string,
  apiMessages: { role: string; content: string }[]
): Promise<LifeEvent[]> {
  try {
    const existingProfile = await loadUserProfile()

    const response = await fetch(`${DOMAIN}/context/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId,
        messages: apiMessages,
        existingProfile
      })
    })

    if (!response.ok) {
      console.error('Context extraction failed:', response.status)
      return []
    }

    const result = await response.json()

    console.log(`[CLIENT] ====== Context Extraction Result ======`)
    console.log(`[CLIENT] Profile: name=${result.userProfile?.name}, interests=[${result.userProfile?.interests?.join(',')}]`)
    console.log(`[CLIENT] Emotion: ${result.emotion?.dominantEmotion} (${result.emotion?.intensity}/5)`)
    console.log(`[CLIENT] Summary: ${result.summary?.summary}`)
    console.log(`[CLIENT] Life Events: ${result.lifeEvents?.length || 0} found`)

    // Save profile, emotion, summary in parallel
    const saves: Promise<void>[] = [
      saveUserProfile(result.userProfile),
      addEmotionEntry(result.emotion),
      addConversationSummary(result.summary)
    ]

    // Save life events + schedule notifications if any were extracted
    if (result.lifeEvents && result.lifeEvents.length > 0) {
      result.lifeEvents.forEach((e: LifeEvent, i: number) => {
        console.log(`[CLIENT]   Event ${i + 1}: "${e.description}"`)
        console.log(`[CLIENT]     eventTime: ${e.eventTime}`)
        console.log(`[CLIENT]     checkInType: ${e.checkInType}`)
        console.log(`[CLIENT]     checkInTime: ${e.checkInTime}`)
        console.log(`[CLIENT]     sentiment: ${e.sentiment}`)
      })
      saves.push(addLifeEvents(result.lifeEvents))
      saves.push(scheduleCheckInNotifications(result.lifeEvents))
    }

    await Promise.all(saves)

    console.log(`[CLIENT] ====== All saved to AsyncStorage ======\n`)

    return result.lifeEvents || []
  } catch (e) {
    console.error('extractAndSaveContext error:', e)
    return []
  }
}

// --- Notification scheduling ---

async function scheduleCheckInNotifications(events: LifeEvent[]): Promise<void> {
  try {
    // Dynamic import to avoid crash if expo-notifications isn't installed yet
    const Notifications = await import('expo-notifications')
    const { SchedulableTriggerInputTypes } = Notifications

    // Request permissions if needed
    const { status } = await Notifications.getPermissionsAsync()
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync()
      if (newStatus !== 'granted') {
        console.log('Notification permission denied, skipping check-in scheduling')
        return
      }
    }

    console.log(`[NOTIFY] Scheduling ${events.length} notifications...`)

    for (const event of events) {
      const checkInDate = new Date(event.checkInTime)
      const now = new Date()

      // Skip if check-in time is already past
      if (checkInDate <= now) {
        console.log(`[NOTIFY] SKIP "${event.description}" — checkInTime ${event.checkInTime} is in the past`)
        continue
      }

      // Build the notification message based on type and sentiment
      let title: string
      let body: string

      if (event.checkInType === 'before') {
        if (event.sentiment === 'anxious') {
          title = '小知了想对你说 💪'
          body = `"${event.description}"快到了，你准备得很好的，加油！`
        } else if (event.sentiment === 'excited') {
          title = '小知了提醒你 ✨'
          body = `"${event.description}"快到啦，期待吧！`
        } else {
          title = '小知了提醒你 📋'
          body = `"${event.description}"快到了，别忘了哦`
        }
      } else {
        if (event.sentiment === 'anxious') {
          title = '小知了关心你 🤗'
          body = `"${event.description}"结束了吗？来聊聊感受吧`
        } else if (event.sentiment === 'excited') {
          title = '小知了想知道 😊'
          body = `"${event.description}"怎么样？来分享一下吧`
        } else {
          title = '小知了问候你 💬'
          body = `"${event.description}"进展如何？`
        }
      }

      console.log(`[NOTIFY] Scheduling: "${title}" — "${body}"`)
      console.log(`[NOTIFY]   Fire at: ${checkInDate.toISOString()} (in ${Math.round((checkInDate.getTime() - now.getTime()) / 60000)} min)`)

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { eventId: event.id, conversationId: event.conversationId }
        },
        trigger: { type: SchedulableTriggerInputTypes.DATE, date: checkInDate }
      })

      console.log(`[NOTIFY] Scheduled OK, notificationId=${notificationId}`)

      // Update the event with the notification ID
      event.notificationId = notificationId
    }

    // Re-save events with notification IDs
    await addLifeEvents(events)
  } catch (e) {
    // expo-notifications may not be installed yet — fail silently
    console.log('Notification scheduling skipped:', e)
  }
}
