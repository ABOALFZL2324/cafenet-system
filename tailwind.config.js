/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fluent: {
          bg: '#f3f3f3',
          card: '#ffffff',
          darkBg: '#202020',
          darkCard: '#2c2c2c',
          accent: '#0078d4',
          accentHover: '#106ebe',
          border: '#e5e5e5',
          darkBorder: '#383838'
        }
      },
      fontFamily: {
        sans: ['Vazirmatn', 'Segoe UI', 'Tahoma', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
