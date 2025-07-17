import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js';
// import AsyncStorage from '@react-native-async-storage/async-storage'

console.log("SUPABASE URL:", process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log("SUPABASE KEY:", process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing');

export const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL || "",
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
    // {
    //   auth: {
    //     storage: AsyncStorage,
    //     autoRefreshToken: true,
    //     persistSession: true,
    //     detectSessionInUrl: false,
    //   },
    // }
)