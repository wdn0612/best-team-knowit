import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { useContext, useState, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import Markdown from '@ronradtke/react-native-markdown-display'
import { ThemeContext } from '../context'
import { loadAllChatHistories, ChatHistory } from '../storage'
import { Card } from '../components'
import { spacing } from '../theme'

export function Journal() {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const [entries, setEntries] = useState<ChatHistory[]>([])

  useFocusEffect(
    useCallback(() => {
      loadAllChatHistories().then(setEntries)
    }, [])
  )

  function formatDate(ts: number): string {
    const d = new Date(ts)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function getSummary(history: ChatHistory): string {
    const lastMsg = history.messages[history.messages.length - 1]
    const text = lastMsg?.assistant || lastMsg?.user || ''
    return text.length > 300 ? text.slice(0, 300) + '...' : text
  }

  const markdownStyle = getMarkdownStyle(theme)

  if (entries.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={styles.emptyText}>No conversations yet.</Text>
        <Text style={styles.emptySubtext}>Start a chat and your history will appear here.</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {entries.map((entry) => (
        <Card key={entry.id} elevated style={styles.card}>
          <Text style={styles.date}>{formatDate(entry.updatedAt)}</Text>
          <Text style={styles.title}>{entry.title || 'Untitled'}</Text>
          <Markdown style={markdownStyle as any}>{getSummary(entry)}</Markdown>
          <View style={styles.footer}>
            <Text style={styles.turns}>{entry.messages.length} turns</Text>
            <TouchableOpacity
              accessibilityLabel="View original chat"
              accessibilityRole="link"
            >
              <Text style={styles.link}>View original chat →</Text>
            </TouchableOpacity>
          </View>
        </Card>
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
    paddingTop: spacing.xxxl,
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
  card: {
    marginBottom: spacing.xl,
  },
  date: {
    fontFamily: theme.regularFont,
    fontSize: 13,
    color: theme.mutedForegroundColor || theme.placeholderTextColor,
    marginBottom: 6,
  },
  title: {
    fontFamily: theme.semiBoldFont,
    fontSize: 18,
    color: theme.textColor,
    marginBottom: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  turns: {
    fontFamily: theme.regularFont,
    fontSize: 13,
    color: theme.mutedForegroundColor || theme.placeholderTextColor,
  },
  link: {
    fontFamily: theme.semiBoldFont,
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
    fontSize: 15,
    lineHeight: 22,
    fontFamily: theme.regularFont,
    marginBottom: spacing.sm,
  },
  heading1: {
    color: theme.headingAccentColor,
    fontFamily: theme.boldFont,
    fontSize: 20,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  heading2: {
    color: theme.headingAccentColor,
    fontFamily: theme.semiBoldFont,
    fontSize: 17,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  heading3: {
    color: theme.textColor,
    fontFamily: theme.semiBoldFont,
    fontSize: 15,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  strong: {
    fontFamily: theme.semiBoldFont,
  },
  em: {
    fontStyle: 'italic' as const,
  },
  list_item: {
    marginTop: 4,
    color: theme.textColor,
    fontFamily: theme.regularFont,
    fontSize: 15,
  },
  bullet_list_icon: {
    color: theme.textColor,
  },
  ordered_list_icon: {
    color: theme.textColor,
    fontFamily: theme.regularFont,
  },
  code_inline: {
    backgroundColor: theme.cardBackgroundColor,
    color: theme.textColor,
    fontFamily: theme.regularFont,
    fontSize: 14,
  },
  fence: {
    backgroundColor: theme.cardBackgroundColor,
    color: theme.textColor,
    fontFamily: theme.regularFont,
    fontSize: 14,
    padding: spacing.sm,
    borderRadius: 8,
  },
  blockquote: {
    backgroundColor: theme.blockquoteBackgroundColor,
    borderLeftColor: theme.blockquoteBorderColor,
    borderLeftWidth: 3,
    paddingLeft: spacing.md,
    marginVertical: spacing.xs,
  },
})
