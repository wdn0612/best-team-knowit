import { StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useContext } from 'react'
import { ThemeContext } from '../context'

type GradientBackgroundProps = {
  children: React.ReactNode
}

export function GradientBackground({ children }: GradientBackgroundProps) {
  const { theme } = useContext(ThemeContext)
  const isXinji = theme.label === 'xinji'

  if (!isXinji) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        {children}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={['#BFE7EA', '#D4EEF0', '#E2F4F2', '#EAF6F4']}
          locations={[0, 0.35, 0.6, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.45, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.glowTopLeft} />
        <View style={styles.glowBottomRight} />
      </View>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glowTopLeft: {
    position: 'absolute',
    top: '-5%',
    left: '5%',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255,255,255,0.32)',
    opacity: 0.6,
  },
  glowBottomRight: {
    position: 'absolute',
    bottom: '10%',
    right: '-5%',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(184,215,232,0.18)',
    opacity: 0.5,
  },
})
