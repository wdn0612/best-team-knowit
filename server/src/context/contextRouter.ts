import express from 'express'
import asyncHandler from 'express-async-handler'
import { extractUserProfile, extractEmotionAndSummary } from './extractContext'
import { extractLifeEvents } from './extractLifeEvents'
import { EMPTY_PROFILE } from './types'

const router = express.Router()

/**
 * POST /context/extract
 * Called by the client after a conversation ends.
 * Receives the conversation messages + existing profile,
 * returns updated profile + emotion + summary + life events.
 */
router.post('/extract', asyncHandler(async (req, res) => {
  const {
    conversationId,
    messages,
    existingProfile
  } = req.body

  console.log(`\n[CONTEXT] ====== POST /context/extract ======`)
  console.log(`[CONTEXT] conversationId: ${conversationId}`)
  console.log(`[CONTEXT] messages count: ${messages?.length || 0}`)
  console.log(`[CONTEXT] existing profile name: ${existingProfile?.name || '(none)'}`)
  if (messages && Array.isArray(messages)) {
    messages.forEach((m: any, i: number) => {
      console.log(`[CONTEXT]   [${i}] ${m.role}: ${m.content?.slice(0, 200)}${m.content?.length > 200 ? '...' : ''}`)
    })
  }
  console.log(`[CONTEXT] Starting 3 parallel extractions...`)

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    console.log(`[CONTEXT] ERROR: no messages provided`)
    res.status(400).json({ error: 'messages array is required' })
    return
  }

  const profile = existingProfile || EMPTY_PROFILE
  const now = new Date().toISOString()
  const startTime = Date.now()

  // Run all three extractions in parallel
  const [updatedProfile, emotionAndSummary, lifeEvents] = await Promise.all([
    extractUserProfile(profile, messages),
    extractEmotionAndSummary(conversationId || 'unknown', messages),
    extractLifeEvents(conversationId || 'unknown', messages, now)
  ])

  const elapsed = Date.now() - startTime
  console.log(`[CONTEXT] ------ Extraction Results (${elapsed}ms) ------`)
  console.log(`[CONTEXT] Profile: name=${updatedProfile.name}, interests=[${updatedProfile.interests.join(',')}], goals=[${updatedProfile.goals.join(',')}]`)
  console.log(`[CONTEXT] Emotion: ${emotionAndSummary.emotion.dominantEmotion} (${emotionAndSummary.emotion.intensity}/5), triggers=[${emotionAndSummary.emotion.triggers.join(',')}]`)
  console.log(`[CONTEXT] Summary: ${emotionAndSummary.summary.summary}`)
  console.log(`[CONTEXT] Life Events: ${lifeEvents.length} found`)
  lifeEvents.forEach((e, i) => {
    console.log(`[CONTEXT]   Event ${i + 1}: "${e.description}" at ${e.eventTime}, checkIn=${e.checkInType} at ${e.checkInTime}, sentiment=${e.sentiment}`)
  })
  console.log(`[CONTEXT] ====== Done ======\n`)

  res.json({
    userProfile: updatedProfile,
    emotion: emotionAndSummary.emotion,
    summary: emotionAndSummary.summary,
    lifeEvents
  })
}))

export default router
