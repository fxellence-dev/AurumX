/**
 * Navigation Types
 * TypeScript types for React Navigation routes and params
 */

import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// Root Stack (Main navigation container)
export type RootStackParamList = {
  Main: undefined;
  // Add auth screens here later if needed
  // Login: undefined;
  // Onboarding: undefined;
};

// Main Bottom Tab Navigator
export type MainTabParamList = {
  LiveRates: undefined;
  Alerts: undefined;
  Comparator: undefined;
  Extra: undefined;
};

// Screen Props Types
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

// Extend React Navigation types globally
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
