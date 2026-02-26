import {
  View,
  Text,
  KeyboardAvoidingView,
  StyleSheet,
  TouchableHighlight,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable
} from 'react-native'
import 'react-native-get-random-values'
import { useContext, useState, useRef } from 'react'
import { ThemeContext } from '../context'
import { getEventSource } from '../utils'
import { saveChatHistory, AssistantBlock } from '../storage'
import { v4 as uuid } from 'uuid'
import Ionicons from '@expo/vector-icons/Ionicons'
import * as Clipboard from 'expo-clipboard'
import { useActionSheet } from '@expo/react-native-action-sheet'
import Markdown from '@ronradtke/react-native-markdown-display'
import { ChatInput, Button } from '../components'
import { spacing } from '../theme'

type Message = {
  user: string
  assistant?: string
  blocks: AssistantBlock[]
}

type ChatState = {
  messages: Message[],
  id: string,
  createdAt: number
}

const MODEL_LABEL = 'ChatGLM 5.0'

const createEmptyChatState = (): ChatState => ({
  messages: [],
  id: uuid(),
  createdAt: Date.now()
})

function ThinkingBlock({ content, theme }: { content: string; theme: any }) {
  const [expanded, setExpanded] = useState(false)
  const styles = getBlockStyles(theme)

  return (
    <Pressable
      onPress={() => setExpanded(!expanded)}
      style={styles.thinkingContainer}
      accessibilityLabel={expanded ? 'Collapse thinking process' : 'Expand thinking process'}
      accessibilityRole="button"
    >
      <View style={styles.thinkingHeader}>
        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-forward'}
          size={14}
          color={theme.textColor}
          style={{ opacity: 0.5 }}
        />
        <Text style={styles.thinkingLabel}>思考过程</Text>
      </View>
      {expanded && (
        <Text style={styles.thinkingContent}>{content}</Text>
      )}
    </Pressable>
  )
}

function ToolStartBlock({ label, theme }: { label: string; theme: any }) {
  const styles = getBlockStyles(theme)
  return (
    <View style={styles.toolStartContainer} accessibilityLabel={`Running: ${label}`}>
      <ActivityIndicator size="small" color={theme.tintColor} />
      <Text style={styles.toolStartText}>正在{label}...</Text>
    </View>
  )
}

function ToolResultBlock({ label, result, theme }: { label: string; result: string; theme: any }) {
  const styles = getBlockStyles(theme)
  const markdownStyle = getMarkdownStyle(theme)
  return (
    <View style={styles.toolResultContainer} accessibilityLabel={`Result from ${label}`}>
      <View style={styles.toolResultHeader}>
        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
        <Text style={styles.toolResultLabel}>{label}</Text>
      </View>
      <View style={styles.toolResultContent}>
        <Markdown style={markdownStyle as any}>{result}</Markdown>
      </View>
    </View>
  )
}

