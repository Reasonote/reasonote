/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{ts,tsx}", "./static/**/*.html"],
    theme: {
        extend: {
            colors: {
                primary: '#4F46E5',
                secondary: '#6B7280',
            },
            fontFamily: {
                atkinson: ['Atkinson Hyperlegible', 'sans-serif'],
            },
        }
    },
    plugins: [],
} 