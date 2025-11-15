/**
 * Profile Screen
 * User profile and settings
 */

import React from 'react';
import { StyleSheet, Text, View, ScrollView, Platform } from 'react-native';
import type { MainTabScreenProps } from '@/navigation/types';
import { colors } from '@/theme';
import { useAuth } from '@/contexts/AuthContext';
import { User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen({ navigation }: MainTabScreenProps<'Profile'>) {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 3D Icon Container */}
        <View style={styles.iconWrapper}>
          {/* Shadow layers for 3D depth */}
          <View style={[styles.iconShadow, styles.iconShadow1]} />
          <View style={[styles.iconShadow, styles.iconShadow2]} />
          
          {/* Main gradient icon container - Blue theme for profile */}
          <LinearGradient
            colors={['#60A5FA', '#2563EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}
          >
            <View style={styles.iconInner}>
              <User size={56} color="#FFFFFF" strokeWidth={2.5} />
            </View>
          </LinearGradient>
        </View>
        
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.description}>
          Manage your account, preferences, and app settings
        </Text>
        
        {user && (
          <View style={styles.userInfo}>
            <Text style={styles.label}>Signed in as:</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        )}
        
        <Text style={styles.status}>Coming soon...</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconWrapper: {
    position: 'relative',
    marginBottom: 32,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 32,
    padding: 3,
    ...Platform.select({
      ios: {
        shadowColor: '#60A5FA',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  iconInner: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconShadow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 32,
    backgroundColor: '#1E3A8A',
  },
  iconShadow1: {
    opacity: 0.3,
    top: 4,
    left: 4,
  },
  iconShadow2: {
    opacity: 0.15,
    top: 8,
    left: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gold[500],
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  userInfo: {
    backgroundColor: colors.background.tertiary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  status: {
    fontSize: 14,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
});
