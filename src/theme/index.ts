/**
 * Gold Hub Theme - Main Export
 * Combines all theme tokens into a single theme object
 */

import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { shadows, borderRadius } from './shadows';

export const theme = {
  colors,
  typography,
  spacing,
  shadows,
  borderRadius,
} as const;

export type Theme = typeof theme;

// Re-export individual modules for convenience
export { colors, typography, spacing, shadows, borderRadius };
