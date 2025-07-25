import { Text, StyleSheet, View, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator} from 'react-native';
import SummaryStatsHeader from '@/components/station/SummaryStatsHeader';
import SubscriptionAlertCard from '@/components/station/SubscriptionAlertCard';
import { Colors } from "@/constants/Colors";
import { useState, useCallback, useEffect } from 'react';
import { useNavigation } from "expo-router"
import * as Location from 'expo-location';
import Toast from 'react-native-root-toast';
import { useStations } from '@/hooks/useStations';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

const alerts = [
  { id: '1', message: 'Fuel restocked at Forte - Ipaja' },
  { id: '2', message: 'Diesel low at Mobil - Idiroko' },
];

// calculate distance between two lat/lon in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


export default function DashboardScreen() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyStations, setNearbyStations] = useState([]);

  const { stations, isLoading, error, refetch } = useStations();

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setUserLocation(null);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
    })();
  }, []);

  useEffect(() => {
    if (userLocation) {
      // Filter stations within 5km
      const filtered = stations?.filter(station => {
        if (!station.latitude || !station.longitude) return true; // fallback: show all
        const dist = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          station.latitude,
          station.longitude
        );
        return dist <= 2;
      });
      setNearbyStations(filtered);
    } else {
      setNearbyStations(stations);
    }
  }, [userLocation, stations]);

  // Show alerts as toasts on mount
  useEffect(() => {
    alerts.forEach((alert, idx) => {
      setTimeout(() => {
        Toast.show(alert.message, {
          duration: Toast.durations.SHORT,
          position: Toast.positions.BOTTOM,
        });
      }, 3000);
    });
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const renderItem = ({ item }) => {
    if (isLoading) {
      return (
        <View style={[styles.card, { alignItems: 'center', justifyContent: 'center', height: 100 }]}>
          <ActivityIndicator size="small" color="#4ade80" />
        </View>
      );
    }

    return (
      <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('StationDetailScreen', { station: item })}
      >
        <View style={{flex: 1, flexDirection: "column", gap: 8}}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.address}>{item.address}</Text>
        </View>
        <View style={styles.availability}>
          <Text style={{color: "#fff"}}>
          <FontAwesome6 name="circle-check" size={14} color="green" /> Fuel: {item.fuel_price ? `₦${item.fuel_price}` : '-'}</Text>
          <Text style={{color: "#fff"}}>
          <FontAwesome6 name="circle-check" size={14} color="green" /> Diesel: {item.diesel_price ? `₦${item.diesel_price}` : '-'}</Text>
          <Text style={{color: "#fff"}}>
          <FontAwesome6 name="circle-check" size={14} color="green" /> Gas: {item.gas_price ? `₦${item.gas_price}` : '-'}</Text>
        </View>
      </TouchableOpacity>
    )
  };

  return (
    <FlatList
    data={isLoading ? Array(5).fill({}) : nearbyStations}
    keyExtractor={(item, idx) => item.id ? item.id.toString() : `skeleton-${idx}`}
    renderItem={renderItem}
    showsVerticalScrollIndicator={false}
    style={{ backgroundColor: 'black' }}
    contentContainerStyle={styles.container}
    refreshControl={
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        progressBackgroundColor="transparent"
        tintColor={"white"}
        colors={["white"]}
      />
    }
    ListHeaderComponent={
      <>
        <Text style={styles.header}>Dashboard</Text>
        <SummaryStatsHeader stations={nearbyStations}/>
        <Text style={styles.sectionTitle}>Nearby Stations</Text>
      </>
    }
    ListFooterComponent={
      <>
        <Text style={styles.sectionTitle}>Your Alerts</Text>
        {alerts.map((alert) => (
          <SubscriptionAlertCard key={alert.id} alert={alert} />
        ))}
      </>
    }
  />
  );
} 

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginTop: 20,
    marginBottom: 5,
  },
  card: {
    backgroundColor: Colors.dark.background,
    padding: 20,
    borderRadius: 30,
    marginBottom: 12,
    marginRight: 12,
    elevation: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  address: {
    color: "#fff",
    marginBottom: 8,
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.light.background,
  },
  availability: {
    flexDirection: "column",
    gap: 4,
    color: "#fff",
  },
});