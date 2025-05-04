import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export const FuelProgressBar = ({ label, percent, color }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}: {percent}%</Text>
      <View style={styles.bar}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    backgroundColor: "black",
    height: 70,
    borderRadius: 20,
    padding: 20,
  },
  label: {
    color: '#fff',
    marginBottom: 4,
  },
  bar: {
    height: 10,
    backgroundColor: '#333',
    borderRadius: 10,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 10,
  },
});

export default FuelProgressBar;