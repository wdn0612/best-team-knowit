import {
  StyleSheet, View, Text
} from 'react-native'
import { useContext } from 'react'
import { Icon } from './Icon'
import { ThemeContext } from '../../src/context'
import { spacing } from '../theme'
import Ionicons from '@expo/vector-icons/Ionicons'

type HeaderProps = {
  subtitle?: string
}

export function Header({ subtitle }: HeaderProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <View style={styles.container}>
      <Icon size={34} fill={theme.textColor} />
      {subtitle ? (
        <View style={styles.subtitleRow}>
          <Ionicons name="sparkles-outline" size={12} color={theme.mutedForegroundColor} />
          <Text style={styles.subtitleText}>{subtitle}</Text>
        </View>
      ) : null}
    </View>
  )
}

function getStyles(theme:any) {
  return StyleSheet.create({
    container: {
      paddingVertical: spacing.lg,
      backgroundColor: theme.backgroundColor,
      justifyContent: 'center',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor
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
