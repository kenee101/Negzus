import { View, Text, FlatList, StyleSheet, ActivityIndicator, Button } from 'react-native';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserSubscriptions } from '@/hooks/useUserSubscriptions';
import { useAuth } from '@/hooks/useAuth';
// import {Colors} from '@/constants/Colors';
import StationSubscriptionCard from '@/components/station/StationSubscriptionCard';
import { fetchUserProfile } from '@/hooks/useUserProfile';
import { useQueryClient } from '@tanstack/react-query';
import { CommonActions } from '@react-navigation/native'
import { useNavigation } from 'expo-router';
import { supabase } from '@/services/supabase';
import { useEffect, useState } from 'react';

export default function ProfileScreen() {
  // const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();
  // console.log(user?.id, user?.email, user?.phone_number, user?.full_name)
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id);
  const { data: subscriptions, isLoading: subsLoading } = useUserSubscriptions(user?.id);

  // useEffect(() => {
    // async function getUser() {
    //   const data = await fetchUserProfile(user?.id);
    //   return data
    // }
    // const data = getUser()
    // // console.log(user?.id, data)
    // console.log(profile)
  // }, [user])

  // fetchUserProfile('647c21f8-1d42-4d65-9d4f-0d9c2d651794')
  // .then((data) => console.log(data))
  // .catch((error) => console.error(error));

  // console.log(subscriptions)

  if (profileLoading || subsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading...</Text>
      </View>
    );
  }

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut();
    setLoading(false)
    // queryClient.clear();
    navigation.dispatch(CommonActions.reset({
      routes: [{name: "LoginScreen"}]
    }))
  };

  return (
    <View style={styles.container}>
      {user ? (
        <>
          <Text style={styles.text}>Welcome, {profile.full_name}</Text>
           {loading ? (
              <ActivityIndicator color="#0000ff" />
            ) : (
              <Button title="Log Out" onPress={handleLogout} />
            )}
        </>
      ) : (
        <Text>You are not logged in.</Text>
      )}
      <View style={styles.profileSection}>
        {/* <Text style={styles.name}>{profile?.full_name}</Text> */}
        <Text style={styles.email}>{profile?.email}</Text>
        <Text style={styles.phone}>{profile?.phone_number || 'No Phone Number'}</Text>
      </View>

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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, justifyContent: 'center', alignItems: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileSection: { marginBottom: 20 },
  name: { fontSize: 24, fontWeight: 'bold' },
  email: { fontSize: 16, color: 'gray' },
  phone: { fontSize: 16, color: 'gray' },
  sectionTitle: { marginTop: 20, fontSize: 18, fontWeight: '600' },
  emptyText: { marginTop: 10, color: 'gray', textAlign: 'center' },
  // text: {justifyContent: 'center', alignItems: 'center'}
});