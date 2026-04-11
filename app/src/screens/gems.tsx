import { Text, View, StyleSheet, ScrollView, TouchableOpacity, Modal, Dimensions, Platform, Animated, Pressable, Easing, Alert } from 'react-native'
import { useContext, useState, useCallback, useRef, useEffect } from 'react'
import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
import { ThemeContext } from '../context'
import { spacing } from '../theme'
import { GemCard, loadGems, deleteGem, getDefaultGems } from '../storage'
import { useFocusEffect } from '@react-navigation/native'
import { Swipeable } from 'react-native-gesture-handler'
import { GradientBackground } from '../components'
import { LinearGradient } from 'expo-linear-gradient'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_COLORS: [string, string, string][] = [
  ['#C8E3EC', '#A8CDD8', '#8FBFCE'],  // mist
  ['#C8DDD0', '#B0CCBB', '#94BAA6'],  // sage
  ['#2A3E48', '#1C2E38', '#142228'],  // dusk
  ['#D8E8EE', '#C4D8E4', '#B0C8D8'],  // cloud
]
const CARD_TEXT_COLORS = ['#1A3545', '#1E3828', '#D0DDE5', '#1A2E40']

function ExpandedCard({ gem, colorIdx, onClose }: { gem: GemCard; colorIdx: number; onClose: () => void }) {
  const bgOpacity = useRef(new Animated.Value(0)).current
  const cardScale = useRef(new Animated.Value(0.85)).current
  const cardOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(bgOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, damping: 15, stiffness: 150 }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start()
  }, [])

  function handleClose() {
    Animated.parallel([
      Animated.timing(bgOpacity, { toValue: 0, duration: 280, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 0.85, useNativeDriver: true, damping: 20, stiffness: 200 }),
      Animated.timing(cardOpacity, { toValue: 0, duration: 280, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]).start(() => onClose())
  }

  async function handleCopyShare() {
    try {
      await Clipboard.setStringAsync(gem.text)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Alert.alert('已复制到剪贴板', gem.text.length > 40 ? gem.text.slice(0, 40) + '…' : gem.text)
    } catch {
      Alert.alert('复制失败', '请稍后重试')
    }
  }

  const colors = CARD_COLORS[colorIdx]
  const textColor = CARD_TEXT_COLORS[colorIdx]

  return (
    <Modal transparent visible animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[expandStyles.overlay, { opacity: bgOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <Animated.View style={[expandStyles.card, {
          transform: [{ scale: cardScale }],
          opacity: cardOpacity,
        }]}>
          <LinearGradient colors={colors} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
          <TouchableOpacity style={expandStyles.closeBtn} onPress={handleClose}>
            <Ionicons name="close" size={14} color={textColor} style={{ opacity: 0.6 }} />
          </TouchableOpacity>
          <View style={expandStyles.content}>
            <Text style={[expandStyles.text, { color: textColor }]}>{gem.text}</Text>
            <Text style={[expandStyles.date, { color: textColor }]}>{gem.category} · 洞察时刻</Text>
          </View>
          <TouchableOpacity style={expandStyles.shareBtn} onPress={handleCopyShare} activeOpacity={0.7}>
            <Ionicons name="download-outline" size={14} color={textColor} style={{ opacity: 0.6 }} />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

const expandStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20,34,40,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 36,
  },
  card: {
    width: '100%',
    maxWidth: 290,
    aspectRatio: 3 / 4,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.28)',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(73,108,116,0.18)',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 1,
        shadowRadius: 40,
      },
      android: { elevation: 8 },
    }),
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
    paddingHorizontal: 26,
  },
  text: {
    fontSize: 17,
    lineHeight: 31,
    fontWeight: '500',
    letterSpacing: 0.5,
    fontFamily: 'LXGWWenKai-Medium',
  },
  date: {
    fontSize: 11,
    marginTop: 18,
    opacity: 0.5,
  },
  shareBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    zIndex: 5,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
})

