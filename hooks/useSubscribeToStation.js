import { useMutation, useQueryClient } from '@tanstack/react-query';

async function subscribeToStation(userId, stationId) {
  const { data, error } = await supabase.from('subscriptions').insert([
    {
      user_id: userId,
      station_id: stationId,
      subscribe_fuel: true,
      subscribe_diesel: true,
      subscribe_gas: true,
    },
  ]);

  if (error) throw error;
  return data;
}

export function useSubscribeToStation() {
  const queryClient = useQueryClient();

  return useMutation(({ userId, stationId }) => subscribeToStation(userId, stationId), {
    onSuccess: () => {
      queryClient.invalidateQueries(['stations']);
      queryClient.invalidateQueries(['user-subscriptions']);
    },
  });
}