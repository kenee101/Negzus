import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Pressable,
  Animated,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { useStations } from "@/hooks/useStations";

const MapScreen = () => {
  const navigation = useNavigation();
  const [isFocused, setIsFocused] = useState(false);

  // const [stations, setStations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [region, setRegion] = useState({
    latitude: 9.05785, // Abuja default center
    longitude: 7.49508,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  // Animated value for smooth transition
  const inputWidth = useRef(new Animated.Value(1)).current;

  // Fetch stations using TanStack Query
  const { stations, isLoading, error } = useStations();

  // Handle focus animation
  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(inputWidth, {
      toValue: 1.1, // Expand width by 10%
      duration: 1000,
      useNativeDriver: false,
    }).start();
  };

  // Handle blur animation
  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(inputWidth, {
      toValue: 1, // Reset width
      duration: 1000,
      useNativeDriver: false,
    }).start();
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss(); // Unfocus the TextInput
    handleBlur(); // Trigger blur animation
  };

  if (isLoading) {
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
      <View style={styles.container}>
        {/* Search Bar */}
        <View className="absolute top-0 left-0 right-0 z-10">
          <Pressable
            style={({ pressed }) => [
              { transform: pressed ? [{ translateX: 20 }] : [] },
            ]}
          >
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#333" />
              <Animated.View style={{ flex: inputWidth }}>
                <TextInput
                  style={[
                    styles.searchInput,
                    isFocused && styles.searchInputFocused,
                  ]}
                  placeholder="Search for a station..."
                  value={searchQuery}
                  onChangeText={(text) => setSearchQuery(text)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </Animated.View>
            </View>
          </Pressable>
        </View>
        {/* Map */}
        <MapView style={styles.map} region={region} showsUserLocation>
          {filteredStations.map((station) => (
            <Marker
              key={station.id}
              coordinate={{
                latitude: station.latitude,
                longitude: station.longitude,
              }}
              title={station.name}
              description={`Fuel: ₦${station.fuel_price}`}
              onPress={() =>
                navigation.navigate("StationDetailScreen", { station: station })
              }
            />
          ))}
        </MapView>

        {/* Optional: List View */}
        {/* 
        <FlatList
          data={filteredStations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.listItem}>
              <Text style={styles.stationName}>{item.name}</Text>
              <Text>{`₦${item.fuelPrice}`}</Text>
            </TouchableOpacity>
          )}
        />
        */}
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    position: "absolute",
    top: 30,
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
  searchInput: {
    flex: 1,
    marginLeft: 10,
  },
  searchInputFocused: {
    height: 30,
    borderColor: "#007BFF",
    borderBottomWidth: 1,
  },
  map: {
    flex: 1,
  },
  listItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  stationName: {
    fontWeight: "bold",
  },
});
