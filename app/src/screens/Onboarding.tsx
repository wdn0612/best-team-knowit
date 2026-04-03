import { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Platform, Easing,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Ionicons from '@expo/vector-icons/Ionicons'
import { saveUserProfile, type UserProfile, type ProfileItem, type ValueItem } from '../contextStorage'

const { width: SW } = Dimensions.get('window')

type OnboardingProps = {
  onComplete: () => void
}

const SLIDES = [
  {
    question: '最近的你，\n更接近哪种状态？',
    options: [
      '心里有些事，想找人聊聊',
      '日子还行，但偶尔会闷',
      '情绪起伏比较大，想理一理',
      '纯粹好奇，来看看',
    ],
  },
  {
    question: '心情不好的时候，\n你通常会？',
    options: [
      '自己消化，不太愿意说',
      '想找人倾诉，但不知道找谁',
      '写点东西，或者发个朋友圈',
      '做点别的事转移注意力',
    ],
  },
  {
    question: '和朋友聊心事时，\n你更希望对方？',
    options: [
      '安静地听，不急着给建议',
      '帮我分析问题，给我方向',
      '陪我吐槽，一起骂一骂',
      '说说 ta 自己的类似经历',
    ],
  },
  {
    question: '你觉得自己\n容易想太多吗？',
    options: [
      '是的，经常反复想一件事',
      '有时候会，看什么事',
      '不太会，比较大条',
      '不确定，没想过这个问题',
    ],
  },
  {
    question: '哪句话\n最让你有共鸣？',
    options: [
      '我不是不坚强，只是偶尔需要有人懂',
      '比起答案，我更需要被听见',
      '我想看清自己，而不是逃避',
      '有时候说出来，就好了一半',
    ],
  },
]

const INSIGHT_TEXT = '你不是不坚强，\n只是还没找到\n那个能放心说出口的地方。'

/**
 * Map onboarding answers to an initial UserProfile.
 * This is seed data only — subsequent conversations will iteratively
 * refine and overwrite these initial observations.
 */
function mapOnboardingToProfile(answers: number[]): UserProfile {
  const today = new Date().toISOString().slice(0, 10)
  const emotionalPatterns: ProfileItem[] = []
  let communicationStyle = ''
  let preferredResponseStyle = ''
  const values: ValueItem[] = []

  // Q1: 最近更接近哪种状态？ → emotionalPatterns
  const q1Map: Record<number, { text: string; why: string } | null> = {
    0: { text: '内心有倾诉需求', why: '初次使用时表示心里有事想聊' },
    1: { text: '整体平稳，偶尔低落', why: '初次使用时表示日子还行但偶尔会闷' },
    2: { text: '情绪波动较大', why: '初次使用时表示情绪起伏大，想梳理' },
    3: null,
  }
  const q1 = q1Map[answers[0]]
  if (q1) emotionalPatterns.push({ text: q1.text, why: q1.why, lastMentioned: today })

  // Q2: 心情不好时通常会？ → communicationStyle
  const q2Map: Record<number, string> = {
    0: '倾向内化情绪，不太主动表达，需要更多耐心引导',
    1: '渴望倾诉但缺少合适的对象',
    2: '习惯通过文字表达来处理情绪',
    3: '倾向用行动转移注意力，不太直面情绪',
  }
  communicationStyle = q2Map[answers[1]] || ''

  // Q3: 希望对方怎么回应？ → preferredResponseStyle
  const q3Map: Record<number, string> = {
    0: '安静倾听为主，不急于给建议',
    1: '帮助分析问题，给出方向',
    2: '情绪共鸣，陪伴为主',
    3: '分享类似经历，产生共鸣',
  }
  preferredResponseStyle = q3Map[answers[2]] || ''

  // Q4: 容易想太多吗？ → emotionalPatterns
  const q4Map: Record<number, { text: string; why: string } | null> = {
    0: { text: '容易反刍思考', why: '自述经常反复想一件事' },
    1: { text: '偶尔反刍思考', why: '自述有时候会反复想，看情况' },
    2: null,
    3: null,
  }
  const q4 = q4Map[answers[3]]
  if (q4) emotionalPatterns.push({ text: q4.text, why: q4.why, lastMentioned: today })

  // Q5: 哪句话最有共鸣？ → values
  const q5Map: Record<number, { text: string; evidence: string }> = {
    0: { text: '被理解和接纳', evidence: '共鸣于"不是不坚强，只是需要有人懂"' },
    1: { text: '被倾听', evidence: '共鸣于"比起答案，更需要被听见"' },
    2: { text: '自我觉察', evidence: '共鸣于"想看清自己，而不是逃避"' },
    3: { text: '表达与释放', evidence: '共鸣于"说出来就好了一半"' },
  }
  const q5 = q5Map[answers[4]]
  if (q5) values.push({ text: q5.text, evidence: q5.evidence, lastMentioned: today })

  return {
    emotionalPatterns,
    interests: [],
    goals: [],
    values,
    communicationStyle,
    importantPeople: [],
    preferredResponseStyle,
    updatedAt: Date.now(),
  }
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [showResult, setShowResult] = useState(false)
  const [resultRevealed, setResultRevealed] = useState(false)
  const slideAnim = useRef(new Animated.Value(0)).current
  const resultOpacity = useRef(new Animated.Value(0)).current
  const cardScale = useRef(new Animated.Value(0.92)).current
  const cardOpacity = useRef(new Animated.Value(0)).current
  const textOpacity = useRef(new Animated.Value(0)).current
  const ctaOpacity = useRef(new Animated.Value(0)).current

  function handlePick(optionIndex: number) {
    const newAnswers = [...answers]
    newAnswers[step] = optionIndex
    setAnswers(newAnswers)

    if (step < SLIDES.length - 1) {
      // Animate to next slide
      Animated.timing(slideAnim, {
        toValue: -(step + 1) * SW,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start()
      setStep(step + 1)
    } else {
      // Show result — save profile in background
      const profile = mapOnboardingToProfile(newAnswers)
      saveUserProfile(profile).catch(console.error)

      setShowResult(true)
      Animated.parallel([
        Animated.timing(resultOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, damping: 15 }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start()

      // Reveal text after delay (simulating generation)
      setTimeout(() => {
        setResultRevealed(true)
        Animated.parallel([
          Animated.timing(textOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(ctaOpacity, { toValue: 1, duration: 400, delay: 300, useNativeDriver: true }),
        ]).start()
      }, 2000)
    }
  }

  function handleBack() {
    if (step > 0) {
      Animated.timing(slideAnim, {
        toValue: -(step - 1) * SW,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start()
      setStep(step - 1)
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#BFE7EA', '#D4EEF0', '#E2F4F2', '#EAF6F4']}
        locations={[0, 0.35, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Progress dots */}
      <View style={styles.progress}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i <= step && styles.dotDone]} />
        ))}
      </View>

      {/* Slides */}
      {!showResult && (
        <Animated.View style={[styles.slidesRow, { transform: [{ translateX: slideAnim }] }]}>
          {SLIDES.map((slide, i) => (
            <View key={i} style={styles.slide}>
              {i > 0 && (
                <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                  <Ionicons name="chevron-back" size={18} color="#6E7F86" />
                </TouchableOpacity>
              )}
              <Text style={styles.question}>{slide.question}</Text>
              <View style={styles.options}>
                {slide.options.map((opt, oi) => (
                  <TouchableOpacity
                    key={oi}
                    style={styles.option}
                    activeOpacity={0.8}
                    onPress={() => handlePick(oi)}
                  >
                    <Text style={styles.optionText}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </Animated.View>
      )}

      {/* Result */}
      {showResult && (
        <Animated.View style={[styles.resultContainer, { opacity: resultOpacity }]}>
          <Text style={styles.resultMsg}>我好像有点认识你了</Text>

          <Animated.View style={[styles.insightCard, {
            transform: [{ scale: cardScale }],
            opacity: cardOpacity,
          }]}>
            <LinearGradient
              colors={['#C8E3EC', '#A8CDD8', '#8FBFCE']}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Loading dots */}
            {!resultRevealed && (
              <View style={styles.loadingContainer}>
                <View style={styles.loadingDots}>
                  <LoadingDot delay={0} />
                  <LoadingDot delay={180} />
                  <LoadingDot delay={360} />
                </View>
                <Text style={styles.loadingText}>正在生成你的第一个洞察</Text>
              </View>
            )}

            {/* Revealed content */}
            <Animated.View style={[styles.insightContent, { opacity: textOpacity }]}>
              <Text style={styles.insightText}>{INSIGHT_TEXT}</Text>
              <Text style={styles.insightDate}>你的第一个洞察时刻</Text>
            </Animated.View>
          </Animated.View>

          <Animated.View style={{ opacity: ctaOpacity }}>
            <TouchableOpacity style={styles.ctaBtn} onPress={onComplete} activeOpacity={0.85}>
              <Text style={styles.ctaText}>开始对话</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  )
}

function LoadingDot({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 750, delay, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 750, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [])

  return (
    <Animated.View style={[styles.loadingDot, {
      opacity: anim,
      transform: [{ scale: anim.interpolate({ inputRange: [0.3, 1], outputRange: [0.85, 1.15] }) }],
    }]} />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progress: {
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 66 : 40,
  },
  dot: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotDone: {
    backgroundColor: '#31444A',
  },
  slidesRow: {
    flexDirection: 'row',
    flex: 1,
  },
  slide: {
    width: SW,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 14,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  question: {
    fontSize: 22,
    fontWeight: '700',
    color: '#304148',
    lineHeight: 32,
    marginBottom: 28,
    letterSpacing: -0.3,
  },
  options: {
    gap: 10,
  },
  option: {
    padding: 14,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  optionText: {
    fontSize: 14.5,
    color: '#304148',
    lineHeight: 22,
  },
  // Result
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
  },
  resultMsg: {
    fontSize: 15,
    color: '#6E7F86',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  insightCard: {
    width: '100%',
    maxWidth: 260,
    aspectRatio: 3 / 4,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.28)',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(73,108,116,0.18)',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 1,
        shadowRadius: 40,
      },
      android: { elevation: 8 },
    }),
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    zIndex: 3,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 5,
  },
  loadingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  loadingText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  insightContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 28,
    paddingHorizontal: 24,
  },
  insightText: {
    fontSize: 16,
    lineHeight: 30,
    fontWeight: '500',
    letterSpacing: 0.5,
    color: '#1A3545',
    fontFamily: 'LXGWWenKai-Medium',
  },
  insightDate: {
    fontSize: 11,
    marginTop: 16,
    opacity: 0.5,
    color: '#1A3545',
  },
  ctaBtn: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 999,
    backgroundColor: '#BDEDE5',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(73,108,116,0.08)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#31444A',
  },
})
