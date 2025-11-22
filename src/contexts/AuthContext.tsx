/**
 * Authentication Context
 * 
 * Provides:
 * - Current user state
 * - Google Sign-In
 * - Sign-Out
 * - Session management
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase, ExpoSecureStoreAdapter } from '@/lib/supabase';
import {
  registerForPushNotificationsAsync,
  savePushTokenToDatabase,
  removePushTokenFromDatabase,
} from '@/services/notificationService';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email || 'No user');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle deep links for OAuth callback
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      
      // Check if this is an auth callback
      if (url?.includes('auth/callback')) {
        const urlObj = new URL(url);
        const access_token = urlObj.searchParams.get('access_token');
        const refresh_token = urlObj.searchParams.get('refresh_token');

        if (access_token && refresh_token) {
          // Set the session with the tokens
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (error) {
            console.error('Error setting session:', error);
          }
        }
      }
    };

    // Listen for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      // Use the custom scheme for mobile app
      const redirectUrl = 'aurumx://auth/callback';
      console.log('🔗 Mobile redirect URL:', redirectUrl);
      
      // Generate the OAuth URL with the mobile redirect
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true, // Important: we handle the redirect manually
        },
      });

      console.log('📱 OAuth URL:', data?.url);

      if (error) {
        console.error('OAuth error:', error);
        throw error;
      }

      if (data?.url) {
        // Open the OAuth URL in browser with our custom redirect scheme
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        console.log('🔙 Browser result:', result.type);

        if (result.type === 'success' && result.url) {
          console.log('✅ Success! Callback URL:', result.url);
          
          // Extract the hash fragment which contains the tokens
          const url = result.url;
          let access_token = null;
          let refresh_token = null;

          // Tokens might be in hash fragment (#) or query params (?)
          if (url.includes('#')) {
            const hashParts = url.split('#')[1];
            const params = new URLSearchParams(hashParts);
            access_token = params.get('access_token');
            refresh_token = params.get('refresh_token');
          } else if (url.includes('?')) {
            const urlObj = new URL(url);
            access_token = urlObj.searchParams.get('access_token');
            refresh_token = urlObj.searchParams.get('refresh_token');
          }

          console.log('🔑 Has access_token:', !!access_token);
          console.log('🔑 Has refresh_token:', !!refresh_token);

          if (access_token && refresh_token) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            if (sessionError) {
              console.error('❌ Error setting session:', sessionError);
              throw sessionError;
            }
            
            console.log('✅ Session set successfully!');
            
            // Register for push notifications after successful sign in
            if (sessionData?.session?.user) {
              try {
                console.log('📱 Registering for push notifications...');
                const pushToken = await registerForPushNotificationsAsync();
                
                if (pushToken) {
                  await savePushTokenToDatabase(sessionData.session.user.id, pushToken, supabase);
                  console.log('✅ Push token registered and saved');
                } else {
                  console.log('⚠️ No push token received (might be simulator or permissions denied)');
                }
              } catch (pushError) {
                console.error('⚠️ Failed to register push notifications:', pushError);
                // Don't throw - push notifications are not critical for sign in
              }
            }
          } else {
            console.error('❌ No tokens found in callback URL');
          }
        } else if (result.type === 'cancel') {
          console.log('⚠️ User cancelled sign in');
        } else {
          console.log('❌ Unexpected result type:', result.type);
        }
      }
    } catch (error) {
      console.error('❌ Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('🔓 Signing out...');
      console.log('Current session:', session?.user?.email);
      
      // Remove push token before signing out
      if (session?.user?.id) {
        try {
          console.log('📱 Removing push token...');
          await removePushTokenFromDatabase(session.user.id, supabase);
          console.log('✅ Push token removed');
        } catch (pushError) {
          console.error('⚠️ Failed to remove push token:', pushError);
          // Don't throw - continue with sign out
        }
      }
      
      // Sign out from Supabase (this clears the session from SecureStore)
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Sign out error:', error);
        
        // If error is about missing session, that means we're already signed out
        // But we still need to clear SecureStore manually
        if (error.message?.includes('session missing') || error.message?.includes('No session') || error.name === 'AuthSessionMissingError') {
          console.log('⚠️ Session already cleared from memory, manually clearing SecureStore');
          
          // Manually clear auth storage using the storage adapter
          try {
            // Get the Supabase project reference from the URL
            const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
            const projectRef = supabaseUrl.split('//')[1]?.split('.')[0];
            
            if (projectRef) {
              // Supabase default storage key format: sb-<project-ref>-auth-token
              const storageKey = `sb-${projectRef}-auth-token`;
              console.log('Clearing storage key:', storageKey);
              await ExpoSecureStoreAdapter.removeItem(storageKey);
              console.log('✅ SecureStore cleared manually');
            } else {
              console.error('Could not determine project ref from URL');
            }
          } catch (storeError) {
            console.error('Error clearing SecureStore:', storeError);
          }
          
          setSession(null);
          setUser(null);
          return; // Don't throw error, this is not a critical failure
        }
        
        throw error;
      }
      
      console.log('✅ Signed out successfully from Supabase');
      
      // Manually update state to ensure immediate UI update
      // The onAuthStateChange listener should also fire, but this ensures responsiveness
      setSession(null);
      setUser(null);
      console.log('✅ Local state cleared');
    } catch (error) {
      console.error('Sign out error:', error);
      // Clear state even on error to prevent stuck logged-in state
      setSession(null);
      setUser(null);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
