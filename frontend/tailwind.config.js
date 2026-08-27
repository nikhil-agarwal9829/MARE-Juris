/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060A12',
          900: '#0A0F1D',
          850: '#0F172A',
          800: '#1E293B',
          700: '#334155',
        },
        gold: {
          500: '#C5A059',
          400: '#D4AF37',
          300: '#E5C158',
          600: '#A6823B',
        },
        ivory: {
          50: '#FAF9F5',
          100: '#F4F1EA',
          200: '#EAE5D9',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'serif'],
      },
      animation: {
        'scale-pulse': 'scalePulse 6s ease-in-out infinite',
        'node-float': 'nodeFloat 4s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        scalePulse: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '50%': { transform: 'rotate(2.5deg)' },
        },
        nodeFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
