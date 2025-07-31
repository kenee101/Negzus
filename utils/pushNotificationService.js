import { supabase } from '@/services/supabase';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';

export async function registerForPushNotificationsAsync() {
  let token;
  
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token:', token);
  } else {
    alert('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}

////////////////////////////////////////
// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class PushNotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
    this.isInitialized = false;
  }

  async initialize(userId) {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return false;
    }

    if (this.isInitialized) {
      return true;
    }

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return false;
      }

      // Get the token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PROJECT_ID || 'fcc9c9d8-ca75-4348-bd71-99cc94660f6f',
      });
      
      this.expoPushToken = token.data;
      console.log('Push token:', this.expoPushToken);

      // Save token to database
      await this.savePushToken(userId, this.expoPushToken);

      // Set up notification listeners
      this.setupNotificationListeners();

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('fuel-updates', {
          name: 'Fuel Updates',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4ade80',
        });
      }

      this.isInitialized = true;
      return true;

    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return false;
    }
  }

  async savePushToken(userId, token) {
    try {
      const platform = Platform.OS;
      
      // First, deactivate any existing tokens for this user
      await supabase
        .from('push_notification_tokens')
        .update({ is_active: false })
        .eq('user_id', userId);

      // Insert the new token
      const { error } = await supabase
        .from('push_notification_tokens')
        .insert({
          user_id: userId,
          token: token,
          platform: platform,
          is_active: true
        });

      if (error) throw error;
      
      // Also update the expo_push_token in users table for backward compatibility
      await supabase
        .from('users')
        .update({ expo_push_token: token })
        .eq('id', userId);

      console.log('Push token saved successfully');
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  setupNotificationListeners() {
    // Listener for notifications received while app is running
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // Handle the notification here if needed
    });

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  handleNotificationResponse(response) {
    const { notification } = response;
    const data = notification.request.content.data;
    
    // Handle different notification types
    switch (data?.type) {
      case 'fuel_restock':
      case 'fuel_out_of_stock':
      case 'price_update':
        // Navigate to station details or fuel prices screen
        if (data.stationId) {
          console.log('Navigate to station:', data.stationId);
          // You can use your navigation service here
        }
        break;
      default:
        console.log('General notification tapped');
    }
  }

  async sendNotificationToStation(stationId, title, message, data = {}) {
    try {
      // Get all users subscribed to this station
      const { data: subscriptions, error: subError } = await supabase
        .from('subscriptions')
        .select(`
          user_id,
          users!inner (
            expo_push_token
          )
        `)
        .eq('station_id', stationId);

      if (subError) throw subError;

      // Also get tokens from push_notification_tokens table
      const { data: tokens, error: tokenError } = await supabase
        .from('push_notification_tokens')
        .select(`
          token,
          platform,
          user_id
        `)
        .eq('is_active', true)
        .in('user_id', subscriptions?.map(sub => sub.user_id) || []);

      if (tokenError) throw tokenError;

      // Combine tokens from both sources
      const allTokens = new Set();
      
      // Add tokens from users table
      if (subscriptions) {
        subscriptions.forEach(sub => {
          if (sub.users?.expo_push_token) {
            allTokens.add(sub.users.expo_push_token);
          }
        });
      }

      // Add tokens from push_notification_tokens table
      if (tokens) {
        tokens.forEach(tokenData => {
          if (tokenData.token) {
            allTokens.add(tokenData.token);
          }
        });
      }

      const tokenArray = Array.from(allTokens);

      if (tokenArray.length === 0) {
        console.log('No active push tokens found for station:', stationId);
        return { success: true, sent: 0 };
      }

      // Send notifications to all tokens
      const notifications = tokenArray.map(token => ({
        to: token,
        sound: 'default',
        title: title,
        body: message,
        data: {
          stationId: stationId,
          ...data
        },
        channelId: 'fuel-updates',
      }));

      const chunks = this.chunkArray(notifications, 100); // Expo limits to 100 notifications per request
      let totalSent = 0;

      for (const chunk of chunks) {
        try {
          const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Accept-encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(chunk),
          });

          const result = await response.json();
          console.log('Push notification result:', result);
          
          if (result.data) {
            totalSent += result.data.filter(item => item.status === 'ok').length;
          }
        } catch (chunkError) {
          console.error('Error sending notification chunk:', chunkError);
        }
      }

      return { success: true, sent: totalSent };
    } catch (error) {
      console.error('Error sending push notifications:', error);
      return { success: false, error: error.message };
    }
  }

  async sendNotificationToUser(userId, title, message, data = {}) {
    try {
      // Get user's push tokens
      const tokens = [];
      
      // Get from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('expo_push_token')
        .eq('id', userId)
        .single();

      if (!userError && userData?.expo_push_token) {
        tokens.push(userData.expo_push_token);
      }

      // Get from push_notification_tokens table
      const { data: tokenData, error: tokenError } = await supabase
        .from('push_notification_tokens')
        .select('token, platform')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (!tokenError && tokenData) {
        tokenData.forEach(t => {
          if (t.token && !tokens.includes(t.token)) {
            tokens.push(t.token);
          }
        });
      }

      if (tokens.length === 0) {
        console.log('No active push tokens found for user:', userId);
        return { success: true, sent: 0 };
      }

      // Send notifications to all user's tokens
      const notifications = tokens.map(token => ({
        to: token,
        sound: 'default',
        title: title,
        body: message,
        data: data,
        channelId: 'fuel-updates',
      }));

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notifications),
      });

      const result = await response.json();
      console.log('Push notification result:', result);

      const sent = result.data ? result.data.filter(item => item.status === 'ok').length : 0;
      return { success: true, sent };
    } catch (error) {
      console.error('Error sending push notification to user:', error);
      return { success: false, error: error.message };
    }
  }

  // Utility function to chunk arrays
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  async scheduleLocalNotification(title, message, seconds = 1) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: message,
          sound: 'default',
        },
        trigger: { seconds: seconds },
      });
    } catch (error) {
      console.error('Error scheduling local notification:', error);
    }
  }

  async cancelAllScheduledNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling scheduled notifications:', error);
    }
  }

  cleanup() {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
    this.isInitialized = false;
  }
}

