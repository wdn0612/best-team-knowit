import { Text, StyleSheet, ScrollView } from 'react-native'
import { useContext, useEffect, useState } from 'react'
import { ThemeContext } from '../context'
import { Card } from '../components'
import { spacing } from '../theme'
import { GemCard, loadGems, getDefaultGems } from '../storage'

export function Gems() {
  const { theme } = useContext(ThemeContext)
  const [gems, setGems] = useState<GemCard[]>(getDefaultGems())

  useEffect(() => {
    loadGems().then(setGems)
  }, [])

  const palette: string[] = theme.accentPalette ?? [theme.tintColor]

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.backgroundColor }}
      contentContainerStyle={styles.contentContainer}
    >
      {gems.map((gem, index) => {
        const accentColor = palette[index % palette.length]
        const isEven = index % 2 === 1
        return (
          <Card
            key={gem.id}
            elevated
            style={{
              ...styles.card,
              marginRight: isEven ? 0 : 40,
              marginLeft: isEven ? 40 : 0,
              borderLeftWidth: 4,
              borderLeftColor: accentColor,
            }}
          >
            <Text style={{
              fontFamily: theme.regularFont,
              fontSize: 12,
              color: theme.mutedForegroundColor,
              marginBottom: 12,
            }}>
              {'✦ ' + gem.category}
            </Text>
            <Text style={{
              fontFamily: theme.semiBoldFont,
              fontSize: 18,
              lineHeight: 28,
              color: theme.textColor,
            }}>
              {'"' + gem.text + '"'}
            </Text>
            <Text style={{
              fontFamily: theme.lightFont,
              fontSize: 12,
              color: theme.mutedForegroundColor,
              marginTop: 16,
              fontStyle: 'italic',
            }}>
              {'── ' + gem.source}
            </Text>
          </Card>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: spacing.xl,
    paddingTop: spacing.xxxl,
  },
  card: {
    marginBottom: spacing.xxl,
    padding: spacing.xl,
    borderRadius: 20,
  },
})
