import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        blush: '#F6D7DE',
        rose: '#D9A6B0',
        ivory: '#FFF8F1',
        beige: '#E8D8C9',
        cocoa: '#7B5E57',
        wine: '#6B4350',
      },
      fontFamily: {
        serif: ['Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 20px 60px rgba(166, 96, 113, 0.18)',
        soft: '0 12px 40px rgba(120, 90, 80, 0.10)',
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'romance-gradient': 'radial-gradient(circle at top, rgba(255,255,255,0.94), rgba(246,215,222,0.72) 38%, rgba(232,216,201,0.86) 68%, rgba(255,248,241,0.96) 100%)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.45' },
          '50%': { opacity: '0.75' },
        },
      },
      animation: {
        float: 'float 7s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;