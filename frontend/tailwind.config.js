/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: {
          DEFAULT: '#FBF9F5',
          light: '#FFFFFF',
          dark: '#EDE7DC',
          50: '#FFFFFF',
          100: '#FBF9F5',
          200: '#F5EFE4',
          300: '#EDE7DC',
        },
        forest: {
          DEFAULT: '#1E2C24',
          light: '#2A3C31',
          dark: '#141E18',
          800: '#1E2C24',
          900: '#141E18',
        },
        terracotta: {
          DEFAULT: '#C87D55',
          light: '#D9936D',
          dark: '#B06841',
          500: '#C87D55',
        },
        gold: {
          DEFAULT: '#D4AF37',
          light: '#E5C45B',
          dark: '#B89525',
          400: '#D4AF37',
        },
        olive: {
          DEFAULT: '#65745B',
          light: '#78896C',
          dark: '#525F4A',
          500: '#65745B',
        },
        beige: {
          DEFAULT: '#EDE7DC',
          light: '#F5EFE4',
          dark: '#DDD5C4',
        },
        warmWhite: '#FFFFFF',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'Manrope', 'system-ui', '-apple-system', 'sans-serif'],
      },
      letterSpacing: {
        widest: '.2em',
        ultra: '.25em',
      },
      borderRadius: {
        'brand': '8px',
        'brand-lg': '16px',
        'brand-xl': '24px',
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '250ms',
        'slow': '400ms',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(30, 44, 36, 0.06)',
        'elevated': '0 12px 32px -4px rgba(30, 44, 36, 0.1)',
        'gold-subtle': '0 0 20px rgba(212, 175, 55, 0.2)',
      },
    },
  },
  plugins: [],
}
