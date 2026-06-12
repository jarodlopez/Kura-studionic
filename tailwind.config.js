/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './js/**/*.js'],
  theme: {
    extend: {
      // kuraRed es ahora el "color de acento" de la marca: se define en
      // runtime via la variable CSS --accent-rgb (configurable desde el admin)
      colors: { kuraRed: 'rgb(var(--accent-rgb) / <alpha-value>)', kuraDark: '#050505', kuraGrey: '#111' },
      fontFamily: {
        bebas: ['"Bebas Neue"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      animation: {
        slideUp: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        marquee: 'marquee 15s linear infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        marquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
    },
  },
  plugins: [],
};
