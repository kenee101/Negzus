import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        // tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        tabBarActiveTintColor: '#4ade80',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: () => (
          <View style={{ backgroundColor: Colors.dark.background }} />
        ),
        tabBarStyle: {
          position: 'absolute',
          marginHorizontal: '9%',
          width: '80%', 
          bottom: 60,
          borderRadius: 32,    
          backgroundColor: Colors.dark.background,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          height: 64,
          borderTopWidth: 0,
          paddingTop: 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="home" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="MapScreen"
        options={{
          title: "Map",
          headerShown: false,
          headerBackground: () => (
            <View
              style={{ flex: 1, backgroundColor: Colors.dark.background }}
            />
          ),
          headerTintColor: Colors.light.tint,
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="map-marker-alt" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="StationListScreen"
        options={{
          title: "Stations",
          headerShown: false,
          headerBackground: () => (
            <View
              style={{ flex: 1, backgroundColor: Colors.dark.background }}
            />
          ),
          headerTintColor: Colors.light.tint,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="gas-station"
              size={28}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ProfileScreen"
        options={{
          title: "Profile",
          headerShown: false,
          headerBackground: () => (
            <View
              style={{ flex: 1, backgroundColor: Colors.dark.background }}
            />
          ),
          headerTintColor: Colors.light.tint,
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="person-pin" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
