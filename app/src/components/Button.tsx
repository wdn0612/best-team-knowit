import { TouchableHighlight, View, Text, StyleSheet } from 'react-native'
import { useContext } from 'react'
import { ThemeContext } from '../context'
import { spacing } from '../theme'

type ButtonProps = {
  variant?: 'primary' | 'icon' | 'ghost'
  onPress: () => void
  children: React.ReactNode
  accessibilityLabel: string
  style?: any
}

export function Button({ variant = 'primary', onPress, children, accessibilityLabel, style }: ButtonProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  const containerStyle = variant === 'primary'
    ? styles.primary
    : variant === 'icon'
    ? styles.icon
    : styles.ghost

  return (
    <TouchableHighlight
      onPress={onPress}
      underlayColor="transparent"
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      <View style={[containerStyle, style]}>
        {children}
      </View>
    </TouchableHighlight>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  primary: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 99,
    backgroundColor: theme.tintColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    padding: spacing.sm,
    borderRadius: 99,
    backgroundColor: theme.tintColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ghost: {
    padding: spacing.sm,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: theme.borderColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
