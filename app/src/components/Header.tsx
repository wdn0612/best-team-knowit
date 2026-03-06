import {
  StyleSheet, View, Text, Platform
} from 'react-native'
import { useContext } from 'react'
import { Icon } from './Icon'
import { ThemeContext } from '../../src/context'
import { spacing } from '../theme'
import Ionicons from '@expo/vector-icons/Ionicons'
import { BlurView } from 'expo-blur'

type HeaderProps = {
  subtitle?: string
}

export function Header({ subtitle }: HeaderProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <View style={styles.shadowWrapper}>
      <BlurView
        intensity={60}
        tint={theme.label === 'light' || theme.label === 'hackerNews' ? 'light' : 'dark'}
        style={styles.container}
      >
        <Icon size={34} fill={theme.textColor} />
        {subtitle ? (
          <View style={styles.subtitleRow}>
            <Ionicons name="sparkles-outline" size={12} color={theme.mutedForegroundColor} />
            <Text style={styles.subtitleText}>{subtitle}</Text>
          </View>
        ) : null}
      </BlurView>
    </View>
  )
}

function getStyles(theme:any) {
  return StyleSheet.create({
    shadowWrapper: {
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    container: {
      paddingVertical: spacing.xl,
      justifyContent: 'center',
      alignItems: 'center',
    },
    subtitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.xs,
    },
    subtitleText: {
      fontFamily: theme.regularFont,
      fontSize: 12,
      color: theme.mutedForegroundColor,
      marginLeft: spacing.xs,
    },
  })
}
