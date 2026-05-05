import { neon } from '@neondatabase/serverless';
import Constants from 'expo-constants';

const DATABASE_URL = Constants.expoConfig?.extra?.databaseUrl ?? '';

export const sql = neon(DATABASE_URL);