export function Chat() {
  const [loading, setLoading] = useState<boolean>(false)
  const [input, setInput] = useState<string>('')
  const scrollViewRef = useRef<ScrollView | null>(null)
  const { showActionSheetWithOptions } = useActionSheet()
  const [chatState, setChatState] = useState<ChatState>(createEmptyChatState)

  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const markdownStyle = getMarkdownStyle(theme)

  async function chat() {
    if (!input || loading) return
    Keyboard.dismiss()

    const messageArray: Message[] = [
      ...chatState.messages,
      { user: input, blocks: [] }
    ]

    const currentId = chatState.id
    const currentCreatedAt = chatState.createdAt
    const currentMsgIndex = messageArray.length - 1
    const blocks: AssistantBlock[] = []

    setChatState(prev => ({
      ...prev,
      messages: [...messageArray]
    }))

    setLoading(true)
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 1)
    setInput('')

    const apiMessages = messageArray.reduce((acc: any[], msg) => {
      acc.push({ role: 'user', content: msg.user })
      if (msg.assistant) {
        acc.push({ role: 'assistant', content: msg.assistant })
      }
      return acc
    }, [])

    const es = await getEventSource({
      body: { messages: apiMessages },
      type: 'agent'
    })

    const listener = (event: any) => {
      if (event.type === "open") {
        setLoading(false)
      } else if (event.type === "message") {
        if (event.data !== "[DONE]") {
          scrollViewRef.current?.scrollToEnd({ animated: true })
          try {
            const data = JSON.parse(event.data)
            const blockType = data.type

            if (blockType === 'thinking') {
              const last = blocks[blocks.length - 1]
              if (last && last.type === 'thinking') {
                last.content += data.content
              } else {
                blocks.push({ type: 'thinking', content: data.content })
              }
            } else if (blockType === 'tool_start') {
              blocks.push({
                type: 'tool_start',
                name: data.name,
                label: data.label,
                args: data.args
              })
            } else if (blockType === 'tool_result') {
              const startIdx = blocks.findIndex(
                b => b.type === 'tool_start' && b.name === data.name
              )
              if (startIdx >= 0) {
                blocks[startIdx] = {
                  type: 'tool_result',
                  name: data.name,
                  label: data.label,
                  result: data.result
                }
              } else {
                blocks.push({
                  type: 'tool_result',
                  name: data.name,
                  label: data.label,
                  result: data.result
                })
              }
            } else if (blockType === 'text') {
              const last = blocks[blocks.length - 1]
              if (last && last.type === 'text') {
                last.content += data.content
              } else {
                blocks.push({ type: 'text', content: data.content })
              }
            }

            messageArray[currentMsgIndex].blocks = [...blocks]
            messageArray[currentMsgIndex].assistant = blocks
              .filter(b => b.type === 'text')
              .map(b => (b as { type: 'text'; content: string }).content)
              .join('')

            setChatState(prev => ({
              ...prev,
              messages: [...messageArray]
            }))
          } catch (e) {
            // skip malformed chunks
          }
        } else {
          setLoading(false)
          const firstMsg = messageArray[0]?.user || ''
          saveChatHistory({
            id: currentId,
            modelLabel: MODEL_LABEL,
            title: firstMsg.slice(0, 30),
            messages: JSON.parse(JSON.stringify(
              messageArray.map(m => ({
                user: m.user,
                assistant: m.assistant,
                blocks: m.blocks
              }))
            )),
            createdAt: currentCreatedAt,
            updatedAt: Date.now(),
          })
          es.close()
        }
      } else if (event.type === "error") {
        console.error("Connection error:", event.message)
        setLoading(false)
      } else if (event.type === "exception") {
        console.error("Error:", event.message, event.error)
        setLoading(false)
      }
    }

    es.addEventListener("open", listener)
    es.addEventListener("message", listener)
    es.addEventListener("error", listener)
  }

  async function copyToClipboard(text: string) {
    await Clipboard.setStringAsync(text)
  }

  async function showClipboardActionsheet(text: string) {
    const cancelButtonIndex = 2
    showActionSheetWithOptions({
      options: ['Copy to clipboard', 'Clear chat', 'cancel'],
      cancelButtonIndex
    }, selectedIndex => {
      if (selectedIndex === Number(0)) {
        copyToClipboard(text)
      }
      if (selectedIndex === 1) {
        clearChat()
      }
    })
  }

  async function clearChat() {
    if (loading) return
    setChatState(createEmptyChatState())
  }

  function renderItem({
    item, index
  } : {
    item: Message, index: number
  }) {
    const hasBlocks = item.blocks && item.blocks.length > 0
    const allText = hasBlocks
      ? item.blocks.filter(b => b.type === 'text').map(b => (b as { type: 'text'; content: string }).content).join('')
      : item.assistant || ''

    return (
      <View style={styles.promptResponse} key={index}>
        <View style={styles.promptTextContainer}>
          <View style={styles.promptTextWrapper}>
            <Text style={styles.promptText}>
              {item.user}
            </Text>
          </View>
        </View>
        {hasBlocks ? (
          <View>
            {item.blocks.map((block, bIdx) => {
              if (block.type === 'thinking') {
                return (
                  <View key={bIdx} style={{ marginHorizontal: spacing.md }}>
                    <ThinkingBlock content={block.content} theme={theme} />
                  </View>
                )
              }
              if (block.type === 'tool_start') {
                return (
                  <View key={bIdx} style={{ marginHorizontal: spacing.md }}>
                    <ToolStartBlock label={block.label || block.name} theme={theme} />
                  </View>
                )
              }
              if (block.type === 'tool_result') {
                return (
                  <View key={bIdx} style={{ marginHorizontal: spacing.md }}>
                    <ToolResultBlock
                      label={block.label || block.name}
                      result={block.result}
                      theme={theme}
                    />
                  </View>
                )
              }
              if (block.type === 'text') {
                return (
                  <View key={bIdx} style={styles.textStyleContainer}>
                    <Markdown style={markdownStyle as any}>{block.content}</Markdown>
                  </View>
                )
              }
              return null
            })}
            {allText ? (
              <TouchableHighlight
                onPress={() => showClipboardActionsheet(allText)}
                underlayColor={'transparent'}
                accessibilityLabel="Message options"
                accessibilityRole="button"
              >
                <View style={styles.optionsIconWrapper}>
                  <Ionicons name="apps" size={20} color={theme.textColor} />
                </View>
              </TouchableHighlight>
            ) : null}
          </View>
        ) : item.assistant ? (
          <View style={styles.textStyleContainer}>
            <Markdown style={markdownStyle as any}>{item.assistant}</Markdown>
            <TouchableHighlight
              onPress={() => showClipboardActionsheet(item.assistant!)}
              underlayColor={'transparent'}
              accessibilityLabel="Message options"
              accessibilityRole="button"
            >
              <View style={styles.optionsIconWrapper}>
                <Ionicons name="apps" size={20} color={theme.textColor} />
              </View>
            </TouchableHighlight>
          </View>
        ) : null}
      </View>
    )
  }

  const callMade = chatState.messages.length > 0

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={styles.container}
      keyboardVerticalOffset={110}
    >
      <ScrollView
        keyboardShouldPersistTaps='handled'
        ref={scrollViewRef}
        contentContainerStyle={!callMade && styles.scrollContentContainer}
      >
        {
          !callMade && (
            <View style={styles.midChatInputWrapper}>
              <View style={styles.midChatInputContainer}>
                <ChatInput
                  value={input}
                  onChangeText={v => setInput(v)}
                  onSubmit={chat}
                  placeholder="Message"
                />
                <Button
                  variant="primary"
                  onPress={chat}
                  accessibilityLabel="Start chat"
                  style={styles.midButtonStyle}
                >
                  <Ionicons
                    name="chatbox-ellipses-outline"
                    size={22} color={theme.tintTextColor}
                  />
                  <Text style={styles.midButtonText}>
                    Start chat
                  </Text>
                </Button>
                <Text style={styles.chatDescription}>
                  Powered by ChatGLM 5.0
                </Text>
              </View>
            </View>
          )
        }
        {
          callMade && (
            <FlatList
              data={chatState.messages}
              renderItem={renderItem}
              scrollEnabled={false}
            />
          )
        }
        {
          loading && (
            <ActivityIndicator style={styles.loadingContainer} />
          )
        }
      </ScrollView>
      {
        callMade && (
          <ChatInput
            value={input}
            onChangeText={v => setInput(v)}
            onSubmit={chat}
            placeholder="Message"
            rightAction={
              <Button
                variant="icon"
                onPress={chat}
                accessibilityLabel="Send message"
                style={styles.chatButton}
              >
                <Ionicons
                  name="arrow-up-outline"
                  size={20} color={theme.tintTextColor}
                />
              </Button>
            }
          />
        )
      }
    </KeyboardAvoidingView>
  )
}

