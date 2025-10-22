import React from 'react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

// Función para imprimir (fuera del componente para evitar que se recree en cada render)
const handlePrint = () => {
    window.print();
};

function Server_con_cola() {
        const [inputs, setInputs] = useState({ lambda: '', mu: '', k: '' });
    const [results, setResults] = useState(null); 
    const [error, setError] = useState('');


    const handleInputChange = (e) => {
        setInputs({
            ...inputs,
            [e.target.name]: e.target.value
        });
    };

    const handleCalculate = (e) => {
        e.preventDefault(); 

        // 2. VALIDACIÓN Y CÁLCULO
        const lambda = parseFloat(inputs.lambda);
        const mu = parseFloat(inputs.mu);
        const k = parseInt(inputs.k, 10); // K debe ser entero

        // Validación básica de entradas
        if (isNaN(lambda) || isNaN(mu) || isNaN(k) || lambda <= 0 || mu <= 0 || k <= 0) {
            setError('Por favor, ingresa valores numéricos válidos y positivos. K debe ser un entero.');
            setResults(null);
            return;
        }
        // Validación específica para K como entero
        if (!Number.isInteger(k)) {
             setError('La Capacidad del Sistema (K) debe ser un número entero positivo.');
             setResults(null);
             return;
        }
        
        setError(''); // Limpia errores

        // Fórmulas del modelo M/M/1/K (cola finita)
        const rho = lambda / mu;
        let P0; // Probabilidad de sistema vacío

        // Caso especial cuando rho = 1
        if (Math.abs(rho - 1) < 1e-9) { // Comparación segura para punto flotante
            P0 = 1 / (k + 1);
        } else {
            P0 = (1 - rho) / (1 - Math.pow(rho, k + 1));
        }

        // Si P0 es inválido (puede pasar con rho muy grande y k grande), detener
         if (isNaN(P0) || !isFinite(P0) || P0 < 0 || P0 > 1) {
             setError('Cálculo inválido. Revisa los valores de entrada (rho^k puede ser muy grande).');
             setResults(null);
             return;
         }


        const Pk = P0 * Math.pow(rho, k); // Probabilidad de sistema lleno (rechazo)
        const lambdaEfectiva = lambda * (1 - Pk);
        const lambdaPerdida = lambda - lambdaEfectiva;

        let Ls; // Clientes promedio en el sistema
        if (Math.abs(rho - 1) < 1e-9) { // Comparación segura para punto flotante
            Ls = k / 2;
        } else {
            // Fórmula Ls para rho != 1
            const numerator = rho * (1 - (k + 1) * Math.pow(rho, k) + k * Math.pow(rho, k + 1));
            const denominator = (1 - rho) * (1 - Math.pow(rho, k + 1));
             // Evitar división por cero si el denominador es cero (matemáticamente no debería pasar si rho!=1)
            if (Math.abs(denominator) < 1e-9) {
                 setError('Cálculo inestable (denominador cero en Ls). Revisa los valores.');
                 setResults(null);
                 return;
            }
            Ls = numerator / denominator;
        }
        
         // Ws (Tiempo promedio en sistema) - Manejo de división por cero si lambdaEfectiva es ~0
        const Ws = (lambdaEfectiva > 1e-9) ? (Ls / lambdaEfectiva) : 0;
        const Wq = Ws - (1 / mu); // Tiempo promedio en cola
        const Lq = lambdaEfectiva * Wq; // Clientes promedio en cola
        
        // Generar la tabla de probabilidad
        const probabilityTable = [];
        let accumulatedFn = 0;
        for (let n = 0; n <= k; n++) {
             let Pn;
             // Calcular Pn usando P0 y rho^n, incluso si rho=1 (donde Pn = P0)
             if (Math.abs(rho - 1) < 1e-9) {
                 Pn = P0;
             } else {
                 Pn = P0 * Math.pow(rho, n);
             }

             // Validar Pn antes de sumar
             if (isNaN(Pn) || !isFinite(Pn) || Pn < 0) {
                 console.error(`Error calculando Pn para n=${n}. P0=${P0}, rho=${rho}`);
                 Pn = 0; // Asignar 0 si hay error
             }

            accumulatedFn += Pn;
            // Asegurar que Fn no supere 1.0 por errores de punto flotante
            const Fn = Math.min(accumulatedFn, 1.0);
            probabilityTable.push({ n, Pn, Fn });
        }

        // Validar que la última Fn sea cercana a 1
        if (probabilityTable.length > 0 && Math.abs(probabilityTable[probabilityTable.length - 1].Fn - 1.0) > 1e-4) {
             console.warn(`La probabilidad acumulada final (Fn en n=${k}) es ${probabilityTable[probabilityTable.length - 1].Fn}, lo cual no es cercano a 1. Puede haber inestabilidad numérica.`);
             // Opcionalmente: setError('Advertencia: Inestabilidad numérica detectada en probabilidades.');
        }


        // 3. ACTUALIZAR ESTADO PARA MOSTRAR RESULTADOS
        // Guardar resultados numéricos para posibles usos futuros, formatear al mostrar
        setResults({ 
            lambda: lambda, // Guardar número original
            mu: mu,       // Guardar número original
            k: k,
            rho, Ls, Lq, Ws, Wq, lambdaEfectiva, lambdaPerdida, Pk, probabilityTable 
        });
    };

    // Componente reutilizable para las tarjetas de métricas
    const MetricCard = ({ label, value }) => (
        <div className="bg-gray-800/70 p-3 rounded-lg text-center print:bg-gray-200 print:text-black print:border print:border-gray-400" style={{ breakInside: 'avoid' }}>
            <p className="text-xs text-gray-400 print:text-gray-600 font-medium">{label}</p>
            {/* Formatear el valor aquí para mostrar */}
            <p className="text-xl font-bold text-emerald-400 print:text-emerald-700 mt-1">{typeof value === 'number' ? value.toFixed(4) : value}</p>
        </div>
    );

    return (
        // Contenedor principal con max-w-6xl
        <div className="max-w-6xl mx-auto text-white print:text-black print:bg-white p-4 font-sans">
            
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
                        .print\\:hover\\:bg-gray-100:hover { background-color: #f7fafc; } /* Estilo hover no aplica en impresión, pero por consistencia */
                         /* Evitar saltos de página dentro de elementos */
                        .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
                         table, tr, td, th, thead, tbody { break-inside: avoid !important; page-break-inside: avoid !important; }

                    }
                    /* Animación simple */
                     @keyframes scale-in {
                        from { opacity: 0; transform: scale(0.95); }
                        to { opacity: 1; transform: scale(1); }
                    }
                    .animate-scale-in { animation: scale-in 0.3s ease-out forwards; }

                     @keyframes float-up {
                        0% { transform: translateY(10px); opacity: 0; }
                        100% { transform: translateY(-50%); opacity: 1; } /* Ajustado para centrar verticalmente */
                    }
                    .animate-float-up { animation: float-up 0.4s ease-out forwards; }


                `}
            </style>

            {/* Contenedor principal para la estructura de dos columnas en escritorio */}
            <div className="flex flex-col md:flex-row gap-8">

                {/* --- COLUMNA 1: FORMULARIO DE ENTRADA (OCULTAR EN IMPRESIÓN) --- */}
                <div className="md:w-1/3 print:hidden">
                    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 h-full">
                        <h1 className="text-2xl font-extrabold mb-2 text-center text-white">
                            M/M/1/K
                        </h1>
                        <p className="text-gray-400 text-center mb-6 text-sm">Un Servidor, Cola Finita (Capacidad K)</p>
                        
                        <form onSubmit={handleCalculate}>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label htmlFor="lambda" className="block text-sm font-medium text-gray-300 mb-1">Tasa de llegada (λ)</label>
                                    <input 
                                        type="number" 
                                        step="any" // Permitir decimales
                                        name="lambda" 
                                        id="lambda" 
                                        value={inputs.lambda} 
                                        onChange={handleInputChange} 
                                        placeholder="Ej: 4" // Ejemplo del PDF
                                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"/>
                                </div>
                                <div>
                                    <label htmlFor="mu" className="block text-sm font-medium text-gray-300 mb-1">Tasa de servicio (μ)</label>
                                    <input 
                                        type="number" 
                                        step="any" // Permitir decimales
                                        name="mu" 
                                        id="mu" 
                                        value={inputs.mu} 
                                        onChange={handleInputChange} 
                                        placeholder="Ej: 6" // Ejemplo del PDF
                                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"/>
                                </div>
                                <div>
                                    <label htmlFor="k" className="block text-sm font-medium text-gray-300 mb-1">Capacidad del Sistema (K)</label>
                                     <p className="text-xs text-gray-400 mb-1">Total de espacios (en cola + en servicio).</p>
                                    <input 
                                        type="number" 
                                        step="1" // K debe ser entero
                                        name="k" 
                                        id="k" 
                                        value={inputs.k} 
                                        onChange={handleInputChange} 
                                        placeholder="Ej: 5" // Ejemplo del PDF (4+1)
                                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"/>
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300">
                                Calcular
                            </button>
                            {error && <p className="text-red-400 text-center mt-4 text-sm">{error}</p>}
                        </form>
                    </div>
                </div>

                {/* --- COLUMNA 2: RESULTADOS (MÉTRICAS y TABLA) --- */}
                <div className="md:w-2/3 print:w-full">
                    {/* Encabezado para la impresión */}
                    {results && (
                        <div className="hidden print:block mb-6">
                            <h1 className="text-3xl font-bold mb-2 text-center text-black">
                                Reporte de Resultados - M/M/1/K
                            </h1>
                            <p className="text-center text-gray-600 mb-4">
                                {/* Mostrar valores formateados en la impresión */}
                                Parámetros: λ = {results.lambda.toFixed(3)} | μ = {results.mu.toFixed(3)} | Capacidad (K) = {results.k}
                            </p>
                        </div>
                    )}

                    {/* Contenedor de Resultados */}
                    {results ? (
                        <div className="space-y-8">
                            
                            {/* 1. Métricas de Rendimiento */}
                            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 print:bg-white print:p-0 print:shadow-none print:border-none break-inside-avoid">
                                <h2 className="text-xl font-bold mb-4 text-center text-emerald-400 print:text-xl print:text-black">Métricas de Rendimiento</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:gap-4 print:grid-cols-4">
                                    {/* Usar MetricCard para formatear a 4 decimales */}
                                    <MetricCard label="Utilización (ρ)" value={results.rho} />
                                    <MetricCard label="Clientes en Cola (Lq)" value={results.Lq} />
                                    <MetricCard label="Clientes en Sistema (Ls)" value={results.Ls} />
                                    <MetricCard label="Tiempo en Cola (Wq)" value={results.Wq} />
                                    <MetricCard label="Tiempo en Sistema (Ws)" value={results.Ws} />
                                    <MetricCard label="λ Efectiva" value={results.lambdaEfectiva} />
                                    <MetricCard label="λ Perdida" value={results.lambdaPerdida} />
                                    <MetricCard label="Prob. de Rechazo (PK)" value={results.Pk} />
                                </div>
                            </div>

                            {/* 2. Tabla de Probabilidad */}
                            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 print:bg-white print:p-0 print:shadow-none print:border-none break-inside-avoid">
                                <h2 className="text-xl font-bold mb-4 text-center text-emerald-400 print:text-xl print:text-black print:mt-8">Tabla de Distribución de Probabilidad</h2>
                                <div className="overflow-x-auto max-h-96"> {/* Scroll vertical si la tabla es larga */}
                                    <table className="w-full text-left print:border-collapse text-sm">
                                        <thead className="bg-gray-700/50 print:bg-gray-300 print:text-black sticky top-0 z-10"> {/* Header pegajoso */}
                                            <tr>
                                                <th className="p-3 print:border print:border-gray-500">Clientes (n)</th>
                                                <th className="p-3 print:border print:border-gray-500">Probabilidad (Pn)</th>
                                                <th className="p-3 print:border print:border-gray-500">Prob. Acumulada (Fn)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="print:text-black">
                                            {results.probabilityTable.map((row) => (
                                                <tr 
                                                    key={row.n} 
                                                    className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700/30 print:border-gray-400"
                                                    style={{ breakInside: 'avoid' }}
                                                >
                                                    <td className="p-3 print:border print:border-gray-400">{row.n}</td>
                                                    {/* Formatear a 6 decimales */}
                                                    <td className="p-3 print:border print:border-gray-400">{row.Pn.toFixed(6)}</td>
                                                    <td className="p-3 print:border print:border-gray-400">{row.Fn.toFixed(6)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full bg-gray-800 p-10 rounded-xl shadow-2xl border border-gray-700 text-center">
                            <p className="text-gray-400 text-lg">Ingresa los datos en el formulario para ver las métricas del sistema M/M/1/K.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- BOTONES INFERIORES (OCULTAR EN IMPRESIÓN) --- */}
            <div className="flex justify-between items-center mt-8 print:hidden">
                <Link 
                    to="/" // Asume que tienes una ruta raíz configurada
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

export default Server_con_cola;
