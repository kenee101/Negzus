import { View, Text, StyleSheet } from 'react-native';

export default function SummaryStatsHeader() {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Fuel: ₦650</Text>
      <Text style={styles.label}>Gas: ₦750</Text>
      <Text style={styles.label}>Diesel: ₦820</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: { color: '#fff', fontSize: 16 },
});