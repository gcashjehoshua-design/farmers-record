/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Light brown and light green palette */
        farm: {
          50: '#f0f7f0',
          100: '#dceddc',
          200: '#bbdab9',
          300: '#94c291',
          400: '#71a76e',
          500: '#5a8e57',
          600: '#467044',
          700: '#385936',
          800: '#2d472b',
          900: '#253a23',
        },
        earth: {
          50: '#faf7f2',
          100: '#f2ece1',
          200: '#e5d9c3',
          300: '#d4c1a1',
          400: '#c2a67e',
          500: '#b28e61',
          600: '#9b7650',
          700: '#7e5e41',
          800: '#664c36',
          900: '#543f2d',
        },
        harvest: {
          50: '#fdf8ed',
          100: '#f9ecd4',
          200: '#f2d9a8',
          300: '#e8c470',
          400: '#dfaf4a',
          500: '#D4A84B',
          600: '#C4942C',
          700: '#9a7019',
          800: '#7a5a14',
          900: '#5c4410',
        },
        sky: {
          50: '#eef5f8',
          100: '#d6e6ed',
          200: '#adccda',
          300: '#7dafc4',
          400: '#5B8A9E',
          500: '#4a7688',
          600: '#3d6272',
          700: '#334f5c',
          800: '#2c424c',
          900: '#233640',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        display: ['Source Serif 4', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 2s infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      backgroundImage: {
        'gradient-farmer': 'linear-gradient(135deg, #4A7C59 0%, #2D5A3D 50%, #1e3d29 100%)',
        'gradient-earth': 'linear-gradient(135deg, #a08060 0%, #8B7355 50%, #6F4E37 100%)',
        'gradient-harvest': 'linear-gradient(135deg, #D4A84B 0%, #C4942C 50%, #9a7019 100%)',
        'gradient-sky': 'linear-gradient(135deg, #5B8A9E 0%, #4a7688 50%, #3d6272 100%)',
        'pattern-farm': 'radial-gradient(circle at 2px 2px, rgba(74, 124, 89, 0.08) 1px, transparent 0)',
      },
      boxShadow: {
        'farm': '0 4px 6px -1px rgba(45, 90, 61, 0.12), 0 2px 4px -1px rgba(45, 90, 61, 0.08)',
        'farm-lg': '0 10px 15px -3px rgba(45, 90, 61, 0.12), 0 4px 6px -2px rgba(45, 90, 61, 0.06)',
        'earth': '0 4px 6px -1px rgba(139, 115, 85, 0.15), 0 2px 4px -1px rgba(139, 115, 85, 0.08)',
        'harvest': '0 4px 6px -1px rgba(196, 148, 44, 0.2), 0 2px 4px -1px rgba(196, 148, 44, 0.1)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
