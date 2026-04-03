import { View, ViewStyle, StyleSheet, Platform } from 'react-native'
import { BlurView } from 'expo-blur'
import { useContext } from 'react'
import { ThemeContext } from '../context'

type GlassCardProps = {
  children: React.ReactNode
  style?: ViewStyle
  borderRadius?: number
  blurIntensity?: number
}

export function GlassCard({
  children,
  style,
  borderRadius = 26,
  blurIntensity = 20,
}: GlassCardProps) {
  const { theme } = useContext(ThemeContext)
  const isXinji = theme.label === 'xinji'

  if (!isXinji) {
    return (
      <View style={[{
        backgroundColor: theme.cardBackgroundColor,
        borderRadius,
        padding: 20,
        ...Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          },
          android: { elevation: 4 },
        }),
      }, style]}>
        {children}
      </View>
    )
  }

  return (
    <View style={[styles.wrapper, { borderRadius }, style]}>
      <BlurView
        intensity={blurIntensity}
        tint="light"
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />
      <View style={[styles.overlay, { borderRadius }]} />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.55)',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(73,108,116,0.10)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 24,
      },
      android: { elevation: 6 },
    }),
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.58)',
  },
  content: {
    padding: 20,
  },
})
