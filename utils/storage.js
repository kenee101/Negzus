import AsyncStorage from '@react-native-async-storage/async-storage';

// User Profile Storage
export const UserProfileStorage = {
  // Save user profile
  saveUserProfile: async (profile) => {
    try {
      await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
      return { success: true };
    } catch (error) {
      console.error('Error saving user profile:', error);
      return { success: false, error: error.message };
    }
  },

  // Load user profile
  loadUserProfile: async () => {
    try {
      const profile = await AsyncStorage.getItem('userProfile');
      return profile ? JSON.parse(profile) : null;
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  },

  // Update user profile (partial update)
  updateUserProfile: async (updates) => {
    try {
      const currentProfile = await UserProfileStorage.loadUserProfile();
      const updatedProfile = { ...currentProfile, ...updates };
      await UserProfileStorage.saveUserProfile(updatedProfile);
      return { success: true, profile: updatedProfile };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error: error.message };
    }
  },

  // Clear user profile
  clearUserProfile: async () => {
    try {
      await AsyncStorage.removeItem('userProfile');
      return { success: true };
    } catch (error) {
      console.error('Error clearing user profile:', error);
      return { success: false, error: error.message };
    }
  },

  // Get specific user field
  getUserField: async (field) => {
    try {
      const profile = await UserProfileStorage.loadUserProfile();
      return profile ? profile[field] : null;
    } catch (error) {
      console.error(`Error getting user field ${field}:`, error);
      return null;
    }
  }
};

// Payment History Storage
export const PaymentHistoryStorage = {
  // Save payment history
  savePaymentHistory: async (history) => {
    try {
      await AsyncStorage.setItem('paymentHistory', JSON.stringify(history));
      return { success: true };
    } catch (error) {
      console.error('Error saving payment history:', error);
      return { success: false, error: error.message };
    }
  },

  // Load payment history
  loadPaymentHistory: async () => {
    try {
      const history = await AsyncStorage.getItem('paymentHistory');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error loading payment history:', error);
      return [];
    }
  },

  // Add new payment to history
  addPaymentToHistory: async (payment) => {
    try {
      const currentHistory = await PaymentHistoryStorage.loadPaymentHistory();
      const newHistory = [payment, ...currentHistory].slice(0, 50); // Keep last 50 payments
      await PaymentHistoryStorage.savePaymentHistory(newHistory);
      return { success: true, history: newHistory };
    } catch (error) {
      console.error('Error adding payment to history:', error);
      return { success: false, error: error.message };
    }
  },

  // Clear payment history
  clearPaymentHistory: async () => {
    try {
      await AsyncStorage.removeItem('paymentHistory');
      return { success: true };
    } catch (error) {
      console.error('Error clearing payment history:', error);
      return { success: false, error: error.message };
    }
  }
};

// App Settings Storage
export const AppSettingsStorage = {
  // Save app settings
  saveAppSettings: async (settings) => {
    try {
      await AsyncStorage.setItem('appSettings', JSON.stringify(settings));
      return { success: true };
    } catch (error) {
      console.error('Error saving app settings:', error);
      return { success: false, error: error.message };
    }
  },

  // Load app settings
  loadAppSettings: async () => {
    try {
      const settings = await AsyncStorage.getItem('appSettings');
      return settings ? JSON.parse(settings) : {};
    } catch (error) {
      console.error('Error loading app settings:', error);
      return {};
    }
  },

  // Update specific setting
  updateSetting: async (key, value) => {
    try {
      const currentSettings = await AppSettingsStorage.loadAppSettings();
      const updatedSettings = { ...currentSettings, [key]: value };
      await AppSettingsStorage.saveAppSettings(updatedSettings);
      return { success: true, settings: updatedSettings };
    } catch (error) {
      console.error('Error updating app setting:', error);
      return { success: false, error: error.message };
    }
  }
};

// Generic Storage Utilities
export const StorageUtils = {
  // Check if key exists
  hasKey: async (key) => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value !== null;
    } catch (error) {
      console.error(`Error checking key ${key}:`, error);
      return false;
    }
  },

  // Remove specific key
  removeKey: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
      return { success: true };
    } catch (error) {
      console.error(`Error removing key ${key}:`, error);
      return { success: false, error: error.message };
    }
  },

  // Get all keys
  getAllKeys: async () => {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  },

  // Clear all data
  clearAll: async () => {
    try {
      await AsyncStorage.clear();
      return { success: true };
    } catch (error) {
      console.error('Error clearing all data:', error);
      return { success: false, error: error.message };
    }
  }
};

// Usage Examples:
/*
// Save user profile
const profile = {
  email: 'user@example.com',
  name: 'John Doe',
  phone: '+1234567890',
  preferences: {
    notifications: true,
    darkMode: false
  }
};
await UserProfileStorage.saveUserProfile(profile);

// Update specific field
await UserProfileStorage.updateUserProfile({ phone: '+0987654321' });

// Load user profile
const userProfile = await UserProfileStorage.loadUserProfile();

// Add payment to history
const payment = {
  id: 'txn_123',
  amount: 5000,
  merchant: 'Gas Station',
  timestamp: new Date().toISOString()
};
await PaymentHistoryStorage.addPaymentToHistory(payment);

// Save app settings
await AppSettingsStorage.saveAppSettings({
  theme: 'dark',
  language: 'en',
  notifications: true
});
*/ 