module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Background layers
        bg: {
          primary: '#0A0A0B',
          secondary: '#141416',
          tertiary: '#1C1C1F',
          quaternary: '#252528',
        },
        // Gold brand color
        gold: {
          50: '#FFF9E6',
          100: '#FFEFC2',
          200: '#FFE28A',
          300: '#FFD452',
          400: '#F4C430',
          500: '#D9A441',
          600: '#C08A2E',
          700: '#9D7025',
          800: '#7A561D',
          900: '#5C4016',
        },
        // Accent colors
        accent: {
          purple: '#8B5CF6',
          blue: '#3B82F6',
          green: '#10B981',
          red: '#EF4444',
          orange: '#F59E0B',
        },
        // Text colors
        text: {
          primary: '#F5F5F7',
          secondary: '#A1A1AA',
          tertiary: '#71717A',
          disabled: '#52525B',
          inverse: '#0A0A0B',
        },
        // Border colors
        border: {
          DEFAULT: '#27272A',
          hover: '#3F3F46',
          focus: '#D9A441',
        },
      },
      fontFamily: {
        regular: ['Inter-Regular'],
        medium: ['Inter-Medium'],
        semibold: ['Inter-SemiBold'],
        bold: ['Inter-Bold'],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        base: '16px',
        lg: '20px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '40px',
        '4xl': '48px',
        '5xl': '64px',
        '6xl': '80px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};
