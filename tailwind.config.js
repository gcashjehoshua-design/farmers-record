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
        /* Farmer-friendly: field greens, earth browns, harvest gold */
        farm: {
          50: '#eef5ee',
          100: '#d4e6d4',
          200: '#a8cda8',
          300: '#7ab47a',
          400: '#5a9a5a',
          500: '#4A7C59',
          600: '#2D5A3D',
          700: '#1e3d29',
          800: '#152e1f',
          900: '#0f2016',
        },
        earth: {
          50: '#f8f3ed',
          100: '#efe4d6',
          200: '#dfc9ad',
          300: '#c9a87d',
          400: '#b08d5e',
          500: '#a08060',
          600: '#8B7355',
          700: '#6F4E37',
          800: '#5a3f2d',
          900: '#4a3424',
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
