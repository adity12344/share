import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        bebas: ['"Bebas Neue"', 'cursive', 'sans-serif'],
        retro: ['"Bebas Neue"', 'cursive', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        sans: ['Poppins', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        retro: {
          cream: '#FAF6EE',
          paper: '#F3EBDD',
          parchment: '#E8DCB8',
          charcoal: '#1E1C1A',
          ink: '#12100E',
          mustard: '#F59E0B',
          amber: '#D97706',
          terracotta: '#D95D39',
          rust: '#C2410C',
          teal: '#0D9488',
          pine: '#15803D',
          moss: '#2D6A4F',
          denim: '#2563EB',
          navy: '#1E3A8A',
          lavender: '#8B5CF6',
          cassette: '#292524',
          tape: '#78716C',
        },
      },
      boxShadow: {
        retro: '3px 3px 0px 0px #1E1C1A',
        'retro-sm': '2px 2px 0px 0px #1E1C1A',
        'retro-lg': '5px 5px 0px 0px #1E1C1A',
        'retro-xl': '7px 7px 0px 0px #1E1C1A',
        'retro-amber': '3px 3px 0px 0px #D97706',
        'retro-teal': '3px 3px 0px 0px #0D9488',
        'retro-pine': '3px 3px 0px 0px #15803D',
        'retro-dark': '3px 3px 0px 0px #000000',
        'retro-dark-lg': '5px 5px 0px 0px #000000',
      },
      borderRadius: {
        polaroid: '10px',
        cassette: '8px',
      },
    },
  },
  plugins: [],
} satisfies Config;
