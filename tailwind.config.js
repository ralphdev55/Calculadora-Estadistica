/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {},
    },
    plugins: [
        // 🚨 NUEVO PLUGIN AÑADIDO 🚨
        function ({ addUtilities }) {
            const newUtilities = {
                // Clase para evitar que el contenido se corte al final de una página impresa
                '.break-inside-avoid': {
                    'break-inside': 'avoid',
                    'page-break-inside': 'avoid', // Propiedad para compatibilidad con navegadores antiguos
                },
            }
            // Habilitar esta utilidad para respuestas y, CRUCIALMENTE, para impresión.
            addUtilities(newUtilities, ['responsive', 'print'])
        },
    ],
}