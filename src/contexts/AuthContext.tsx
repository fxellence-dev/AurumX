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
import * as AppleAuthentication from 'expo-apple-authentication';
import { Alert, Platform } from 'react-native';
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
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
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

  // Handle deep links for OAuth callback, email verification, and password reset
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      console.log('🔗 Deep link received:', url);
      
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
      
      // Handle email confirmation (aurumx://email-confirmed#access_token=...)
      if (url?.includes('email-confirmed')) {
        console.log('📧 Email confirmation link clicked');
        const hash = url.split('#')[1];
        if (hash) {
          const params = new URLSearchParams(hash);
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');
          
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            
            if (!error) {
              // Show success message after a short delay to let the UI update
              setTimeout(() => {
                Alert.alert(
                  '✅ Email Verified!',
                  'Your email has been confirmed. Welcome to AurumX! 🎉'
                );
              }, 300);
            }
          }
        }
      }
      
      // Handle password reset (aurumx://reset-password#access_token=...)
      if (url?.includes('reset-password')) {
        console.log('🔑 Password reset link clicked');
        const hash = url.split('#')[1];
        if (hash) {
          const params = new URLSearchParams(hash);
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');
          
          if (access_token) {
            // Show password reset prompt immediately (works from any screen)
            // Use a small delay to ensure the app UI has loaded
            setTimeout(() => {
              Alert.prompt(
                '🔑 Reset Your Password',
                'Enter your new password (minimum 6 characters):',
                [
                  { 
                    text: 'Cancel', 
                    style: 'cancel',
                    onPress: () => {
                      console.log('Password reset cancelled');
                    }
                  },
                  {
                    text: 'Update',
                    onPress: async (password?: string) => {
                      if (!password || password.length < 6) {
                        Alert.alert('Error', 'Password must be at least 6 characters');
                        return;
                      }
                      
                      try {
                        // Set the session first (temporarily)
                        await supabase.auth.setSession({
                          access_token,
                          refresh_token: refresh_token || '',
                        });
                        
                        // Update the password
                        const { error } = await supabase.auth.updateUser({
                          password: password,
                        });
                        
                        if (error) {
                          Alert.alert('Error', error.message);
                          // Sign out since password wasn't changed
                          await supabase.auth.signOut();
                        } else {
                          // Password updated successfully - user is now logged in with new password
                          Alert.alert(
                            '✅ Password Updated!',
                            'Your password has been changed successfully. You are now signed in.'
                          );
                        }
                      } catch (error: any) {
                        Alert.alert('Error', error.message || 'Failed to update password');
                        // Sign out on error
                        await supabase.auth.signOut();
                      }
                    },
                  },
                ],
                'secure-text'
              );
            }, 500);
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
                console.log('📱 Push token result:', pushToken);
                
                if (pushToken) {
                  console.log('📱 About to save push token for user:', sessionData.session.user.id);
                  await savePushTokenToDatabase(sessionData.session.user.id, pushToken, supabase);
                  console.log('✅ Push token registered and saved');
                } else {
                  console.log('⚠️ No push token received (might be simulator or permissions denied)');
                }
              } catch (pushError) {
                console.error('⚠️ Failed to register push notifications:', pushError);
                console.error('⚠️ Push error details:', JSON.stringify(pushError, null, 2));
                // Don't throw - push notifications are not critical for sign in
              }
            } else {
              console.log('⚠️ No session user found for push token registration');
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

  const signInWithApple = async () => {
    try {
      console.log('🍎 Starting Apple Sign-In...');
      
      // Check if Apple Authentication is available (only on real iOS devices)
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      
      if (!isAvailable) {
        console.log('⚠️ Apple Sign-In not available');
        Alert.alert(
          'Not Available',
          Platform.OS === 'ios' 
            ? 'Sign in with Apple is only available on physical iOS devices, not in simulators.'
            : 'Sign in with Apple is only available on iOS devices.'
        );
        return;
      }

      // Request Apple credentials
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('🍎 Apple credential received');
      console.log('- User ID:', credential.user);
      console.log('- Has identity token:', !!credential.identityToken);
      console.log('- Email:', credential.email || 'Hidden');
      console.log('- Name:', credential.fullName?.givenName || 'Not provided');

      // Sign in with Supabase using Apple ID token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken!,
      });

      if (error) {
        console.error('❌ Supabase Apple Sign-In error:', error);
        throw error;
      }

      console.log('✅ Apple Sign-In successful!');
      console.log('User email:', data.user?.email);

      // Register for push notifications after successful sign in
      if (data?.user) {
        try {
          console.log('📱 Registering for push notifications...');
          const pushToken = await registerForPushNotificationsAsync();
          
          if (pushToken) {
            await savePushTokenToDatabase(data.user.id, pushToken, supabase);
            console.log('✅ Push token registered and saved');
          } else {
            console.log('⚠️ No push token received');
          }
        } catch (pushError) {
          console.error('⚠️ Failed to register push notifications:', pushError);
          // Don't throw - push notifications are not critical for sign in
        }
      }
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        console.log('⚠️ User canceled Apple Sign-In');
        // Don't show alert for user cancellation
      } else {
        console.error('❌ Apple Sign-In error:', error);
        Alert.alert(
          'Sign In Failed',
          error.message || 'Failed to sign in with Apple. Please try again.'
        );
      }
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log('📧 Signing in with email...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Email sign-in error:', error);
        throw error;
      }

      console.log('✅ Signed in with email successfully');

      // Register for push notifications
      if (data.user) {
        try {
          console.log('📱 Registering for push notifications...');
          const pushToken = await registerForPushNotificationsAsync();
          console.log('📱 Push token result:', pushToken);
          
          if (pushToken) {
            console.log('📱 About to save push token for user:', data.user.id);
            await savePushTokenToDatabase(data.user.id, pushToken, supabase);
            console.log('✅ Push token registered and saved');
          } else {
            console.log('⚠️ No push token received');
          }
        } catch (pushError) {
          console.error('⚠️ Failed to register push notifications:', pushError);
        }
      }
    } catch (error) {
      console.error('Email sign-in error:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    try {
      console.log('📝 Signing up with email...');
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            name: fullName,
          },
          emailRedirectTo: 'aurumx://email-confirmed',
        },
      });

      if (error) {
        console.error('❌ Email sign-up error:', error);
        throw error;
      }

      if (data.user && !data.session) {
        // Email confirmation required
        console.log('📧 Email confirmation required');
        throw new Error('CONFIRMATION_REQUIRED');
      }

      console.log('✅ Signed up with email successfully');

      // Register for push notifications
      if (data.user) {
        try {
          console.log('📱 Registering for push notifications...');
          const pushToken = await registerForPushNotificationsAsync();
          console.log('📱 Push token result:', pushToken);
          
          if (pushToken) {
            console.log('📱 About to save push token for user:', data.user.id);
            await savePushTokenToDatabase(data.user.id, pushToken, supabase);
            console.log('✅ Push token registered and saved');
          } else {
            console.log('⚠️ No push token received');
          }
        } catch (pushError) {
          console.error('⚠️ Failed to register push notifications:', pushError);
        }
      }
    } catch (error) {
      console.error('Email sign-up error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log('🔑 Sending password reset email...');
      
      // Use deep link to open directly in the app
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'aurumx://reset-password',
      });

      if (error) {
        console.error('❌ Password reset error:', error);
        throw error;
      }

      console.log('✅ Password reset email sent');
    } catch (error) {
      console.error('Password reset error:', error);
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

  const deleteAccount = async () => {
    try {
      console.log('🗑️ Deleting account...');
      
      if (!user) {
        throw new Error('No user logged in');
      }

      // Call Supabase RPC function to delete user
      const { error } = await supabase.rpc('delete_user');
      
      if (error) {
        console.error('❌ Delete account error:', error);
        throw error;
      }
      
      console.log('✅ Account deleted successfully');
      
      // Sign out after deletion
      await signOut();
    } catch (error) {
      console.error('Delete account error:', error);
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
        signInWithApple,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        signOut,
        deleteAccount,
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
