import { View, TextInput, StyleSheet } from 'react-native'
import { useContext } from 'react'
import { ThemeContext } from '../context'
import { spacing } from '../theme'

type ChatInputProps = {
  value: string
  onChangeText: (text: string) => void
  onSubmit: () => void
  placeholder?: string
  leftAction?: React.ReactNode
  rightAction?: React.ReactNode
}

export function ChatInput({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Message',
  leftAction,
  rightAction,
}: ChatInputProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <View style={styles.container}>
      {leftAction}
      <TextInput
        style={styles.input}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.placeholderTextColor}
        value={value}
        onSubmitEditing={onSubmit}
        returnKeyType="send"
        accessibilityLabel={placeholder}
      />
      {rightAction}
    </View>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 99,
    color: theme.textColor,
    marginHorizontal: spacing.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.xl,
    borderColor: theme.borderColor,
    fontFamily: theme.semiBoldFont,
  },
})
