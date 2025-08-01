import { supabase } from "@/services/supabase";
import { useQuery } from "@tanstack/react-query";

const loadNotifications = async (stationId) => {
  if (!stationId) {
    return [];
  }

  try {
    // console.log('Loading notifications for station:', stationId);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('station_id', stationId)
      .order('sent_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Supabase error loading notifications:', error);
      throw error;
    }
    
    // console.log('Loaded notifications:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Error loading notifications:', error);
    throw error; // Re-throw so React Query can handle it
  }
};

export function useNotifications(stationId) {
  const { data: notifications, error, isLoading, refetch } = useQuery({
    queryKey: ['notifications', stationId],
    queryFn: () => loadNotifications(stationId),
    enabled: !!stationId, // Only run when stationId exists
    networkMode: 'online',
    staleTime: 1000 * 60 * 1, // 1 minute
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  
  // console.log('useNotifications - stationId:', stationId, 'notifications:', notifications?.length, 'isLoading:', isLoading, 'error:', error);
  
  return { 
    notifications: notifications || [], 
    error, 
    isLoading, 
    refetch 
  };
}