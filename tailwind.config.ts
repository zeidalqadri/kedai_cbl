import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // CBL brand colors
        'cbl-orange': '#FF6B35',
        'cbl-orange-dark': '#E55A28',
        'cbl-orange-light': '#FF8F66',
        // Dark navy palette
        'cbl-navy': '#0A1628',
        'cbl-navy-light': '#162544',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
