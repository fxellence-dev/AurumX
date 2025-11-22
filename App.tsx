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
import { StyleSheet, Text, View, Animated, Dimensions, Image } from 'react-native';
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
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
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
    // Start animations
    Animated.parallel([
      // Logo scale-in animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      // Shimmer animation - continuous loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ),
      // Glow pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    // Show splash for 5 seconds
    const timer = setTimeout(() => {
      // Fade out splash screen
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        setIsReady(true);
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, [fadeAnim, shimmerAnim, scaleAnim, glowAnim]);

  // Shimmer translate animation
  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  // Glow opacity animation
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {!isReady ? (
          <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
            {/* Animated gradient background */}
            <LinearGradient
              colors={[
                '#000000',
                colors.gold[900],
                colors.gold[700],
                colors.gold[500],
                colors.gold[700],
                colors.gold[900],
                '#000000',
              ]}
              locations={[0, 0.2, 0.35, 0.5, 0.65, 0.8, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Animated shimmer overlay */}
            <Animated.View
              style={[
                styles.shimmerOverlay,
                {
                  transform: [{ translateX: shimmerTranslate }],
                },
              ]}
            >
              <LinearGradient
                colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>

            {/* Content */}
            <View style={styles.splashContent}>
              {/* Animated glow behind logo */}
              <Animated.View style={[styles.logoGlow, { opacity: glowOpacity }]}>
                <LinearGradient
                  colors={[colors.gold[400], colors.gold[600], 'transparent']}
                  style={styles.glowGradient}
                />
              </Animated.View>

              {/* Logo/Title with scale animation */}
              <Animated.View style={[styles.logoContainer, { transform: [{ scale: scaleAnim }] }]}>
                <LinearGradient
                  colors={[colors.gold[300], colors.gold[500], colors.gold[700]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.emojiGradient}
                >
                  <Text style={styles.logoEmoji}>✨</Text>
                </LinearGradient>
                
                <Text style={styles.title}>AurumX</Text>
                
                {/* Underline decoration */}
                <LinearGradient
                  colors={['transparent', colors.gold[500], 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.titleUnderline}
                />
              </Animated.View>

              <Text style={styles.subtitle}>Next-Gen Gold Market Intelligence</Text>

              {/* Loading dots animation */}
              <View style={styles.loadingContainer}>
                <Animated.View style={[styles.loadingDot, { opacity: glowOpacity }]} />
                <Animated.View style={[styles.loadingDot, { opacity: glowOpacity }]} />
                <Animated.View style={[styles.loadingDot, { opacity: glowOpacity }]} />
              </View>
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
    position: 'relative',
  },
  splashContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    position: 'relative',
    zIndex: 10,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width * 2,
  },
  logoGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: '35%',
  },
  glowGradient: {
    flex: 1,
    borderRadius: 100,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emojiGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: colors.gold[500],
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  logoEmoji: {
    fontSize: 50,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: colors.gold[500],
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
    marginBottom: 8,
  },
  titleUnderline: {
    width: 120,
    height: 3,
    marginTop: 8,
    borderRadius: 2,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.gold[300],
    letterSpacing: 1.5,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 48,
    gap: 12,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.gold[500],
    shadowColor: colors.gold[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
});
