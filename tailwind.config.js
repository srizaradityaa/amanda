/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Treasury & Market Terminal palette
        bg: {
          DEFAULT: '#0B1120',
        },
        surface: {
          DEFAULT: '#111827',
          hover: '#1A2234',
        },
        border: {
          DEFAULT: '#1F2937',
          strong: '#374151',
        },
        ink: {
          primary: '#E5E7EB',
          secondary: '#9CA3AF',
          muted: '#6B7280',
        },
        amber: {
          DEFAULT: '#F59E0B',
          hover: '#FBBF24',
          dark: '#0B1120',
        },
        teal: {
          DEFAULT: '#2DD4BF',
          hover: '#5EEAD4',
        },
        status: {
          green: '#34D399',
          yellow: '#FBBF24',
          red: '#F87171',
          orange: '#FB923C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      minWidth: {
        18: '4.5rem',
      },
      maxWidth: {
        '8xl': '88rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
        'pulse-ring': 'pulse-ring 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
