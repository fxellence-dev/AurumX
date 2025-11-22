import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications and get Expo Push Token
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;

  // Check if physical device (simulators don't support push notifications)
  if (!Device.isDevice) {
    console.log('⚠️ Push notifications only work on physical devices');
    return undefined;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // If permissions denied, return
  if (finalStatus !== 'granted') {
    console.log('❌ Failed to get push token - permissions denied');
    return undefined;
  }

  // Get Expo Push Token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    if (!projectId) {
      throw new Error('Project ID not found in app config');
    }

    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;
    
    console.log('📱 Expo Push Token:', token);
  } catch (error) {
    console.error('❌ Error getting push token:', error);
  }

  // iOS-specific configuration
  if (Platform.OS === 'ios') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#D4AF37',
    });
  }

  return token;
}

/**
 * Save push token to Supabase for the current user
 */
export async function savePushTokenToDatabase(
  userId: string,
  pushToken: string,
  supabase: any
): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_push_tokens')
      .upsert({
        user_id: userId,
        push_token: pushToken,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,platform'
      });

    if (error) {
      console.error('❌ Error saving push token:', error);
      throw error;
    }

    console.log('✅ Push token saved to database');
  } catch (error) {
    console.error('❌ Failed to save push token:', error);
    throw error;
  }
}

/**
 * Remove push token when user signs out
 */
export async function removePushTokenFromDatabase(
  userId: string,
  supabase: any
): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_push_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('platform', Platform.OS);

    if (error) {
      console.error('❌ Error removing push token:', error);
      throw error;
    }

    console.log('✅ Push token removed from database');
  } catch (error) {
    console.error('❌ Failed to remove push token:', error);
  }
}

/**
 * Handle notification received while app is in foreground
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Handle notification tapped by user
 */
export function addNotificationResponseReceivedListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
  await setBadgeCount(0);
}

/**
 * Schedule a local notification (for testing)
 */
export async function scheduleTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🔔 Test Notification",
      body: 'This is a test push notification from AurumX',
      data: { test: true },
      sound: true,
    },
    trigger: { 
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
      repeats: false,
    },
  });
}