// ─── Inline Month-Grid Calendar Picker ───────────────────────────────────────

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function CalendarModal({
  visible,
  selectedDate,
  activeDates,
  onSelect,
  onClear,
  onClose,
}: {
  visible: boolean
  selectedDate: Date | null
  activeDates: Date[]
  onSelect: (d: Date) => void
  onClear: () => void
  onClose: () => void
}) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth()) // 0-indexed

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  // Build grid of days for viewYear/viewMonth
  const firstDay = new Date(viewYear, viewMonth, 1).getDay() // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  const monthLabel = `${viewYear}年${viewMonth + 1}月`
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={calStyles.overlay} onPress={onClose}>
        <Pressable style={calStyles.sheet} onPress={e => e.stopPropagation()}>
          {/* Header */}
          <View style={calStyles.header}>
            <TouchableOpacity onPress={prevMonth} style={calStyles.navBtn}>
              <Ionicons name="chevron-back" size={18} color="#31444A" />
            </TouchableOpacity>
            <Text style={calStyles.monthLabel}>{monthLabel}</Text>
            <TouchableOpacity onPress={nextMonth} style={calStyles.navBtn}>
              <Ionicons name="chevron-forward" size={18} color="#31444A" />
            </TouchableOpacity>
          </View>

          {/* Week-day labels */}
          <View style={calStyles.weekRow}>
            {weekDays.map(d => (
              <Text key={d} style={calStyles.weekDay}>{d}</Text>
            ))}
          </View>

          {/* Day cells */}
          <View style={calStyles.grid}>
            {cells.map((day, idx) => {
              if (!day) return <View key={`e${idx}`} style={calStyles.cell} />
              const cellDate = new Date(viewYear, viewMonth, day)
              const isSelected = selectedDate ? isSameDay(cellDate, selectedDate) : false
              const hasGem = activeDates.some(d => isSameDay(d, cellDate))
              const isToday = isSameDay(cellDate, today)
              return (
                <TouchableOpacity
                  key={day}
                  style={[calStyles.cell, isSelected && calStyles.cellSelected]}
                  onPress={() => { onSelect(cellDate); onClose() }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    calStyles.dayText,
                    isToday && calStyles.dayToday,
                    isSelected && calStyles.daySelectedText,
                  ]}>{day}</Text>
                  {hasGem && !isSelected && <View style={calStyles.dot} />}
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Footer */}
          <View style={calStyles.footer}>
            {selectedDate && (
              <TouchableOpacity onPress={() => { onClear(); onClose() }} style={calStyles.clearBtn}>
                <Text style={calStyles.clearText}>清除筛选</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={calStyles.doneBtn}>
              <Text style={calStyles.doneText}>完成</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const calStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20,34,40,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#EAF3F6',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(49,68,74,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#31444A',
    letterSpacing: 0.3,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    color: '#6E7F86',
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellSelected: {
    backgroundColor: '#31444A',
    borderRadius: 99,
  },
  dayText: {
    fontSize: 14,
    color: '#31444A',
  },
  dayToday: {
    fontWeight: '700',
    color: '#3A8C9E',
  },
  daySelectedText: {
    color: '#fff',
    fontWeight: '600',
  },
  dot: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3A8C9E',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 10,
  },
  clearBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(49,68,74,0.08)',
  },
  clearText: {
    fontSize: 14,
    color: '#6E7F86',
  },
  doneBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#31444A',
  },
  doneText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
})

// ─── Main Gems Screen ─────────────────────────────────────────────────────────

