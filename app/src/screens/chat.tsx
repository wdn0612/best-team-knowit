import {
  View,
  Text,
  KeyboardAvoidingView,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  Modal,
  TextInput,
  Platform,
  Animated,
} from 'react-native'
import { BlurView } from 'expo-blur'
import 'react-native-get-random-values'
import { useContext, useState, useRef, useEffect } from 'react'
import { ThemeContext } from '../context'
import { getEventSource } from '../utils'
import { saveChatHistory, addGem, AssistantBlock } from '../storage'
import { v4 as uuid } from 'uuid'
import Ionicons from '@expo/vector-icons/Ionicons'
import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
import Markdown from '@ronradtke/react-native-markdown-display'
import { ChatInput, Button } from '../components'
import { spacing } from '../theme'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRoute } from '@react-navigation/native'
import * as DropdownMenu from 'zeego/dropdown-menu'

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

function ThinkingBlock({ content, theme, isStreaming }: { content: string; theme: any; isStreaming?: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const styles = getBlockStyles(theme)
  const pulseAnim = useRef(new Animated.Value(isStreaming ? 0.4 : 1)).current

  useEffect(() => {
    if (isStreaming) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        ])
      )
      loop.start()
      return () => loop.stop()
    } else {
      pulseAnim.setValue(1)
    }
  }, [isStreaming])

  return (
    <Pressable
      onPress={() => setExpanded(!expanded)}
      style={styles.thinkingContainer}
      accessibilityLabel={expanded ? 'Collapse thinking process' : 'Expand thinking process'}
      accessibilityRole="button"
    >
      <View style={styles.thinkingHeader}>
        {isStreaming ? (
          <Animated.View style={{ opacity: pulseAnim }}>
            <ActivityIndicator size="small" color={theme.tintColor} style={{ transform: [{ scale: 0.7 }] }} />
          </Animated.View>
        ) : (
          <Ionicons
            name={expanded ? 'chevron-down' : 'chevron-forward'}
            size={14}
            color={theme.textColor}
            style={{ opacity: 0.5 }}
          />
        )}
        <Text style={styles.thinkingLabel}>
          {isStreaming ? '正在思考...' : '思考过程'}
        </Text>
      </View>
      {expanded && !isStreaming && (
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
  const insets = useSafeAreaInsets()
  const route = useRoute<any>()
  const [loading, setLoading] = useState<boolean>(false)
  const [input, setInput] = useState<string>('')
  const scrollViewRef = useRef<ScrollView | null>(null)
  const [chatState, setChatState] = useState<ChatState>(createEmptyChatState)
  const [feedbackState, setFeedbackState] = useState<Record<number, 'liked' | 'disliked'>>({})
  const [dislikeModalVisible, setDislikeModalVisible] = useState(false)
  const [dislikeModalIndex, setDislikeModalIndex] = useState<number>(-1)
  const [dislikeFeedbackText, setDislikeFeedbackText] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingText, setEditingText] = useState('')
  const toastOpacity = useRef(new Animated.Value(0)).current
  const textChunkCount = useRef(0)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()
  const restoredChatId = useRef<string | null>(null)

  const [menuIndex, setMenuIndex] = useState<number | null>(null)
  const [aiSelectingIndex, setAiSelectingIndex] = useState<number | null>(null)
  const [aiSelectingText, setAiSelectingText] = useState('')
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number }>({ start: 0, end: 0 })
  const [gemModalVisible, setGemModalVisible] = useState(false)
  const [gemText, setGemText] = useState('')
  const [gemCategory, setGemCategory] = useState('')
  const [toastMessage, setToastMessage] = useState('已复制')

  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const markdownStyle = getMarkdownStyle(theme)

  // Restore chat from Journal navigation
  useEffect(() => {
    const restore = route.params?.restoreChat
    if (restore && restore.id !== restoredChatId.current) {
      restoredChatId.current = restore.id
      const messages: Message[] = restore.messages.map((m: any) => ({
        user: m.user,
        assistant: m.assistant,
        blocks: m.blocks || [],
      }))
      setChatState({
        id: restore.id,
        messages,
        createdAt: restore.createdAt,
      })
      setFeedbackState({})
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false })
      }, 100)
    }
  }, [route.params?.restoreChat])

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
    textChunkCount.current = 0
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
              textChunkCount.current++
              if (textChunkCount.current % 3 === 1) {
                Haptics.selectionAsync()
              }
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

  function showToast(msg: string = '已复制') {
    setToastMessage(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    Animated.spring(toastOpacity, { toValue: 1, useNativeDriver: true, damping: 15, stiffness: 150 }).start()
    toastTimer.current = setTimeout(() => {
      Animated.spring(toastOpacity, { toValue: 0, useNativeDriver: true, damping: 15, stiffness: 150 }).start()
    }, 1500)
  }

  async function copyToClipboard(text: string) {
    await Clipboard.setStringAsync(text)
    showToast('已复制')
  }

  function openGemModal(text: string) {
    setGemText(text)
    setGemCategory('')
    setGemModalVisible(true)
  }

  async function submitGem() {
    await addGem({
      id: uuid(),
      text: gemText,
      category: gemCategory || '未分类',
      source: 'AI 对话',
    })
    setGemModalVisible(false)
    showToast('已收藏')
  }

  function handleAIBubbleLongPress(index: number, fullText: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setAiSelectingIndex(index)
    setAiSelectingText(fullText)
    setSelectionRange({ start: 0, end: fullText.length })
  }

  function dismissAISelection() {
    setAiSelectingIndex(null)
    setAiSelectingText('')
  }

  function getSelectedText() {
    return aiSelectingText.substring(selectionRange.start, selectionRange.end)
  }

  function handleSelectionCopy() {
    const text = getSelectedText()
    if (text) copyToClipboard(text)
    dismissAISelection()
  }

  function handleSelectionGem() {
    const text = getSelectedText()
    if (text) openGemModal(text)
    dismissAISelection()
  }

  function handleUserMessageLongPress(index: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setMenuIndex(prev => prev === index ? null : index)
  }

  function handleMenuCopy(text: string) {
    setMenuIndex(null)
    copyToClipboard(text)
  }

  function handleMenuEdit(index: number, text: string) {
    setMenuIndex(null)
    setEditingIndex(index)
    setEditingText(text)
  }

  function cancelEditing() {
    setEditingIndex(null)
    setEditingText('')
  }

  async function confirmEditing() {
    if (editingIndex === null || !editingText.trim()) return
    const truncated = chatState.messages.slice(0, editingIndex)
    const newMessages: Message[] = [...truncated, { user: editingText.trim(), blocks: [] }]
    setChatState(prev => ({ ...prev, messages: newMessages }))
    setEditingIndex(null)

    // Re-send with edited message
    setLoading(true)
    textChunkCount.current = 0
    setInput('')
    setTimeout(() => { scrollViewRef.current?.scrollToEnd({ animated: true }) }, 1)

    const currentId = chatState.id
    const currentCreatedAt = chatState.createdAt
    const currentMsgIndex = newMessages.length - 1
    const blocks: AssistantBlock[] = []

    const apiMessages = newMessages.reduce((acc: any[], msg) => {
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
              blocks.push({ type: 'tool_start', name: data.name, label: data.label, args: data.args })
            } else if (blockType === 'tool_result') {
              const startIdx = blocks.findIndex(b => b.type === 'tool_start' && b.name === data.name)
              if (startIdx >= 0) {
                blocks[startIdx] = { type: 'tool_result', name: data.name, label: data.label, result: data.result }
              } else {
                blocks.push({ type: 'tool_result', name: data.name, label: data.label, result: data.result })
              }
            } else if (blockType === 'text') {
              textChunkCount.current++
              if (textChunkCount.current % 3 === 1) {
                Haptics.selectionAsync()
              }
              const last = blocks[blocks.length - 1]
              if (last && last.type === 'text') {
                last.content += data.content
              } else {
                blocks.push({ type: 'text', content: data.content })
              }
            }

            newMessages[currentMsgIndex].blocks = [...blocks]
            newMessages[currentMsgIndex].assistant = blocks
              .filter(b => b.type === 'text')
              .map(b => (b as { type: 'text'; content: string }).content)
              .join('')

            setChatState(prev => ({ ...prev, messages: [...newMessages] }))
          } catch (e) { /* skip malformed chunks */ }
        } else {
          setLoading(false)
          const firstMsg = newMessages[0]?.user || ''
          saveChatHistory({
            id: currentId,
            modelLabel: MODEL_LABEL,
            title: firstMsg.slice(0, 30),
            messages: JSON.parse(JSON.stringify(
              newMessages.map(m => ({ user: m.user, assistant: m.assistant, blocks: m.blocks }))
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

  async function clearChat() {
    if (loading) return
    setChatState(createEmptyChatState())
    setFeedbackState({})
  }

  function handleLike(index: number) {
    setFeedbackState(prev => ({
      ...prev,
      [index]: prev[index] === 'liked' ? undefined! : 'liked',
    }))
  }

  function handleDislike(index: number) {
    if (feedbackState[index] === 'disliked') {
      setFeedbackState(prev => ({ ...prev, [index]: undefined! }))
      return
    }
    setDislikeModalIndex(index)
    setDislikeFeedbackText('')
    setDislikeModalVisible(true)
  }

  function submitDislikeFeedback() {
    setFeedbackState(prev => ({ ...prev, [dislikeModalIndex]: 'disliked' }))
    console.log('Dislike feedback for message', dislikeModalIndex, ':', dislikeFeedbackText)
    setDislikeModalVisible(false)
    setDislikeFeedbackText('')
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
          {editingIndex === index ? (
            <View style={styles.editingContainer}>
              <TextInput
                style={[styles.editingInput, {
                  color: theme.textColor,
                  borderColor: theme.borderColor,
                  backgroundColor: theme.cardBackgroundColor,
                  fontFamily: theme.regularFont,
                }]}
                value={editingText}
                onChangeText={setEditingText}
                multiline
                autoFocus
              />
              <View style={styles.editingButtons}>
                <TouchableOpacity onPress={cancelEditing} style={[styles.editingBtn, { borderColor: theme.borderColor }]}>
                  <Text style={{ color: theme.mutedForegroundColor, fontFamily: theme.mediumFont, fontSize: 14 }}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmEditing} style={[styles.editingBtn, { backgroundColor: theme.tintColor }]}>
                  <Text style={{ color: theme.tintTextColor, fontFamily: theme.mediumFont, fontSize: 14 }}>确认</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <Pressable style={styles.promptTextWrapper}>
                  <Text style={styles.promptText}>
                    {item.user}
                  </Text>
                </Pressable>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item key="copy" onSelect={() => handleMenuCopy(item.user)}>
                  <DropdownMenu.ItemIcon ios={{ name: 'doc.on.doc' }} />
                  <DropdownMenu.ItemTitle>复制</DropdownMenu.ItemTitle>
                </DropdownMenu.Item>
                <DropdownMenu.Item key="edit" onSelect={() => handleMenuEdit(index, item.user)}>
                  <DropdownMenu.ItemIcon ios={{ name: 'pencil' }} />
                  <DropdownMenu.ItemTitle>编辑</DropdownMenu.ItemTitle>
                </DropdownMenu.Item>
                <DropdownMenu.Item key="gem" onSelect={() => openGemModal(item.user)}>
                  <DropdownMenu.ItemIcon ios={{ name: 'diamond' }} />
                  <DropdownMenu.ItemTitle>收藏</DropdownMenu.ItemTitle>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          )}
        </View>
        {hasBlocks ? (
          <View>
            {aiSelectingIndex === index ? (
              <Pressable style={styles.textStyleContainer}>
                <TextInput
                  style={[styles.aiSelectingInput, {
                    color: theme.textColor,
                    fontFamily: theme.regularFont,
                  }]}
                  value={aiSelectingText}
                  multiline
                  editable={false}
                  selection={selectionRange}
                  onSelectionChange={(e) => setSelectionRange(e.nativeEvent.selection)}
                  autoFocus
                />
                <View style={styles.selectionActionBar}>
                  <TouchableOpacity onPress={handleSelectionCopy} style={styles.selectionActionBtn}>
                    <Ionicons name="copy-outline" size={15} color={theme.tintColor} />
                    <Text style={{ color: theme.tintColor, fontFamily: theme.mediumFont, fontSize: 13 }}>复制</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSelectionGem} style={styles.selectionActionBtn}>
                    <Ionicons name="diamond-outline" size={15} color={theme.tintColor} />
                    <Text style={{ color: theme.tintColor, fontFamily: theme.mediumFont, fontSize: 13 }}>收藏</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={dismissAISelection} style={styles.selectionActionBtn}>
                    <Ionicons name="close-outline" size={17} color={theme.mutedForegroundColor} />
                  </TouchableOpacity>
                </View>
              </Pressable>
            ) : (
              <>
                {item.blocks.map((block, bIdx) => {
                  if (block.type === 'thinking') {
                    const isLastMsg = index === chatState.messages.length - 1
                    const isLastBlock = bIdx === item.blocks.length - 1
                    const thinkingStreaming = isLastMsg && isLastBlock && !item.assistant
                    return (
                      <View key={bIdx} style={{ marginHorizontal: spacing.md }}>
                        <ThinkingBlock content={block.content} theme={theme} isStreaming={thinkingStreaming} />
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
                      <Pressable
                        key={bIdx}
                        style={styles.textStyleContainer}
                        onLongPress={() => handleAIBubbleLongPress(index, allText)}
                      >
                        <Markdown style={markdownStyle as any}>{block.content}</Markdown>
                      </Pressable>
                    )
                  }
                  return null
                })}
              </>
            )}
            {allText ? (
              <View style={[styles.feedbackBar, { marginLeft: spacing.xl }]}>
                <TouchableOpacity onPress={() => copyToClipboard(allText)} style={styles.feedbackBtn}>
                  <Ionicons name="copy-outline" size={15} color={theme.mutedForegroundColor} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleLike(index)} style={styles.feedbackBtn}>
                  <Ionicons
                    name={feedbackState[index] === 'liked' ? 'thumbs-up' : 'thumbs-up-outline'}
                    size={18}
                    color={feedbackState[index] === 'liked' ? theme.tintColor : theme.mutedForegroundColor}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDislike(index)} style={styles.feedbackBtn}>
                  <Ionicons
                    name={feedbackState[index] === 'disliked' ? 'thumbs-down' : 'thumbs-down-outline'}
                    size={18}
                    color={feedbackState[index] === 'disliked' ? '#FF6B6B' : theme.mutedForegroundColor}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openGemModal(allText)} style={styles.feedbackBtn}>
                  <Ionicons name="diamond-outline" size={17} color={theme.mutedForegroundColor} />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ) : item.assistant ? (
          aiSelectingIndex === index ? (
            <Pressable style={styles.textStyleContainer}>
              <TextInput
                style={[styles.aiSelectingInput, {
                  color: theme.textColor,
                  fontFamily: theme.regularFont,
                }]}
                value={aiSelectingText}
                multiline
                editable={false}
                selection={selectionRange}
                onSelectionChange={(e) => setSelectionRange(e.nativeEvent.selection)}
                autoFocus
              />
              <View style={styles.selectionActionBar}>
                <TouchableOpacity onPress={handleSelectionCopy} style={styles.selectionActionBtn}>
                  <Ionicons name="copy-outline" size={15} color={theme.tintColor} />
                  <Text style={{ color: theme.tintColor, fontFamily: theme.mediumFont, fontSize: 13 }}>复制</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSelectionGem} style={styles.selectionActionBtn}>
                  <Ionicons name="diamond-outline" size={15} color={theme.tintColor} />
                  <Text style={{ color: theme.tintColor, fontFamily: theme.mediumFont, fontSize: 13 }}>收藏</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={dismissAISelection} style={styles.selectionActionBtn}>
                  <Ionicons name="close-outline" size={17} color={theme.mutedForegroundColor} />
                </TouchableOpacity>
              </View>
            </Pressable>
          ) : (
            <Pressable
              style={styles.textStyleContainer}
              onLongPress={() => handleAIBubbleLongPress(index, item.assistant!)}
            >
              <Markdown style={markdownStyle as any}>{item.assistant}</Markdown>
              <View style={styles.feedbackBar}>
                <TouchableOpacity onPress={() => copyToClipboard(item.assistant!)} style={styles.feedbackBtn}>
                  <Ionicons name="copy-outline" size={15} color={theme.mutedForegroundColor} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleLike(index)} style={styles.feedbackBtn}>
                  <Ionicons
                    name={feedbackState[index] === 'liked' ? 'thumbs-up' : 'thumbs-up-outline'}
                    size={18}
                    color={feedbackState[index] === 'liked' ? theme.tintColor : theme.mutedForegroundColor}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDislike(index)} style={styles.feedbackBtn}>
                  <Ionicons
                    name={feedbackState[index] === 'disliked' ? 'thumbs-down' : 'thumbs-down-outline'}
                    size={18}
                    color={feedbackState[index] === 'disliked' ? '#FF6B6B' : theme.mutedForegroundColor}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openGemModal(item.assistant!)} style={styles.feedbackBtn}>
                  <Ionicons name="diamond-outline" size={17} color={theme.mutedForegroundColor} />
                </TouchableOpacity>
              </View>
            </Pressable>
          )
        ) : null}
      </View>
    )
  }

  const callMade = chatState.messages.length > 0

  return (
    <>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 44 : 0}
    >
      <ScrollView
        keyboardShouldPersistTaps='handled'
        ref={scrollViewRef}
        contentContainerStyle={!callMade && styles.scrollContentContainer}
        onScrollBeginDrag={() => { setMenuIndex(null); dismissAISelection() }}
        onTouchStart={() => { if (menuIndex !== null) setMenuIndex(null) }}
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
          <View style={{ paddingBottom: 50 + insets.bottom }}>
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
          </View>
        )
      }
    </KeyboardAvoidingView>
    <Modal
      visible={dislikeModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setDislikeModalVisible(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setDislikeModalVisible(false)}
      >
        <Pressable style={[styles.modalContent, { backgroundColor: theme.backgroundColor }]}>
          <Text style={[styles.modalTitle, { color: theme.textColor, fontFamily: theme.semiBoldFont }]}>
            What went wrong?
          </Text>
          <TextInput
            style={[styles.modalInput, {
              color: theme.textColor,
              borderColor: theme.borderColor,
              fontFamily: theme.regularFont,
              backgroundColor: theme.cardBackgroundColor,
            }]}
            value={dislikeFeedbackText}
            onChangeText={setDislikeFeedbackText}
            placeholder="Tell us what could be improved..."
            placeholderTextColor={theme.placeholderTextColor}
            multiline
            autoFocus
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              onPress={() => setDislikeModalVisible(false)}
              style={[styles.modalBtn, { borderColor: theme.borderColor }]}
            >
              <Text style={{ color: theme.mutedForegroundColor, fontFamily: theme.mediumFont, fontSize: 15 }}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={submitDislikeFeedback}
              style={[styles.modalBtn, styles.modalSubmitBtn, { backgroundColor: theme.tintColor }]}
            >
              <Text style={{ color: theme.tintTextColor, fontFamily: theme.mediumFont, fontSize: 15 }}>
                Submit
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
    <Modal
      visible={gemModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setGemModalVisible(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setGemModalVisible(false)}
      >
        <Pressable style={[styles.modalContent, { backgroundColor: theme.backgroundColor }]}>
          <View style={styles.gemModalHeader}>
            <Text style={[styles.modalTitle, { color: theme.textColor, fontFamily: theme.semiBoldFont, marginBottom: 0 }]}>
              收藏为 GEM
            </Text>
            <Ionicons name="diamond" size={20} color={theme.tintColor} />
          </View>
          <View style={[styles.gemPreview, { backgroundColor: theme.cardBackgroundColor, borderLeftWidth: 3, borderLeftColor: theme.tintColor }]}>
            <TextInput
              style={{ color: theme.textColor, fontFamily: theme.regularFont, fontSize: 14, lineHeight: 20, maxHeight: 120, padding: 0 }}
              value={gemText}
              onChangeText={setGemText}
              multiline
              placeholder="选取或编辑要收藏的内容"
              placeholderTextColor={theme.placeholderTextColor}
            />
          </View>
          <View style={styles.gemChipsRow}>
            {['每日灵感', '人生哲学', '技术洞见', '金句'].map(cat => (
              <TouchableOpacity
                key={cat}
                onPress={() => setGemCategory(prev => prev === cat ? '' : cat)}
                style={[
                  styles.gemChip,
                  {
                    borderColor: gemCategory === cat ? theme.tintColor : theme.borderColor,
                    backgroundColor: gemCategory === cat ? theme.tintColor : 'transparent',
                  },
                ]}
              >
                <Text style={{
                  fontSize: 13,
                  fontFamily: theme.mediumFont,
                  color: gemCategory === cat ? theme.tintTextColor : theme.textColor,
                }}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.gemCategoryInput, {
              color: theme.textColor,
              borderColor: theme.borderColor,
              fontFamily: theme.regularFont,
              backgroundColor: theme.cardBackgroundColor,
            }]}
            value={gemCategory}
            onChangeText={setGemCategory}
            placeholder="自定义分类（可选）"
            placeholderTextColor={theme.placeholderTextColor}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              onPress={() => setGemModalVisible(false)}
              style={[styles.modalBtn, { borderColor: theme.borderColor }]}
            >
              <Text style={{ color: theme.mutedForegroundColor, fontFamily: theme.mediumFont, fontSize: 15 }}>
                取消
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={submitGem}
              style={[styles.modalBtn, styles.modalSubmitBtn, { backgroundColor: theme.tintColor }]}
            >
              <Text style={{ color: theme.tintTextColor, fontFamily: theme.mediumFont, fontSize: 15 }}>
                收藏
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
    <Animated.View
      pointerEvents="none"
      style={[styles.toast, { opacity: toastOpacity }]}
    >
      <BlurView
        intensity={50}
        tint={theme.label === 'light' || theme.label === 'hackerNews' ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <Text style={styles.toastText}>{toastMessage}</Text>
    </Animated.View>
    </>
  )
}

const getBlockStyles = (theme: any) => StyleSheet.create({
  thinkingContainer: {
    backgroundColor: theme.cardBackgroundColor,
    borderRadius: 12,
    borderCurve: 'continuous',
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
    backgroundColor: theme.cardBackgroundColor,
    borderRadius: 12,
    borderCurve: 'continuous',
  },
  toolStartText: {
    color: theme.textColor,
    fontSize: 14,
    fontFamily: theme.mediumFont,
    marginLeft: spacing.sm,
  },
  toolResultContainer: {
    borderWidth: 1,
    borderColor: theme.borderColor,
    borderRadius: 12,
    borderCurve: 'continuous',
    marginVertical: spacing.xs,
    overflow: 'hidden',
  },
  toolResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: theme.cardBackgroundColor,
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
  feedbackBar: {
    flexDirection: 'row',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.md,
  },
  feedbackBtn: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: spacing.xl,
  },
  modalTitle: {
    fontSize: 17,
    marginBottom: spacing.lg,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modalSubmitBtn: {
    borderWidth: 0,
  },
  scrollContentContainer: {
    flex: 1,
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
    borderRadius: 18,
    borderCurve: 'continuous',
  },
  promptTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: spacing.lg,
    marginLeft: spacing.xxl,
    overflow: 'visible',
    zIndex: 1,
  },
  promptTextWrapper: {
    borderRadius: 18,
    borderCurve: 'continuous',
    backgroundColor: theme.tintColor,
  },
  promptText: {
    color: theme.tintTextColor,
    fontFamily: theme.regularFont,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: 16
  },
  chatButton: {
    marginRight: spacing.lg,
  },
  container: {
    backgroundColor: theme.backgroundColor,
    flex: 1,
  },
  toast: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    backgroundColor: theme.label === 'light' || theme.label === 'hackerNews'
      ? 'rgba(0,0,0,0.7)'
      : 'rgba(255,255,255,0.18)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    overflow: 'hidden',
  },
  toastText: {
    color: theme.label === 'light' || theme.label === 'hackerNews' ? '#fff' : theme.textColor,
    fontSize: 14,
    fontFamily: theme.mediumFont,
  },
  editingContainer: {
    width: '100%',
  },
  editingInput: {
    borderWidth: 1,
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: spacing.sm,
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  editingButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  editingBtn: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  bubbleMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: spacing.xs,
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  bubbleMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  bubbleMenuText: {
    fontSize: 15,
  },
  bubbleMenuDivider: {
    height: StyleSheet.hairlineWidth,
  },
  gemModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  gemPreview: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  gemChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  gemChip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  gemCategoryInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: spacing.sm,
    fontSize: 14,
    marginBottom: spacing.lg,
  },
  aiSelectingInput: {
    fontSize: 16,
    lineHeight: 22,
    padding: 0,
    textAlignVertical: 'top',
  },
  selectionActionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.borderColor,
    marginTop: spacing.sm,
  },
  selectionActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
})
