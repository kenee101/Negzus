import React, { useEffect, useState, useRef, useCallback } from "react";
import * as Location from 'expo-location';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Animated,
  Keyboard,
  TouchableWithoutFeedback,
  FlatList,
  Alert,
  Platform,
  Linking,
} from "react-native";
import MapView, { Marker, Polyline, Callout, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation } from "expo-router";
import { useStations } from "@/hooks/useStations";


const MapScreen = () => {
  const navigation = useNavigation();
  const [isFocused, setIsFocused] = useState(false);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeDistance, setRouteDistance] = useState(null);
  const [routeDuration, setRouteDuration] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  
  const mapRef = useRef(null);
  const inputWidth = useRef(new Animated.Value(1)).current;

  const [region, setRegion] = useState({
    latitude: 9.05785, // Abuja default center
    longitude: 7.49508,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  const [zoomLevel, setZoomLevel] = useState(14); // Default zoom level

  // Fetch stations using TanStack Query
  const { stations, isLoading, error } = useStations();

  // Request location permission and get current location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      
      // Update region to user's location
      setRegion(prev => ({
        ...prev,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      }));
    })();
  }, []);

  // Handle marker press
  const handleMarkerPress = (station) => {
    handleStationSelect(station);
  };

  // Handle station selection from autocomplete
  const handleStationSelect = useCallback((station) => {
    setSearchQuery(station.name);
    setShowSuggestions(false);
    setSelectedStation(station);
    
    // Animate to selected station
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: station.latitude,
        longitude: station.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 2000);
    }
    
    // Calculate route if user location is available
    if (location) {
      calculateRoute(location, station);
    }
    
    Keyboard.dismiss();
  }, [location]);

  // Calculate route between two points using Google Directions API
  const calculateRoute = async (origin, destination) => {
    try {
      const originStr = `${origin.latitude},${origin.longitude}`;
      const destinationStr = `${destination.latitude},${destination.longitude}`;
      
      // Replace with your Google Maps API key
      const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];
        
        // Decode polyline
        const points = decodePolyline(route.overview_polyline.points);
        setRouteCoordinates(points);
        setRouteDistance(leg.distance.text);
        setRouteDuration(leg.duration.text);
        
        // Fit map to show entire route
        if (mapRef.current) {
          mapRef.current.fitToCoordinates(points, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          });
        }
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      Alert.alert('Error', 'Failed to calculate route. Please try again.');
    }
  };

  // Decode Google Maps polyline
  const decodePolyline = (encoded) => {
    let points = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }
    return points;
  };

  // Start navigation using external navigation apps
  const startNavigation = () => {
    if (!selectedStation || !location) {
      Alert.alert('Error', 'Please select a station and ensure location is available.');
      return;
    }

    const destination = `${selectedStation.latitude},${selectedStation.longitude}`;
    
    Alert.alert(
      'Start Navigation',
      'Choose your navigation app:',
      [
        {
          text: 'Google Maps',
          onPress: () => {
            const url = Platform.select({
              ios: `comgooglemaps://?saddr=Current+Location&daddr=${destination}&directionsmode=driving`,
              android: `google.navigation:q=${destination}`,
            });
            
            Linking.canOpenURL(url).then((supported) => {
              if (supported) {
                Linking.openURL(url);
              } else {
                // Fallback to web version
                Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destination}`);
              }
            });
          }
        },
        {
          text: 'Apple Maps',
          onPress: () => {
            const url = `http://maps.apple.com/?daddr=${destination}&dirflg=d`;
            Linking.openURL(url);
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  // Find nearest stations and optimize route
  const optimizeRoute = () => {
    if (!location || !stations.length) {
      Alert.alert('Error', 'Location or stations not available.');
      return;
    }

    // Calculate distances and sort by proximity
    const stationsWithDistance = stations.map(station => {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        station.latitude,
        station.longitude
      );
      return { ...station, distance };
    });

    // Sort by distance and fuel price
    const optimizedStations = stationsWithDistance
      .sort((a, b) => {
        // Prioritize by distance first, then by fuel price
        const distanceWeight = a.distance - b.distance;
        const priceWeight = (a.fuel_price - b.fuel_price) * 0.1; // Less weight on price
        return distanceWeight + priceWeight;
      })
      .slice(0, 3); // Show top 3 optimized stations

    // Show optimized route suggestions
    Alert.alert(
      'Route Optimization',
      `Nearest stations:\n${optimizedStations.map((s, i) => 
        `${i + 1}. ${s.name} - ${s.distance.toFixed(1)}km - ₦${s.fuel_price}`
      ).join('\n')}`,
      [
        {
          text: 'Select First',
          onPress: () => handleStationSelect(optimizedStations[0])
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  // Calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Filter stations within 5km of user location
  const getNearbyStations = () => {
    if (!location || !stations) return [];
    const MAX_DISTANCE_KM = 5
    
    return stations.filter(station => {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        station.latitude,
        station.longitude
      );
      return distance <= MAX_DISTANCE_KM;
    });
  };

  // Get nearby stations
  const nearbyStations = getNearbyStations();

  // Filter nearby stations based on search query
  const filteredStations = nearbyStations?.filter((station) =>
    station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    station.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get top5uggestions for autocomplete
  const suggestions = filteredStations?.slice(0, 5);

  // Clear route and selection
  const clearRoute = () => {
    setRouteCoordinates([]);
    setRouteDistance(null);
    setRouteDuration(null);
    setSelectedStation(null);
    setSearchQuery("");
  };

  // Handle focus animation
  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
    Animated.timing(inputWidth, {
      toValue: 1.1,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  };

  const goToMyLocation = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01, // adjust for desired zoom
        longitudeDelta: 0.01,
      }, 2000); 
    }
  };

  // Handle blur animation
  const handleBlur = () => {
    setIsFocused(false);
    setTimeout(() => setShowSuggestions(false), 200); // Delay to allow tap on suggestions
    Animated.timing(inputWidth, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    setShowSuggestions(false);
  };

  // Render suggestion item
  const renderSuggestion = ({ item }) => (
    <Pressable
      style={styles.suggestionItem}
      onPress={() => handleStationSelect(item)}
    >
      <View style={styles.suggestionContent}>
        <Ionicons name="location-outline" size={16} color="#666" />
        <View style={styles.suggestionText}>
          <Text style={styles.suggestionName}>{item.name}</Text>
          <Text style={styles.suggestionAddress}>{item.address}</Text>
          <Text style={styles.suggestionPrice}>₦{item.fuel_price}</Text>
        </View>
      </View>
    </Pressable>
  );

  if (isLoading || !location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={{color: "white"}}>Loading stations...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text>Error loading stations. Please try again later.</Text>
        <Text style={styles.errorText}>
          Error details: {error?.message || 'Unknown error'}
        </Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" />
            <Animated.View style={{ flex: inputWidth }}>
              <TextInput
                style={[styles.searchInput, isFocused && styles.searchInputFocused]}
                placeholder="Search gas stations..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </Animated.View>
            {searchQuery.length > 0 && (
              <Pressable onPress={clearRoute} style={styles.clearButton}>
                <Ionicons name="close" size={20} color="#666" />
              </Pressable>
            )}
          </View>
          
          {/* Autocomplete Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <FlatList
                data={suggestions}
                renderItem={renderSuggestion}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                style={styles.suggestionsList}
              />
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <Pressable style={styles.actionButton} onPress={optimizeRoute}>
            <Ionicons name="analytics" size={20} color="#007BFF" />
            <Text style={styles.actionButtonText}>Optimize</Text>
          </Pressable>
          
          {selectedStation && (
            <Pressable style={styles.actionButton} onPress={startNavigation}>
              <Ionicons name="navigate" size={20} color="#007BFF" />
              <Text style={styles.actionButtonText}>Navigate</Text>
            </Pressable>
          )}
        </View>

        {/* Route Info */}
        {routeDistance && routeDuration && (
          <View style={styles.routeInfo}>
            <Text style={styles.routeText}>
              Distance: {routeDistance} • Duration: {routeDuration}
            </Text>
            <Pressable onPress={clearRoute} style={styles.clearRouteButton}>
              <Ionicons name="close" size={16} color="#666" />
            </Pressable>
          </View>
        )}

        {/* Map */}
        <Pressable
          style={{
            position: 'absolute',
            bottom: 160,
            right: 20,
            backgroundColor: '#fff',
            borderRadius: 25,
            padding: 12,
            zIndex: 1001,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
            elevation: 3,
          }}
          onPress={goToMyLocation}
        >
          <Ionicons name="locate" size={24} color="#007BFF" />
        </Pressable>

        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          zoomEnabled
          zoomControlEnabled
          showsUserLocation
          showsMyLocationButton
          // provider={PROVIDER_GOOGLE}
          onRegionChangeComplete={setRegion}
        >
          {/* Gas Station Markers */}
          {filteredStations?.map((station) => {
          // {stations?.map((station) => {
            const isSelected = selectedStation?.id === station.id;
            return (
              <Marker
                key={station.id}
                coordinate={{
                  latitude: station.latitude,
                  longitude: station.longitude,
                }}
                title={station.name}
                description={`Fuel: ₦${station.fuel_price}`}
                onPress={() => handleMarkerPress(station)}
                pinColor={isSelected ? "#007BFF" : "#FF6B6B"}
              >
                <View style={[
                  styles.customMarker,
                  isSelected && styles.selectedMarker
                ]}>
                  {/* <Ionicons 
                    name="car" 
                    size={isSelected ? 24 : 20} 
                    color={isSelected ? "#007BFF" : "#000"} 
                  /> */}
                  <FontAwesome5 
                  name="gas-pump" 
                  size={isSelected ? 24 : 20} 
                  color={isSelected ? "#fff" : "#000"} 
                  />
                  <Text style={[
                    styles.markerText,
                    isSelected && styles.selectedMarkerText
                  ]}>
                    ₦{station.fuel_price}
                  </Text>
                </View>
              </Marker>
            );
          })}
          
          {/* Route Polyline */}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#007BFF"
              strokeWidth={4}
              lineDashPattern={[5, 5]}
            />
          )}
        </MapView>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  searchWrapper: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  searchContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  searchInputFocused: {
    borderBottomWidth: 2,
    borderBottomColor: "#000",
  },
  clearButton: {
    padding: 5,
  },
  suggestionsContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 5,
    maxHeight: 200,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 5,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionText: {
    flex: 1,
    marginLeft: 10,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  suggestionAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  suggestionPrice: {
    fontSize: 14,
    color: '#007BFF',
    fontWeight: '600',
    marginTop: 2,
  },
  actionButtonsContainer: {
    position: 'absolute',
    top: 120,
    right: 20,
    zIndex: 1000,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#007BFF',
    fontWeight: '600',
  },
  routeInfo: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  routeText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  clearRouteButton: {
    padding: 5,
  },
  map: {
    flex: 1,
  },
  customMarker: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#000',
  },
  selectedMarker: {
    backgroundColor: '#000',
    borderColor: '#fff',
  },
  markerText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#000',
    marginTop: 2,
  },
  selectedMarkerText: {
    color: '#fff',
  },
  calloutContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 0,
    minWidth: 150,
  },
  calloutContent: {
    padding: 10,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  calloutPrice: {
    fontSize: 14,
    color: '#007BFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  calloutAddress: {
    fontSize: 12,
    color: '#666',
  },
});