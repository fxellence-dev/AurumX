/**
 * Gold Hub Theme - Typography
 * Mobile-optimized font scales and text styles
 */

export const typography = {
  // Font families (will be loaded via expo-font)
  fonts: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
  
  // Font sizes (Mobile-optimized)
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
    '6xl': 48,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
  
  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
  
  // Predefined text styles
  styles: {
    h1: {
      fontSize: 32,
      fontFamily: 'Inter-Bold',
      lineHeight: 38.4, // 32 * 1.2
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 28,
      fontFamily: 'Inter-Bold',
      lineHeight: 33.6, // 28 * 1.2
      letterSpacing: -0.3,
    },
    h3: {
      fontSize: 24,
      fontFamily: 'Inter-SemiBold',
      lineHeight: 31.2, // 24 * 1.3
      letterSpacing: 0,
    },
    h4: {
      fontSize: 20,
      fontFamily: 'Inter-SemiBold',
      lineHeight: 28, // 20 * 1.4
      letterSpacing: 0,
    },
    body: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      lineHeight: 24, // 16 * 1.5
      letterSpacing: 0,
    },
    bodyLarge: {
      fontSize: 18,
      fontFamily: 'Inter-Regular',
      lineHeight: 27, // 18 * 1.5
      letterSpacing: 0,
    },
    caption: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      lineHeight: 19.6, // 14 * 1.4
      letterSpacing: 0,
    },
    captionSmall: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      lineHeight: 15.6, // 12 * 1.3
      letterSpacing: 0,
    },
    button: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      lineHeight: 19.2, // 16 * 1.2
      letterSpacing: 0.5,
    },
  },
} as const;

export type Typography = typeof typography;
