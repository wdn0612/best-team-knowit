import { Modal, View, Text, Pressable, TouchableOpacity, StyleSheet, Animated, Easing, ScrollView, Dimensions } from 'react-native'
import { useEffect, useRef, useState } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

const SHEET_HPAD = 20
const { width: WINDOW_WIDTH } = Dimensions.get('window')
const CELL_SIZE = (WINDOW_WIDTH - SHEET_HPAD * 2) / 7
const BODY_HEIGHT = CELL_SIZE * 6 // 6-row grid height, used as the constant body slot

export function CalendarModal({
  visible,
  selectedDate,
  selectedMonth,
  activeDates,
  onSelect,
  onSelectMonth,
  onClear,
  onClose,
}: {
  visible: boolean
  selectedDate: Date | null
  selectedMonth?: { year: number; month: number } | null
  activeDates: Date[]
  onSelect: (d: Date) => void
  onSelectMonth?: (year: number, month: number) => void
  onClear: () => void
  onClose: () => void
}) {
  const insets = useSafeAreaInsets()
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [pickerMode, setPickerMode] = useState<'date' | 'month'>('date')
  const slideY = useRef(new Animated.Value(-SHEET_OFFSCREEN)).current

  useEffect(() => {
    if (visible) {
      setPickerMode('date')
      slideY.setValue(-SHEET_OFFSCREEN)
      Animated.spring(slideY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 220,
      }).start()
    }
  }, [visible])

  function handleClose() {
    Animated.timing(slideY, {
      toValue: -SHEET_OFFSCREEN,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => onClose())
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  // Build 42 cells across prev/current/next month so the grid is always full
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate()

  type Cell = { day: number; kind: 'prev' | 'curr' | 'next'; year: number; month: number }
  const cells: Cell[] = []
  for (let i = firstDay - 1; i >= 0; i--) {
    const y = viewMonth === 0 ? viewYear - 1 : viewYear
    const m = viewMonth === 0 ? 11 : viewMonth - 1
    cells.push({ day: daysInPrevMonth - i, kind: 'prev', year: y, month: m })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, kind: 'curr', year: viewYear, month: viewMonth })
  }
  let nextDay = 1
  while (cells.length < 42) {
    const y = viewMonth === 11 ? viewYear + 1 : viewYear
    const m = viewMonth === 11 ? 0 : viewMonth + 1
    cells.push({ day: nextDay++, kind: 'next', year: y, month: m })
  }

  const monthLabel = `${viewYear}年${viewMonth + 1}月`
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  // Year range for picker: ±8 years around today
  const currentYear = today.getFullYear()
  const years = Array.from({ length: 17 }, (_, i) => currentYear - 8 + i)
  const months = Array.from({ length: 12 }, (_, i) => i)

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Animated.View
          style={[
            styles.sheet,
            { paddingTop: insets.top + 20, transform: [{ translateY: slideY }] },
          ]}
        >
          <Pressable onPress={e => e.stopPropagation?.()}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={prevMonth}
                style={[styles.navBtn, pickerMode === 'month' && styles.navBtnHidden]}
                disabled={pickerMode === 'month'}
              >
                <Ionicons name="chevron-back" size={18} color="#31444A" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPickerMode(m => m === 'date' ? 'month' : 'date')}
                style={styles.monthLabelBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.monthLabel}>{monthLabel}</Text>
                <Ionicons
                  name={pickerMode === 'date' ? 'chevron-down' : 'chevron-up'}
                  size={14}
                  color="#31444A"
                  style={{ marginLeft: 4 }}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={nextMonth}
                style={[styles.navBtn, pickerMode === 'month' && styles.navBtnHidden]}
                disabled={pickerMode === 'month'}
              >
                <Ionicons name="chevron-forward" size={18} color="#31444A" />
              </TouchableOpacity>
            </View>

            {pickerMode === 'date' ? (
              <>
                <View style={styles.weekRow}>
                  {weekDays.map(d => (
                    <Text key={d} style={styles.weekDay}>{d}</Text>
                  ))}
                </View>

                <View style={[styles.grid, { height: BODY_HEIGHT }]}>
                  {Array.from({ length: 6 }).map((_, rowIdx) => (
                    <View key={`row-${rowIdx}`} style={styles.gridRow}>
                      {cells.slice(rowIdx * 7, rowIdx * 7 + 7).map((c, colIdx) => {
                        const cellDate = new Date(c.year, c.month, c.day)
                        const isSelected = selectedDate ? isSameDay(cellDate, selectedDate) : false
                        const hasItem = activeDates.some(d => isSameDay(d, cellDate))
                        const isToday = isSameDay(cellDate, today)
                        const isOther = c.kind !== 'curr'
                        return (
                          <TouchableOpacity
                            key={`${c.kind}-${rowIdx}-${colIdx}`}
                            style={styles.cell}
                            onPress={() => {
                              if (isOther) {
                                setViewYear(c.year)
                                setViewMonth(c.month)
                              }
                              onSelect(cellDate)
                              handleClose()
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={[styles.cellInner, isSelected && styles.cellSelected]}>
                              <Text style={[
                                styles.dayText,
                                isOther && styles.dayOther,
                                isToday && !isOther && styles.dayToday,
                                isSelected && styles.daySelectedText,
                              ]}>{c.day}</Text>
                              {hasItem && !isSelected && <View style={styles.dot} />}
                            </View>
                          </TouchableOpacity>
                        )
                      })}
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <View style={[styles.pickerBody, { height: BODY_HEIGHT + 24 }]}>
                <ScrollView
                  style={styles.pickerCol}
                  contentContainerStyle={styles.pickerColContent}
                  showsVerticalScrollIndicator={false}
                >
                  {years.map(y => {
                    const active = y === viewYear
                    return (
                      <TouchableOpacity
                        key={y}
                        style={[styles.pickerItem, active && styles.pickerItemActive]}
                        onPress={() => setViewYear(y)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.pickerItemText, active && styles.pickerItemTextActive]}>{y}年</Text>
                      </TouchableOpacity>
                    )
                  })}
                </ScrollView>
                <ScrollView
                  style={styles.pickerCol}
                  contentContainerStyle={styles.pickerColContent}
                  showsVerticalScrollIndicator={false}
                >
                  {months.map(m => {
                    const active = m === viewMonth
                    const isSelectedMonth = selectedMonth
                      ? selectedMonth.year === viewYear && selectedMonth.month === m
                      : false
                    return (
                      <TouchableOpacity
                        key={m}
                        style={[
                          styles.pickerItem,
                          active && styles.pickerItemActive,
                          isSelectedMonth && !active && styles.pickerItemSelected,
                        ]}
                        onPress={() => {
                          setViewMonth(m)
                          if (onSelectMonth) {
                            onSelectMonth(viewYear, m)
                            handleClose()
                          } else {
                            setPickerMode('date')
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.pickerItemText, active && styles.pickerItemTextActive]}>{m + 1}月</Text>
                      </TouchableOpacity>
                    )
                  })}
                </ScrollView>
              </View>
            )}

            <View style={styles.footer}>
              <TouchableOpacity
                onPress={() => {
                  const t = new Date()
                  setViewYear(t.getFullYear())
                  setViewMonth(t.getMonth())
                  setPickerMode('date')
                  onSelect(t)
                  handleClose()
                }}
                style={styles.todayBtn}
              >
                <Text style={styles.todayText}>今天</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { onClear(); handleClose() }}
                style={[styles.clearBtn, !(selectedDate || selectedMonth) && styles.clearBtnHidden]}
                disabled={!(selectedDate || selectedMonth)}
              >
                <Text style={styles.clearText}>清除筛选</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClose} style={styles.doneBtn}>
                <Text style={styles.doneText}>完成</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  )
}

const SHEET_OFFSCREEN = 800

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20,34,40,0.35)',
    justifyContent: 'flex-start',
  },
  sheet: {
    backgroundColor: '#EAF3F6',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: SHEET_HPAD,
    paddingBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(49,68,74,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBtnHidden: {
    opacity: 0,
  },
  monthLabelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#31444A',
    letterSpacing: 0.3,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    color: '#6E7F86',
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'column',
  },
  gridRow: {
    flexDirection: 'row',
    height: CELL_SIZE,
  },
  cell: {
    flex: 1,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellInner: {
    width: '82%',
    height: '82%',
    borderRadius: 99,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellSelected: {
    backgroundColor: '#31444A',
  },
  dayText: {
    fontSize: 14,
    color: '#31444A',
  },
  dayOther: {
    color: '#B4C1C7',
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
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3A8C9E',
  },
  pickerBody: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerCol: {
    flex: 1,
    backgroundColor: 'rgba(49,68,74,0.04)',
    borderRadius: 14,
  },
  pickerColContent: {
    paddingVertical: 8,
  },
  pickerItem: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    marginHorizontal: 8,
  },
  pickerItemActive: {
    backgroundColor: '#31444A',
  },
  pickerItemSelected: {
    backgroundColor: 'rgba(58,140,158,0.15)',
  },
  pickerItemText: {
    fontSize: 15,
    color: '#31444A',
  },
  pickerItemTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  todayBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(58,140,158,0.12)',
    marginRight: 'auto',
  },
  todayText: {
    fontSize: 14,
    color: '#3A8C9E',
    fontWeight: '600',
  },
  clearBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(49,68,74,0.08)',
  },
  clearBtnHidden: {
    opacity: 0,
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
