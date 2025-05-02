import { View, Text, StyleSheet } from 'react-native';

export default function StationSubscriptionCard({ station }) {
  return (
    <View style={styles.card}>
      <Text style={styles.stationName}>{station.name}</Text>
      <Text style={styles.stationAddress}>{station.address}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f1f1f1',
    padding: 15,
    borderRadius: 10,
    marginVertical: 8,
  },
  stationName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stationAddress: {
    fontSize: 14,
    color: 'gray',
  },
});