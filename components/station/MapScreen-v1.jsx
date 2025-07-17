import React, { useEffect, useState, useRef } from "react";
import * as Location from 'expo-location';
import {
  View, 
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
  ScrollView,
} from "react-native";
import MapboxGL from '@rnmapbox/maps';
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { useStations } from "@/hooks/useStations";

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_ACCESS_TOKEN);
MapboxGL.setTelemetryEnabled(false);

// Default location in Lagos, Nigeria
const LAGOS_LOCATION = [3.082251, 6.624499];

// Default location in Ogun, Nigeria
const OGUN_LOCATION = [3.152303, 6.671542];

const mockStations = [
  {
    id: '1',
    name: 'Total - Garki',
    coordinates: [7.491302, 9.072264],
  },
  {
    id: '2',
    name: 'Mobil - Wuse',
    coordinates: [7.482510, 9.080140],
  },
];

const MapScreen = () => {
  const navigation = useNavigation();
  const [location, setLocation] = useState(OGUN_LOCATION);
  const [errorMsg, setErrorMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(15);
  const isSimulator = Platform.OS === 'ios' && __DEV__;
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      try {
        let loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        console.log('Location:', loc.coords.longitude, loc.coords.latitude);
        
        // Only use real location if not in simulator
        if (!isSimulator) {
          setLocation([loc.coords.longitude, loc.coords.latitude]);
        }
      } catch (error) {
        console.log('Error getting location:', error);
        // Fallback to default location
        setLocation(OGUN_LOCATION);
      }
    })();
  }, []);

  const { stations, isLoading, error } = useStations();

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 1, 20));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 1, 1));
  };

  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (text.length > 2) {
      setIsSearching(true);
      try {
        // Search for gas stations in Lagos
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            'gas station ' + text
          )}.json?access_token=${process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_ACCESS_TOKEN}&country=ng&proximity=3.3792,6.5244&types=poi&limit=20`
        );
        const data = await response.json();
        
        // Filter results to only include gas stations within 30 miles (approximately 48.28 km)
        // const lagosCenter = [3.3792, 6.5244]; // Lagos coordinates
        const filteredResults = data.features.filter(feature => {
          const distance = calculateDistance(
            OGUN_LOCATION[0],
            OGUN_LOCATION[1],
            feature.center[0],
            feature.center[1]
          );
          return distance <= 48.28; // 30 miles in kilometers
        });
        
        console.log(filteredResults)
        setSearchResults(filteredResults);
      } catch (error) {
        console.error('Search error:', error);
      }
      setIsSearching(false);
    } else {
      setSearchResults([]);
    }
  };

  // Function to calculate distance between two points using Haversine formula
  const calculateDistance = (lon1, lat1, lon2, lat2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  const handleSelectLocation = (feature) => {
    const [longitude, latitude] = feature.center;
    console.log('Selected location:', { longitude, latitude, place: feature.place_name });
    setLocation([longitude, latitude]);
    setSearchQuery(feature.place_name);
    setSearchResults([]);
    setZoomLevel(14); 
    Keyboard.dismiss();
  };

  if (isLoading || !location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading stations...</Text>
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
    station.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.page}>
        <View style={styles.mapContainer}>
          <MapboxGL.MapView
            ref={mapRef}
            style={styles.map}
            styleURL={MapboxGL.StyleURL.Street}
            onMapLoadingError={(e) => console.error('Map load failed:', e.nativeEvent)}
            onDidFinishLoadingMap={() => setMapReady(true)}
            compassEnabled={true}
            logoEnabled={false}
            attributionEnabled={false}
          >
            {mapReady && (
              <>
                <MapboxGL.Camera
                  zoomLevel={zoomLevel}
                  // centerCoordinate={location}
                  animationMode="flyTo"
                  animationDuration={2000}
                  followUserLocation={!isSimulator}
                  followUserMode="normal"
                  followZoomLevel={zoomLevel}
                  key={`camera-${location[0]}-${location[1]}`}
                /> 

                {/* User's current location marker - only show on real devices */}
                {!isSimulator && (
                  <MapboxGL.UserLocation
                    visible={true}
                    animated={true}
                    requestsAlwaysUse={true}
                    showsUserHeadingIndicator={true}
                  />
                )}

                {/* Station markers */}
                {mockStations.map((station) => (
                  <MapboxGL.PointAnnotation
                    key={station.id}
                    id={station.id}
                    coordinate={station.coordinates}
                    title={station.name}
                    selected={false}
                  >
                    <View style={styles.markerContainer}>
                      <View style={styles.marker}>
                        <Ionicons name="location" size={24} color="#FF0000" />
                      </View>
                    </View>
                  </MapboxGL.PointAnnotation>
                ))}
              </>
            )}
          </MapboxGL.MapView>

          {/* Search Box */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for gas stations in Lagos..."
              value={searchQuery}
              onChangeText={handleSearch}
              placeholderTextColor="#666"
            />
            {isSearching && (
              <ActivityIndicator size="small" color="#666" style={styles.searchLoader} />
            )}
          </View>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <View style={styles.searchResultsContainer}>
              <ScrollView style={styles.searchResultsList}>
                {searchResults.map((result, index) => (
                  <Pressable
                    key={index}
                    style={styles.searchResultItem}
                    onPress={() => handleSelectLocation(result)}
                  >
                    <Ionicons name="location-outline" size={20} color="#666" />
                    <Text style={styles.searchResultText}>{result.place_name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Zoom Controls */}
          <View style={styles.zoomControls}>
            <Pressable style={styles.zoomButton} onPress={handleZoomIn}>
              <Ionicons name="add" size={24} color="#000" />
            </Pressable>
            <Pressable style={styles.zoomButton} onPress={handleZoomOut}>
              <Ionicons name="remove" size={24} color="#000" />
            </Pressable>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  searchLoader: {
    marginLeft: 8,
  },
  searchResultsContainer: {
    position: "absolute",
    top: 110,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 8,
    maxHeight: 200,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  searchResultsList: {
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchResultText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#000',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  zoomControls: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  zoomButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginVertical: 4,
  },
});