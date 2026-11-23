/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EAF1FF',
          100: '#D6E4FF',
          200: '#B0CAFF',
          300: '#7DA8FF',
          400: '#4580F5',
          500: '#1D64E8',
          600: '#0756D7',
          700: '#0B55B9',
          800: '#0E3F8A',
          900: '#10213D',
        },
        accent: {
          50: '#F0F5FF',
          100: '#E0EAFF',
          200: '#C7D7FE',
          300: '#A4BCFD',
          400: '#8098F9',
          500: '#3B6BE8',
          600: '#0B55B9',
          700: '#0A469B',
          800: '#0F3470',
          900: '#10213D',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Manrope"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(16,24,40,0.06), 0 4px 16px rgba(16,24,40,0.05)',
        'card-hover': '0 6px 18px rgba(11,85,185,0.10), 0 12px 32px rgba(16,33,61,0.08)',
      },
    },
  },
  plugins: [],
}
