import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = 'rnai-chat-histories'
const GEMS_KEY = 'rnai-gems'

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
}

export function getDefaultGems(): GemCard[] {
  return [
    { id: '1', text: 'Fake it till you make it', category: '每日灵感', source: '小知了 · 每日一句' },
    { id: '2', text: '戒掉过度自省，享受缺德人生', category: '人生哲学', source: '小知了 · 每日一句' },
    { id: '3', text: '把期望降低，把付出当礼物，你就赢了', category: '心态修炼', source: '小知了 · 每日一句' },
    { id: '4', text: 'Done is better than perfect', category: '效率法则', source: '小知了 · 每日一句' },
    { id: '5', text: '允许一切发生', category: '人生哲学', source: '小知了 · 每日一句' },
  ]
}

export async function saveGems(gems: GemCard[]): Promise<void> {
  try {
    await AsyncStorage.setItem(GEMS_KEY, JSON.stringify(gems))
  } catch (e) {
    console.error('saveGems error:', e)
  }
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
