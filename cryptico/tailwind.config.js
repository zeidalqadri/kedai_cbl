/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Crypto brand colors
        usdt: '#26A17B',
        usdc: '#2775CA',
        bnb: '#F3BA2F',
        matic: '#8247E5',
      },
    },
  },
  plugins: [],
}
