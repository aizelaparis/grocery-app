import * as SecureStore from 'expo-secure-store';

const USER_KEY = 'pamili_user';

export const saveSession = async (user) => {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
};

export const getSession = async () => {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const clearSession = async () => {
  await SecureStore.deleteItemAsync(USER_KEY);
};