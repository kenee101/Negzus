import { View, StyleSheet } from 'react-native';
import { FuelProgressBar } from '@/components/station/FuelProgressBar';
import { Colors } from '@/constants/Colors';

export default function SummaryStatsHeader({stations}) {
  return (
    <View style={styles.card}>
      {/* <Text style={styles.label}>Fuel: ₦650</Text>
      <Text style={styles.label}>Gas: ₦750</Text>
      <Text style={styles.label}>Diesel: ₦820</Text> */}
      <FuelProgressBar label="Fuel" percent={stations[0].fuelLevel} color="#4ade80" />
      <FuelProgressBar label="Diesel" percent={stations[0].dieselLevel} color="#60a5fa" />
      <FuelProgressBar label="Gas" percent={stations[0].gasLevel} color="#facc15" />
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
  label: { 
    color: '#fff', 
    fontSize: 16 
  },
});