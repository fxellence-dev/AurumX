/**
 * Main Tab Navigator
 * Bottom tab navigation for primary app screens
 */

import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from './types';
import { colors } from '@/theme';
import { Scale, TrendingUp, Bell, User } from 'lucide-react-native';

// Screens
import ComparatorScreen from '@/screens/ComparatorScreen';
import LiveRatesScreen from '@/screens/LiveRatesScreen';
import AlertsScreen from '@/screens/AlertsScreen';
import ProfileScreen from '@/screens/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background.secondary,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.background.tertiary,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: colors.text.primary,
        },
        tabBarStyle: {
          backgroundColor: colors.background.secondary,
          borderTopWidth: 1,
          borderTopColor: colors.background.tertiary,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 88 : 64,
        },
        tabBarActiveTintColor: colors.gold[500],
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Comparator"
        component={ComparatorScreen}
        options={{
          title: 'Compare',
          tabBarLabel: 'Compare',
          tabBarIcon: ({ focused, color }) => (
            <Scale 
              size={24} 
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      
      <Tab.Screen
        name="LiveRates"
        component={LiveRatesScreen}
        options={{
          title: 'Live Rates',
          tabBarLabel: 'Rates',
          tabBarIcon: ({ focused, color }) => (
            <TrendingUp 
              size={24} 
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      
      <Tab.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{
          title: 'Price Alerts',
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ focused, color }) => (
            <Bell 
              size={24} 
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <User 
              size={24} 
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
