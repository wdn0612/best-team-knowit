import { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput,
  Animated, Dimensions, Platform, Easing,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Ionicons from '@expo/vector-icons/Ionicons'

const { width: SW, height: SH } = Dimensions.get('window')

type InsightOverlayProps = {
  visible: boolean
  text: string
  onClose: () => void
  onSave: (text: string) => void
  tabBarTarget?: { x: number; y: number }
}

export function InsightOverlay({ visible, text, onClose, onSave, tabBarTarget }: InsightOverlayProps) {
  const [phase, setPhase] = useState<'loading' | 'revealed' | 'editing' | 'saving'>('loading')
  const [editText, setEditText] = useState(text)

  // Animations
  const bgOpacity = useRef(new Animated.Value(0)).current
  const cardScale = useRef(new Animated.Value(0.92)).current
  const cardOpacity = useRef(new Animated.Value(0)).current
  const contentOpacity = useRef(new Animated.Value(0)).current
  const contentBlur = useRef(new Animated.Value(6)).current
  const shimmerPos = useRef(new Animated.Value(1.3)).current
  const shimmerOpacity = useRef(new Animated.Value(0)).current
  const closeOpacity = useRef(new Animated.Value(0)).current
  const actionsOpacity = useRef(new Animated.Value(0)).current

  // Orb animations
  const orb1Anim = useRef(new Animated.Value(0)).current
  const orb2Anim = useRef(new Animated.Value(0)).current

  // Shrink + fly
  const shrinkScale = useRef(new Animated.Value(1)).current
  const shrinkOpacity = useRef(new Animated.Value(1)).current
  const flyDotX = useRef(new Animated.Value(SW / 2)).current
  const flyDotY = useRef(new Animated.Value(SH / 2)).current
  const flyDotOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      setEditText(text)
      setPhase('loading')
      resetAnims()
      startEntrance()
    }
  }, [visible, text])

  function resetAnims() {
    bgOpacity.setValue(0)
    cardScale.setValue(0.92)
    cardOpacity.setValue(0)
    contentOpacity.setValue(0)
    shimmerPos.setValue(1.3)
    shimmerOpacity.setValue(0)
    closeOpacity.setValue(0)
    actionsOpacity.setValue(0)
    shrinkScale.setValue(1)
    shrinkOpacity.setValue(1)
    flyDotOpacity.setValue(0)
  }

  function startEntrance() {
    // Show overlay bg + card
    Animated.parallel([
      Animated.timing(bgOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, damping: 15 }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start()

    // Start orb loops
    startOrbAnimation()

    // Reveal content after "generation" delay
    setTimeout(() => {
      setPhase('revealed')
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(closeOpacity, { toValue: 1, duration: 300, delay: 200, useNativeDriver: true }),
        Animated.timing(actionsOpacity, { toValue: 1, duration: 300, delay: 200, useNativeDriver: true }),
      ]).start()

      // Shimmer sweep
      shimmerOpacity.setValue(1)
      Animated.timing(shimmerPos, {
        toValue: -0.3,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        shimmerOpacity.setValue(0)
      })
    }, 1800)
  }

  function startOrbAnimation() {
    Animated.loop(
      Animated.timing(orb1Anim, { toValue: 1, duration: 4800, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
    ).start()
    Animated.loop(
      Animated.timing(orb2Anim, { toValue: 1, duration: 6200, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
    ).start()
  }

  function handleEdit() {
    setPhase('editing')
  }

  function handleSaveWithAnimation() {
    setPhase('saving')

    // Shrink card to dot
    Animated.parallel([
      Animated.timing(shrinkScale, { toValue: 0.02, duration: 500, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }),
      Animated.timing(shrinkOpacity, { toValue: 0, duration: 350, delay: 150, useNativeDriver: true }),
      Animated.timing(closeOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(actionsOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      // Show fly dot
      flyDotX.setValue(SW / 2 - 11)
      flyDotY.setValue(SH / 2 - 11)
      flyDotOpacity.setValue(1)

      // Fly to tab bar target
      const targetX = tabBarTarget?.x ?? (SW * 2 / 3)
      const targetY = tabBarTarget?.y ?? (SH - 60)

      Animated.parallel([
        Animated.timing(flyDotX, {
          toValue: targetX,
          duration: 850,
          easing: Easing.bezier(0.4, 0, 0.15, 1),
          useNativeDriver: true,
        }),
        Animated.timing(flyDotY, {
          toValue: targetY,
          duration: 850,
          easing: Easing.bezier(0.4, 0, 0.15, 1),
          useNativeDriver: true,
        }),
        Animated.timing(flyDotOpacity, {
          toValue: 0,
          duration: 300,
          delay: 600,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.timing(bgOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
          onSave(editText)
        })
      })
    })
  }

  function handleClose() {
    Animated.parallel([
      Animated.timing(bgOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      onClose()
    })
  }

  // Orb interpolations
  const orb1TranslateX = orb1Anim.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: [20, 130, 180, 110, 20, 20],
  })
  const orb1TranslateY = orb1Anim.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: [30, 15, 100, 170, 110, 30],
  })
  const orb1Opacity = orb1Anim.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: [0.35, 0.85, 0.55, 0.9, 0.5, 0.35],
  })

  const orb2TranslateX = orb2Anim.interpolate({
    inputRange: [0, 0.3, 0.6, 1],
    outputRange: [160, 190, 80, 160],
  })
  const orb2TranslateY = orb2Anim.interpolate({
    inputRange: [0, 0.3, 0.6, 1],
    outputRange: [200, 70, 20, 200],
  })
  const orb2Opacity = orb2Anim.interpolate({
    inputRange: [0, 0.3, 0.6, 1],
    outputRange: [0.25, 0.65, 0.45, 0.25],
  })

  if (!visible) return null

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[styles.overlay, { opacity: bgOpacity }]}>
        {/* Card */}
        <Animated.View style={[styles.card, {
          transform: [{ scale: Animated.multiply(cardScale, shrinkScale) }],
          opacity: Animated.multiply(cardOpacity, shrinkOpacity),
        }]}>
          <LinearGradient
            colors={['#C8E3EC', '#A8CDD8', '#8FBFCE']}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Orbs — only during loading */}
          {phase === 'loading' && (
            <>
              <Animated.View style={[styles.orb, {
                opacity: orb1Opacity,
                transform: [{ translateX: orb1TranslateX }, { translateY: orb1TranslateY }],
              }]} />
              <Animated.View style={[styles.orb2, {
                opacity: orb2Opacity,
                transform: [{ translateX: orb2TranslateX }, { translateY: orb2TranslateY }],
              }]} />
            </>
          )}

          {/* Loading indicator */}
          {phase === 'loading' && (
            <View style={styles.loadingWrap}>
              <View style={styles.dots}>
                <LoadingDot delay={0} />
                <LoadingDot delay={180} />
                <LoadingDot delay={360} />
              </View>
              <Text style={styles.loadingText}>正在生成洞察卡片</Text>
            </View>
          )}

          {/* Content */}
          <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
            {phase === 'editing' ? (
              <TextInput
                style={styles.editInput}
                value={editText}
                onChangeText={setEditText}
                multiline
                autoFocus
              />
            ) : (
              <Text style={styles.quoteText}>{editText}</Text>
            )}
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.')} · 洞察时刻
            </Text>
          </Animated.View>

          {/* Shimmer */}
          <Animated.View style={[styles.shimmer, {
            opacity: shimmerOpacity,
            transform: [{ translateX: shimmerPos.interpolate({
              inputRange: [-0.3, 1.3],
              outputRange: [-SW * 0.7, SW * 0.7],
            }) }],
          }]} />

          {/* Close button */}
          <Animated.View style={[styles.closeBtn, { opacity: closeOpacity }]}>
            <TouchableOpacity onPress={handleClose} style={styles.closeTouchable}>
              <Ionicons name="close" size={14} color="#1A3545" style={{ opacity: 0.6 }} />
            </TouchableOpacity>
          </Animated.View>

          {/* Action buttons */}
          <Animated.View style={[styles.actions, { opacity: actionsOpacity }]}>
            <TouchableOpacity style={styles.actBtn} onPress={handleEdit}>
              <Ionicons name="pencil-outline" size={14} color="#1A3545" style={{ opacity: 0.6 }} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actBtn} onPress={handleSaveWithAnimation}>
              <Ionicons name="bookmark-outline" size={14} color="#1A3545" style={{ opacity: 0.6 }} />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Flying dot */}
        <Animated.View style={[styles.flyDot, {
          opacity: flyDotOpacity,
          transform: [{ translateX: flyDotX }, { translateY: flyDotY }],
        }]}>
          <LinearGradient
            colors={['#BDEDE5', '#CFEFF3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </Animated.View>
    </Modal>
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
    <Animated.View style={[styles.dot, {
      opacity: anim,
      transform: [{ scale: anim.interpolate({ inputRange: [0.3, 1], outputRange: [0.85, 1.15] }) }],
    }]} />
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20,34,40,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 36,
  },
  card: {
    width: '100%',
    maxWidth: 290,
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
  orb: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.40)',
    zIndex: 2,
  },
  orb2: {
    position: 'absolute',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255,255,255,0.25)',
    zIndex: 2,
  },
  loadingWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    zIndex: 3,
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
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
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
    paddingHorizontal: 26,
    zIndex: 1,
  },
  quoteText: {
    fontSize: 17,
    lineHeight: 31,
    fontWeight: '500',
    letterSpacing: 0.5,
    color: '#1A3545',
    fontFamily: 'LXGWWenKai-Medium',
  },
  editInput: {
    fontSize: 17,
    lineHeight: 31,
    fontWeight: '500',
    letterSpacing: 0.5,
    color: '#1A3545',
    backgroundColor: 'rgba(255,255,255,0.65)',
    padding: 12,
    borderRadius: 14,
  },
  dateText: {
    fontSize: 11,
    marginTop: 18,
    opacity: 0.5,
    color: '#1A3545',
  },
  shimmer: {
    position: 'absolute',
    top: -1,
    bottom: -1,
    width: '70%',
    zIndex: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 5,
  },
  closeTouchable: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    position: 'absolute',
    bottom: 18,
    right: 18,
    zIndex: 5,
    flexDirection: 'row',
    gap: 8,
  },
  actBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.30)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flyDot: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    overflow: 'hidden',
    zIndex: 68,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(185,236,227,0.7)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 18,
      },
      android: { elevation: 6 },
    }),
  },
})
