import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';

export const fetchUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    // .select('id, full_name, email, phone_number', 'created_at')
    .select()
    .eq('id', userId)
    .single();

  if (error) throw error;
  // return data?.[0] || null
  return data
};

export function useUserProfile(userId) {
  return useQuery({
    queryKey: ['user-profile', userId], 
    queryFn: () => fetchUserProfile(userId), 
    enabled: !!userId,
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),});
}