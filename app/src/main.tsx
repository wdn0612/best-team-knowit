import { useContext } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Chat, Journal, Gems } from './screens'
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
  const styles = getStyles({ insets })

  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#31444A',
          tabBarInactiveTintColor: '#96A6AC',
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
              intensity={40}
              tint="light"
              style={[StyleSheet.absoluteFill, {
                backgroundColor: 'rgba(228,242,240,0.82)',
                borderTopWidth: 0.5,
                borderTopColor: 'rgba(255,255,255,0.50)',
              }]}
            />
          ),
        }}
      >
        <Tab.Screen
          name="Chat"
          component={Chat}
          options={{
            headerShown: false,
            tabBarLabel: '对话',
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
            headerShown: false,
            tabBarLabel: '日记',
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
            headerShown: false,
            tabBarLabel: '洞察',
            tabBarIcon: ({ color, size }) => (
              <FeatherIcon
                name="star"
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

const getStyles = ({ insets } : { insets: any }) => StyleSheet.create({
  container: {
    backgroundColor: '#EAF6F4',
    flex: 1,
  },
})
