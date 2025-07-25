import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Modal, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStations } from '@/hooks/useStations';
import { Colors } from '@/constants/Colors';
import { Ionicons } from "@expo/vector-icons";
import * as Location from 'expo-location';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

const StationListScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [filters, setFilters] = useState({
    maxDistance: 50, // km
    maxFuelPrice: 1000,
    maxDieselPrice: 1000,
    maxGasPrice: 1000,
    fuelAvailable: false,
    dieselAvailable: false,
    gasAvailable: false,
    sortBy: 'distance', // 'distance', 'price', 'name'
    sortOrder: 'asc' // 'asc', 'desc'
  });
  const navigation = useNavigation();
  const { stations, isLoading, error } = useStations();

  // Get user location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
    })();
  }, []);

  // Calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Filter and sort stations
  const getFilteredStations = () => {
    if (!stations) return [];

    let filtered = stations.map(station => {
      let distance = null;
      if (userLocation) {
        distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          station.latitude,
          station.longitude
        );
      }
      return { ...station, distance };
    });

    // Apply filters
    filtered = filtered.filter(station => {
      // Distance filter
      if (filters.maxDistance && station.distance && station.distance > filters.maxDistance) {
        return false;
      }

      // Price filters
      if (filters.maxFuelPrice && station.fuel_price > filters.maxFuelPrice) {
        return false;
      }
      if (filters.maxDieselPrice && station.diesel_price > filters.maxDieselPrice) {
        return false;
      }
      if (filters.maxGasPrice && station.gas_price > filters.maxGasPrice) {
        return false;
      }

      // Availability filters
      if (filters.fuelAvailable && !station.fuel_available) {
        return false;
      }
      if (filters.dieselAvailable && !station.diesel_available) {
        return false;
      }
      if (filters.gasAvailable && !station.gas_available) {
        return false;
      }

      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!station.name.toLowerCase().includes(query) &&
            !station.address.toLowerCase().includes(query)) {
          return false;
        }
      }

      return true;
    });

    // Sort stations
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (filters.sortBy) {
        case 'distance':
          aValue = a.distance || Infinity;
          bValue = b.distance || Infinity;
          break;
        case 'price':
          aValue = a.fuel_price || 0;
          bValue = b.fuel_price || 0;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        default:
          return 0;
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const filteredStations = getFilteredStations();

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      maxDistance: 50,
      maxFuelPrice: 1000,
      maxDieselPrice: 1000,
      maxGasPrice: 1000,
      fuelAvailable: false,
      dieselAvailable: false,
      gasAvailable: false,
      sortBy: 'distance',
      sortOrder: 'asc'
    });
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterContainer}>
            {/* Distance Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Maximum Distance: {filters.maxDistance}km</Text>
              <View style={styles.sliderContainer}>
                <TouchableOpacity
                  style={styles.sliderButton}
                  onPress={() => updateFilter('maxDistance', Math.max(5, filters.maxDistance - 5))}
                >
                  <Text style={styles.sliderButtonText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sliderButton}
                  onPress={() => updateFilter('maxDistance', Math.min(100, filters.maxDistance + 5))}
                >
                  <Text style={styles.sliderButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Price Filters */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Maximum Fuel Price: ₦{filters.maxFuelPrice}</Text>
              <View style={styles.sliderContainer}>
                <TouchableOpacity
                  style={styles.sliderButton}
                  onPress={() => updateFilter('maxFuelPrice', Math.max(100, filters.maxFuelPrice - 50))}
                >
                  <Text style={styles.sliderButtonText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sliderButton}
                  onPress={() => updateFilter('maxFuelPrice', Math.min(2000, filters.maxFuelPrice + 50))}
                >
                  <Text style={styles.sliderButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Availability Filters */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Availability</Text>
              <TouchableOpacity
                style={[styles.checkbox, filters.fuelAvailable && styles.checkboxActive]}
                onPress={() => updateFilter('fuelAvailable', !filters.fuelAvailable)}
              >
                <Text style={styles.checkboxText}>Fuel Available</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.checkbox, filters.dieselAvailable && styles.checkboxActive]}
                onPress={() => updateFilter('dieselAvailable', !filters.dieselAvailable)}
              >
                <Text style={styles.checkboxText}>Diesel Available</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.checkbox, filters.gasAvailable && styles.checkboxActive]}
                onPress={() => updateFilter('gasAvailable', !filters.gasAvailable)}
              >
                <Text style={styles.checkboxText}>Gas Available</Text>
              </TouchableOpacity>
            </View>

            {/* Sort Options */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Sort By</Text>
              <View style={styles.sortButtons}>
                <TouchableOpacity
                  style={[styles.sortButton, filters.sortBy === 'distance' && styles.sortButtonActive]}
                  onPress={() => updateFilter('sortBy', 'distance')}
                >
                  <Text style={styles.sortButtonText}>Distance</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sortButton, filters.sortBy === 'price' && styles.sortButtonActive]}
                  onPress={() => updateFilter('sortBy', 'price')}
                >
                  <Text style={styles.sortButtonText}>Price</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sortButton, filters.sortBy === 'name' && styles.sortButtonActive]}
                  onPress={() => updateFilter('sortBy', 'name')}
                >
                  <Text style={styles.sortButtonText}>Name</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.sortOrderButton}
                onPress={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                <Text style={styles.sortOrderButtonText}>
                  {filters.sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Reset Button */}
            <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
              <Text style={styles.resetButtonText}>Reset Filters</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
         <Text style={styles.loaderText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading stations. Please try again later.</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('StationDetailScreen', { station: item })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{item.name}</Text>
        {item.distance && (
          <Text style={styles.distance}>{item.distance.toFixed(1)}km</Text>
        )}
      </View>
      <Text style={styles.address}>{item.address}</Text>
      <View style={styles.availability}>
        <Text style={styles.availabilityText}>
        <FontAwesome6 name="circle-check" size={14} color="green" /> Fuel: {item.fuel_available ? `₦${item.fuel_price}` : '❌'}
        </Text>
        <Text style={styles.availabilityText}>
        <FontAwesome6 name="circle-check" size={14} color="green" /> Diesel: {item.diesel_available ? `₦${item.diesel_price}` : '❌'}
        </Text>
        <Text style={styles.availabilityText}>
        <FontAwesome6 name="circle-check" size={14} color="green" /> Gas: {item.gas_available ? `₦${item.gas_price}` : '❌'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search stations..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)}>
          <Ionicons name="filter" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.resultsInfo}>
        <Text style={styles.resultsText}>
          {filteredStations.length} stations found
        </Text>
      </View>

      <FlatList
        data={filteredStations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {renderFilterModal()}
    </View>
  );
};

