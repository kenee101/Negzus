import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function SummaryStatsHeader({ stations }) {
  if (!stations || stations.length === 0) return null;

  const avgFuelPrice = Math.round(stations.reduce((sum, s) => sum + (s.fuel_price || 0), 0) / stations.length);
  const avgDieselPrice = Math.round(stations.reduce((sum, s) => sum + (s.diesel_price || 0), 0) / stations.length);
  const avgGasPrice = Math.round(stations.reduce((sum, s) => sum + (s.gas_price || 0), 0) / stations.length);

  const fuelAvailable = stations.filter(s => s.fuel_available).length;
  const dieselAvailable = stations.filter(s => s.diesel_available).length;
  const gasAvailable = stations.filter(s => s.gas_available).length;

  return (
    <View style={styles.card}>
      <View style={styles.stat}>
        <Text style={styles.label}>Avg Fuel Price</Text>
        <Text style={styles.value}>₦{avgFuelPrice}</Text>
      </View>
      <View style={styles.stat}>
        <Text style={styles.label}>Avg Diesel Price</Text>
        <Text style={styles.value}>₦{avgDieselPrice}</Text>
      </View>
      <View style={styles.stat}>
        <Text style={styles.label}>Avg Gas Price</Text>
        <Text style={styles.value}>₦{avgGasPrice}</Text>
      </View>
      {/* <View style={styles.stat}>
        <Text style={styles.label}>Stations with Fuel</Text>
        <Text style={styles.value}>{fuelAvailable}/{stations.length}</Text>
      </View> */}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.background,
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: "center",
    gap: 4,
  },
  stat: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  label: { 
    color: '#fff', 
    fontSize: 14,
    marginBottom: 4,
  },
  value: {
    color: '#4ade80',
    fontSize: 16,
    fontWeight: 'bold',
  },
});