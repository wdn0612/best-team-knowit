import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable, Platform, Animated, Dimensions, Easing, TextInput } from 'react-native'
import { useContext, useState, useCallback, useRef, useEffect } from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import Markdown from '@ronradtke/react-native-markdown-display'
import { ThemeContext } from '../context'
import { loadAllChatHistories, saveChatHistory, ChatHistory } from '../storage'
import { Card, GlassCard, GradientBackground } from '../components'
import { spacing } from '../theme'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const EMOTION_KEYWORDS: { emoji: string; label: string; keywords: string[] }[] = [
  { emoji: '😰', label: '焦虑', keywords: ['焦虑', '紧张', '担心', '害怕', '不安', '面试'] },
  { emoji: '😔', label: '低落', keywords: ['低落', '难过', '伤心', '失望', '沮丧', '否'] },
  { emoji: '🥹', label: '感动', keywords: ['感动', '温暖', '感谢', '谢谢', '开心'] },
  { emoji: '😊', label: '平静', keywords: ['平静', '放松', '还好', '不错'] },
  { emoji: '😤', label: '烦躁', keywords: ['烦', '生气', '愤怒', '讨厌'] },
  { emoji: '💭', label: '自我觉察', keywords: ['觉察', '意识到', '发现', '原来'] },
]

function detectEmotion(text: string): string {
  for (const e of EMOTION_KEYWORDS) {
    if (e.keywords.some(k => text.includes(k))) {
      return `${e.emoji} ${e.label}`
    }
  }
  return '💭 自我觉察'
}

