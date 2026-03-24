import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // ── SkyforgeAI Brand Colors ──────────────────────────────
      colors: {
        // Deep space backgrounds
        bg: {
          DEFAULT: '#05070d',
          2: '#080c14',
          3: '#0b1020',
        },
        surface: {
          DEFAULT: '#0e1525',
          2: '#121b2e',
          3: '#162035',
        },
        // Electric Blue (left wing)
        sky: {
          DEFAULT: '#1e7fd4',
          2: '#0d5aa8',
          3: '#0a3d7a',
          glow: 'rgba(30,127,212,0.28)',
          dim: 'rgba(30,127,212,0.10)',
        },
        // Ember Orange (right wing)
        ember: {
          DEFAULT: '#e8621a',
          2: '#c44810',
          glow: 'rgba(232,98,26,0.22)',
          dim: 'rgba(232,98,26,0.10)',
        },
        // Silver (eagle body)
        silver: {
          DEFAULT: '#d4dde8',
          2: '#a8b8cc',
        },
        // Text hierarchy
        txt: {
          DEFAULT: '#e8edf5',
          2: '#8fa3be',
          3: '#4a6080',
          4: '#2d4060',
        },
        // Borders
        border: {
          sky: 'rgba(30,127,212,0.14)',
          sky2: 'rgba(30,127,212,0.28)',
          ember: 'rgba(232,98,26,0.22)',
          light: 'rgba(212,221,232,0.08)',
        },
        // Semantic
        ok: {
          DEFAULT: '#22d98a',
          bg: 'rgba(34,217,138,0.08)',
          border: 'rgba(34,217,138,0.20)',
        },
        warn: {
          DEFAULT: '#f0a830',
          bg: 'rgba(240,168,48,0.08)',
        },
        danger: {
          DEFAULT: '#e84040',
          bg: 'rgba(232,64,64,0.08)',
          border: 'rgba(232,64,64,0.22)',
        },
      },

      // ── SkyforgeAI Typography ────────────────────────────────
      fontFamily: {
        display: ['Rajdhani', 'sans-serif'],     // Headers, brand, stats
        body: ['Inter', 'sans-serif'],            // Body copy, forms
        mono: ['JetBrains Mono', 'monospace'],   // Code, data, labels
      },

      // ── Spacing & Layout ─────────────────────────────────────
      borderRadius: {
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },

      // ── Animations ───────────────────────────────────────────
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.85)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'glow': {
          '0%, 100%': { boxShadow: '0 0 12px rgba(30,127,212,0.28)' },
          '50%': { boxShadow: '0 0 24px rgba(30,127,212,0.45)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.3s ease forwards',
        'shimmer': 'shimmer 4s linear infinite',
        'pulse-dot': 'pulse-dot 2s ease infinite',
        'float': 'float 4s ease infinite',
        'glow': 'glow 2s ease infinite',
      },

      // ── Box Shadows ──────────────────────────────────────────
      boxShadow: {
        'sky': '0 0 20px rgba(30,127,212,0.28)',
        'sky-lg': '0 0 32px rgba(30,127,212,0.45)',
        'ember': '0 0 18px rgba(232,98,26,0.22)',
        'ember-lg': '0 0 28px rgba(232,98,26,0.38)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
      },

      // ── Background patterns ──────────────────────────────────
      backgroundImage: {
        'grid-sky': `linear-gradient(rgba(30,127,212,0.04) 1px, transparent 1px),
                     linear-gradient(90deg, rgba(30,127,212,0.04) 1px, transparent 1px)`,
        'sky-gradient': 'linear-gradient(135deg, #1e7fd4, #0d5aa8)',
        'ember-gradient': 'linear-gradient(135deg, #e8621a, #c44810)',
        'brand-gradient': 'linear-gradient(135deg, #d4dde8, #1e7fd4)',
        'shimmer': 'linear-gradient(90deg, transparent, rgba(30,127,212,0.15), transparent)',
        'card-top': 'linear-gradient(90deg, transparent, #1e7fd4, transparent)',
        'dual-bar': 'linear-gradient(90deg, #1e7fd4, #e8621a)',
        'ambient': `radial-gradient(ellipse 700px 500px at 0% 100%, rgba(232,98,26,0.06) 0%, transparent 70%),
                    radial-gradient(ellipse 700px 500px at 100% 0%, rgba(30,127,212,0.08) 0%, transparent 70%)`,
      },
      backgroundSize: {
        'grid': '48px 48px',
        'shimmer': '200% 100%',
      },
    },
  },
  plugins: [animate],
}

export default config
