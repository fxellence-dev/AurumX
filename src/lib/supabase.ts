/**
 * Supabase Client Configuration
 * 
 * Initializes and exports the Supabase client with:
 * - Expo SecureStore adapter for secure session persistence
 * - TypeScript types for database tables
 * - Configured auth settings for mobile
 */

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import type { Database } from '@/types/database';

// Environment variables (from .env file)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Custom storage adapter using Expo SecureStore
 * Provides encrypted, persistent storage for auth tokens
 */
export const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('SecureStore getItem error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('SecureStore setItem error:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('SecureStore removeItem error:', error);
    }
  },
};

/**
 * Supabase client instance
 * 
 * Features:
 * - Type-safe database queries with generated types
 * - Secure session storage with Expo SecureStore
 * - Auto-refresh for expired tokens
 * - Google OAuth for mobile
 */
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Use Expo SecureStore for session persistence
    storage: ExpoSecureStoreAdapter,
    
    // Auto-refresh tokens before they expire
    autoRefreshToken: true,
    
    // Persist session across app restarts
    persistSession: true,
    
    // Detect session from URL (for OAuth redirects)
    detectSessionInUrl: false,
  },
});

/**
 * Helper type for typed Supabase queries
 * Usage: const { data } = await supabase.from('gold_prices_cache').select('*');
 */
export type SupabaseClient = typeof supabase;