export default StationListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    color: '#333',
  },
  filterButton: {
    backgroundColor: '#007BFF',
    padding: 12,
    borderRadius: 8,
  },
  resultsInfo: {
    marginBottom: 16,
  },
  resultsText: {
    color: '#fff',
    fontSize: 14,
  },
  card: {
    backgroundColor: Colors.dark.background,
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: "#fff",
    flex: 1,
  },
  distance: {
    fontSize: 14,
    color: '#007BFF',
    fontWeight: '600',
  },
  address: {
    color: '#fff',
    marginBottom: 8,
  },
  availability: {
    flexDirection: 'column',
    gap: 4,
  },
  availabilityText: {
    color: "#fff",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  loaderText: {
    color: '#fff',
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  errorText: {
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  filterContainer: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 600,
    color: '#fff',
    marginBottom: 12,
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderButton: {
    backgroundColor: '#007BFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#333',
    marginBottom: 8,
  },
  checkboxActive: {
    backgroundColor: '#007BFF',
  },
  checkboxText: {
    color: '#fff',
    marginLeft: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  sortButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  sortButtonActive: {
    backgroundColor: '#007BFF',
  },
  sortButtonText: {
    color: '#fff',
  },
  sortOrderButton: {
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  sortOrderButtonText: {
    color: '#fff',
  },
  resetButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});