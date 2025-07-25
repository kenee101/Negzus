import { View, Text, FlatList, StyleSheet, ActivityIndicator, Button, Image, Modal, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserSubscriptions } from '@/hooks/useUserSubscriptions';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/Colors';
import StationSubscriptionCard from '@/components/station/StationSubscriptionCard';
import { CommonActions } from '@react-navigation/native'
import { useNavigation } from 'expo-router';
import { supabase } from '@/services/supabase';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';


export default function ProfileScreen() {
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const navigation = useNavigation();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useUserProfile(user?.id);
  const { data: subscriptions, isLoading: subsLoading } = useUserSubscriptions(user?.id);
  
  const PLACEHOLDER_IMG = `https://ui-avatars.com/api/?name=${profile?.full_name.charAt(0).toUpperCase() || ''}&background=007BFF&color=fff&size=128`;
  
  useEffect(() => {
    if (profile) {
      setEditName(profile.full_name || '');
      setEditPhone(profile.phone_number || '');
    }
  }, [profile]);
  
  if (profileLoading || subsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{color: "white"}}>Loading...</Text>
      </View>
    );
  }
  
  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out', style: 'destructive', onPress: async () => {
            setLoading(true)
            await supabase.auth.signOut();
            setLoading(false)
            navigation.dispatch(CommonActions.reset({
              routes: [{ name: "LoginScreen" }]
            }))
          }
        }
      ]
    );
  };

  const handleEditProfile = async () => {
    setLoading(true);
    await supabase.from('profiles').update({
      full_name: editName,
      phone_number: editPhone
    }).eq('id', user.id);
    setLoading(false);
    setEditModalVisible(false);
    refetchProfile();
  };

  // Stats
  // console.log(profile)
  const joinDate = profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A';
  const subsCount = subscriptions ? subscriptions.length : 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutIconButton}>
            <Ionicons name="log-out-outline" size={28} color="#dc3545" />
          </TouchableOpacity>
        </View>
        {user ? (
          <>
            <Image
              source={{ uri: profile?.avatar_url || PLACEHOLDER_IMG }}
              style={styles.avatar}
            />
            <Text style={styles.text}>Welcome, {profile?.full_name}</Text>
            <Text style={styles.email}>{profile?.email}</Text>
            <Text style={styles.phone}>{profile?.phone_number || 'No Phone Number'}</Text>
            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{subsCount}</Text>
                <Text style={styles.statLabel}>Subscriptions</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{joinDate}</Text>
                <Text style={styles.statLabel}>Joined</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.editButton, styles.card]} onPress={() => setEditModalVisible(true)}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <View style={{ width: '100%', flex: 1, alignItems: 'center', marginTop: 4, flexDirection: 'row', justifyContent: 'space-around' }}>
              <TouchableOpacity
                style={[styles.editButton, styles.card]}
                onPress={() => navigation.navigate('PaymentScreenMerchant')}
              >
                <Text style={styles.editButtonText}>Admin Code</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editButton, styles.card]}
                onPress={() => navigation.navigate('PaymentScreenUser')}
              >
                <Text style={styles.editButtonText}>User Pay</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <Text>You are not logged in.</Text>
        )}
        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>Your Subscribed Stations</Text>
          <FlatList
            data={subscriptions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <StationSubscriptionCard station={item.stations} />
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>You have no subscriptions yet.</Text>
            }
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 8 }}
          />
        </View>
      </ScrollView>
      
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={editName}
              onChangeText={setEditName}
              placeholderTextColor="#888"
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={editPhone}
              onChangeText={setEditPhone}
              placeholderTextColor="#888"
              keyboardType="phone-pad"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.saveButton} onPress={handleEditProfile} disabled={loading}>
                <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'black', 
    padding: 20, 
    justifyContent: 'flex-start', 
    alignItems: 'center' 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: "black", 
  },
  card: {
    backgroundColor: Colors.dark.background,
    padding: 20,
    borderRadius: 30,
    marginBottom: 12,
    marginRight: 12,
    elevation: 2,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoutIconButton: {
    padding: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#007BFF',
  },
  profileSection: { 
    marginTop: 20,
    width: '100%',
    flex: 1,
  },
  name: { 
    fontSize: 24, 
    fontWeight: 'bold',
    color: "#fff",
  },
  email: { 
    fontSize: 16, 
    color: '#fff',
    marginBottom: 4,
  },
  phone: { 
    fontSize: 16, 
    color: '#fff', 
    marginBottom: 8,
  },
  sectionTitle: { 
    marginTop: 20, 
    fontSize: 18, 
    fontWeight: '600',
    color: "#fff", 
    marginBottom: 8,
  },
  emptyText: {
    marginTop: 10, 
    color: '#fff', 
    textAlign: 'center',
  },
  text: {
    justifyContent: 'center', 
    alignItems: 'center',
    color: "#fff",
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
    gap: 24,
  },
  statBox: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.dark.background,
    borderRadius: 10,
    minWidth: 90,
  },
  statValue: {
    color: '#4ade80',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 2,
  },
  editButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 8,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#181818',
    borderRadius: 16,
    padding: 24,
    width: 320,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#4ade80',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#181818',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});