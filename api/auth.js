import { supabase } from './db';
import { saveSession, clearSession } from './session';

export const registerUser = async ({ firstName, lastName, email, password }) => {
  // 1. Create auth account — trigger auto-creates the public.users profile
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name:  lastName,
      },
    },
  });

  if (error) throw new Error(error.message);

  // 2. Sign in immediately to establish session
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) throw new Error(signInError.message);

  const safeUser = {
    id:         signInData.user.id,
    first_name: firstName,
    last_name:  lastName,
    email,
    created_at: signInData.user.created_at,
  };

  await saveSession(safeUser);
  return safeUser;
};

export const loginUser = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error('Incorrect email or password.');

  // Fetch full profile from public.users table
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, first_name, last_name, email, address, created_at')
    .eq('id', data.user.id)
    .single();

  if (profileError) throw new Error(profileError.message);

  await saveSession(profile);
  return profile;
};

export const logoutUser = async () => {
  await supabase.auth.signOut();
  await clearSession();
};