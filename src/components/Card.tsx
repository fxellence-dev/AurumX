/**
 * Card Component
 * Premium card container with 3D effects and variants
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Platform,
  ViewStyle,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme';

type CardVariant = 'default' | 'elevated' | 'gradient' | 'outlined';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export default function Card({
  children,
  variant = 'default',
  onPress,
  style,
  contentStyle,
}: CardProps) {
  const CardWrapper = onPress ? Pressable : View;

  // Gradient variant with gold effect
  if (variant === 'gradient') {
    return (
      <CardWrapper
        onPress={onPress}
        style={[styles.card, styles.gradientCard, style]}
      >
        <LinearGradient
          colors={[colors.background.tertiary, colors.background.quaternary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientContent, contentStyle]}
        >
          <View style={styles.gradientBorder} />
          {children}
        </LinearGradient>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper
      onPress={onPress}
      style={[
        styles.card,
        variant === 'elevated' && styles.elevatedCard,
        variant === 'outlined' && styles.outlinedCard,
        variant === 'default' && styles.defaultCard,
        style,
      ]}
    >
      <View style={[styles.content, contentStyle]}>{children}</View>
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  defaultCard: {
    backgroundColor: colors.background.secondary,
  },
  elevatedCard: {
    backgroundColor: colors.background.secondary,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  outlinedCard: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.background.quaternary,
  },
  gradientCard: {
    ...Platform.select({
      ios: {
        shadowColor: colors.gold[500],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  content: {
    padding: 16,
  },
  gradientContent: {
    padding: 16,
    position: 'relative',
  },
  gradientBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.gold[500],
    opacity: 0.5,
  },
});
