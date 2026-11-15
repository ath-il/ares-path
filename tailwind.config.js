/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ap: {
          bg: '#070b12',
          'bg-2': '#0b1422',
          panel: '#101b2a',
          'panel-2': '#0d1626',
          border: 'rgba(115, 199, 232, 0.14)',
          'border-strong': 'rgba(115, 199, 232, 0.3)',
          orange: '#e87542',
          gold: '#f4b860',
          ice: '#73c7e8',
          green: '#80b89a',
          red: '#e05a4f',
          text: '#c9d6e4',
          'text-dim': '#8fa3b8',
          'text-faint': '#5d7288',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
        dash: {
          to: { strokeDashoffset: '-24' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in': 'ap-fade-in 0.6s ease both',
        'slide-up': 'ap-slide-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pulse-dot': 'ap-pulse-dot 2.2s ease-in-out infinite',
        dash: 'ap-dash 1.4s linear infinite',
        'spin-slow': 'ap-spin-slow 14s linear infinite',
      },
    },
  },
  plugins: [],
};
