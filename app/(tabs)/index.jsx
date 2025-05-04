import { Text, StyleSheet, ScrollView, View, FlatList, TouchableOpacity} from 'react-native';
import SummaryStatsHeader from '@/components/station/SummaryStatsHeader';
import SubscriptionAlertCard from '@/components/station/SubscriptionAlertCard';
import {Colors} from "@/constants/Colors"

const stations = [
  { id: '1', name: 'Total - Garki', fuel: '₦650', gas: '₦750', diesel: '₦820', distance: '2.5km' },
  { id: '2', name: 'Mobil - Wuse', fuel: '₦630', gas: '₦740', diesel: '₦810', distance: '4.2km' },
];

const alerts = [
  { id: '1', message: 'Fuel restocked at Total - Garki' },
  { id: '2', message: 'Diesel low at Mobil - Wuse' },
];

const renderItem = ({ item }) => (
    <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('StationDetailScreen', { station: item })}
    >
        <Text style={styles.name}>{item.name}</Text>
        {/* <Text style={styles.address}>{item.address}</Text> */}
        <View style={styles.availability}>
          <Text style={{color: "#ccc"}}>Fuel: {item.fuel ? `✅ ${item.fuel}` : '❌'}</Text>
          <Text style={{color: "#ccc"}}>Diesel: {item.diesel ? `✅ ${item.diesel}` : '❌'}</Text>
          <Text style={{color: "#ccc"}}>Gas: {item.gas ? `✅ ${item.gas}` : '❌'}</Text>
          <Text style={{color: "#ccc"}}>Distance: {item.distance ? `${item.distance}` : '❌'}</Text>
        </View>
    </TouchableOpacity>
);

export default function DashboardScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Dashboard</Text>

      <SummaryStatsHeader />

      <Text style={styles.sectionTitle}>Nearby Stations</Text>
      {stations.map((station) => (
        <View style={{flex: 1}}>
          <FlatList
            data={stations}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </View>
      ))}

      <Text style={styles.sectionTitle}>Your Alerts</Text>
      {alerts.map((alert) => (
        <SubscriptionAlertCard key={alert.id} alert={alert} />
      ))}
    </ScrollView>
  );
} 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0e0e0e",
    padding: 20,
    marginBottom: 80,
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ccc",
    marginTop: 20,
    marginBottom: 5,
  },
  card: {
    backgroundColor: Colors.dark.background,
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    marginRight: 12,
    elevation: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ccc",
  },
  address: {
    color: "#666",
    marginBottom: 8,
    color: Colors.light.background,
  },
  availability: {
    flexDirection: "column",
    gap: 4,
  },
});