export function Gems() {
  const { theme } = useContext(ThemeContext)
  const isXinji = theme.label === 'xinji'
  const insets = useSafeAreaInsets()
  const styles = getStyles(theme)
  const [gems, setGems] = useState<GemCard[]>(getDefaultGems())
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map())
  const [expandedGem, setExpandedGem] = useState<{ gem: GemCard; colorIdx: number } | null>(null)
  const [calendarVisible, setCalendarVisible] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useFocusEffect(
    useCallback(() => {
      loadGems().then(setGems)
    }, [])
  )

  // Derive the set of dates that have at least one gem (for calendar dots)
  const activeDates = gems
    .filter(g => g.createdAt != null)
    .map(g => new Date(g.createdAt!))

  // Filter gems by selected date (match same calendar day); if none selected, show all
  const filteredGems = selectedDate
    ? gems.filter(g => {
        if (!g.createdAt) return false
        return isSameDay(new Date(g.createdAt), selectedDate)
      })
    : gems

  async function handleDelete(id: string) {
    await deleteGem(id)
    setGems(prev => prev.filter(g => g.id !== id))
  }

  function handleCalendarSelect(date: Date) {
    setSelectedDate(date)
  }

  function handleCalendarClear() {
    setSelectedDate(null)
  }

  function renderRightActions(id: string) {
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => handleDelete(id)}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={20} color="#fff" />
      </TouchableOpacity>
    )
  }

  if (gems.length === 0) {
    return (
      <GradientBackground>
        <View style={[styles.emptyContainer, isXinji && { backgroundColor: 'transparent' }]}>
          <Ionicons name="diamond-outline" size={48} color={theme.mutedForegroundColor} style={{ opacity: 0.5 }} />
          <Text style={styles.emptyText}>{isXinji ? '还没有收藏的洞察' : '还没有收藏的 GEM'}</Text>
          <Text style={styles.emptySubtext}>长按对话气泡，收藏喜欢的内容</Text>
        </View>
      </GradientBackground>
    )
  }

  const selectedDateLabel = selectedDate
    ? `${selectedDate.getFullYear()}/${String(selectedDate.getMonth() + 1).padStart(2, '0')}/${String(selectedDate.getDate()).padStart(2, '0')}`
    : null

  // Xinji card grid style
  if (isXinji) {
    return (
      <GradientBackground>
        <ScrollView
          style={[styles.container, { backgroundColor: 'transparent' }]}
          contentContainerStyle={{ paddingBottom: 90 }}
        >
          <View style={[styles.xinjiHeader, { paddingTop: insets.top + spacing.md }]}>
            <View>
              <Text style={styles.xinjiTitle}>洞察</Text>
              <Text style={styles.xinjiSubtitle}>
                {selectedDateLabel ? `${selectedDateLabel} · ${filteredGems.length} 条` : '值得反复看的那些话'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.datePick, selectedDate && styles.datePickActive]}
              onPress={() => setCalendarVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={selectedDate ? 'calendar' : 'calendar-outline'}
                size={20}
                color={selectedDate ? '#3A8C9E' : '#31444A'}
              />
            </TouchableOpacity>
          </View>

          {/* Empty-date state */}
          {filteredGems.length === 0 && selectedDate && (
            <View style={styles.emptyDate}>
              <Text style={styles.emptyDateText}>该日期没有洞察</Text>
              <TouchableOpacity onPress={handleCalendarClear}>
                <Text style={styles.emptyDateLink}>查看全部</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Card grid */}
          <View style={styles.cardGrid}>
            {filteredGems.map((gem, idx) => {
              const colorIdx = idx % CARD_COLORS.length
              const colors = CARD_COLORS[colorIdx]
              const textColor = CARD_TEXT_COLORS[colorIdx]
              return (
                <TouchableOpacity
                  key={gem.id}
                  activeOpacity={0.9}
                  onPress={() => setExpandedGem({ gem, colorIdx })}
                  style={styles.gridCardWrap}
                >
                  <View style={styles.gridCard}>
                    <LinearGradient
                      colors={colors}
                      start={{ x: 0.2, y: 0 }}
                      end={{ x: 0.8, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.gridCardContent}>
                      <Text style={[styles.gridCardText, { color: textColor }]} numberOfLines={4}>
                        {gem.text}
                      </Text>
                      <Text style={[styles.gridCardDate, { color: textColor }]}>
                        {gem.category}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        </ScrollView>

        {/* Expanded card overlay */}
        {expandedGem && (
          <ExpandedCard
            gem={expandedGem.gem}
            colorIdx={expandedGem.colorIdx}
            onClose={() => setExpandedGem(null)}
          />
        )}

        {/* Calendar picker */}
        <CalendarModal
          visible={calendarVisible}
          selectedDate={selectedDate}
          activeDates={activeDates}
          onSelect={handleCalendarSelect}
          onClear={handleCalendarClear}
          onClose={() => setCalendarVisible(false)}
        />
      </GradientBackground>
    )
  }

  // Default (non-xinji) list style
  const accentColor = theme.tintColor
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + spacing.xl }]}
    >
      {gems.map((gem) => {
        return (
          <Swipeable
            key={gem.id}
            ref={ref => {
              if (ref) swipeableRefs.current.set(gem.id, ref)
              else swipeableRefs.current.delete(gem.id)
            }}
            renderRightActions={() => renderRightActions(gem.id)}
            overshootRight={false}
          >
            <View style={styles.gemCard}>
              <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
              <View style={styles.gemBody}>
                <Text style={styles.gemText}>{gem.text}</Text>
                <View style={styles.categoryRow}>
                  <View style={[styles.categoryBadge, { borderColor: accentColor }]}>
                    <Text style={[styles.categoryText, { color: accentColor }]}>{gem.category}</Text>
                  </View>
                </View>
              </View>
            </View>
          </Swipeable>
        )
      })}
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
    paddingTop: spacing.xl,
    paddingBottom: 90,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.backgroundColor,
    padding: 40,
  },
  emptyText: {
    fontFamily: theme.semiBoldFont,
    fontSize: 17,
    color: theme.textColor,
    marginTop: spacing.lg,
  },
  emptySubtext: {
    fontFamily: theme.regularFont,
    fontSize: 14,
    color: theme.mutedForegroundColor || theme.placeholderTextColor,
    marginTop: spacing.xs,
  },
  gemCard: {
    flexDirection: 'row',
    backgroundColor: theme.cardBackgroundColor,
    borderRadius: 14,
    borderCurve: 'continuous',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
  },
  gemBody: {
    flex: 1,
    padding: spacing.lg,
    paddingLeft: spacing.md,
  },
  gemText: {
    fontFamily: theme.regularFont,
    fontSize: 16,
    lineHeight: 24,
    color: theme.textColor,
  },
  categoryRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  categoryBadge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  categoryText: {
    fontFamily: theme.mediumFont,
    fontSize: 11,
  },
  deleteAction: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 64,
    borderRadius: 14,
    borderCurve: 'continuous',
    marginBottom: spacing.md,
    marginLeft: spacing.sm,
  },
  // Xinji styles
  xinjiHeader: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  datePick: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: 'rgba(49,68,74,0.06)',
  },
  datePickActive: {
    backgroundColor: 'rgba(58,140,158,0.12)',
  },
  emptyDate: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyDateText: {
    fontSize: 15,
    color: '#6E7F86',
  },
  emptyDateLink: {
    fontSize: 14,
    color: '#3A8C9E',
    textDecorationLine: 'underline',
  },
  xinjiTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: '#304148',
  },
  xinjiSubtitle: {
    fontSize: 13,
    color: '#6E7F86',
    marginTop: 2,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl,
    gap: 12,
    paddingBottom: spacing.xxl,
  },
  gridCardWrap: {
    width: (SCREEN_WIDTH - spacing.xl * 2 - 12) / 2,
  },
  gridCard: {
    borderRadius: 22,
    overflow: 'hidden',
    aspectRatio: 3 / 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.28)',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(73,108,116,0.10)',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 20,
      },
      android: { elevation: 4 },
    }),
  },
  gridCardContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 14,
  },
  gridCardText: {
    fontSize: 12,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: 0.3,
    fontFamily: 'LXGWWenKai-Medium',
  },
  gridCardDate: {
    fontSize: 9,
    marginTop: 8,
    opacity: 0.45,
  },
  // Expand overlay
  expandOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20,34,40,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 36,
  },
  expandCard: {
    width: '100%',
    maxWidth: 290,
    aspectRatio: 3 / 4,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.28)',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(73,108,116,0.18)',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 1,
        shadowRadius: 40,
      },
      android: { elevation: 8 },
    }),
  },
  expandClose: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
    paddingHorizontal: 26,
  },
  expandText: {
    fontSize: 17,
    lineHeight: 31,
    fontWeight: '500',
    letterSpacing: 0.5,
    fontFamily: 'LXGWWenKai-Medium',
  },
  expandDate: {
    fontSize: 11,
    marginTop: 18,
    opacity: 0.5,
  },
})