const getBlockStyles = (theme: any) => StyleSheet.create({
  thinkingContainer: {
    backgroundColor: theme.borderColor,
    borderRadius: spacing.sm,
    padding: spacing.md,
    marginVertical: spacing.xs,
  },
  thinkingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thinkingLabel: {
    color: theme.textColor,
    opacity: 0.5,
    fontSize: 13,
    fontFamily: theme.mediumFont,
    marginLeft: spacing.xs,
  },
  thinkingContent: {
    color: theme.textColor,
    opacity: 0.7,
    fontSize: 13,
    fontFamily: theme.regularFont,
    marginTop: 6,
    lineHeight: 18,
  },
  toolStartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginVertical: spacing.xs,
    backgroundColor: theme.borderColor,
    borderRadius: spacing.sm,
  },
  toolStartText: {
    color: theme.textColor,
    fontSize: 14,
    fontFamily: theme.mediumFont,
    marginLeft: spacing.sm,
  },
  toolResultContainer: {
    borderWidth: 1,
    borderColor: theme.tintColor || '#4CAF50',
    borderRadius: 10,
    marginVertical: spacing.xs,
    overflow: 'hidden',
  },
  toolResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: theme.borderColor,
  },
  toolResultLabel: {
    color: theme.textColor,
    fontSize: 13,
    fontFamily: theme.semiBoldFont || theme.mediumFont,
    marginLeft: 6,
  },
  toolResultContent: {
    padding: spacing.md,
  },
})

