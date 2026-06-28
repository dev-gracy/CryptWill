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
        background: {
          DEFAULT: 'var(--color-bg)',
          secondary: 'var(--color-bg-secondary)',
          elevated: 'var(--color-bg-elevated)',
        },
        border: 'var(--color-border)',
        brand: {
          DEFAULT: 'var(--color-brand)',
          hover: 'var(--color-brand-hover)',
          glow: 'var(--color-brand-glow)',
        },
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
