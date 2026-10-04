/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: 'var(--color-bg-base)',
          elevated: 'var(--color-bg-elevated)',
          light: 'var(--color-bg-base)',
          dark: 'var(--color-bg-base)',
        },
        label: {
          DEFAULT: 'var(--color-label-primary)',
          primary: 'var(--color-label-primary)',
          secondary: 'var(--color-label-secondary)',
          tertiary: 'var(--color-label-tertiary)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent)',
        },
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        border: 'var(--color-border)',
        separator: 'var(--color-border)',
        glass: 'var(--color-glass-fill)',
        // Semantic aliases ensuring legacy tokens map cleanly to Monochrome + One Accent:
        primary: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent)',
        },
        secondary: {
          DEFAULT: 'var(--color-success)',
          hover: 'var(--color-success)',
        },
        surface: {
          light: 'var(--color-bg-elevated)',
          dark: 'var(--color-bg-elevated)',
        },
        text: {
          main: 'var(--color-label-primary)',
          muted: 'var(--color-label-secondary)',
          darkMain: 'var(--color-label-primary)',
          darkMuted: 'var(--color-label-secondary)',
        },
        apple: {
          blue: 'var(--color-accent)',
          green: 'var(--color-success)',
          red: '#FF3B30',
          orange: 'var(--color-system-orange)',
        },
      },
      fontFamily: {
        sans: [
          '"Outfit"',
          '"Inter"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Plus Jakarta Sans"',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        apple: '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        'apple-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.4), 0 2px 6px -1px rgba(0, 0, 0, 0.2)',
      },
    },
  },
  plugins: [],
};

