import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { UserProfileStorage } from '@/utils/storage';
import { useNavigation } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';

const UserProfileManager = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useUserProfile(user?.id);
  const [userProfile, setUserProfile] = useState({
    email: '',
    name: '',
    phone: '',
    address: '',
    preferences: {
      notifications: true,
      darkMode: false,
      language: 'en'
    }
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const savedProfile = await UserProfileStorage.loadUserProfile();
      if (savedProfile) {
        setUserProfile(savedProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      const result = await UserProfileStorage.saveUserProfile(profile);
      if (result.success) {
        Alert.alert('Success', 'Profile saved successfully!');
        setIsEditing(false);
      } else {
        Alert.alert('Error', 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  const updateProfile = async (updates) => {
    try {
      const result = await UserProfileStorage.updateUserProfile(updates);
      if (result.success) {
        setUserProfile(result.profile);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const clearProfile = async () => {
    Alert.alert(
      'Clear Profile',
      'Are you sure you want to clear your profile? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await UserProfileStorage.clearUserProfile();
              if (result.success) {
                setUserProfile({
                  email: '',
                  name: '',
                  phone: '',
                  address: '',
                  preferences: {
                    notifications: true,
                    darkMode: false,
                    language: 'en'
                  }
                });
                Alert.alert('Success', 'Profile cleared successfully!');
              } else {
                Alert.alert('Error', 'Failed to clear profile');
              }
            } catch (error) {
              console.error('Error clearing profile:', error);
              Alert.alert('Error', 'Failed to clear profile');
            }
          }
        }
      ]
    );
  };

  const togglePreference = (key) => {
    setUserProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: !prev.preferences[key]
      }
    }));
  };

  if (profileLoading || isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4ade80" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>User Profile</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput]}
            value={profile?.full_name}
            onChangeText={(text) => setUserProfile(prev => ({ ...prev, name: text }))}
            placeholder="Enter your name"
            editable={isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput]}
            value={profile?.email}
            onChangeText={(text) => setUserProfile(prev => ({ ...prev, email: text }))}
            placeholder="Enter your email"
            keyboardType="email-address"
            editable={isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput]}
            value={profile?.phone_number}
            onChangeText={(text) => setUserProfile(prev => ({ ...prev, phone: text }))}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            editable={isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput]}
            value={profile?.address}
            onChangeText={(text) => setUserProfile(prev => ({ ...prev, address: text }))}
            placeholder="Enter your address"
            multiline
            numberOfLines={3}
            editable={isEditing}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <View style={styles.preferenceItem}>
          <Text style={styles.preferenceLabel}>Notifications</Text>
          <TouchableOpacity
            style={[styles.toggle, userProfile.preferences.notifications && styles.toggleActive]}
            onPress={() => isEditing && togglePreference('notifications')}
            disabled={!isEditing}
          >
            <Text style={styles.toggleText}>
              {userProfile.preferences.notifications ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.preferenceItem}>
          <Text style={styles.preferenceLabel}>Dark Mode</Text>
          <TouchableOpacity
            style={[styles.toggle, userProfile.preferences.darkMode && styles.toggleActive]}
            onPress={() => isEditing && togglePreference('darkMode')}
            disabled={!isEditing}
          >
            <Text style={styles.toggleText}>
              {userProfile.preferences.darkMode ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        {isEditing ? (
          <>
            <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
              <Text style={styles.saveButtonText}>Save Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditing(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.clearButton} onPress={clearProfile}>
              <Text style={styles.clearButtonText}>Clear Profile</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => updateProfile({ email: 'newemail@example.com' })}
        >
          <Text style={styles.actionButtonText}>Update Email Only</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => updateProfile({ phone: '+1234567890' })}
        >
          <Text style={styles.actionButtonText}>Update Phone Only</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  section: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#3a3a3a',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#4a4a4a',
  },
  disabledInput: {
    opacity: 0.6,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  preferenceLabel: {
    color: '#fff',
    fontSize: 16,
  },
  toggle: {
    backgroundColor: '#4a4a4a',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toggleActive: {
    backgroundColor: '#4ade80',
  },
  toggleText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: '#4ade80',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: '#4ade80',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  actionButtonText: {
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default UserProfileManager; 