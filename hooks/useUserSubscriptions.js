import { useQuery } from '@tanstack/react-query';

const fetchUserSubscriptions = async (userId) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, stations(name, address)')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
};

export function useUserSubscriptions(userId) {
  return useQuery({ queryKey: ['user-subscriptions', userId], queryFn: () => fetchUserSubscriptions(userId), enabled: !!userId, networkMode: 'offlineFirst'});
}