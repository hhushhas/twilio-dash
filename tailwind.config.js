/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        hub: {
          950: '#121113', // bg-primary
          900: '#1a191d', // bg-secondary
          800: '#222222', // bg-tertiary / border-subtle
          700: '#333333', // border
          text: '#c1c1c1', // text-primary
          muted: '#8a8a9a', // text-secondary
          dim: '#555560',   // text-muted
          accent: '#e78a53', // Warm Orange
          'accent-glow': 'rgba(231, 138, 83, 0.15)',
        },
        success: '#5f8787', // Muted Teal
        danger: '#cf5555',
      },
      fontFamily: {
        sans: ['"JetBrains Mono"', 'monospace'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 20px -5px rgba(231, 138, 83, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}