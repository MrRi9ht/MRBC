/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./store/**/*.{js,ts,jsx,tsx}",
    "./engine/**/*.{js,ts,jsx,tsx}",
    "./define/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'bounce-small': 'bounce-small 1s infinite',
        'fade-in-up': 'fade-in-up 0.3s ease-out',
        'card-deal': 'card-deal 0.5s ease-out',
        'card-flip': 'card-flip 0.4s ease-in-out',
        'chip-fly': 'chip-fly 0.6s ease-in-out',
        'pot-pulse': 'pot-pulse 1s infinite',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        'bounce-small': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'card-deal': {
          '0%': { opacity: '0', transform: 'translateY(-100px) rotate(-10deg)' },
          '100%': { opacity: '1', transform: 'translateY(0) rotate(0deg)' },
        },
        'card-flip': {
          '0%': { transform: 'rotateY(0deg)' },
          '50%': { transform: 'rotateY(90deg)' },
          '100%': { transform: 'rotateY(0deg)' },
        },
        'chip-fly': {
          '0%': { opacity: '1', transform: 'translate(0, 0) scale(1)' },
          '100%': { opacity: '0', transform: 'translate(var(--fly-x), var(--fly-y)) scale(0.5)' },
        },
        'pot-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
      },
      colors: {
        'table-green': '#35654d',
        'table-dark': '#1a3d2d',
        'felt': '#2d5a42',
      },
    },
  },
  plugins: [],
}
