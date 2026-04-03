import { DOMAIN } from '../constants'
import EventSource from 'react-native-sse'
import { buildContextPayload } from './contextStorage'

/**
 * Threshold: when apiMessages exceeds this count, compress older messages.
 * We keep the most recent RECENT_KEEP messages in full.
 */
const COMPACT_THRESHOLD = 16
const RECENT_KEEP = 10

/**
 * Cache for compacted summaries within a single chat session.
 * Key: chatId, Value: { summary, compactedUpTo }
 */
const compactCache = new Map<string, { summary: string; compactedUpTo: number }>()

export function clearCompactCache(chatId: string) {
  compactCache.delete(chatId)
}

/**
 * Compact older messages into a summary if the conversation is long enough.
 * Returns the messages array to send to the API (possibly with a summary prefix).
 */
async function maybeCompact(
  chatId: string,
  apiMessages: { role: string; content: string }[]
): Promise<{ role: string; content: string }[]> {
  if (apiMessages.length <= COMPACT_THRESHOLD) {
    return apiMessages
  }

  const splitAt = apiMessages.length - RECENT_KEEP
  const cached = compactCache.get(chatId)

  // If we already compacted up to this split point, reuse
  if (cached && cached.compactedUpTo === splitAt) {
    return [
      { role: 'system', content: `【之前的对话摘要】\n${cached.summary}` },
      ...apiMessages.slice(splitAt)
    ]
  }

  // Need to compact the older portion
  const olderMessages = apiMessages.slice(0, splitAt)

  try {
    console.log(`[COMPACT] Compacting ${olderMessages.length} messages (keeping recent ${RECENT_KEEP})`)

    const response = await fetch(`${DOMAIN}/chat/compact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: olderMessages })
    })

    if (!response.ok) {
      console.error('[COMPACT] Server error, sending full messages')
      return apiMessages
    }

    const { summary } = await response.json()

    if (!summary) {
      return apiMessages
    }

    // Cache the result
    compactCache.set(chatId, { summary, compactedUpTo: splitAt })

    console.log(`[COMPACT] Done: ${olderMessages.length} messages → ${summary.length} chars`)

    return [
      { role: 'system', content: `【之前的对话摘要】\n${summary}` },
      ...apiMessages.slice(splitAt)
    ]
  } catch (err) {
    console.error('[COMPACT] Failed, falling back to full messages:', err)
    return apiMessages
  }
}

export async function getEventSource({
  headers,
  body,
  type,
  chatId
} : {
  headers?: any,
  body: any,
  type: string,
  chatId?: string
}) {
  // Compact long conversations before sending
  if (chatId && body.messages) {
    body = { ...body, messages: await maybeCompact(chatId, body.messages) }
  }

  // Attach user context to agent requests
  if (type === 'agent') {
    const context = await buildContextPayload()
    body = { ...body, context }
  }

  const es = new EventSource(`${DOMAIN}/chat/${type}`, {
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    method: 'POST',
    body: JSON.stringify(body),
  })

  return es;
}

export function getFirstNCharsOrLess(text:string, numChars:number = 1000) {
  if (text.length <= numChars) {
    return text;
  }
  return text.substring(0, numChars);
}

export function getFirstN({ messages, size = 10 } : { size?: number, messages: any[] }) {
  if (messages.length > size) {
    const firstN = new Array()
    for(let i = 0; i < size; i++) {
      firstN.push(messages[i])
    }
    return firstN
  } else {
    return messages
  }
}
