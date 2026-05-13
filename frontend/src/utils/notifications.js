import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from '../api';

/**
 * Configure how notifications are handled when the app is foregrounded
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Registers the device for push notifications and sends the token to the backend.
 * Only runs on physical devices.
 */
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'web') {
    return null;
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return null;
    }

    try {
      // Get the projectId from app config (EAS Project ID)
      const projectId = 
        Constants?.expoConfig?.extra?.eas?.projectId ?? 
        Constants?.easConfig?.projectId;

      if (!projectId) {
        console.warn('Project ID not found in expo config. Check app.json.');
        return null;
      }

      // Get the token from Expo
      token = (await Notifications.getExpoPushTokenAsync({
        projectId
      })).data;
      
      console.log('Expo Push Token:', token);

      // Save token to backend for the logged-in user
      if (token) {
        await api.post('/users/push-token', { pushToken: token });
      }

    } catch (error) {
      console.error('Error getting push token:', error);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
