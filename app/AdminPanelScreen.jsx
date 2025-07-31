import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useRoleBasedAccess, USER_ROLES, roleUtils } from '@/hooks/useRoleBasedAccess';
import { supabase } from '@/services/supabase';
import { Colors } from '@/constants/Colors';

export default function AdminPanelScreen() {
  const { user } = useAuth();
  const { isAdmin, loading: rbacLoading } = useRoleBasedAccess();
  
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [stations, setStations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [stationModalVisible, setStationModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    if (!rbacLoading && isAdmin()) {
      loadData();
    }
  }, [rbacLoading]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadUsers(), loadStations()]);
    } catch (error) {
      console.error('Error loading admin data:', error);
      Alert.alert('Error', 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          station_managers (
            station_id,
            is_active,
            stations (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
      // console.log(data)
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadStations = async () => {
    try {
      const { data, error } = await supabase
        .from('stations')
        .select('*')
        .order('name');

      if (error) throw error;
      setStations(data || []);
    } catch (error) {
      console.error('Error loading stations:', error);
    }
  };

  const handleChangeUserRole = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      Alert.alert('Success', 'User role updated successfully');
      loadUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      Alert.alert('Error', 'Failed to update user role');
    }
  };

  const handleAssignStationManager = async (userId, stationId) => {
    try {
      const result = await roleUtils.assignStationManager(userId, stationId, user.id);
      
      if (result.success) {
        Alert.alert('Success', 'Station manager assigned successfully');
        loadUsers();
      } else {
        Alert.alert('Error', result.error || 'Failed to assign station manager');
      }
    } catch (error) {
      console.error('Error assigning station manager:', error);
      Alert.alert('Error', 'Failed to assign station manager');
    }
  };

  const handleRemoveStationManager = async (userId, stationId) => {
    Alert.alert(
      'Remove Station Manager',
      'Are you sure you want to remove this station manager assignment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await roleUtils.removeStationManager(userId, stationId);
              
              if (result.success) {
                Alert.alert('Success', 'Station manager removed successfully');
                loadUsers();
              } else {
                Alert.alert('Error', result.error || 'Failed to remove station manager');
              }
            } catch (error) {
              console.error('Error removing station manager:', error);
              Alert.alert('Error', 'Failed to remove station manager');
            }
          }
        }
      ]
    );
  };

  const openRoleModal = (user) => {
    setSelectedUser(user);
    setRoleModalVisible(true);
  };

  const openStationModal = (user) => {
    setSelectedUser(user);
    setStationModalVisible(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (rbacLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ade80" />
        <Text style={styles.loadingText}>Loading admin panel...</Text>
      </View>
    );
  }

  if (!isAdmin()) {
    return (
      <View style={styles.unauthorizedContainer}>
        <Ionicons name="shield-checkmark" size={64} color="#dc3545" />
        <Text style={styles.unauthorizedTitle}>Access Denied</Text>
        <Text style={styles.unauthorizedText}>
          You don't have permission to access the admin panel.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSubtitle}>User & Role Management</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{users.length}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {users.filter(u => u.role === USER_ROLES.STATION_MANAGER).length}
            </Text>
            <Text style={styles.statLabel}>Station Managers</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stations.length}</Text>
            <Text style={styles.statLabel}>Stations</Text>
          </View>
        </View>

        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInput}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchTextInput}
              placeholder="Search users..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterContainer}>
              {['all', ...Object.values(USER_ROLES)].map(role => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.filterButton,
                    filterRole === role && styles.filterButtonActive
                  ]}
                  onPress={() => setFilterRole(role)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    filterRole === role && styles.filterButtonTextActive
                  ]}>
                    {role === 'all' ? 'All' : roleUtils.getRoleDisplayName(role)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Users List */}
        <View style={styles.usersContainer}>
          {filteredUsers.map(userItem => (
            <View key={userItem.id} style={styles.userCard}>
              <View style={styles.userHeader}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{userItem.full_name || 'No Name'}</Text>
                  <Text style={styles.userEmail}>{userItem.email}</Text>
                  <View style={styles.roleContainer}>
                    <View style={[
                      styles.roleBadge,
                      { backgroundColor: roleUtils.getRoleColor(userItem.role) }
                    ]}>
                      <Text style={styles.roleBadgeText}>
                        {roleUtils.getRoleDisplayName(userItem.role)}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.userActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openRoleModal(userItem)}
                  >
                    <Ionicons name="person-circle" size={20} color="#4ade80" />
                  </TouchableOpacity>
                  
                  {(userItem.role === USER_ROLES.STATION_MANAGER || userItem.role === USER_ROLES.ADMIN) && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => openStationModal(userItem)}
                    >
                      <Ionicons name="business" size={20} color="#f59e0b" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Station Assignments */}
              {userItem.station_managers && userItem.station_managers.length > 0 && (
                <View style={styles.stationAssignments}>
                  <Text style={styles.assignmentsTitle}>Assigned Stations:</Text>
                  {userItem.station_managers
                    .filter(sm => sm.is_active)
                    .map(sm => (
                      <View key={sm.station_id} style={styles.assignmentItem}>
                        <Text style={styles.assignmentText}>
                          {sm.stations?.name || 'Unknown Station'}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveStationManager(userItem.id, sm.station_id)}
                        >
                          <Ionicons name="close-circle" size={18} color="#dc3545" />
                        </TouchableOpacity>
                      </View>
                    ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Role Change Modal */}
      <Modal
        visible={roleModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRoleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change User Role</Text>
            <Text style={styles.modalSubtitle}>
              {selectedUser?.full_name} ({selectedUser?.email})
            </Text>
            
            <View style={styles.roleOptions}>
              {Object.values(USER_ROLES).map(role => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleOption,
                    selectedUser?.role === role && styles.roleOptionActive
                  ]}
                  onPress={() => {
                    handleChangeUserRole(selectedUser.id, role);
                    setRoleModalVisible(false);
                  }}
                >
                  <View style={[
                    styles.roleOptionBadge,
                    { backgroundColor: roleUtils.getRoleColor(role) }
                  ]}>
                    <Text style={styles.roleOptionText}>
                      {roleUtils.getRoleDisplayName(role)}
                    </Text>
                  </View>
                  {selectedUser?.role === role && (
                    <Ionicons name="checkmark-circle" size={24} color="#4ade80" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setRoleModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Station Assignment Modal */}
      <Modal
        visible={stationModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setStationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Manage Station Assignments</Text>
            <Text style={styles.modalSubtitle}>
              {selectedUser?.full_name} ({selectedUser?.email})
            </Text>
            
            <Text style={styles.sectionTitle}>Available Stations:</Text>
            <ScrollView style={styles.stationsList} showsVerticalScrollIndicator={false}>
              {stations.map(station => {
                const isAssigned = selectedUser?.station_managers?.some(
                  sm => sm.station_id === station.id && sm.is_active
                );
                
                return (
                  <View key={station.id} style={styles.stationItem}>
                    <View style={styles.stationInfo}>
                      <Text style={styles.stationName}>{station.name}</Text>
                      <Text style={styles.stationAddress}>{station.address}</Text>
                    </View>
                    
                    <TouchableOpacity
                      style={[
                        styles.assignButton,
                        isAssigned ? styles.assignButtonRemove : styles.assignButtonAdd
                      ]}
                      onPress={() => {
                        if (isAssigned) {
                          handleRemoveStationManager(selectedUser.id, station.id);
                        } else {
                          handleAssignStationManager(selectedUser.id, station.id);
                        }
                        setStationModalVisible(false);
                      }}
                    >
                      <Ionicons
                        name={isAssigned ? "remove-circle" : "add-circle"}
                        size={20}
                        color="#fff"
                      />
                      <Text style={styles.assignButtonText}>
                        {isAssigned ? 'Remove' : 'Assign'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setStationModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
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
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  unauthorizedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
    marginTop: 16,
    marginBottom: 8,
  },
  unauthorizedText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#4ade80',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4ade80',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
  },
  searchContainer: {
    marginBottom: 20,
    gap: 12,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchTextInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#333',
  },
  filterButtonActive: {
    backgroundColor: '#4ade80',
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  usersContainer: {
    gap: 12,
  },
  userCard: {
    backgroundColor: Colors.dark.background,
    borderRadius: 12,
    padding: 16,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  stationAssignments: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  assignmentsTitle: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  assignmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  assignmentText: {
    color: '#fff',
    fontSize: 14,
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 20,
    textAlign: 'center',
  },
  roleOptions: {
    gap: 12,
    marginBottom: 20,
  },
  roleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  roleOptionActive: {
    backgroundColor: '#4ade8020',
    borderWidth: 1,
    borderColor: '#4ade80',
  },
  roleOptionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleOptionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  stationsList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  stationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  stationInfo: {
    flex: 1,
  },
  stationName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  stationAddress: {
    color: '#ccc',
    fontSize: 12,
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  assignButtonAdd: {
    backgroundColor: '#4ade80',
  },
  assignButtonRemove: {
    backgroundColor: '#dc3545',
  },
  assignButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalCloseButton: {
    backgroundColor: '#333',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});