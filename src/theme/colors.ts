/**
 * Gold Hub Theme - Colors
 * Dark mode first color palette
 */

export const colors = {
  // Base
  black: '#000000',
  white: '#FFFFFF',
  
  // Background layers
  background: {
    primary: '#0A0A0B',      // Deep charcoal
    secondary: '#141416',     // Elevated surfaces
    tertiary: '#1C1C1F',      // Cards
    quaternary: '#252528',    // Input fields
  },
  
  // Gold (Brand color)
  gold: {
    50: '#FFF9E6',
    100: '#FFEFC2',
    200: '#FFE28A',
    300: '#FFD452',
    400: '#F4C430',
    500: '#D9A441',           // Primary gold
    600: '#C08A2E',
    700: '#9D7025',
    800: '#7A561D',
    900: '#5C4016',
  },
  
  // Accent colors
  accent: {
    purple: '#8B5CF6',        // Secondary actions
    blue: '#3B82F6',          // Info states
    green: '#10B981',         // Success
    red: '#EF4444',           // Error/Danger
    orange: '#F59E0B',        // Warning
  },
  
  // Text
  text: {
    primary: '#F5F5F7',       // Main text
    secondary: '#A1A1AA',     // Subtle text
    tertiary: '#71717A',      // Muted text
    disabled: '#52525B',      // Disabled state
    inverse: '#0A0A0B',       // Text on light backgrounds
  },
  
  // Borders
  border: {
    default: '#27272A',
    hover: '#3F3F46',
    focus: '#D9A441',
  },
  
  // States
  states: {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  },
  
  // Overlays
  overlay: {
    light: 'rgba(255, 255, 255, 0.05)',
    medium: 'rgba(255, 255, 255, 0.1)',
    heavy: 'rgba(0, 0, 0, 0.7)',
  },
} as const;

export type Colors = typeof colors;
