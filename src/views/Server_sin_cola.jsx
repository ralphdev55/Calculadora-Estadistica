import React from 'react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

// Función para imprimir (fuera del componente para evitar que se recree en cada render)
const handlePrint = () => {
    window.print();
};

function Server_sin_cola() {
   
    // --- ESTADOS ---
    // Almacena los valores de entrada del usuario (lambda y mu)
    const [inputs, setInputs] = useState({ lambda: '', mu: '' });
    // Almacena los resultados calculados para mostrarlos en la UI
    const [results, setResults] = useState(null);
    // Almacena cualquier mensaje de error de validación
    const [error, setError] = useState('');

    // --- MANEJADORES DE EVENTOS ---

    // Actualiza el estado 'inputs' cada vez que el usuario escribe en un campo
    const handleInputChange = (e) => {
        setInputs({
            ...inputs,
            [e.target.name]: e.target.value
        });
    };

    // Se ejecuta al enviar el formulario para realizar los cálculos
    const handleCalculate = (e) => {
        e.preventDefault(); // Evita que la página se recargue al enviar el formulario

        // Convierte las entradas de texto a números
        const lambda = parseFloat(inputs.lambda);
        const mu = parseFloat(inputs.mu);
        
        // --- VALIDACIONES ---
        if (isNaN(lambda) || isNaN(mu) || lambda <= 0 || mu <= 0) {
            setError('Por favor, ingresa valores numéricos válidos y positivos para λ y μ.');
            setResults(null); // Limpia resultados previos si hay error
            return;
        }

        // Condición de estabilidad para el modelo M/M/1
        if (lambda >= mu) {
            setError('La tasa de llegada (λ) debe ser menor que la tasa de servicio (μ) para que el sistema sea estable.');
            setResults(null);
            return;
        }

        // Si todas las validaciones pasan, limpia los errores
        setError('');

        // --- CÁLCULO DE MÉTRICAS (Fórmulas del modelo M/M/1) ---
        const rho = lambda / mu; // Factor de utilización del sistema (ρ)
        const Ls = lambda / (mu - lambda); // Número promedio de clientes en el sistema
        const Lq = rho * Ls; // Número promedio de clientes en la cola (Lq = rho * Ls)
        const Ws = Ls / lambda; // Tiempo promedio de un cliente en el sistema (Ws = Ls / lambda)
        const Wq = Lq / lambda; // Tiempo promedio de un cliente en la cola (Wq = Lq / lambda)
        const P0 = 1 - rho; // Probabilidad de que no haya clientes en el sistema

        // --- Generación de la Tabla de Probabilidad (Lógica Dinámica) ---
        const probabilityTable = [];
        let n = 0;
        // Límite de probabilidad individual ajustado a 1e-5 (para 5 decimales)
        const MIN_PROBABILITY = 0.00001;
        // Límite para la probabilidad acumulada (muy cercano a 1)
        const MAX_CUMULATIVE_PROB = 0.999995; // Ajustado ligeramente para 5 decimales
        // Límite de seguridad para evitar bucles infinitos en casos extremos
        const SAFETY_MAX_ITERATIONS = 1000;

        let cumulativeFn = 0; // Calcular Fn acumulativamente para mayor precisión

        while (n <= SAFETY_MAX_ITERATIONS) {
            // Calcular Pn usando la forma recursiva Pn = P(n-1)*rho (más estable numéricamente)
            // P0 se calcula directamente
            const Pn = (n === 0) ? P0 : probabilityTable[n-1].Pn * rho; 
            
            cumulativeFn += Pn;
            const Fn = Math.min(cumulativeFn, 1.0); // Asegurar que Fn no exceda 1.0

            probabilityTable.push({ n, Pn, Fn });

            // Condiciones de parada basadas en tu solicitud:
            // 1. Pn es muy pequeña (después de n=0)
            // 2. Fn es casi 1
            // Usamos >= para MAX_CUMULATIVE_PROB
            if (n > 0 && (Pn < MIN_PROBABILITY || Fn >= MAX_CUMULATIVE_PROB)) { 
                break; // Detener el bucle
            }
            n++;
        }
        
        // Almacena todos los resultados NUMÉRICOS en el estado
        setResults({
            lambda: lambda,
            mu: mu,
            rho, Ls, Lq, Ws, Wq, P0, probabilityTable
        });
    };
    
    // --- SUBCOMPONENTES DE RENDERIZADO ---

    // Componente reutilizable para mostrar cada métrica en una tarjeta
    const MetricCard = ({ label, value }) => (
        <div className="bg-gray-800/70 p-3 rounded-lg text-center print:bg-gray-200 print:text-black print:border print:border-gray-400">
            <p className="text-xs text-gray-400 print:text-gray-600 font-medium">{label}</p>
            {/* Formatear a 4 decimales al mostrar */}
            <p className="text-xl font-bold text-emerald-400 print:text-emerald-700 mt-1">{typeof value === 'number' ? value.toFixed(4) : 'N/A'}</p>
        </div>
    );

    // --- RENDERIZADO PRINCIPAL DEL COMPONENTE ---
    return (
        <div className="max-w-6xl mx-auto text-white print:text-black print:bg-white p-4 sm:p-6 lg:p-8 font-sans">
             {/* Estilos específicos para impresión */}
             <style>
                {`
                    @media print {
                        body {
                            -webkit-print-color-adjust: exact; /* Chrome, Safari */
                            color-adjust: exact; /* Firefox */
                        }
                        .print\\:hidden { display: none; }
                        .print\\:block { display: block; }
                        .print\\:text-black { color: black; }
                        .print\\:bg-white { background-color: white; }
                        .print\\:border { border-width: 1px; }
                        .print\\:border-gray-400 { border-color: #cbd5e0; }
                        .print\\:p-0 { padding: 0; }
                        .print\\:shadow-none { box-shadow: none; }
                        .print\\:text-xl { font-size: 1.25rem; }
                        .print\\:text-gray-600 { color: #718096; }
                        .print\\:text-emerald-700 { color: #047857; }
                        .print\\:mt-8 { margin-top: 2rem; }
                        .print\\:border-collapse { border-collapse: collapse; }
                        .print\\:bg-gray-300 { background-color: #e2e8f0; }
                        .print\\:hover\\:bg-gray-100:hover { background-color: #f7fafc; }
                         .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
                         table, tr, td, th, thead, tbody { break-inside: avoid !important; page-break-inside: avoid !important; }

                    }
                     @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                    .animate-scale-in { animation: scale-in 0.3s ease-out forwards; }
                     @keyframes float-up { 0% { transform: translateY(10px); opacity: 0; } 100% { transform: translateY(-50%); opacity: 1; } }
                    .animate-float-up { animation: float-up 0.4s ease-out forwards; }
                `}
            </style>
            
            <div className="flex flex-col md:flex-row gap-8">

                {/* --- COLUMNA IZQUIERDA: FORMULARIO DE ENTRADA (se oculta al imprimir) --- */}
                <div className="md:w-1/3 print:hidden">
                    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 h-full">
                        <h1 className="text-2xl font-extrabold mb-2 text-center text-white">
                            Modelo M/M/1
                        </h1>
                        <p className="text-gray-400 text-center mb-6 text-sm">Un Servidor, Cola Infinita</p>
                        
                        <form onSubmit={handleCalculate} className="space-y-4">
                            <div>
                                <label htmlFor="lambda" className="block text-sm font-medium text-gray-300 mb-1">Tasa de llegada (λ)</label>
                                <input type="number" step="any" name="lambda" id="lambda" value={inputs.lambda} onChange={handleInputChange} placeholder="Ej: 8" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"/>
                            </div>
                            <div>
                                <label htmlFor="mu" className="block text-sm font-medium text-gray-300 mb-1">Tasa de servicio (μ)</label>
                                <input type="number" step="any" name="mu" id="mu" value={inputs.mu} onChange={handleInputChange} placeholder="Ej: 10" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"/>
                            </div>
                            
                            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 mt-2">
                                Calcular
                            </button>
                            {error && <p className="text-red-400 text-center mt-4 text-sm">{error}</p>}
                        </form>
                    </div>
                </div>

                {/* --- COLUMNA DERECHA: RESULTADOS (Métricas y Tabla) --- */}
                <div className="md:w-2/3 print:w-full">
                    {/* Encabezado que solo aparece al imprimir */}
                    {results && (
                        <div className="hidden print:block mb-6">
                            <h1 className="text-3xl font-bold mb-2 text-center text-black">Reporte de Resultados - M/M/1</h1>
                            <p className="text-center text-gray-600 mb-4">
                                {/* Mostrar valores originales (no redondeados) en impresión */}
                                Parámetros: λ = {results.lambda} | μ = {results.mu}
                            </p>
                        </div>
                    )}

                    {/* Muestra los resultados o un mensaje inicial */}
                    {results ? (
                        <div className="space-y-8">
                            
                            {/* Sección de Métricas de Rendimiento */}
                            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 print:bg-white print:p-0 print:shadow-none print:border-none break-inside-avoid">
                                <h2 className="text-xl font-bold mb-4 text-center text-emerald-400 print:text-xl print:text-black">Métricas de Rendimiento</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <MetricCard label="Utilización (ρ)" value={results.rho} />
                                    <MetricCard label="Clientes en Cola (Lq)" value={results.Lq} />
                                    <MetricCard label="Clientes en Sistema (Ls)" value={results.Ls} />
                                    <MetricCard label="Tiempo en Cola (Wq)" value={results.Wq} />
                                    <MetricCard label="Tiempo en Sistema (Ws)" value={results.Ws} />
                                    <MetricCard label="Prob. Sistema Vacío (P0)" value={results.P0} />
                                </div>
                            </div>

                            {/* Sección de la Tabla de Probabilidad */}
                            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 print:bg-white print:p-0 print:shadow-none print:border-none break-inside-avoid">
                                <h2 className="text-xl font-bold mb-4 text-center text-emerald-400 print:text-xl print:text-black print:mt-8">Tabla de Distribución de Probabilidad</h2>
                                <div className="overflow-x-auto max-h-96"> {/* Scroll vertical */}
                                    <table className="w-full text-left print:border-collapse text-sm">
                                        <thead className="bg-gray-700/50 print:bg-gray-300 print:text-black sticky top-0 z-10"> {/* Header pegajoso */}
                                            <tr>
                                                <th className="p-3 rounded-tl-lg print:border print:border-gray-500">Clientes (n)</th>
                                                <th className="p-3 print:border print:border-gray-500">Probabilidad (Pn)</th>
                                                <th className="p-3 rounded-tr-lg print:border print:border-gray-500">Prob. Acumulada (Fn)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="print:text-black">
                                            {results.probabilityTable.map((row) => (
                                                <tr key={row.n} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700/30 print:border-gray-400" style={{ breakInside: 'avoid' }}>
                                                    <td className="p-3 print:border print:border-gray-400">{row.n}</td>
                                                    {/* Mostrar 5 decimales */}
                                                    <td className="p-3 print:border print:border-gray-400">{row.Pn.toFixed(5)}</td>
                                                    <td className="p-3 print:border print:border-gray-400">{row.Fn.toFixed(5)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full bg-gray-800 p-10 rounded-xl shadow-2xl border border-gray-700 text-center">
                            <p className="text-gray-400 text-lg">Ingresa los datos en el formulario para calcular y ver las métricas del sistema M/M/1.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- BOTONES INFERIORES (OCULTAR EN IMPRESIÓN) --- */}
                            <div className="flex justify-between items-center mt-8 print:hidden">
                                <Link
                                    to="/" // Asegúrate que esta ruta exista en tu Router
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300"
                                >
                                    &larr; Volver al menú
                                </Link>

                                {results && (
                                    <button
                                        onClick={handlePrint}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300"
                                    >
                                        Imprimir Resultados 🖨️
                                    </button>
                                )}
                            </div>

        </div>
    );
}

export default Server_sin_cola;