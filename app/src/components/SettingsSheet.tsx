import { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Switch, Platform,
  Animated, Dimensions, Easing,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { GlassCard } from './GlassCard'

type SettingsSheetProps = {
  visible: boolean
  onClose: () => void
}

const { height: SH } = Dimensions.get('window')

export function SettingsSheet({ visible, onClose }: SettingsSheetProps) {
  const insets = useSafeAreaInsets()
  const [greetingEnabled, setGreetingEnabled] = useState(true)
  const [greetingTime, setGreetingTime] = useState('21:00')
  const [memoryFollowUp, setMemoryFollowUp] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
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
            <TouchableOpacity style={styles.row}>
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
})
