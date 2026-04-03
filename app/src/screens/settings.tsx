import {
  View,
  Text,
  StyleSheet,
  TouchableHighlight,
  ScrollView,
  Platform,
  TouchableOpacity,
} from 'react-native'
import { useContext } from 'react'
import { ThemeContext } from '../context'
import * as themes from '../theme'
import { spacing } from '../theme'
import { GlassCard, GradientBackground } from '../components'
import Ionicons from '@expo/vector-icons/Ionicons'

const _themes = Object.values(themes).filter(v => typeof v === 'object' && v !== null && 'name' in v).map(v => ({
  name: (v as any).name,
  label: (v as any).label,
  tintColor: (v as any).tintColor,
}))

const XINJI_SETTINGS = [
  { icon: 'person-outline', label: '个人资料', bg: '#B9ECE3', value: '' },
  { icon: 'notifications-outline', label: '提醒设置', bg: '#B8D7E8', value: '' },
  { icon: 'moon-outline', label: '深色模式', bg: '#AFC8BA', value: '', toggle: true },
  { icon: 'language-outline', label: '语言', bg: '#B9ECE3', value: '简体中文' },
]

const XINJI_ABOUT = [
  { icon: 'information-circle-outline', label: '版本', bg: '#B8D7E8', value: '1.1.0' },
  { icon: 'people-outline', label: '开发者', bg: '#AFC8BA', value: 'KnowIt Team' },
]

export function Settings() {
  const { theme, setTheme, themeName } = useContext(ThemeContext)
  const isXinji = theme.label === 'xinji'
  const styles = getStyles(theme)

  if (isXinji) {
    return (
      <GradientBackground>
        <ScrollView
          style={[styles.container, { backgroundColor: 'transparent' }]}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.xinjiHeader}>
            <Text style={styles.xinjiTitle}>设置</Text>
          </View>

          <Text style={styles.xinjiSectionLabel}>通用</Text>
          <GlassCard borderRadius={26} style={styles.xinjiGroup}>
            {XINJI_SETTINGS.map((item, idx) => (
              <View key={item.label}>
                <View style={styles.xinjiRow}>
                  <View style={styles.xinjiRowLeft}>
                    <View style={[styles.xinjiIconBox, { backgroundColor: item.bg }]}>
                      <Ionicons name={item.icon as any} size={16} color="#fff" />
                    </View>
                    <Text style={styles.xinjiRowLabel}>{item.label}</Text>
                  </View>
                  <View style={styles.xinjiRowRight}>
                    {item.value ? <Text style={styles.xinjiRowValue}>{item.value}</Text> : null}
                    {item.toggle ? (
                      <TouchableOpacity style={styles.xinjiToggle} activeOpacity={0.7}>
                        <View style={styles.xinjiToggleKnob} />
                      </TouchableOpacity>
                    ) : (
                      <Ionicons name="chevron-forward" size={14} color="#96A6AC" />
                    )}
                  </View>
                </View>
                {idx < XINJI_SETTINGS.length - 1 && <View style={styles.xinjiDivider} />}
              </View>
            ))}
          </GlassCard>

          <Text style={styles.xinjiSectionLabel}>主题</Text>
          <GlassCard borderRadius={26} style={styles.xinjiGroup}>
            {_themes.map((value, index) => {
              const isSelected = themeName === value.label
              return (
                <View key={value.label}>
                  <TouchableOpacity
                    onPress={() => setTheme(value.label)}
                    activeOpacity={0.6}
                  >
                    <View style={styles.xinjiRow}>
                      <View style={styles.xinjiRowLeft}>
                        <View style={[styles.xinjiColorDot, { backgroundColor: value.tintColor }]} />
                        <Text style={styles.xinjiRowLabel}>{value.name}</Text>
                      </View>
                      {isSelected && <Ionicons name="checkmark" size={20} color="#31444A" />}
                    </View>
                  </TouchableOpacity>
                  {index < _themes.length - 1 && <View style={styles.xinjiDivider} />}
                </View>
              )
            })}
          </GlassCard>

          <Text style={styles.xinjiSectionLabel}>模型</Text>
          <GlassCard borderRadius={26} style={styles.xinjiGroup}>
            <View style={styles.xinjiRow}>
              <View style={styles.xinjiRowLeft}>
                <Text style={styles.xinjiRowLabel}>ChatGLM 5.0</Text>
              </View>
              <View style={styles.xinjiCurrentBadge}>
                <Text style={styles.xinjiCurrentText}>当前</Text>
              </View>
            </View>
            <Text style={styles.xinjiModelSub}>Powered by Zhipu AI</Text>
          </GlassCard>

          <Text style={styles.xinjiSectionLabel}>关于</Text>
          <GlassCard borderRadius={26} style={styles.xinjiGroup}>
            {XINJI_ABOUT.map((item, idx) => (
              <View key={item.label}>
                <View style={styles.xinjiRow}>
                  <View style={styles.xinjiRowLeft}>
                    <View style={[styles.xinjiIconBox, { backgroundColor: item.bg }]}>
                      <Ionicons name={item.icon as any} size={16} color="#fff" />
                    </View>
                    <Text style={styles.xinjiRowLabel}>{item.label}</Text>
                  </View>
                  <Text style={styles.xinjiRowValue}>{item.value}</Text>
                </View>
                {idx < XINJI_ABOUT.length - 1 && <View style={styles.xinjiDivider} />}
              </View>
            ))}
          </GlassCard>
        </ScrollView>
      </GradientBackground>
    )
  }

  // Default settings style
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
  // Xinji styles
  xinjiHeader: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  xinjiTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: '#304148',
  },
  xinjiSectionLabel: {
    fontSize: 12,
    color: '#6E7F86',
    fontWeight: '500',
    paddingHorizontal: spacing.xxl,
    marginBottom: 6,
    marginTop: spacing.xl,
  },
  xinjiGroup: {
    marginHorizontal: spacing.xl,
    marginBottom: 0,
  },
  xinjiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  xinjiRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  xinjiRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  xinjiIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  xinjiRowLabel: {
    fontSize: 14,
    color: '#304148',
  },
  xinjiRowValue: {
    fontSize: 13,
    color: '#6E7F86',
  },
  xinjiDivider: {
    height: 0.5,
    backgroundColor: 'rgba(63,86,92,0.10)',
  },
  xinjiColorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  xinjiToggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.10)',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  xinjiToggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  xinjiCurrentBadge: {
    backgroundColor: '#31444A',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  xinjiCurrentText: {
    fontSize: 12,
    color: '#EDFAF7',
    fontWeight: '500',
  },
  xinjiModelSub: {
    fontSize: 13,
    color: '#6E7F86',
    marginTop: -8,
    paddingBottom: 4,
    paddingLeft: 0,
  },
})
