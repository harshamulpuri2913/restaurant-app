/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'traditional-brown': '#8B4513',
        'deep-brown': '#5C2E0A',
        'golden': '#D4AF37',
        'light-gold': '#F4E4BC',
        'cream': '#F5E6D3',
      },
      fontFamily: {
        'traditional': ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}

