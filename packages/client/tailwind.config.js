/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        farm: {
          bg:     '#1a1a2e',
          panel:  '#16213e',
          card:   '#0f3460',
          accent: '#e94560',
          gold:   '#ffd700',
          green:  '#4ade80',
          soil:   '#7c3f00',
        },
      },
    },
  },
  plugins: [],
};
