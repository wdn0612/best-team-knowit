import {
  View,
  Text,
  StyleSheet,
  TouchableHighlight,
  ScrollView,
  Platform,
} from 'react-native'
import { useContext } from 'react'
import { ThemeContext } from '../context'
import * as themes from '../theme'
import { spacing } from '../theme'
import Ionicons from '@expo/vector-icons/Ionicons'

const _themes = Object.values(themes).filter(v => typeof v === 'object' && v !== null && 'name' in v).map(v => ({
  name: (v as any).name,
  label: (v as any).label,
  tintColor: (v as any).tintColor,
}))

export function Settings() {
  const { theme, setTheme, themeName } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Theme Section */}
      <Text style={styles.sectionHeader}>主题</Text>
      <View style={styles.groupCard}>
        {_themes.map((value, index) => {
          const isSelected = themeName === value.label
          const isFirst = index === 0
          const isLast = index === _themes.length - 1
          return (
            <View key={value.label}>
              <TouchableHighlight
                underlayColor={theme.borderColor}
                onPress={() => setTheme(value.label)}
                accessibilityLabel={`Select ${value.name} theme`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                style={[
                  isFirst && styles.rowFirst,
                  isLast && styles.rowLast,
                ]}
              >
                <View style={styles.row}>
                  <View style={[styles.colorDot, { backgroundColor: value.tintColor }]} />
                  <Text style={[styles.rowText, { flex: 1 }]}>{value.name}</Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={20} color={theme.tintColor} />
                  )}
                </View>
              </TouchableHighlight>
              {!isLast && <View style={[styles.separator, { marginLeft: 52 }]} />}
            </View>
          )
        })}
      </View>

      {/* Model Section */}
      <Text style={styles.sectionHeader}>模型</Text>
      <View style={styles.groupCard}>
        <View style={styles.row}>
          <View style={styles.rowContent}>
            <Text style={styles.rowText}>ChatGLM 5.0</Text>
            <Text style={styles.rowSubtext}>Powered by Zhipu AI</Text>
          </View>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>当前</Text>
          </View>
        </View>
      </View>

      {/* About Section */}
      <Text style={styles.sectionHeader}>关于</Text>
      <View style={styles.groupCard}>
        <View style={[styles.row, styles.rowFirst, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.borderColor }]}>
          <Text style={styles.rowText}>版本</Text>
          <Text style={styles.rowValueText}>1.1.0</Text>
        </View>
        <View style={[styles.row, styles.rowLast]}>
          <Text style={styles.rowText}>开发者</Text>
          <Text style={styles.rowValueText}>KnowIt Team</Text>
        </View>
      </View>
    </ScrollView>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: 90,
  },
  sectionHeader: {
    fontFamily: theme.regularFont,
    fontSize: 13,
    color: theme.mutedForegroundColor,
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
    marginLeft: spacing.lg,
    textTransform: 'uppercase',
  },
  groupCard: {
    backgroundColor: theme.cardBackgroundColor,
    borderRadius: 10,
    borderCurve: 'continuous',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    minHeight: 44,
  },
  rowFirst: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  rowLast: {
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  rowContent: {
    flex: 1,
  },
  rowText: {
    fontFamily: theme.regularFont,
    fontSize: 17,
    color: theme.textColor,
    flex: 1,
  },
  rowSubtext: {
    fontFamily: theme.regularFont,
    fontSize: 13,
    color: theme.mutedForegroundColor,
    marginTop: 2,
  },
  rowValueText: {
    fontFamily: theme.regularFont,
    fontSize: 17,
    color: theme.mutedForegroundColor,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: spacing.md,
  },
  activeBadge: {
    backgroundColor: theme.tintColor,
    borderRadius: 6,
    borderCurve: 'continuous',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  activeBadgeText: {
    fontFamily: theme.mediumFont,
    fontSize: 12,
    color: theme.tintTextColor,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.borderColor,
  },
})
