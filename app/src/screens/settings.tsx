import {
  View,
  Text,
  StyleSheet,
  TouchableHighlight,
  ScrollView,
} from 'react-native'
import { useContext } from 'react'
import { ThemeContext } from '../context'
import * as themes from '../theme'
import { spacing } from '../theme'

const _themes = Object.values(themes).filter(v => typeof v === 'object' && v !== null && 'name' in v).map(v => ({
  name: (v as any).name,
  label: (v as any).label
}))

export function Settings() {
  const { theme, setTheme, themeName } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.titleContainer}>
        <Text style={styles.mainText}>Theme</Text>
      </View>
      {
        _themes.map((value, index) => (
          <TouchableHighlight
            key={index}
            underlayColor='transparent'
            onPress={() => {
              setTheme(value.label)
            }}
            accessibilityLabel={`Select ${value.name} theme`}
            accessibilityRole="button"
            accessibilityState={{ selected: themeName === value.label }}
          >
            <View
              style={{
                ...styles.chatChoiceButton,
                ...getDynamicViewStyle(themeName, value.label, theme)
              }}
            >
            <Text
              style={{
                ...styles.optionText,
                ...getDynamicTextStyle(themeName, value.label, theme)
              }}
            >
              {value.name}
            </Text>
          </View>
        </TouchableHighlight>
        ))
      }
      <View style={styles.titleContainer}>
        <Text style={styles.mainText}>Chat Model</Text>
      </View>
      <View style={styles.modelInfoContainer}>
        <Text style={styles.modelText}>ChatGLM 5.0</Text>
        <Text style={styles.modelSubtext}>Powered by Zhipu AI</Text>
      </View>
    </ScrollView>
  )
}

function getDynamicTextStyle(baseType:string, type:string, theme:any) {
  if (type === baseType) {
    return {
      color: theme.tintTextColor,
    }
  } else return {}
}

function getDynamicViewStyle(baseType:string, type:string, theme:any) {
  if (type === baseType) {
    return {
      backgroundColor: theme.tintColor
    }
  } else return {}
}

const getStyles = (theme:any) => StyleSheet.create({
  container: {
    padding: spacing.lg,
    flex: 1,
    backgroundColor: theme.backgroundColor,
    paddingTop: spacing.md,
  },
  contentContainer: {
    paddingBottom: 40
  },
  titleContainer: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  chatChoiceButton: {
    padding: spacing.lg,
    borderRadius: spacing.sm,
    flexDirection: 'row'
  },
  optionText: {
    fontFamily: theme.semiBoldFont,
    color: theme.textColor
  },
  mainText: {
    fontFamily: theme.boldFont,
    fontSize: 18,
    color: theme.textColor
  },
  modelInfoContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: theme.tintColor,
    borderRadius: spacing.sm,
  },
  modelText: {
    fontFamily: theme.semiBoldFont,
    color: theme.tintTextColor,
    fontSize: 15,
  },
  modelSubtext: {
    fontFamily: theme.regularFont,
    color: theme.tintTextColor,
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
})
