import { View, ViewStyle, StyleSheet } from 'react-native'
import { useContext } from 'react'
import { ThemeContext } from '../context'
import { spacing } from '../theme'

type CardProps = {
  children: React.ReactNode
  style?: ViewStyle
  elevated?: boolean
}

export function Card({ children, style, elevated = false }: CardProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme, elevated)

  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  )
}

const getStyles = (theme: any, elevated: boolean) => StyleSheet.create({
  card: {
    backgroundColor: theme.cardBackgroundColor,
    borderRadius: 16,
    padding: spacing.xl,
    ...(elevated ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
    } : {}),
  },
})
