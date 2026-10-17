/** @type {import('tailwindcss').Config} */
const config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./context/**/*.{js,ts,jsx,tsx}",
        "./features/**/*.{js,ts,jsx,tsx}",
        "./hooks/**/*.{js,ts,jsx,tsx}",
        "./lib/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}",
    ],
    // Note: In Tailwind v4, most configuration is done in CSS with @theme
    // This file is kept for content scanning and legacy compatibility
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                // Alice design system (DESIGN.md): Onest + Pixelify Sans for KPI numerals.
                // Colour values below mirror design-system/tokens/colors.css.
                sans: ['var(--font-onest)', 'Onest', 'sans-serif'],
                pixel: ['GNF', 'var(--font-pixelify)', 'Pixelify Sans', 'monospace'],
                display: ['var(--font-onest)', 'Onest', 'sans-serif'],
                serif: ['Cinzel', 'serif'],
            },
            colors: {
                primary: {
                    50: '#EAF8FB',
                    100: '#D4F1F6',
                    200: '#B3E7F0',
                    300: '#7FD3E5',
                    400: '#43B7D4',
                    500: '#1B9FC0',
                    600: '#1B8FAE',
                    700: '#127A95',
                    800: '#0E6278',
                    900: '#0B4A5B',
                },
                dark: {
                    bg: '#06171C',
                    card: '#0D252C',
                    border: '#173B45',
                    hover: '#14343D',
                },
                // Semantic tokens — bridge CSS vars (globals.css) to Tailwind utilities
                // Usage: bg-surface, text-muted, bg-success, text-error-text, etc.
                surface: 'var(--color-surface)',
                'surface-bg': 'var(--color-bg)',
                muted: 'var(--color-muted)',
                success: 'var(--color-success)',
                'success-bg': 'var(--color-success-bg)',
                'success-text': 'var(--color-success-text)',
                warning: 'var(--color-warning)',
                'warning-bg': 'var(--color-warning-bg)',
                'warning-text': 'var(--color-warning-text)',
                error: 'var(--color-error)',
                'error-bg': 'var(--color-error-bg)',
                'error-text': 'var(--color-error-text)',
                info: 'var(--color-info)',
                'info-bg': 'var(--color-info-bg)',
                'info-text': 'var(--color-info-text)',
                'text-primary': 'var(--color-text-primary)',
                'text-secondary': 'var(--color-text-secondary)',
                'text-muted': 'var(--color-text-muted)',
                'text-subtle': 'var(--color-text-subtle)',
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
            }
        },
    },
    plugins: [],
}

module.exports = config
