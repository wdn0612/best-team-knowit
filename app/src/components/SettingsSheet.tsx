import { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Switch, Platform,
  Animated, Dimensions, Easing,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { GlassCard } from './GlassCard'
import { USER_AGREEMENT, AGREEMENT_VERSION, EFFECTIVE_DATE, AgreementBlock } from '../agreements/userAgreement'

type SettingsSheetProps = {
  visible: boolean
  onClose: () => void
}

const { height: SH } = Dimensions.get('window')

function AgreementBlockView({ block }: { block: AgreementBlock }) {
  switch (block.type) {
    case 'lead':
      return <Text style={styles.agreementLead}>{block.text}</Text>
    case 'section':
      return (
        <View style={styles.agreementSection}>
          <Text style={styles.agreementSectionIndex}>{block.index}</Text>
          <Text style={styles.agreementSectionTitle}>{block.title}</Text>
        </View>
      )
    case 'subtitle':
      return <Text style={styles.agreementSubtitle}>{block.text}</Text>
    case 'paragraph':
      return <Text style={styles.agreementParagraph}>{block.text}</Text>
    case 'bullets':
      return (
        <View style={styles.agreementBullets}>
          {block.items.map((item, i) => (
            <View key={i} style={styles.agreementBulletRow}>
              <View style={styles.agreementBulletDot} />
              <Text style={styles.agreementBulletText}>{item}</Text>
            </View>
          ))}
        </View>
      )
    case 'callout':
      return (
        <View style={[styles.agreementCallout, block.tone === 'warn' && styles.agreementCalloutWarn]}>
          {block.title && <Text style={styles.agreementCalloutTitle}>{block.title}</Text>}
          <Text style={styles.agreementCalloutText}>{block.text}</Text>
        </View>
      )
    case 'footer':
      return <Text style={styles.agreementFooter}>{block.text}</Text>
    default:
      return null
  }
}

export function SettingsSheet({ visible, onClose }: SettingsSheetProps) {
  const insets = useSafeAreaInsets()
  const [greetingEnabled, setGreetingEnabled] = useState(true)
  const [greetingTime, setGreetingTime] = useState('21:00')
  const [memoryFollowUp, setMemoryFollowUp] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [agreementVisible, setAgreementVisible] = useState(false)
  const slideAnim = useRef(new Animated.Value(SH)).current

  const TIME_OPTIONS = ['08:00', '09:00', '12:00', '18:00', '21:00', '22:00']

  useEffect(() => {
    if (visible) {
      setModalVisible(true)
      slideAnim.setValue(SH)
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 22,
        stiffness: 220,
        useNativeDriver: true,
      }).start()
    } else if (modalVisible) {
      Animated.timing(slideAnim, {
        toValue: SH,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => setModalVisible(false))
    }
  }, [visible])

  return (
    <Modal visible={modalVisible} animationType="none" transparent={false} onRequestClose={onClose}>
      <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
        <LinearGradient
          colors={['#BFE7EA', '#D4EEF0', '#E2F4F2', '#EAF6F4']}
          locations={[0, 0.35, 0.6, 1]}
          style={StyleSheet.absoluteFill}
        />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 10, paddingBottom: 40 }]}
        >
          {/* Nav */}
          <View style={styles.nav}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={18} color="#31444A" />
              <Text style={styles.backText}>返回</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.pageTitle}>设置</Text>

          {/* 主动问候 */}
          <Text style={styles.sectionLabel}>主动问候</Text>
          <GlassCard borderRadius={26} style={styles.group}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#B9ECE3' }]}>
                  <Ionicons name="sunny-outline" size={16} color="#fff" />
                </View>
                <View>
                  <Text style={styles.rowLabel}>每日问候</Text>
                  <Text style={styles.rowSub}>每天主动和你打招呼</Text>
                </View>
              </View>
              <Switch
                value={greetingEnabled}
                onValueChange={setGreetingEnabled}
                trackColor={{ false: 'rgba(0,0,0,0.10)', true: '#BDEDE5' }}
                thumbColor="#fff"
              />
            </View>
            {greetingEnabled && (
              <>
                <View style={styles.divider} />
                <View style={styles.row}>
                  <View style={styles.rowLeft}>
                    <View style={[styles.iconBox, { backgroundColor: '#B9ECE3' }]}>
                      <Ionicons name="time-outline" size={16} color="#fff" />
                    </View>
                    <Text style={styles.rowLabel}>问候时间</Text>
                  </View>
                  <View style={styles.timeChips}>
                    {TIME_OPTIONS.map(t => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.timeChip, greetingTime === t && styles.timeChipActive]}
                        onPress={() => setGreetingTime(t)}
                      >
                        <Text style={[styles.timeChipText, greetingTime === t && styles.timeChipTextActive]}>
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}
            <View style={styles.divider} />
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#B8D7E8' }]}>
                  <Ionicons name="chatbubbles-outline" size={16} color="#fff" />
                </View>
                <View>
                  <Text style={styles.rowLabel}>记忆追问</Text>
                  <Text style={styles.rowSub}>根据你提过的事情主动关心</Text>
                </View>
              </View>
              <Switch
                value={memoryFollowUp}
                onValueChange={setMemoryFollowUp}
                trackColor={{ false: 'rgba(0,0,0,0.10)', true: '#BDEDE5' }}
                thumbColor="#fff"
              />
            </View>
          </GlassCard>

          {/* 通知 */}
          <Text style={styles.sectionLabel}>通知</Text>
          <GlassCard borderRadius={26} style={styles.group}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#AFC8BA' }]}>
                  <Ionicons name="notifications-outline" size={16} color="#fff" />
                </View>
                <Text style={styles.rowLabel}>推送通知</Text>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: 'rgba(0,0,0,0.10)', true: '#BDEDE5' }}
                thumbColor="#fff"
              />
            </View>
          </GlassCard>

          {/* 关于 */}
          <Text style={styles.sectionLabel}>关于</Text>
          <GlassCard borderRadius={26} style={styles.group}>
            <TouchableOpacity style={styles.row} onPress={() => setAgreementVisible(true)}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#B9ECE3' }]}>
                  <Ionicons name="document-text-outline" size={16} color="#fff" />
                </View>
                <Text style={styles.rowLabel}>用户协议</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color="#96A6AC" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#B8D7E8' }]}>
                  <Ionicons name="information-circle-outline" size={16} color="#fff" />
                </View>
                <Text style={styles.rowLabel}>版本</Text>
              </View>
              <Text style={styles.rowValue}>1.1.0</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#AFC8BA' }]}>
                  <Ionicons name="people-outline" size={16} color="#fff" />
                </View>
                <Text style={styles.rowLabel}>开发者</Text>
              </View>
              <Text style={styles.rowValue}>KnowIt Team</Text>
            </View>
          </GlassCard>
        </ScrollView>
      </Animated.View>

      {/* 用户协议 全屏阅读界面 */}
      <Modal
        visible={agreementVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setAgreementVisible(false)}
      >
        <View style={styles.agreementContainer}>
          <LinearGradient
            colors={['#BFE7EA', '#D4EEF0', '#E2F4F2', '#EAF6F4']}
            locations={[0, 0.35, 0.6, 1]}
            style={StyleSheet.absoluteFill}
          />
          {/* 顶部导航 */}
          <View style={[styles.agreementNav, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity onPress={() => setAgreementVisible(false)} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={18} color="#31444A" />
              <Text style={styles.backText}>返回</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.agreementTitle}>用户协议</Text>
          <Text style={styles.agreementMeta}>版本 {AGREEMENT_VERSION}　·　{EFFECTIVE_DATE}</Text>
          {/* 协议正文 */}
          <ScrollView
            style={styles.agreementScroll}
            contentContainerStyle={[styles.agreementContent, { paddingBottom: insets.bottom + 40 }]}
            showsVerticalScrollIndicator={true}
          >
            {USER_AGREEMENT.map((block, idx) => (
              <AgreementBlockView key={idx} block={block} />
            ))}
          </ScrollView>
        </View>
      </Modal>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  backText: {
    fontSize: 14,
    color: '#31444A',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#304148',
    letterSpacing: -0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#6E7F86',
    fontWeight: '500',
    marginBottom: 6,
    marginTop: 20,
    marginLeft: 4,
  },
  group: {
    marginBottom: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    flex: 1,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 14,
    color: '#304148',
  },
  rowSub: {
    fontSize: 11,
    color: '#96A6AC',
    marginTop: 1,
  },
  rowValue: {
    fontSize: 13,
    color: '#6E7F86',
  },
  divider: {
    height: 0.5,
    backgroundColor: 'rgba(63,86,92,0.10)',
  },
  timeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    maxWidth: 180,
    justifyContent: 'flex-end',
  },
  timeChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.40)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  timeChipActive: {
    backgroundColor: 'rgba(185,236,227,0.35)',
    borderColor: '#B9ECE3',
  },
  timeChipText: {
    fontSize: 12,
    color: '#6E7F86',
  },
  timeChipTextActive: {
    color: '#31444A',
    fontWeight: '600',
  },
  // 用户协议 modal styles
  agreementContainer: {
    flex: 1,
  },
  agreementNav: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  agreementTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#304148',
    letterSpacing: -0.5,
    marginTop: 4,
    marginBottom: 2,
    paddingHorizontal: 20,
  },
  agreementMeta: {
    fontSize: 12,
    color: '#6E7F86',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  agreementScroll: {
    flex: 1,
  },
  agreementContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  agreementLead: {
    fontSize: 14.5,
    lineHeight: 25,
    color: '#304148',
    marginBottom: 20,
  },
  agreementSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 26,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(49,68,74,0.18)',
  },
  agreementSectionIndex: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3A8C9E',
    marginRight: 8,
    letterSpacing: 0.5,
  },
  agreementSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F3239',
    letterSpacing: 0.3,
  },
  agreementSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#31444A',
    marginTop: 14,
    marginBottom: 4,
  },
  agreementParagraph: {
    fontSize: 14,
    lineHeight: 24,
    color: '#304148',
    marginBottom: 10,
  },
  agreementBullets: {
    marginBottom: 10,
    gap: 6,
  },
  agreementBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 4,
  },
  agreementBulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3A8C9E',
    marginTop: 10,
    marginRight: 10,
  },
  agreementBulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 24,
    color: '#304148',
  },
  agreementCallout: {
    backgroundColor: 'rgba(58,140,158,0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#3A8C9E',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginVertical: 10,
  },
  agreementCalloutWarn: {
    backgroundColor: 'rgba(205,117,85,0.08)',
    borderLeftColor: '#C16A48',
  },
  agreementCalloutTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8B3F1E',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  agreementCalloutText: {
    fontSize: 13.5,
    lineHeight: 22,
    color: '#3A2A1E',
  },
  agreementFooter: {
    fontSize: 12,
    color: '#6E7F86',
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 8,
  },
})
