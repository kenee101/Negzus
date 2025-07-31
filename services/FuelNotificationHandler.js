// services/FuelNotificationHandler.js
import { supabase } from '@/services/supabase';
import pushNotificationService from '@/utils/pushNotificationService';

class FuelNotificationHandler {
  constructor() {
    this.setupDatabaseTriggers();
  }

  setupDatabaseTriggers() {
    // Listen for new notifications in the database
    supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          this.handleNewNotification(payload.new);
        }
      )
      .subscribe();
  }

  async handleNewNotification(notification) {
    try {
      console.log('New notification received:', notification);
      
      // Get notification details with station info
      const { data: notificationWithStation, error } = await supabase
        .from('notifications')
        .select(`
          *,
          stations (
            id,
            name,
            address
          )
        `)
        .eq('id', notification.id)
        .single();

      if (error) throw error;

      const station = notificationWithStation.stations;
      const title = notificationWithStation.title;
      const message = notificationWithStation.message;
      
      // Prepare push notification data
      const pushData = {
        type: notificationWithStation.notification_type,
        stationId: notificationWithStation.station_id,
        stationName: station?.name,
        fuelType: notificationWithStation.fuel_type,
        notificationId: notificationWithStation.id
      };

      // Send push notification to all subscribers of this station
      const result = await pushNotificationService.sendNotificationToStation(
        notificationWithStation.station_id,
        title,
        message,
        pushData
      );

      console.log(`Push notification sent to ${result.sent} users`);

      // Log the notification delivery
      await this.logNotificationDelivery(
        notificationWithStation.id,
        result.sent,
        result.success
      );

    } catch (error) {
      console.error('Error handling new notification:', error);
    }
  }

  async logNotificationDelivery(notificationId, recipientCount, success) {
    try {
      // You could create a notification_delivery_log table to track this
      console.log(`Notification ${notificationId} delivered to ${recipientCount} users. Success: ${success}`);
    } catch (error) {
      console.error('Error logging notification delivery:', error);
    }
  }

  // Method to manually trigger notifications for fuel status changes
  async triggerFuelStatusNotification(stationId, fuelType, statusChange, additionalData = {}) {
    try {
      let title, message, notificationType;

      switch (statusChange) {
        case 'restocked':
          title = 'Fuel Restocked! ⛽';
          message = `${fuelType.charAt(0).toUpperCase() + fuelType.slice(1)} is now available at this station.`;
          notificationType = 'fuel_restock';
          break;
        
        case 'out_of_stock':
          title = 'Fuel Out of Stock ❌';
          message = `${fuelType.charAt(0).toUpperCase() + fuelType.slice(1)} is currently out of stock at this station.`;
          notificationType = 'fuel_out_of_stock';
          break;
        
        case 'price_update':
          title = 'Price Update 💰';
          message = `${fuelType.charAt(0).toUpperCase() + fuelType.slice(1)} price has been updated to ₦${additionalData.newPrice}.`;
          notificationType = 'price_update';
          break;
        
        case 'low_stock':
          title = 'Low Stock Warning ⚠️';
          message = `${fuelType.charAt(0).toUpperCase() + fuelType.slice(1)} is running low at this station. Hurry!`;
          notificationType = 'general';
          break;
        
        default:
          return;
      }

      // Insert notification into database (this will trigger the push notification)
      const { error } = await supabase
        .from('notifications')
        .insert({
          station_id: stationId,
          title: title,
          message: message,
          notification_type: notificationType,
          fuel_type: fuelType,
          created_by: additionalData.userId
        });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error triggering fuel status notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Method to send custom notifications from station managers
  async sendCustomStationNotification(stationId, title, message, createdBy, fuelType = null) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          station_id: stationId,
          title: title,
          message: message,
          notification_type: 'general',
          fuel_type: fuelType,
          created_by: createdBy
        });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error sending custom station notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Method to send emergency notifications
  async sendEmergencyNotification(stationId, message, createdBy) {
    try {
      const title = '🚨 Emergency Alert';
      
      const { error } = await supabase
        .from('notifications')
        .insert({
          station_id: stationId,
          title: title,
          message: message,
          notification_type: 'general',
          created_by: createdBy
        });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error sending emergency notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Method to get notification statistics
  async getNotificationStats(stationId, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('notifications')
        .select('notification_type, created_at')
        .eq('station_id', stationId)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const stats = {
        total: data.length,
        fuel_restock: data.filter(n => n.notification_type === 'fuel_restock').length,
        fuel_out_of_stock: data.filter(n => n.notification_type === 'fuel_out_of_stock').length,
        price_update: data.filter(n => n.notification_type === 'price_update').length,
        general: data.filter(n => n.notification_type === 'general').length
      };

      return { success: true, stats };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return { success: false, error: error.message };
    }
  }

  // Method to cleanup old notifications
  async cleanupOldNotifications(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { error } = await supabase
        .from('notifications')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;

      console.log(`Cleaned up notifications older than ${daysToKeep} days`);
      return { success: true };
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      return { success: false, error: error.message };
    }
  }

  // Method to get user notification preferences (for future implementation)
  async getUserNotificationPreferences(userId) {
    try {
      // This could be expanded to include user preferences for different types of notifications
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return {
        success: true,
        preferences: data?.notification_preferences || {
          fuel_restock: true,
          fuel_out_of_stock: true,
          price_update: true,
          general: true
        }
      };
    } catch (error) {
      console.error('Error getting user notification preferences:', error);
      return {
        success: false,
        preferences: {
          fuel_restock: true,
          fuel_out_of_stock: true,
          price_update: true,
          general: true
        }
      };
    }
  }
}

// Export singleton instance
export default new FuelNotificationHandler();

// React hook for using fuel notifications
export function useFuelNotifications() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const getStats = async (stationId, days = 7) => {
    setLoading(true);
    const result = await FuelNotificationHandler.getNotificationStats(stationId, days);
    if (result.success) {
      setStats(result.stats);
    }
    setLoading(false);
    return result;
  };

  const sendCustomNotification = async (stationId, title, message, createdBy, fuelType = null) => {
    return await FuelNotificationHandler.sendCustomStationNotification(
      stationId, title, message, createdBy, fuelType
    );
  };

  const sendEmergencyAlert = async (stationId, message, createdBy) => {
    return await FuelNotificationHandler.sendEmergencyNotification(stationId, message, createdBy);
  };

  const triggerFuelStatusChange = async (stationId, fuelType, statusChange, additionalData = {}) => {
    return await FuelNotificationHandler.triggerFuelStatusNotification(
      stationId, fuelType, statusChange, additionalData
    );
  };

  return {
    stats,
    loading,
    getStats,
    sendCustomNotification,
    sendEmergencyAlert,
    triggerFuelStatusChange
  };
}