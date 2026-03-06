import { Text, View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { useContext, useState, useCallback, useRef } from 'react'
import { ThemeContext } from '../context'
import { spacing } from '../theme'
import { GemCard, loadGems, deleteGem, getDefaultGems } from '../storage'
import { useFocusEffect } from '@react-navigation/native'
import { Swipeable } from 'react-native-gesture-handler'
import Ionicons from '@expo/vector-icons/Ionicons'

export function Gems() {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const [gems, setGems] = useState<GemCard[]>(getDefaultGems())
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map())

  useFocusEffect(
    useCallback(() => {
      loadGems().then(setGems)
    }, [])
  )

  async function handleDelete(id: string) {
    await deleteGem(id)
    setGems(prev => prev.filter(g => g.id !== id))
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
      <View style={styles.emptyContainer}>
        <Ionicons name="diamond-outline" size={48} color={theme.mutedForegroundColor} style={{ opacity: 0.5 }} />
        <Text style={styles.emptyText}>还没有收藏的 GEM</Text>
        <Text style={styles.emptySubtext}>长按对话气泡，收藏喜欢的内容</Text>
      </View>
    )
  }

  const accentColor = theme.tintColor

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
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
})
