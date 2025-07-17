import { supabase } from "../services/supabase";
import { useQuery } from "@tanstack/react-query";

const fetchStations = async () => {
  try {
    // console.log('Fetching stations from Supabase...');
    // console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
    // console.log('Supabase Key:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing');
    
    const { data, error } = await supabase
      .from('stations')
      .select('*');

    if (error) {
      console.error('Error fetching stations from Supabase:', error);
      throw error;
    }

    // console.log('Stations fetched successfully:', data?.length || 0, 'stations');
    return data || [];
  } catch (error) {
    console.error('Network error in fetchStations:', error);
    throw error;
  }
};

export function useStations() {
  const { data: stations, error, isLoading, refetch } = useQuery({
    queryKey: ['stations'],
    queryFn: fetchStations,
    networkMode: 'online', // Changed from 'offlineFirst' to 'online'
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
  
  return { stations, error, isLoading, refetch };
}