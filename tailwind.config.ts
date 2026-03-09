/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./App.tsx",
        "./index.tsx",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./context/**/*.{js,ts,jsx,tsx}",
        "./hooks/**/*.{js,ts,jsx,tsx}",
        "./services/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                slate: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617',
                },
            },
            screens: {
                'xs': '475px',
                // Tailwind defaults remain: sm:640, md:768, lg:1024, xl:1280, 2xl:1536
                'touch': { 'raw': '(hover: none) and (pointer: coarse)' },
                'hover-device': { 'raw': '(hover: hover)' },
                'landscape': { 'raw': '(orientation: landscape) and (max-height: 500px)' },
            },
            spacing: {
                'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
                'safe-top': 'env(safe-area-inset-top, 0px)',
                'nav-height': 'var(--bottom-nav-height, 72px)',
                'header-height': 'var(--header-height, 64px)',
                'sidebar-width': 'var(--sidebar-width, 256px)',
            },
            minHeight: {
                'dvh': '100dvh',
            },
            height: {
                'dvh': '100dvh',
            },
        },
    },
    plugins: [],
}
