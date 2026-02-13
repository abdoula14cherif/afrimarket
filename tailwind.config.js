/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          blue: '#1d3557',
          red: '#ef4444',
          orange: '#f97316',
          green: '#10b981',
        }
      },
      animation: {
        'fadeIn': 'fadeIn 0.5s ease',
        'slideIn': 'slideIn 0.3s ease',
        'pulse': 'pulse 2s infinite',
        'pulse-green': 'pulseGreen 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%': { boxShadow: '0 0 0 0 rgba(245, 158, 11, 0.4)' },
          '70%': { boxShadow: '0 0 0 10px rgba(245, 158, 11, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(245, 158, 11, 0)' },
        },
        pulseGreen: {
          '0%': { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.4)' },
          '70%': { boxShadow: '0 0 0 10px rgba(16, 185, 129, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0)' },
        },
      },
    },
  },
  plugins: [],
}