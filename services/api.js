import { supabase } from './supabase'
// import { useQueryClient } from '@tanstack/react-query';

// const queryClient = useQueryClient();

export async function createUserIfNotExists(user) {
  const { data, error } = await supabase
    .from('users')
    .upsert([
      {
        id: user.id,
        full_name: user.user_metadata?.full_name || '',
        email: user.email,
      },
    ], { onConflict: 'id' }); // If user already exists, do nothing

  if (error) throw error;
  return data;
}

async function addStation({ name, address, lat, lng, userId }) {
  const { data, error } = await supabase
    .from('stations')
    .insert([
      {
        name,
        address,
        latitude: lat,
        longitude: lng,
        user_id: userId,
      },
    ]);

  if (error) throw error;
  return data;
}

export async function updatePushToken(userId, token) {
  const { data, error } = await supabase
    .from('users')
    .update({ expo_push_token: token })
    .eq('id', userId);

  if (error) throw error;
  return data;
}

export async function checkSubscription(userId, stationId) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('station_id', stationId)
    .single();

  if (error && error.code !== 'PGRST116') { // Means not found
    throw error;
  }
  return !!data;
}

export async function signUpUser({ email, password, fullName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  const user = data.user;

  // Insert into users table
  const { error: insertError } = await supabase.from('users').insert([
    {
      id: user.id,
      full_name: fullName,
      email: user.email,
    },
  ]);

  if (insertError) throw insertError;

  return user;
}
