import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = 'rnai-chat-histories'
const GEMS_KEY = 'rnai-gems'
const GEM_CATEGORIES_KEY = 'rnai-gem-categories'

const DEFAULT_CATEGORIES = ['每日灵感', '人生哲学', '技术洞见', '金句', '心态修炼', '效率法则']

export type AssistantBlock =
  | { type: 'thinking'; content: string }
  | { type: 'tool_start'; name: string; label?: string; args?: string }
  | { type: 'tool_result'; name: string; label?: string; result: string }
  | { type: 'text'; content: string }

export type ChatHistory = {
  id: string
  modelLabel: string
  title: string
  messages: Array<{ user: string; assistant?: string; blocks?: AssistantBlock[] }>
  createdAt: number
  updatedAt: number
}

export async function saveChatHistory(history: ChatHistory): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    const all: ChatHistory[] = raw ? JSON.parse(raw) : []
    const idx = all.findIndex(h => h.id === history.id)
    if (idx >= 0) {
      all[idx] = history
    } else {
      all.push(history)
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch (e) {
    console.error('saveChatHistory error:', e)
  }
}

export async function loadAllChatHistories(): Promise<ChatHistory[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    const all: ChatHistory[] = raw ? JSON.parse(raw) : []
    return all.sort((a, b) => b.updatedAt - a.updatedAt)
  } catch (e) {
    console.error('loadAllChatHistories error:', e)
    return []
  }
}

export async function deleteChatHistory(id: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    const all: ChatHistory[] = raw ? JSON.parse(raw) : []
    const filtered = all.filter(h => h.id !== id)
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (e) {
    console.error('deleteChatHistory error:', e)
  }
}

// --- Gems ---

export type GemCard = {
  id: string
  text: string
  category: string
  source: string
  createdAt?: number
}

export function getDefaultGems(): GemCard[] {
  // Spread default gems across the last 5 days so date filtering has something to show
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  return [
    { id: '1', text: 'Fake it till you make it', category: '每日灵感', source: '小知了 · 每日一句', createdAt: now - 4 * day },
    { id: '2', text: '戒掉过度自省，享受缺德人生', category: '人生哲学', source: '小知了 · 每日一句', createdAt: now - 3 * day },
    { id: '3', text: '把期望降低，把付出当礼物，你就赢了', category: '心态修炼', source: '小知了 · 每日一句', createdAt: now - 2 * day },
    { id: '4', text: 'Done is better than perfect', category: '效率法则', source: '小知了 · 每日一句', createdAt: now - 1 * day },
    { id: '5', text: '允许一切发生', category: '人生哲学', source: '小知了 · 每日一句', createdAt: now },
  ]
}

export async function saveGems(gems: GemCard[]): Promise<void> {
  try {
    await AsyncStorage.setItem(GEMS_KEY, JSON.stringify(gems))
  } catch (e) {
    console.error('saveGems error:', e)
  }
}

export async function addGem(gem: GemCard): Promise<void> {
  const gems = await loadGems()
  gems.unshift({ createdAt: Date.now(), ...gem })
  await saveGems(gems)
}

export async function deleteGem(id: string): Promise<void> {
  const gems = await loadGems()
  await saveGems(gems.filter(g => g.id !== id))
}

export async function loadGems(): Promise<GemCard[]> {
  try {
    const raw = await AsyncStorage.getItem(GEMS_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
    return getDefaultGems()
  } catch (e) {
    console.error('loadGems error:', e)
    return getDefaultGems()
  }
}

// ---------------------------------------------------------------------------
// Device-level onboarding completion flag
//
// DEVICE-SCOPED (not user-scoped): this flag is written to AsyncStorage which
// is tied to the app install on the device. It persists across logout/re-login
// and is only cleared when the app is uninstalled or storage is manually wiped.
// It records the ISO timestamp of when the 5-question flow was first completed
// on this device, ensuring the flow is never shown again on the same device.
// ---------------------------------------------------------------------------

const ONBOARDING_QUESTIONS_COMPLETED_AT_KEY = 'onboarding_questions_completed_at'

/**
 * Mark the 5-question onboarding flow as completed on this device.
 * Writes the current ISO timestamp. Idempotent — safe to call multiple times.
 */
export async function markOnboardingQuestionsCompleted(): Promise<void> {
  try {
    await AsyncStorage.setItem(
      ONBOARDING_QUESTIONS_COMPLETED_AT_KEY,
      new Date().toISOString()
    )
  } catch (e) {
    console.error('markOnboardingQuestionsCompleted error:', e)
  }
}

/**
 * Returns the ISO timestamp string if the 5-question flow was previously
 * completed on this device, or null if it has not been completed yet.
 */
export async function getOnboardingQuestionsCompletedAt(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ONBOARDING_QUESTIONS_COMPLETED_AT_KEY)
  } catch (e) {
    console.error('getOnboardingQuestionsCompletedAt error:', e)
    return null
  }
}
