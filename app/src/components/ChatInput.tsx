import { View, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { useContext } from 'react'
import { ThemeContext } from '../context'
import { spacing } from '../theme'
import { LinearGradient } from 'expo-linear-gradient'
import Ionicons from '@expo/vector-icons/Ionicons'

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
  placeholder = '想说点什么……',
  leftAction,
  rightAction,
}: ChatInputProps) {
  const { theme } = useContext(ThemeContext)
  const isXinji = theme.label === 'xinji'

  if (isXinji) {
    return (
      <View style={xinjiStyles.container}>
        <View style={xinjiStyles.inputWrap}>
          <TextInput
            style={xinjiStyles.input}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#96A6AC"
            value={value}
            onSubmitEditing={onSubmit}
            returnKeyType="send"
          />
          <TouchableOpacity onPress={onSubmit} activeOpacity={0.8} style={xinjiStyles.sendBtn}>
            <LinearGradient
              colors={['#BDEDE5', '#CFEFF3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={xinjiStyles.sendGradient}
            />
            <Ionicons name="arrow-up" size={16} color="#31444A" />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

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
      />
      {rightAction}
    </View>
  )
}

const xinjiStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: 26,
    paddingVertical: 5,
    paddingLeft: 16,
    paddingRight: 5,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(73,108,116,0.04)',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 1,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#304148',
    paddingVertical: 7,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
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
  sendGradient: {
    ...StyleSheet.absoluteFillObject,
  },
})

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
    borderWidth: 0,
    borderRadius: 20,
    borderCurve: 'continuous',
    color: theme.textColor,
    marginHorizontal: spacing.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.xl,
    backgroundColor: theme.cardBackgroundColor,
    fontFamily: theme.semiBoldFont,
  },
})
