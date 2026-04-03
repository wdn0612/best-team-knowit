import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { markEventCheckedIn } from './contextStorage'

// Configure how notifications appear when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

/**
 * Request notification permissions.
 * Call this early in app lifecycle.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync()
  if (existing === 'granted') return true

  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

/**
 * Set up the listener for when a user taps a notification.
 * Returns a navigation callback data object, or null.
 */
export type CheckInData = {
  eventId: string
  conversationId: string
}

let pendingCheckIn: CheckInData | null = null

/**
 * Get and clear any pending check-in from a notification tap.
 */
export function consumePendingCheckIn(): CheckInData | null {
  const data = pendingCheckIn
  pendingCheckIn = null
  return data
}

/**
 * Initialize notification response handling.
 * Call once in App.tsx. When user taps a check-in notification,
 * stores the data so the Chat screen can pick it up.
 */
export function setupNotificationResponseHandler(
  onCheckIn: (data: CheckInData) => void
): () => void {
  // Handle notification taps when the app is already running
  const subscription = Notifications.addNotificationResponseReceivedListener(
    async (response) => {
      const data = response.notification.request.content.data as CheckInData | undefined
      if (data?.eventId) {
        await markEventCheckedIn(data.eventId)
        pendingCheckIn = data
        onCheckIn(data)
      }
    }
  )

  // Handle the case where the app was launched by tapping a notification
  Notifications.getLastNotificationResponseAsync().then(async (response) => {
    if (response) {
      const data = response.notification.request.content.data as CheckInData | undefined
      if (data?.eventId) {
        await markEventCheckedIn(data.eventId)
        pendingCheckIn = data
        onCheckIn(data)
      }
    }
  })

  return () => subscription.remove()
}

/**
 * Cancel all scheduled notifications for a specific event.
 */
export async function cancelEventNotifications(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId)
  } catch {
    // Already fired or invalid ID
  }
}
