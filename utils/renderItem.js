import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const navigation = useNavigation();

export const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('StationDetailScreen', { station: item })}
    >
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.address}>{item.address}</Text>
      <View style={styles.availability}>
        <Text>Fuel: {item.fuel_available ? `✅ ₦${item.fuel_price}` : '❌'}</Text>
        <Text>Diesel: {item.diesel_available ? `✅ ₦${item.diesel_price}` : '❌'}</Text>
        <Text>Gas: {item.gas_available ? `✅ ₦${item.gas_price}` : '❌'}</Text>
      </View>
    </TouchableOpacity>
  );
  
  const styles = StyleSheet.create({
    card: {
      backgroundColor: '#fafafa',
      padding: 16,
      borderRadius: 10,
      marginBottom: 12,
      elevation: 2,
    },
    name: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    address: {
      color: '#666',
      marginBottom: 8,
    },
    availability: {
      flexDirection: 'column',
      gap: 4,
    },
  });