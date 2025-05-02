import { useMutation, useQueryClient } from '@tanstack/react-query';

async function unsubscribeFromStation(userId, stationId) {
  const { data, error } = await supabase
    .from('subscriptions')
    .delete()
    .match({ user_id: userId, station_id: stationId });

  if (error) throw error;
  return data;
}

export function useUnsubscribeFromStation() {
  const queryClient = useQueryClient();

  return useMutation(({ userId, stationId }) => unsubscribeFromStation(userId, stationId), {
    onSuccess: () => {
      queryClient.invalidateQueries(['stations']);
      queryClient.invalidateQueries(['user-subscriptions']);
    },
  });
}