export default new PushNotificationService();

// Hook for using push notifications in components
export function usePushNotifications() {
  const [isInitialized, setIsInitialized] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id && !isInitialized) {
      PushNotificationService.initialize(user.id).then((success) => {
        setIsInitialized(success);
      });
    }

    return () => {
      if (isInitialized) {
        PushNotificationService.cleanup();
      }
    };
  }, [user?.id]);

  const sendToStation = async (stationId, title, message, data = {}) => {
    return await PushNotificationService.sendNotificationToStation(stationId, title, message, data);
  };

  const sendToUser = async (userId, title, message, data = {}) => {
    return await PushNotificationService.sendNotificationToUser(userId, title, message, data);
  };

  const scheduleLocal = async (title, message, seconds = 1) => {
    return await PushNotificationService.scheduleLocalNotification(title, message, seconds);
  };

  const cancelAll = async () => {
    return await PushNotificationService.cancelAllScheduledNotifications();
  };

  return {
    isInitialized,
    sendToStation,
    sendToUser,
    scheduleLocal,
    cancelAll,
  };
}

// Enhanced notification handler for database changes
// export class FuelNotificationHandler {
//   constructor() {
//     this.setupDatabaseTriggers();
//   }

//   setupDatabaseTriggers() {
//     // Listen for new notifications in the database
//     supabase
//       .channel('notifications')
//       .on(
//         'postgres_changes',
//         {
//           event: 'INSERT',
//           schema: 'public',
//           table: 'notifications'
//         },
//         (payload) => {
//           this.handleNewNotification(payload.new);
//         }
//       )
//       .subscribe();
//   }

//   async handleNewNotification(notification) {
//     try {
//       console.log('New notification received:', notification);
      
//       // Get station info
//       const { data: station, error } = await supabase
//         .from('stations')
//         .select('id, name, address')
//         .eq('id', notification.station_id)
//         .single();

//       if (error) throw error;

//       const title = notification.title;
//       const message = notification.message;
      
//       // Prepare push notification data
//       const pushData = {
//         type: notification.notification_type,
//         stationId: notification.station_id,
//         stationName: station?.name,
//         fuelType: notification.fuel_type,
//         notificationId: notification.id
//       };

//       // Send push notification to all subscribers of this station
//       const result = await PushNotificationService.sendNotificationToStation(
//         notification.station_id,
//         title,
//         message,
//         pushData
//       );

//       console.log(`Push notification sent to ${result.sent} users`);

//     } catch (error) {
//       console.error('Error handling new notification:', error);
//     }
//   }

//   // Method to manually trigger notifications for fuel status changes
//   async triggerFuelStatusNotification(stationId, fuelType, statusChange, additionalData = {}) {
//     try {
//       let title, message, notificationType;

//       switch (statusChange) {
//         case 'restocked':
//           title = 'Fuel Restocked! ⛽';
//           message = `${fuelType.charAt(0).toUpperCase() + fuelType.slice(1)} is now available at this station.`;
//           notificationType = 'fuel_restock';
//           break;
        
//         case 'out_of_stock':
//           title = 'Fuel Out of Stock ❌';
//           message = `${fuelType.charAt(0).toUpperCase() + fuelType.slice(1)} is currently out of stock at this station.`;
//           notificationType = 'fuel_out_of_stock';
//           break;
        
//         case 'price_update':
//           title = 'Price Update 💰';
//           message = `${fuelType.charAt(0).toUpperCase() + fuelType.slice(1)} price has been updated to ₦${additionalData.newPrice}.`;
//           notificationType = 'price_update';
//           break;
        
//         default:
//           return { success: false, error: 'Invalid status change' };
//       }

//       // Insert notification into database (this will trigger the push notification)
//       const { error } = await supabase
//         .from('notifications')
//         .insert({
//           station_id: stationId,
//           title: title,
//           message: message,
//           notification_type: notificationType,
//           fuel_type: fuelType,
//           created_by: additionalData.userId
//         });

//       if (error) throw error;

//       return { success: true };
//     } catch (error) {
//       console.error('Error triggering fuel status notification:', error);
//       return { success: false, error: error.message };
//     }
//   }
// }

