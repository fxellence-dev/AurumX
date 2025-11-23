/**
 * AurumX - Main Entry Point
 * Next-gen gold market intelligence platform
 * 
 * Features:
 * - React Query for data fetching
 * - Authentication context
 * - React Navigation with bottom tabs
 * - Premium animated splash screen with gold gradients
 * - Premium 3D UI with modern design
 * - Push notifications for gold price alerts
 */

import { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Animated, Dimensions } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import RootNavigator from '@/navigation/RootNavigator';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme';
import * as Notifications from 'expo-notifications';
import {
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
} from '@/services/notificationService';

const { width, height } = Dimensions.get('window');

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000, // 30 seconds
      gcTime: 300_000, // 5 minutes
    },
  },
});

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  // Set up notification listeners
  useEffect(() => {
    // Handle notification received while app is in foreground
    notificationListener.current = addNotificationReceivedListener(notification => {
      console.log('🔔 Notification received:', notification);
      // Notification will be displayed automatically by the handler we set
    });

    // Handle notification tapped by user
    responseListener.current = addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      
      // You can navigate to specific screen based on notification data
      const data = response.notification.request.content.data;
      if (data?.alertId) {
        console.log('📍 Navigate to alert:', data.alertId);
        // TODO: Add navigation logic when RootNavigator is ready
        // Example: navigationRef.current?.navigate('Alerts');
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    // Simple, elegant fade-in sequence
    Animated.sequence([
      // Logo fades in and scales up gently
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      // Text fades in after logo
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 500,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle glow pulse (slow and gentle)
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.7,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.4,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Show splash for 3 seconds (shorter, cleaner)
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        setIsReady(true);
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, glowAnim, logoOpacity, textOpacity]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {!isReady ? (
          <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
            {/* Clean gradient background */}
            <LinearGradient
              colors={[
                '#000000',
                '#0A0A0B',
                colors.gold[900],
                '#0A0A0B',
                '#000000',
              ]}
              locations={[0, 0.3, 0.5, 0.7, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Content */}
            <View style={styles.splashContent}>
              {/* Subtle glow behind logo */}
              <Animated.View style={[styles.logoGlow, { opacity: glowAnim }]}>
                <LinearGradient
                  colors={[colors.gold[600], colors.gold[800], 'transparent']}
                  style={styles.glowGradient}
                />
              </Animated.View>

              {/* Main logo container */}
              <Animated.View
                style={[
                  styles.logoContainer,
                  {
                    opacity: logoOpacity,
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
                {/* Elegant card */}
                <View style={styles.logoCard}>
                  <LinearGradient
                    colors={[
                      'rgba(217, 164, 65, 0.12)',
                      'rgba(217, 164, 65, 0.06)',
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardGradient}
                  >
                    <Text style={styles.logoEmoji}>✨</Text>
                  </LinearGradient>
                </View>

                {/* Title */}
                <Text style={styles.title}>AurumX</Text>
                
                {/* Simple underline */}
                <View style={styles.titleUnderline}>
                  <LinearGradient
                    colors={[
                      'transparent',
                      colors.gold[500],
                      'transparent',
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.underlineGradient}
                  />
                </View>
              </Animated.View>

              {/* Subtitle */}
              <Animated.View style={{ opacity: textOpacity }}>
                <Text style={styles.subtitle}>Next-Gen Gold Market Intelligence</Text>
              </Animated.View>
            </View>

            <StatusBar style="light" />
          </Animated.View>
        ) : (
          <>
            <RootNavigator />
            <StatusBar style="light" />
          </>
        )}
      </AuthProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
  },
  splashContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  // Subtle glow effect
  logoGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  glowGradient: {
    flex: 1,
    borderRadius: 110,
  },
  // Logo container
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  // Elegant logo card
  logoCard: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(217, 164, 65, 0.25)',
    shadowColor: colors.gold[500],
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
    marginBottom: 24,
  },
  cardGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Logo emoji
  logoEmoji: {
    fontSize: 64,
    textShadowColor: colors.gold[400],
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  // Title
  title: {
    fontSize: 52,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: colors.gold[500],
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 16,
    marginBottom: 12,
  },
  // Underline
  titleUnderline: {
    width: 120,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  underlineGradient: {
    flex: 1,
  },
  // Subtitle
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gold[300],
    letterSpacing: 1.8,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.9,
  },
});
