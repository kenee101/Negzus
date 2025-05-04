import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStations } from '@/hooks/useStations';
// import {renderItem} from '@/utils/renderItem';

const StationListScreen = () => {
  // const [stations, setStations] = useState([]);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();

  const { stations, isLoading, error } = useStations();

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
         <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text>Error loading stations. Please try again later.</Text>
      </View>
    );
  }

  const filteredStations = stations.filter((station) =>
    station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    station.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }) => (
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


  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search stations..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={filteredStations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

export default StationListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});