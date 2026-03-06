import { useContext } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Chat, Journal, Gems, Settings } from './screens'
import { Header } from './components'
import FeatherIcon from '@expo/vector-icons/Feather'
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
import { ThemeContext } from './context'
import { BlurView } from 'expo-blur'

const Tab = createBottomTabNavigator()

function MainComponent() {
  const insets = useSafeAreaInsets()
  const { theme } = useContext(ThemeContext)
  const styles = getStyles({ theme, insets })

  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: theme.tabBarActiveTintColor,
          tabBarInactiveTintColor: theme.tabBarInactiveTintColor,
          tabBarStyle: {
            position: 'absolute',
            borderTopWidth: 0,
            backgroundColor: 'transparent',
            paddingBottom: insets.bottom,
            height: 50 + insets.bottom,
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
              },
              android: {
                elevation: 4,
              },
            }),
          },
          tabBarBackground: () => (
            <BlurView
              intensity={60}
              tint={theme.label === 'light' || theme.label === 'hackerNews' ? 'light' : 'dark'}
              style={StyleSheet.absoluteFill}
            />
          ),
        }}
      >
        <Tab.Screen
          name="Chat"
          component={Chat}
          options={{
            header: () => <Header subtitle="ChatGLM 5.0" />,
            tabBarIcon: ({ color, size }) => (
              <FeatherIcon
                name="message-circle"
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Journal"
          component={Journal}
          options={{
            header: () => <Header />,
            tabBarIcon: ({ color, size }) => (
              <FeatherIcon
                name="book"
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Gems"
          component={Gems}
          options={{
            header: () => <Header />,
            tabBarIcon: ({ color, size }) => (
              <FeatherIcon
                name="hexagon"
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={Settings}
          options={{
            header: () => <Header />,
            tabBarIcon: ({ color, size }) => (
              <FeatherIcon
                name="sliders"
                color={color}
                size={size}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

export function Main() {
  return (
    <SafeAreaProvider>
      <MainComponent />
    </SafeAreaProvider>
  )
}

const getStyles = ({ theme, insets } : { theme: any, insets: any}) => StyleSheet.create({
  container: {
    backgroundColor: theme.backgroundColor,
    flex: 1,
    paddingTop: insets.top,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  },
})
