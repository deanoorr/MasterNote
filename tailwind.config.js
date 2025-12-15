/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090b', // Zinc 950
        surface: '#18181b',    // Zinc 900
        primary: {
          400: '#a1a1aa', // Zinc 400
          500: '#71717a', // Zinc 500
          600: '#52525b', // Zinc 600
          // For active states, we might use white/black contrast
        },
        accent: {
          400: '#ffffff', // White
          500: '#f4f4f5', // Zinc 100
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        // Minimal gentle gradients if needed, otherwise solid
        'subtle-gradient': 'linear-gradient(to bottom, #09090b, #18181b)',
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'elevation': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
