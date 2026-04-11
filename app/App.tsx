import 'react-native-gesture-handler'
import './global.css'
import { useState, useEffect, useRef, useCallback } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { Main } from './src/main'
import { useFonts } from 'expo-font'
import { ThemeContext } from './src/context'
import { xinjiTheme } from './src/theme'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { ActionSheetProvider } from '@expo/react-native-action-sheet'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LogBox } from 'react-native'
import {
  requestNotificationPermissions,
  setupNotificationResponseHandler,
  type CheckInData
} from './src/notifications'
import { Onboarding } from './src/screens/Onboarding'
import {
  getOnboardingQuestionsCompletedAt,
  markOnboardingQuestionsCompleted,
} from './src/storage'

LogBox.ignoreLogs([
  'Key "cancelled" in the image picker result is deprecated and will be removed in SDK 48, use "canceled" instead',
  'No native splash screen registered'
])

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingChecked, setOnboardingChecked] = useState(false)
  const navigationRef = useRef<any>(null)
  const [fontsLoaded] = useFonts({
    'Geist-Regular': require('./assets/fonts/Geist-Regular.otf'),
    'Geist-Light': require('./assets/fonts/Geist-Light.otf'),
    'Geist-Bold': require('./assets/fonts/Geist-Bold.otf'),
    'Geist-Medium': require('./assets/fonts/Geist-Medium.otf'),
    'Geist-Black': require('./assets/fonts/Geist-Black.otf'),
    'Geist-SemiBold': require('./assets/fonts/Geist-SemiBold.otf'),
    'Geist-Thin': require('./assets/fonts/Geist-Thin.otf'),
    'Geist-UltraLight': require('./assets/fonts/Geist-UltraLight.otf'),
    'Geist-UltraBlack': require('./assets/fonts/Geist-UltraBlack.otf'),
    'LXGWWenKai-Medium': require('./assets/fonts/LXGWWenKai-Medium.ttf'),
  })

  const handleCheckIn = useCallback((data: CheckInData) => {
    if (navigationRef.current) {
      navigationRef.current.navigate('Chat', {
        checkInEvent: data
      })
    }
  }, [])

  useEffect(() => {
    checkOnboarding()
    requestNotificationPermissions()
    const cleanup = setupNotificationResponseHandler(handleCheckIn)
    return cleanup
  }, [handleCheckIn])

  async function checkOnboarding() {
    try {
      // Device-level flag: once the 5-question flow is completed on this device
      // it will never show again, even after logout/re-login.
      // See storage.ts — ONBOARDING_QUESTIONS_COMPLETED_AT_KEY for details.
      const completedAt = await getOnboardingQuestionsCompletedAt()
      if (!completedAt) {
        setShowOnboarding(true)
      }
      setOnboardingChecked(true)
    } catch (err) {
      console.log('error checking onboarding', err)
      setOnboardingChecked(true)
    }
  }

  async function completeOnboarding() {
    // Persist device-level completion flag with ISO timestamp
    await markOnboardingQuestionsCompleted()
    setShowOnboarding(false)
  }

  if (!fontsLoaded || !onboardingChecked) return null
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeContext.Provider value={{
        theme: xinjiTheme,
        themeName: 'xinji',
        setTheme: () => {},
        }}>
        {showOnboarding ? (
          <Onboarding onComplete={completeOnboarding} />
        ) : (
          <ActionSheetProvider>
            <NavigationContainer ref={navigationRef}>
              <Main />
            </NavigationContainer>
          </ActionSheetProvider>
        )}
      </ThemeContext.Provider>
    </GestureHandlerRootView>
  )
}