const getMarkdownStyle = (theme: any) => ({
  body: {
    color: theme.textColor,
    fontFamily: theme.regularFont
  },
  paragraph: {
    color: theme.textColor,
    fontSize: 16,
    fontFamily: theme.regularFont
  },
  heading1: {
    color: theme.headingAccentColor,
    fontFamily: theme.boldFont,
    fontSize: 24,
    marginTop: spacing.xxxl,
    marginBottom: spacing.md,
  },
  heading2: {
    color: theme.headingAccentColor,
    fontFamily: theme.semiBoldFont,
    fontSize: 20,
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
  },
  heading3: {
    color: theme.textColor,
    fontFamily: theme.semiBoldFont,
    fontSize: 17,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  heading4: {
    color: theme.textColor,
    fontFamily: theme.mediumFont,
    fontSize: 16,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  heading5: {
    color: theme.textColor,
    fontFamily: theme.mediumFont,
    fontSize: 15,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  heading6: {
    color: theme.textColor,
    fontFamily: theme.mediumFont,
    fontSize: 14,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  list_item: {
    marginTop: 7,
    color: theme.textColor,
    fontFamily: theme.regularFont,
    fontSize: 16,
  },
  ordered_list_icon: {
    color: theme.textColor,
    fontSize: 16,
    fontFamily: theme.regularFont
  },
  bullet_list: {
    marginTop: spacing.md
  },
  ordered_list: {
    marginTop: 7
  },
  bullet_list_icon: {
    color: theme.textColor,
    fontSize: 16,
    fontFamily: theme.regularFont
  },
  code_inline: {
    color: theme.secondaryTextColor,
    backgroundColor: theme.codeBackgroundColor,
    borderWidth: 1,
    borderColor: theme.codeBorderColor,
    fontFamily: theme.lightFont
  },
  hr: {
    backgroundColor: theme.dividerColor,
    height: 1,
  },
  fence: {
    marginVertical: spacing.xs,
    padding: spacing.md,
    color: theme.secondaryTextColor,
    backgroundColor: theme.codeBackgroundColor,
    borderColor: theme.codeBorderColor,
    fontFamily: theme.regularFont
  },
  tr: {
    borderBottomWidth: 1,
    borderColor: theme.tableBorderColor,
    flexDirection: 'row',
  },
  table: {
    marginTop: 7,
    borderWidth: 1,
    borderColor: theme.tableBorderColor,
    borderRadius: 3,
  },
  blockquote: {
    backgroundColor: theme.blockquoteBackgroundColor,
    borderColor: theme.blockquoteBorderColor,
    borderLeftWidth: 4,
    marginLeft: spacing.xs,
    paddingHorizontal: spacing.xs,
    marginVertical: spacing.xs,
  },
} as any)

const getStyles = (theme: any) => StyleSheet.create({
  optionsIconWrapper: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    alignItems: 'flex-end'
  },
  scrollContentContainer: {
    flex: 1,
  },
  chatDescription: {
    color: theme.textColor,
    textAlign: 'center',
    marginTop: spacing.lg,
    fontSize: 13,
    paddingHorizontal: spacing.xxxl,
    opacity: .8,
    fontFamily: theme.regularFont
  },
  midButtonStyle: {
    marginHorizontal: spacing.lg,
  },
  midButtonText: {
    color: theme.tintTextColor,
    marginLeft: spacing.md,
    fontFamily: theme.boldFont,
    fontSize: 16
  },
  midChatInputWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  midChatInputContainer: {
    width: '100%',
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  loadingContainer: {
    marginTop: spacing.xxl
  },
  promptResponse: {
    marginTop: spacing.md,
  },
  textStyleContainer: {
    backgroundColor: theme.cardBackgroundColor,
    marginRight: spacing.xxl,
    padding: spacing.xl,
    paddingBottom: 6,
    paddingTop: spacing.xs,
    margin: spacing.md,
    borderRadius: 16,
  },
  promptTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: spacing.lg,
    marginLeft: spacing.xxl,
  },
  promptTextWrapper: {
    borderRadius: spacing.sm,
    borderTopRightRadius: 0,
    backgroundColor: theme.tintColor,
  },
  promptText: {
    color: theme.tintTextColor,
    fontFamily: theme.regularFont,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    fontSize: 16
  },
  chatButton: {
    marginRight: spacing.lg,
  },
  container: {
    backgroundColor: theme.backgroundColor,
    flex: 1
  },
})
