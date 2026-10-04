/**
 * Apple HIG Design System Tokens & Configuration
 */

export const THEME_TOKENS = {
  colors: {
    system: {
      blue: '#007AFF',
      purple: '#5856D6',
      pink: '#FF2D55',
      red: '#FF3B30',
      orange: '#FF9500',
      yellow: '#FFCC00',
      green: '#34C759',
      teal: '#5AC8FA',
      indigo: '#5856D6',
    },
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    light: {
      background: '#F5F5F7',
      surface: 'rgba(255, 255, 255, 0.75)',
      surfaceElevated: '#FFFFFF',
      border: 'rgba(0, 0, 0, 0.08)',
      textPrimary: '#1D1D1F',
      textSecondary: '#86868B',
      textTertiary: '#AEAEB2',
    },
    dark: {
      background: '#000000',
      surface: 'rgba(28, 28, 30, 0.75)',
      surfaceElevated: '#1C1C1E',
      border: 'rgba(255, 255, 255, 0.12)',
      textPrimary: '#F5F5F7',
      textSecondary: '#8E8E93',
      textTertiary: '#636366',
    },
  },
  blur: {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
    '2xl': 'backdrop-blur-2xl',
    '3xl': 'backdrop-blur-3xl',
  },
  radii: {
    card: 'rounded-3xl',
    button: 'rounded-2xl',
    pill: 'rounded-full',
    badge: 'rounded-xl',
  },
  transitions: {
    spring: 'transition-all duration-300 ease-out',
    springFast: 'transition-all duration-200 cubic-bezier(0.16, 1, 0.3, 1)',
    springSmooth: 'transition-all duration-400 cubic-bezier(0.25, 1, 0.5, 1)',
  },
  shadows: {
    apple: '0 4px 24px -2px rgba(0, 0, 0, 0.06), 0 2px 8px -1px rgba(0, 0, 0, 0.03)',
    appleDark: '0 4px 24px -2px rgba(0, 0, 0, 0.5), 0 2px 8px -1px rgba(0, 0, 0, 0.3)',
    elevated: '0 12px 36px -4px rgba(0, 0, 0, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.06)',
  },
};

export default THEME_TOKENS;
