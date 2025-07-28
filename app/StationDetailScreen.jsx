import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useNavigation, useRoute } from '@react-navigation/native';
// import { checkSubscription } from '@/services/api';
import {useAuth} from '@/hooks/useAuth';
import { useUserSubscriptions } from '@/hooks/useUserSubscriptions';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Entypo from '@expo/vector-icons/Entypo';

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
        <ActivityIndicator size="large" color='#4ade80' />
        <Text style={{ color: 'white'}}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: 'black' }} contentContainerStyle={styles.container}>
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
        <Text style={{ color: 'white' }}>
          {station.fuel_available ? 
            <FontAwesome6 name="circle-check" size={14} color="green" /> :
            <Entypo name="circle-with-cross" size={14} color="green" />
          } 
          &nbsp; Fuel: {station.fuel_price ? `₦${station.fuel_price}` : '-'}
        </Text>
        <Text style={{ color: 'white' }}>
          {station.diesel_available ? 
            <FontAwesome6 name="circle-check" size={14} color="green" /> :
            <Entypo name="circle-with-cross" size={14} color="green" />
          } 
          &nbsp; Diesel: {station.diesel_price ? `₦${station.diesel_price}` : '-'}
        </Text>
        <Text style={{ color: 'white' }}>
          {station.gas_available ? 
            <FontAwesome6 name="circle-check" size={14} color="green" /> :
            <Entypo name="circle-with-cross" size={14} color="green" />
          }  
          &nbsp; Gas: {station.gas_price ? `₦${station.gas_price}` : '-'}
        </Text>
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
    backgroundColor: '#000'
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
    color: 'white',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
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
    color: 'white',
  },
  availabilitySection: {
    marginBottom: 16,
    color: 'white',
  },
  availabilityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'white',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
  },
  directionsButton: {
    backgroundColor: '#4ade80',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  directionsText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subscribeButton: {
    backgroundColor: '#4ade80',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});