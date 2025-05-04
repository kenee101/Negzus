import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useNavigation, useRoute } from '@react-navigation/native';
// import { checkSubscription } from '@/services/api';
import {useAuth} from '@/hooks/useAuth';
import { useUserSubscriptions } from '@/hooks/useUserSubscriptions';

const StationDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { station } = route.params;
  // const [isSubscribed, setIsSubscribed] = useState(false);
  // const [loading, setLoading] = useState(false);
  const {user} = useAuth();
  const { data: subscriptions, isLoading: subsLoading } = useUserSubscriptions(user?.id);

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${station.latitude},${station.longitude}`;
    Linking.openURL(url);
  };
  
  // useEffect(() => {
  //   fetchSubscriptionStatus();
  // }, []);
  
  // const fetchSubscriptionStatus = async () => {
  //   try {
  //     setLoading(true);
  //     const subscribed = await checkSubscription(user?.id, station.id);
  //     setIsSubscribed(subscribed);
  //     setLoading(false);
  //   } catch (error) { 
  //     console.error('Failed to check subscription', error);
  //     setLoading(false);
  //   } 
  // };
  
  const handleSubscribeToggle = async () => {
    try {
      if (subscriptions) {
        await unsubscribeFromStation(user.id, station.id);
        Alert.alert('Unsubscribed', 'You have unsubscribed from updates.');
      } else {
        await subscribeToStation(user.id, station.id);
        Alert.alert('Subscribed', 'You will get updates about this station.');
      }
      // setIsSubscribed(!isSubscribed);
    } catch (error) {
      console.error('Subscription toggle failed', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };
  
  if (subsLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backButton}>← Back</Text>
      </TouchableOpacity> */}

      <Text style={styles.name}>{station.name}</Text>

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: station.latitude,
          longitude: station.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        scrollEnabled={true}
        zoomEnabled={true}
      >
        <Marker coordinate={{ latitude: station.latitude, longitude: station.longitude }} />
      </MapView>

      <Text style={styles.address}>{station.address}</Text>

      <View style={styles.availabilitySection}>
        <Text style={styles.availabilityTitle}>Availability:</Text>
        <Text>Fuel: {station.fuel_available ? `✅ ₦${station.fuel_price}` : '❌'}</Text>
        <Text>Diesel: {station.diesel_available ? `✅ ₦${station.diesel_price}` : '❌'}</Text>
        <Text>Gas: {station.gas_available ? `✅ ₦${station.gas_price}` : '❌'}</Text>
      </View>

      <Text style={styles.lastUpdated}>
        Last Updated: {new Date(station.last_updated).toLocaleString()}
      </Text>

      <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribeToggle}>
        <Text style={styles.subscribeButtonText}>
          {subscriptions ? 'Unsubscribe from Updates' : 'Subscribe to Updates'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.directionsButton} onPress={openInGoogleMaps}>
        <Text style={styles.directionsText}>Get Directions</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default StationDetailScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  backButton: {
    fontSize: 16,
    color: '#588157',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  map: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 16,
  },
  address: {
    fontSize: 16,
    marginBottom: 16,
  },
  availabilitySection: {
    marginBottom: 16,
  },
  availabilityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
  },
  directionsButton: {
    backgroundColor: '#3A5A40',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  directionsText: {
    color: '#fff',
    fontSize: 16,
  },
  subscribeButton: {
    backgroundColor: '#3A5A40',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});