export function Journal() {
  const { theme } = useContext(ThemeContext)
  const isXinji = theme.label === 'xinji'
  const insets = useSafeAreaInsets()
  const styles = getStyles(theme)
  const [entries, setEntries] = useState<ChatHistory[]>([])
  const [selectedEntry, setSelectedEntry] = useState<ChatHistory | null>(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const detailSlideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current
  const navigation = useNavigation<any>()

  function openDetail(entry: ChatHistory) {
    setSelectedEntry(entry)
    setIsEditing(false)
    setEditText('')
    setDetailModalVisible(true)
    detailSlideAnim.setValue(Dimensions.get('window').height)
    Animated.spring(detailSlideAnim, {
      toValue: 0,
      damping: 22,
      stiffness: 220,
      useNativeDriver: true,
    }).start()
  }

  function closeDetail() {
    setIsEditing(false)
    Animated.timing(detailSlideAnim, {
      toValue: Dimensions.get('window').height,
      duration: 280,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setDetailModalVisible(false)
      setSelectedEntry(null)
    })
  }

  function startEditing() {
    if (!selectedEntry) return
    // Populate editText with the full assistant content of the entry
    const fullText = selectedEntry.messages
      .filter((msg: any) => msg.assistant)
      .map((msg: any) => msg.assistant)
      .join('\n\n')
    setEditText(fullText)
    setIsEditing(true)
  }

  async function saveEdit() {
    if (!selectedEntry) return
    // Build updated entry: replace all assistant messages with single updated message
    const updatedMessages = selectedEntry.messages.map((msg: any, idx: number) => {
      if (idx === 0 && msg.assistant !== undefined) {
        return { ...msg, assistant: editText }
      }
      return msg
    })
    // If no message had assistant content, put the text into the last message
    const hasAssistant = selectedEntry.messages.some((msg: any) => msg.assistant !== undefined)
    const finalMessages = hasAssistant
      ? updatedMessages
      : selectedEntry.messages.map((msg: any, idx: number) =>
          idx === selectedEntry.messages.length - 1 ? { ...msg, assistant: editText } : msg
        )
    const updatedEntry: ChatHistory = {
      ...selectedEntry,
      messages: finalMessages,
      updatedAt: Date.now(),
    }
    await saveChatHistory(updatedEntry)
    setSelectedEntry(updatedEntry)
    setEntries(prev => prev.map(e => (e.id === updatedEntry.id ? updatedEntry : e)))
    setIsEditing(false)
  }

  useFocusEffect(
    useCallback(() => {
      loadAllChatHistories().then(setEntries)
    }, [])
  )

  function formatDate(ts: number): string {
    const d = new Date(ts)
    if (isXinji) {
      const year = d.getFullYear()
      const month = d.getMonth() + 1
      const day = d.getDate()
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      return `${year}年${month}月${day}日 · ${weekdays[d.getDay()]}`
    }
    const month = d.toLocaleDateString('en-US', { month: 'short' })
    const day = d.getDate()
    const hour = d.getHours().toString().padStart(2, '0')
    const min = d.getMinutes().toString().padStart(2, '0')
    return `${month} ${day}, ${hour}:${min}`
  }

  function formatDateGroup(ts: number): string {
    const d = new Date(ts)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = d.toDateString() === yesterday.toDateString()
    if (isToday) return '今天'
    if (isYesterday) return '昨天'
    return d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
  }

  function getSummary(history: ChatHistory): string {
    const lastMsg = history.messages[history.messages.length - 1]
    const text = lastMsg?.assistant || lastMsg?.user || ''
    return text.length > 200 ? text.slice(0, 200) + '...' : text
  }

  function viewOriginalChat(entry: ChatHistory) {
    navigation.navigate('Chat', {
      restoreChat: {
        id: entry.id,
        messages: entry.messages,
        createdAt: entry.createdAt,
      },
    })
  }

  const markdownStyle = getMarkdownStyle(theme)

  if (entries.length === 0) {
    return (
      <GradientBackground>
        <View style={[styles.container, styles.emptyContainer, isXinji && { backgroundColor: 'transparent' }]}>
          <Ionicons name="book-outline" size={48} color={theme.mutedForegroundColor || theme.placeholderTextColor} style={{ marginBottom: spacing.md, opacity: 0.5 }} />
          <Text style={styles.emptyText}>还没有对话记录</Text>
          <Text style={styles.emptySubtext}>开始聊天后，记录会出现在这里</Text>
        </View>
      </GradientBackground>
    )
  }

  // Group entries by date
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

  // Xinji diary card style
  if (isXinji) {
    return (
      <GradientBackground>
        <ScrollView
          style={[styles.container, { backgroundColor: 'transparent' }]}
          contentContainerStyle={styles.xinjiContentContainer}
        >
          <View style={[styles.xinjiHeader, { paddingTop: insets.top + spacing.md }]}>
            <View>
              <Text style={styles.xinjiTitle}>日记</Text>
              <Text style={styles.xinjiSubtitle}>你的每一段故事都值得被记住</Text>
            </View>
            <TouchableOpacity style={styles.datePick}>
              <Ionicons name="calendar-outline" size={20} color="#31444A" />
            </TouchableOpacity>
          </View>
          <View style={styles.xinjiList}>
            {entries.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                activeOpacity={0.9}
                onPress={() => openDetail(entry)}
              >
                <GlassCard style={styles.xinjiCard} borderRadius={26}>
                  <View style={styles.xinjiDateBadge}>
                    <Ionicons name="calendar-outline" size={11} color="#6E7F86" />
                    <Text style={styles.xinjiDateText}>{formatDate(entry.updatedAt)}</Text>
                  </View>
                  <Text style={styles.xinjiCardTitle} numberOfLines={1}>
                    {entry.title || '无标题'}
                  </Text>
                  <Text style={styles.xinjiCardExcerpt} numberOfLines={3}>
                    {getSummary(entry)}
                  </Text>
                  <View style={styles.xinjiEmotionTag}>
                    <Text style={styles.xinjiEmotionText}>{detectEmotion(getSummary(entry) + (entry.title || ''))}</Text>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Detail overlay */}
        <Modal
          visible={detailModalVisible}
          animationType="none"
          transparent={false}
          onRequestClose={closeDetail}
        >
          {selectedEntry && (
            <Animated.View style={{ flex: 1, transform: [{ translateY: detailSlideAnim }] }}>
              <GradientBackground>
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 60, paddingTop: insets.top }}>
                  <View style={styles.detailNav}>
                    <TouchableOpacity onPress={closeDetail} style={styles.detailBack}>
                      <Ionicons name="chevron-back" size={18} color="#31444A" />
                      <Text style={styles.detailBackText}>返回</Text>
                    </TouchableOpacity>
                    {isEditing ? (
                      <TouchableOpacity onPress={saveEdit}>
                        <Text style={styles.detailSaveText}>保存</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity onPress={startEditing}>
                        <Text style={styles.detailEditText}>编辑</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailDate}>{formatDate(selectedEntry.updatedAt)}</Text>
                    <Text style={styles.detailTitle}>{selectedEntry.title || '无标题'}</Text>
                    <View style={styles.detailEmotionTag}>
                      <Text style={styles.xinjiEmotionText}>
                        {detectEmotion(getSummary(selectedEntry) + (selectedEntry.title || ''))}
                      </Text>
                    </View>
                    {isEditing ? (
                      <TextInput
                        style={styles.detailEditInput}
                        value={editText}
                        onChangeText={setEditText}
                        multiline
                        autoFocus
                        textAlignVertical="top"
                        placeholder="编辑日记内容..."
                        placeholderTextColor="#96A6AC"
                      />
                    ) : (
                      selectedEntry.messages.map((msg: any, idx: number) => (
                        <View key={idx} style={styles.detailParagraph}>
                          {msg.assistant ? (
                            <Text style={styles.detailBodySerifText}>{msg.assistant}</Text>
                          ) : null}
                        </View>
                      ))
                    )}
                    {!isEditing && (
                      <TouchableOpacity
                        style={styles.detailOriginalLink}
                        onPress={() => { const entry = selectedEntry; closeDetail(); setTimeout(() => viewOriginalChat(entry), 300); }}
                      >
                        <Ionicons name="chatbubble-outline" size={14} color="#31444A" />
                        <Text style={styles.detailOriginalText}>查看原始对话</Text>
                        <Ionicons name="chevron-forward" size={14} color="#96A6AC" />
                      </TouchableOpacity>
                    )}
                  </View>
                </ScrollView>
              </GradientBackground>
            </Animated.View>
          )}
        </Modal>
      </GradientBackground>
    )
  }

  // Default (non-xinji) timeline style
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + spacing.lg }]}
    >
      {grouped.map((group, gIdx) => (
        <View key={gIdx}>
          <Text style={styles.groupLabel}>{group.label}</Text>
          {group.entries.map((entry, eIdx) => {
            const isLast = gIdx === grouped.length - 1 && eIdx === group.entries.length - 1
            return (
              <View key={entry.id} style={styles.timelineRow}>
                <View style={styles.timelineGutter}>
                  <View style={[styles.timelineDot, { backgroundColor: theme.tintColor }]} />
                  {!isLast && (
                    <View style={[styles.timelineLine, { backgroundColor: theme.borderColor }]} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTime}>{formatDate(entry.updatedAt)}</Text>
                  <Card elevated style={styles.card}>
                    <Text style={styles.title} numberOfLines={1}>{entry.title || '无标题'}</Text>
                    <View style={styles.summaryContainer}>
                      <Markdown style={markdownStyle as any}>{getSummary(entry)}</Markdown>
                    </View>
                    <View style={styles.footer}>
                      <Text style={styles.turns}>{entry.messages.length} 轮对话</Text>
                      <TouchableOpacity
                        onPress={() => viewOriginalChat(entry)}
                        accessibilityLabel="View original chat"
                        accessibilityRole="link"
                        style={styles.linkBtn}
                      >
                        <Text style={styles.link}>查看原文</Text>
                        <Ionicons name="chevron-forward" size={14} color={theme.tintColor} />
                      </TouchableOpacity>
                    </View>
                  </Card>
                </View>
              </View>
            )
          })}
        </View>
      ))}
    </ScrollView>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
  },
  contentContainer: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 90,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontFamily: theme.semiBoldFont,
    fontSize: 18,
    color: theme.textColor,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontFamily: theme.regularFont,
    fontSize: 14,
    color: theme.mutedForegroundColor || theme.placeholderTextColor,
    textAlign: 'center',
  },
  groupLabel: {
    fontFamily: theme.semiBoldFont,
    fontSize: 15,
    color: theme.mutedForegroundColor || theme.placeholderTextColor,
    marginBottom: spacing.md,
    marginTop: spacing.md,
    marginLeft: 28,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  timelineGutter: {
    width: 20,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: spacing.lg,
  },
  timelineTime: {
    fontFamily: theme.regularFont,
    fontSize: 12,
    color: theme.mutedForegroundColor || theme.placeholderTextColor,
    marginBottom: 6,
  },
  card: {
    marginBottom: 0,
  },
  title: {
    fontFamily: theme.semiBoldFont,
    fontSize: 16,
    color: theme.textColor,
    marginBottom: spacing.xs,
  },
  summaryContainer: {
    maxHeight: 100,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.borderColor,
    paddingTop: spacing.sm,
  },
  turns: {
    fontFamily: theme.regularFont,
    fontSize: 13,
    color: theme.mutedForegroundColor || theme.placeholderTextColor,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  link: {
    fontFamily: theme.mediumFont,
    fontSize: 14,
    color: theme.tintColor,
  },
  // Xinji diary styles
  xinjiContentContainer: {
    paddingBottom: 90,
  },
  xinjiHeader: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  datePick: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  xinjiList: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  xinjiCard: {
    marginBottom: 0,
  },
  xinjiDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.30)',
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginBottom: 9,
  },
  xinjiDateText: {
    fontSize: 11,
    color: '#6E7F86',
  },
  xinjiCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#304148',
    marginBottom: 6,
    lineHeight: 22,
  },
  xinjiCardExcerpt: {
    fontSize: 13,
    color: '#6E7F86',
    lineHeight: 21,
  },
  xinjiEmotionTag: {
    marginTop: 10,
    backgroundColor: 'rgba(185,236,227,0.22)',
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  xinjiEmotionText: {
    fontSize: 11,
    color: '#31444A',
    fontWeight: '500',
  },
  // Detail overlay
  detailNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,  // 20px = --sp-20
    paddingTop: 8,
    paddingBottom: 10,
  },
  detailBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  detailBackText: {
    fontSize: 14,
    color: '#31444A',
  },
  detailEditText: {
    fontSize: 13,
    color: '#31444A',
    fontWeight: '500',
  },
  detailSaveText: {
    fontSize: 13,
    color: '#2A7A6A',
    fontWeight: '700',
  },
  detailEditInput: {
    fontSize: 15,
    lineHeight: 29,
    color: '#304148',
    letterSpacing: 0.3,
    fontFamily: 'LXGWWenKai-Medium',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(49,68,74,0.2)',
    padding: 12,
    minHeight: 200,
    marginBottom: spacing.lg,
  },
  detailContent: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
  },
  detailDate: {
    fontSize: 12,
    color: '#6E7F86',
    marginBottom: 8,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#304148',
    lineHeight: 30,
    marginBottom: spacing.md,
  },
  detailEmotionTag: {
    backgroundColor: 'rgba(185,236,227,0.22)',
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginBottom: spacing.xl,
  },
  detailBodyText: {
    fontSize: 14,
    lineHeight: 24,
    color: '#6E7F86',
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  detailBodySerifText: {
    fontSize: 15,
    lineHeight: 29,
    color: '#304148',
    letterSpacing: 0.3,
    marginBottom: spacing.lg,
    fontFamily: 'LXGWWenKai-Medium',
  },
  detailParagraph: {
    marginBottom: spacing.xs,
  },
  detailOriginalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  detailOriginalText: {
    flex: 1,
    fontSize: 14,
    color: '#31444A',
    fontWeight: '500',
  },
})

const getMarkdownStyle = (theme: any) => ({
  body: {
    color: theme.textColor,
    fontFamily: theme.regularFont,
  },
  paragraph: {
    color: theme.textColor,
    fontSize: theme.label === 'xinji' ? 15 : 14,
    lineHeight: theme.label === 'xinji' ? 28 : 20,
    fontFamily: theme.regularFont,
    marginBottom: 2,
    ...(theme.label === 'xinji' ? { letterSpacing: 0.3 } : {}),
  },
  strong: {
    fontFamily: theme.semiBoldFont,
  },
  em: {
    fontStyle: 'italic' as const,
  },
  code_inline: {
    backgroundColor: theme.cardBackgroundColor,
    color: theme.textColor,
    fontFamily: theme.regularFont,
    fontSize: 13,
  },
})
