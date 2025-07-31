import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
  ActivityIndicator,
  Modal,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';
import { Colors } from '@/constants/Colors';
import { useLocalSearchParams } from 'expo-router';
import { useNavigation } from 'expo-router';

const FUEL_TYPES = [
  { 
    key: 'fuel', 
    label: 'Petrol', 
    icon: 'car',
    availableField: 'fuel_available',
    priceField: 'fuel_price'
  },
  { 
    key: 'diesel', 
    label: 'Diesel', 
    icon: 'bus',
    availableField: 'diesel_available',
    priceField: 'diesel_price'
  },
  { 
    key: 'gas', 
    label: 'Gas', 
    icon: 'flame',
    availableField: 'gas_available',
    priceField: 'gas_price'
  },
  { 
    key: 'kerosene', 
    label: 'Kerosene', 
    icon: 'water',
    availableField: 'kerosene_available',
    priceField: 'kerosene_price'
  }
];

export default function FuelManagementScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const stationId = params.stationId;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stationData, setStationData] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedFuel, setSelectedFuel] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editAvailable, setEditAvailable] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (stationId) {
      loadStationData();
      loadNotifications();
    }
  }, [stationId]);

  const loadStationData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stations')
        .select('*')
        .eq('id', stationId)
        .single();

      if (error) throw error;
      setStationData(data);
    } catch (error) {
      console.error('Error loading station data:', error);
      Alert.alert('Error', 'Failed to load station information');
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('station_id', stationId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleEditFuel = (fuelType) => {
    const fuelData = {
      type: fuelType.key,
      label: fuelType.label,
      price: stationData[fuelType.priceField] || 0,
      available: stationData[fuelType.availableField] || false,
      availableField: fuelType.availableField,
      priceField: fuelType.priceField
    };
    
    setSelectedFuel(fuelData);
    setEditPrice(fuelData.price?.toString() || '0');
    setEditAvailable(fuelData.available);
    setEditModalVisible(true);
  };

  const handleSaveFuel = async () => {
    if (!selectedFuel) return;

    try {
      setSaving(true);
      const price = parseFloat(editPrice) || 0;
      const oldPrice = stationData[selectedFuel.priceField] || 0;
      const oldAvailable = stationData[selectedFuel.availableField] || false;

      const updateData = {
        [selectedFuel.priceField]: price,
        [selectedFuel.availableField]: editAvailable,
        last_updated: new Date().toISOString()
      };

      const { error } = await supabase
        .from('stations')
        .update(updateData)
        .eq('id', stationId);

      if (error) throw error;

      // Create notifications for significant changes
      await createNotificationsForChanges(
        selectedFuel.type,
        selectedFuel.label,
        oldPrice,
        price,
        oldAvailable,
        editAvailable
      );

      Alert.alert('Success', 'Fuel information updated successfully');
      setEditModalVisible(false);
      loadStationData();
      loadNotifications();
    } catch (error) {
      console.error('Error saving fuel data:', error);
      Alert.alert('Error', 'Failed to update fuel information');
    } finally {
      setSaving(false);
    }
  };

  const createNotificationsForChanges = async (fuelType, fuelLabel, oldPrice, newPrice, oldAvailable, newAvailable) => {
    const notifications = [];

    // Check if fuel availability changed
    if (oldAvailable !== newAvailable) {
      if (newAvailable) {
        // Fuel became available
        notifications.push({
          station_id: stationId,
          title: 'Fuel Restocked! ⛽',
          message: `${fuelLabel} is now available at this station.`,
          notification_type: 'fuel_restock',
          fuel_type: fuelType,
          created_by: user.id
        });
      } else {
        // Fuel became unavailable
        notifications.push({
          station_id: stationId,
          title: 'Fuel Out of Stock ❌',
          message: `${fuelLabel} is currently out of stock at this station.`,
          notification_type: 'fuel_out_of_stock',
          fuel_type: fuelType,
          created_by: user.id
        });
      }
    }

    // Check for significant price changes (more than 5% or 10 naira)
    if (oldPrice > 0 && Math.abs(oldPrice - newPrice) > Math.max(oldPrice * 0.05, 10)) {
      notifications.push({
        station_id: stationId,
        title: 'Price Update 💰',
        message: `${fuelLabel} price updated from ₦${oldPrice} to ₦${newPrice}`,
        notification_type: 'price_update',
        fuel_type: fuelType,
        created_by: user.id
      });
    }

    // Insert notifications if any
    if (notifications.length > 0) {
      try {
        const { error } = await supabase
          .from('notifications')
          .insert(notifications);

        if (error) throw error;
      } catch (error) {
        console.error('Error creating notifications:', error);
      }
    }
  };

  const sendCustomNotification = async (title, message, notificationType = 'general') => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          station_id: stationId,
          title: title,
          message: message,
          notification_type: notificationType,
          created_by: user.id
        });

      if (error) throw error;
      
      Alert.alert('Success', 'Notification sent to all subscribers');
      loadNotifications();
    } catch (error) {
      console.error('Error sending notification:', error);
      Alert.alert('Error', 'Failed to send notification');
    }
  };

  const promptCustomNotification = () => {
    Alert.prompt(
      'Send Custom Notification',
      'Enter notification message:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: (message) => {
            if (message?.trim()) {
              Alert.prompt(
                'Notification Title',
                'Enter notification title:',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Send',
                    onPress: (title) => {
                      sendCustomNotification(
                        title?.trim() || 'Station Update',
                        message.trim()
                      );
                    }
                  }
                ]
              );
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const getStatusColor = (fuelType) => {
    const isAvailable = stationData[fuelType.availableField];
    const price = stationData[fuelType.priceField];
    
    if (!isAvailable || !price || price <= 0) return '#dc3545';
    return '#28a745';
  };

  const checkManagerPermission = async () => {
    try {
      const { data, error } = await supabase
        .from('station_managers')
        .select('*')
        .eq('user_id', user.id)
        .eq('station_id', stationId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        // Check if user is admin or has station_id match
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, station_id')
          .eq('id', user.id)
          .single();

        if (userError) throw userError;
        
        const isAdmin = userData.role === 'admin';
        const isAssignedManager = userData.station_id === stationId;
        
        return isAdmin || isAssignedManager;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  };

  useEffect(() => {
    if (user?.id && stationId) {
      checkManagerPermission().then(hasPermission => {
        if (!hasPermission) {
          Alert.alert(
            'Access Denied',
            'You do not have permission to manage this station.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      });
    }
  }, [user?.id, stationId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ade80" />
        <Text style={styles.loadingText}>Loading fuel inventory...</Text>
      </View>
    );
  }

  if (!stationData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Station not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Fuel Management</Text>
          <Text style={styles.stationName}>{stationData?.name || 'Station'}</Text>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => setShowNotifications(true)}
          >
            <Ionicons name="notifications" size={24} color="#4ade80" />
            {notifications.length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{notifications.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={promptCustomNotification}
          >
            <Ionicons name="megaphone" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Send Alert</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.refreshButton]}
            onPress={loadStationData}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Fuel Inventory Cards */}
        <View style={styles.inventoryContainer}>
          {FUEL_TYPES.map((fuelType) => {
            const price = stationData[fuelType.priceField] || 0;
            const isAvailable = stationData[fuelType.availableField] || false;
            const statusColor = getStatusColor(fuelType);
            
            return (
              <TouchableOpacity
                key={fuelType.key}
                style={[styles.fuelCard, { borderLeftColor: statusColor }]}
                onPress={() => handleEditFuel(fuelType)}
              >
                <View style={styles.fuelHeader}>
                  <View style={styles.fuelTitleContainer}>
                    <Ionicons name={fuelType.icon} size={24} color="#4ade80" />
                    <Text style={styles.fuelTitle}>{fuelType.label}</Text>
                  </View>
                  <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
                </View>
                
                <View style={styles.fuelDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Price:</Text>
                    <Text style={styles.detailValue}>₦{price}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text style={[styles.detailValue, { color: statusColor }]}>
                      {isAvailable ? 'Available' : 'Out of Stock'}
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity style={styles.editButton}>
                  <Ionicons name="create" size={16} color="#4ade80" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Station Info */}
        <View style={styles.stationInfo}>
          <Text style={styles.sectionTitle}>Station Information</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Address:</Text>
            <Text style={styles.infoValue}>{stationData.address || 'Not specified'}</Text>
            <Text style={styles.infoLabel}>Last Updated:</Text>
            <Text style={styles.infoValue}>
              {stationData.last_updated ? new Date(stationData.last_updated).toLocaleString() : 'Never'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Edit {selectedFuel?.label || 'Fuel'}
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Price (₦)</Text>
              <TextInput
                style={styles.input}
                value={editPrice}
                onChangeText={setEditPrice}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#666"
              />
            </View>
            
            <View style={styles.switchContainer}>
              <Text style={styles.inputLabel}>Available for Sale</Text>
              <Switch
                value={editAvailable}
                onValueChange={setEditAvailable}
                trackColor={{ false: '#333', true: '#4ade80' }}
                thumbColor={editAvailable ? '#fff' : '#ccc'}
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveFuel}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.notificationsModal}>
            <View style={styles.notificationsHeader}>
              <Text style={styles.modalTitle}>Recent Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.notificationItem}>
                  <Text style={styles.notificationTitle}>{item.title}</Text>
                  <Text style={styles.notificationMessage}>{item.message}</Text>
                  <Text style={styles.notificationTime}>
                    {new Date(item.sent_at || item.created_at).toLocaleString()}
                  </Text>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No notifications yet</Text>
              }
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 18,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  stationName: {
    fontSize: 16,
    color: '#4ade80',
  },
  notificationButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 10,
  },
  notificationBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#dc3545',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#4ade80',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  refreshButton: {
    backgroundColor: Colors.dark.background,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  inventoryContainer: {
    gap: 16,
    marginBottom: 20,
  },
  fuelCard: {
    backgroundColor: Colors.dark.background,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  fuelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fuelTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fuelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  fuelDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    color: '#ccc',
    fontSize: 14,
  },
  detailValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
  },
  editButtonText: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: '500',
  },
  stationInfo: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: Colors.dark.background,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  infoLabel: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: '600',
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.dark.background,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4ade80',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  notificationsModal: {
    backgroundColor: Colors.dark.background,
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 16,
  },
  notificationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  notificationItem: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  notificationTitle: {
    color: '#4ade80',
    fontWeight: 'bold',
    fontSize: 14,
  },
  notificationMessage: {
    color: '#fff',
    fontSize: 13,
    marginVertical: 4,
  },
  notificationTime: {
    color: '#666',
    fontSize: 11,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});