import { supabase } from "../services/supabase";
import { useQuery } from "@tanstack/react-query";

const fetchStations = async () => {
  const { data, error } = await supabase
    .from('stations')
    .select('*');

  if (error) {
    console.error('Error fetching stations from Supabase:', error);
    throw error;
  }

  return data;
};

export function useStations() {
  const { data: stations, error, isLoading } = useQuery({
    queryKey: ['stations'],
    queryFn: fetchStations,
    networkMode: 'offlineFirst',
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
  });
  
  return { stations, error, isLoading };
}