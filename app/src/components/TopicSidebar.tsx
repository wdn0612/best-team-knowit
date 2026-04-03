import { useState, useRef, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions,
  ScrollView, Pressable, Platform, Modal, Easing,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { loadAllChatHistories, ChatHistory } from '../storage'

const { width: SW } = Dimensions.get('window')
const SIDEBAR_W = 295

type TopicSidebarProps = {
  visible: boolean
  currentChatId: string
  onClose: () => void
  onSelectChat: (chat: ChatHistory) => void
  onNewChat: () => void
  onOpenSettings: () => void
}

export function TopicSidebar({
  visible,
  currentChatId,
  onClose,
  onSelectChat,
  onNewChat,
  onOpenSettings,
}: TopicSidebarProps) {
  const insets = useSafeAreaInsets()
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_W)).current
  const maskOpacity = useRef(new Animated.Value(0)).current
  const [entries, setEntries] = useState<ChatHistory[]>([])
  const [modalVisible, setModalVisible] = useState(false)

  useEffect(() => {
    if (visible) {
      setModalVisible(true)
      loadAllChatHistories().then(setEntries)
      slideAnim.setValue(-SIDEBAR_W)
      maskOpacity.setValue(0)
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(maskOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -SIDEBAR_W, duration: 280, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(maskOpacity, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]).start(() => {
        setModalVisible(false)
      })
    }
  }, [visible])

  function formatDateGroup(ts: number): string {
    const d = new Date(ts)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) return '今天'
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === yesterday.toDateString()) return '昨天'
    return d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
  }

  // Group by date
  const grouped: { label: string; entries: ChatHistory[] }[] = []
  for (const entry of entries) {
    const label = formatDateGroup(entry.updatedAt)
    const last = grouped[grouped.length - 1]
    if (last && last.label === label) {
      last.entries.push(entry)
    } else {
      grouped.push({ label, entries: [entry] })
    }
  }

  return (
    <Modal transparent visible={modalVisible} animationType="none" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Mask */}
        <Animated.View style={[styles.mask, { opacity: maskOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Sidebar */}
        <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }], paddingTop: insets.top }]}>
          <LinearGradient
            colors={['#BFE7EA', '#D4EEF0', '#E2F4F2', '#EAF6F4']}
            locations={[0, 0.35, 0.6, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, styles.sidebarGlass]} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>对话</Text>
            <TouchableOpacity style={styles.newBtn} onPress={onNewChat} activeOpacity={0.7}>
              <Ionicons name="add" size={15} color="#31444A" />
            </TouchableOpacity>
          </View>

          {/* List */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {grouped.map((group, gIdx) => (
              <View key={gIdx}>
                <Text style={styles.sectionLabel}>{group.label}</Text>
                {group.entries.map(entry => {
                  const isActive = entry.id === currentChatId
                  return (
                    <TouchableOpacity
                      key={entry.id}
                      style={[styles.item, isActive && styles.itemActive]}
                      onPress={() => onSelectChat(entry)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {entry.title || '新对话'}
                      </Text>
                      <View style={styles.itemMeta}>
                        <View style={[styles.itemDot, { backgroundColor: '#B9ECE3' }]} />
                        <Text style={styles.itemMetaText}>{entry.messages.length} 轮对话</Text>
                      </View>
                    </TouchableOpacity>
                  )
                })}
              </View>
            ))}
          </ScrollView>

          {/* Footer — aligned with tab bar height (50 + insets.bottom) */}
          <View style={[styles.footer, { height: 50 + insets.bottom, paddingBottom: insets.bottom }]}>
            <TouchableOpacity style={styles.footerItem} onPress={onOpenSettings} activeOpacity={0.7}>
              <Ionicons name="settings-outline" size={18} color="#6E7F86" />
              <Text style={styles.footerText}>设置</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_W,
    overflow: 'hidden',
  },
  sidebarGlass: {
    backgroundColor: 'rgba(246,251,250,0.55)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#304148',
  },
  newBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(73,108,116,0.08)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
    }),
  },
  list: {
    flex: 1,
    paddingHorizontal: 12,
  },
  sectionLabel: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 11,
    fontWeight: '600',
    color: '#96A6AC',
    letterSpacing: 0.5,
  },
  item: {
    padding: 11,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 2,
  },
  itemActive: {
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  itemTitle: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#304148',
    lineHeight: 19,
    marginBottom: 2,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  itemMetaText: {
    fontSize: 11,
    color: '#96A6AC',
  },
  footer: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(63,86,92,0.10)',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 11,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  footerText: {
    fontSize: 13.5,
    color: '#6E7F86',
    fontWeight: '500',
    lineHeight: 19,
  },
})
