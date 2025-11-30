/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#fff7ed',
                    100: '#ffedd5',
                    500: '#f97316', // Orange-500
                    600: '#ea580c', // Orange-600
                    700: '#c2410c',
                    DEFAULT: '#F97316', // Viva Orange
                },
                gold: {
                    500: '#d4af37', // Viva Gold
                    600: '#b4941f',
                },
                dark: {
                    950: '#050505', // Ultra Black
                    900: '#111111', // Deep Black
                    800: '#1a1a1a', // Lighter Black for cards
                    700: '#2a2a2a',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
