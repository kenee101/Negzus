import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native'
import { PaystackProvider } from 'react-native-paystack-webview';
import '@/global.css'
// import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Colors } from '@/constants/Colors';
import { registerForPushNotificationsAsync } from '@/utils/pushNotificationService';
import { useAuth } from "@/hooks/useAuth";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const queryClient = new QueryClient();
  const { user, loading } = useAuth();
  // console.log(user)
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  // console.log(process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY)

  // useEffect(() => {
  //   async function getToken() {
  //     const token = await registerForPushNotificationsAsync();
  //     // TODO: Send this token to Supabase and save it under user's record
  //   }
  //   getToken();
  // }, []);

  useEffect(() => {
    if (loaded || loading) {
      SplashScreen.hideAsync();
    }
  }, [loaded, loading]);

  if (!(loaded || loading)) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PaystackProvider debug={true} currency="NGN" defaultChannels={['card', 'bank']} publicKey={process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || ''}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          {user ? 
          <Stack screenOptions={{title: 'Negzus', headerTintColor: '#4ade80', headerBackground: () => <View style={{ flex: 1, backgroundColor: Colors.dark.background }} />}}>
            <Stack.Screen name="(tabs)" options={{ headerTintColor: '#4ade80' }} />
            <Stack.Screen name="StationDetailScreen" options={{ title: 'Station Details', headerTintColor: '#4ade80' }}/>
            <Stack.Screen name="PaymentScreenMerchant" options={{ title: 'Payments', headerTintColor:'#4ade80' }}/>
            <Stack.Screen name="PaymentScreenUser" options={{ title: 'Payments', headerTintColor: '#4ade80' }}/>
            <Stack.Screen name="UserProfileManager" options={{ title: 'Profile', headerTintColor: '#4ade80' }}/>
            <Stack.Screen name="FuelManagementScreen" options={{ title: 'Updates', headerTintColor: '#4ade80' }}/>
            <Stack.Screen name="AdminPanelScreen" options={{ title: 'Admin', headerTintColor: '#4ade80' }}/>
            <Stack.Screen name="+not-found" />
          </Stack> : 
          <Stack screenOptions={{title: 'Negzus', headerTintColor: '#4ade80', headerBackground: () => <View style={{ flex: 1, backgroundColor: Colors.dark.background }} />}}>
            <Stack.Screen name="LoginScreen" options={{ title: 'Log In', headerTintColor: '#4ade80' }}/>
            <Stack.Screen name="SignUpScreen" options={{ title: 'Sign Up', headerTintColor: '#4ade80' }}/>
            <Stack.Screen name="+not-found" />
          </Stack>
          }
        </ThemeProvider>
        <StatusBar style="light" />
      </PaystackProvider>
    </QueryClientProvider>
  );
}
