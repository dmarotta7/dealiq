/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy:  { DEFAULT: '#0A1628', 50: '#E8ECF4', 100: '#C5CFDF', 200: '#8FA3C0', 300: '#5977A0', 400: '#2E4F80', 500: '#0A1628', 600: '#081220', 700: '#060D18', 800: '#040910', 900: '#020508' },
        red:   { DEFAULT: '#B22234', 50: '#FCE8EB', 100: '#F5C2C8', 200: '#EB8592', 300: '#DF4B5E', 400: '#C7273C', 500: '#B22234', 600: '#8F1B2A', 700: '#6B141F', 800: '#470D15', 900: '#24070A' },
        blue:  { DEFAULT: '#3C3B6E', 50: '#EEEEF6', 100: '#D4D3E9', 200: '#A9A8D3', 300: '#7E7EBE', 400: '#5958A8', 500: '#3C3B6E', 600: '#302F58', 700: '#242342', 800: '#18182C', 900: '#0C0C16' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    }
  },
  plugins: [],
}
