import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { useContext, useState, useCallback } from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import Markdown from '@ronradtke/react-native-markdown-display'
import { ThemeContext } from '../context'
import { loadAllChatHistories, ChatHistory } from '../storage'
import { Card } from '../components'
import { spacing } from '../theme'
import Ionicons from '@expo/vector-icons/Ionicons'

export function Journal() {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const [entries, setEntries] = useState<ChatHistory[]>([])
  const navigation = useNavigation<any>()

  useFocusEffect(
    useCallback(() => {
      loadAllChatHistories().then(setEntries)
    }, [])
  )

  function formatDate(ts: number): string {
    const d = new Date(ts)
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
      <View style={[styles.container, styles.emptyContainer]}>
        <Ionicons name="book-outline" size={48} color={theme.mutedForegroundColor || theme.placeholderTextColor} style={{ marginBottom: spacing.md, opacity: 0.5 }} />
        <Text style={styles.emptyText}>还没有对话记录</Text>
        <Text style={styles.emptySubtext}>开始聊天后，记录会出现在这里</Text>
      </View>
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {grouped.map((group, gIdx) => (
        <View key={gIdx}>
          <Text style={styles.groupLabel}>{group.label}</Text>
          {group.entries.map((entry, eIdx) => {
            const isLast = gIdx === grouped.length - 1 && eIdx === group.entries.length - 1
            return (
              <View key={entry.id} style={styles.timelineRow}>
                {/* Timeline gutter */}
                <View style={styles.timelineGutter}>
                  <View style={[styles.timelineDot, { backgroundColor: theme.tintColor }]} />
                  {!isLast && (
                    <View style={[styles.timelineLine, { backgroundColor: theme.borderColor }]} />
                  )}
                </View>
                {/* Content */}
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
})

const getMarkdownStyle = (theme: any) => ({
  body: {
    color: theme.textColor,
    fontFamily: theme.regularFont,
  },
  paragraph: {
    color: theme.textColor,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: theme.regularFont,
    marginBottom: 2,
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
