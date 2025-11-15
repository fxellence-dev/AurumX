/**
 * Live Rates Screen
 * View current gold prices in different currencies
 */

import React from 'react';
import { StyleSheet, Text, View, ScrollView, Platform } from 'react-native';
import type { MainTabScreenProps } from '@/navigation/types';
import { colors } from '@/theme';
import { TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function LiveRatesScreen({ navigation }: MainTabScreenProps<'LiveRates'>) {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 3D Icon Container */}
        <View style={styles.iconWrapper}>
          {/* Shadow layers for 3D depth */}
          <View style={[styles.iconShadow, styles.iconShadow1]} />
          <View style={[styles.iconShadow, styles.iconShadow2]} />
          
          {/* Main gradient icon container - Green theme for rates/charts */}
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}
          >
            <View style={styles.iconInner}>
              <TrendingUp size={56} color="#FFFFFF" strokeWidth={2.5} />
            </View>
          </LinearGradient>
        </View>
        
        <Text style={styles.title}>Live Gold Rates</Text>
        <Text style={styles.description}>
          Real-time XAU prices in GBP, USD, and INR with interactive charts
        </Text>
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
        shadowColor: '#10B981',
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
    backgroundColor: '#059669',
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconShadow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 32,
    backgroundColor: '#064E3B',
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
  status: {
    fontSize: 14,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
});
