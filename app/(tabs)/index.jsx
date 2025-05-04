import { Text, StyleSheet, View, FlatList, TouchableOpacity} from 'react-native';
import SummaryStatsHeader from '@/components/station/SummaryStatsHeader';
import SubscriptionAlertCard from '@/components/station/SubscriptionAlertCard';
import { Colors } from "@/constants/Colors";
import { useState, useCallback } from 'react';

const stations = [
  { 
    id: '1', 
    name: 'Total - Garki', 
    address: 'Abuja, Nigeria', 
    fuel: '₦650', 
    gas: '₦750', 
    diesel: '₦820', 
    distance: '2.5km', 
    fuelLevel: 80,
    gasLevel: 65,
    dieselLevel: 50,
    fuelStatus: 'Available', 
  },
  { 
    id: '2',
    name: 'Mobil - Wuse', 
    address: 'Abuja, Nigeria', 
    fuel: '₦630', 
    gas: '₦740',
    diesel: '₦810', 
    distance: '4.2km', 
    fuelLevel: 40,
    gasLevel: 90,
    dieselLevel: 70,
    fuelStatus: 'Available',
  },
];

const alerts = [
  { id: '1', message: 'Fuel restocked at Total - Garki' },
  { id: '2', message: 'Diesel low at Mobil - Wuse' },
];

const renderItem = ({ item, navigation }) => (
    <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('StationDetailScreen', { station: item })}
    >
      <View style={{flex: 1, flexDirection: "row", gap: 4}}>
        <Text style={styles.name}>{item.name},</Text>
        <Text style={styles.address}>{item.address}</Text>
      </View>
      <View style={styles.availability}>
        <Text style={{color: "#fff"}}>Fuel: {item.fuel ? `✅ ${item.fuel}` : '❌'}</Text>
        <Text style={{color: "#fff"}}>Diesel: {item.diesel ? `✅ ${item.diesel}` : '❌'}</Text>
        <Text style={{color: "#fff"}}>Gas: {item.gas ? `✅ ${item.gas}` : '❌'}</Text>
        <Text style={{color: "#fff"}}>Distance: {item.distance ? `${item.distance}` : '❌'}</Text>
      </View>
    </TouchableOpacity>
);

export default function DashboardScreen({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate a network request or data re-fetch
    setTimeout(() => {
      // You can add logic to actually reload data here
      setRefreshing(false);
    }, 1500);
  }, []);

  return (
    <FlatList
    data={stations}
    keyExtractor={(item) => item.id}
    renderItem={(props) => renderItem({ ...props, navigation })}
    showsVerticalScrollIndicator={false}
    contentContainerStyle={styles.container}
    refreshing={refreshing}
    onRefresh={onRefresh}
    ListHeaderComponent={
      <>
        <Text style={styles.header}>Dashboard</Text>
        <SummaryStatsHeader stations={stations}/>
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
    backgroundColor: "#0e0e0e",
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