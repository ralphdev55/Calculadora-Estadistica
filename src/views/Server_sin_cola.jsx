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
        const Lq = Math.pow(lambda, 2) / (mu * (mu - lambda)); // Número promedio de clientes en la cola
        const Ws = 1 / (mu - lambda); // Tiempo promedio de un cliente en el sistema
        const Wq = lambda / (mu * (mu - lambda)); // Tiempo promedio de un cliente en la cola
        const P0 = 1 - rho; // Probabilidad de que no haya clientes en el sistema

        // Genera los datos para la tabla de distribución de probabilidad
        const probabilityTable = [];
        // Se define un límite fijo para la tabla, ya que el input 'k' se ha eliminado
        const maxNForTable = 20;
        for (let n = 0; n <= maxNForTable; n++) {
            const Pn = (1 - rho) * Math.pow(rho, n); // Probabilidad de tener 'n' clientes en el sistema
            const Fn = 1 - Math.pow(rho, n + 1);    // Probabilidad acumulada (tener 'n' o menos clientes)
            probabilityTable.push({ n, Pn, Fn });
        }

        // Almacena todos los resultados en el estado para que se muestren en la UI
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
            <p className="text-xl font-bold text-emerald-400 print:text-emerald-700 mt-1">{value}</p>
        </div>
    );

    // --- RENDERIZADO PRINCIPAL DEL COMPONENTE ---
    return (
        <div className="max-w-6xl mx-auto text-white print:text-black print:bg-white sm:p-6 lg:p-8 font-sans">
        
            
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
                    
                    {/* --- INICIO DE LA SECCIÓN MODIFICADA --- */}
                    {/* Esta sección está oculta en pantalla (hidden) y sólo se muestra con CSS de impresión (print:block) */}
                    {results && (
                        <div className="hidden print:block mt-6 text-black">
                            <div className="max-w-4xl mx-auto p-4 border-t border-gray-300">
                                <h1 className="text-3xl font-bold mb-2 text-center text-black">Reporte de Resultados - M/M/1</h1>
                                <p className="text-center text-gray-700 mb-4">Este reporte contiene los parámetros usados, las métricas principales y la distribución de probabilidad. Cada métrica incluye una breve explicación.</p>

                                {/* Parámetros */}
                                <section className="mb-4">
                                    <h3 className="font-semibold">Parámetros</h3>
                                    <table className="w-full text-sm">
                                        <tbody>
                                            <tr>
                                                <td className="py-1 font-medium">λ (tasa de llegada)</td>
                                                <td className="py-1">{results.lambda}</td>
                                            </tr>
                                            <tr>
                                                <td className="py-1 font-medium">μ (tasa de servicio)</td>
                                                <td className="py-1">{results.mu}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </section>

                                {/* Explicaciones (breves, tomadas de la guía) */}
                                <section className="mb-4">
                                    <h3 className="font-semibold">Explicaciones</h3>
                                    <ol className="list-decimal ml-5 text-sm">
                                        <li><strong>λ:</strong> tasa promedio de llegadas por unidad de tiempo.</li>
                                        <li><strong>μ:</strong> tasa promedio de servicio por unidad de tiempo.</li>
                                        <li><strong>ρ = λ/μ:</strong> fracción del tiempo que el servidor está ocupado; valores cercanos a 1 indican congestión.</li>
                                        <li><strong>P0:</strong> probabilidad de que no haya clientes en el sistema.</li>
                                        <li><strong>Ls:</strong> número promedio de clientes en el sistema (esperando + en servicio).</li>
                                        <li><strong>Lq:</strong> número promedio de clientes esperando en la cola.</li>
                                        <li><strong>Ws:</strong> tiempo promedio en el sistema (espera + servicio).</li>
                                        <li><strong>Wq:</strong> tiempo promedio de espera en cola.</li>
                                    </ol>
                                </section>
                            </div>
                        </div>
                    )}
                    {/* --- FIN DE LA SECCIÓN MODIFICADA --- */}


                    {/* Muestra los resultados o un mensaje inicial */}
                    {results ? (
                        <div className="space-y-full">
                            
                            {/* Sección de Métricas de Rendimiento - Añadido break-inside-avoid */}
                            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 print:bg-white print:p-0 print:shadow-none print:border-none break-inside-avoid">
                                <h2 className="text-xl font-bold mb-4 text-center text-emerald-400 print:text-xl print:text-black">Métricas de Rendimiento</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <MetricCard label="Utilización (ρ)" value={results.rho.toFixed(4)} />
                                    <MetricCard label="Clientes en Cola (Lq)" value={results.Lq.toFixed(4)} />
                                    <MetricCard label="Clientes en Sistema (Ls)" value={results.Ls.toFixed(4)} />
                                    <MetricCard label="Tiempo en Cola (Wq)" value={results.Wq.toFixed(4)} />
                                    <MetricCard label="Tiempo en Sistema (Ws)" value={results.Ws.toFixed(4)} />
                                    <MetricCard label="Prob. Sistema Vacío (P0)" value={results.P0.toFixed(4)} />
                                </div>
                            </div>

                            {/* Sección de la Tabla de Probabilidad - Añadido break-inside-avoid */}
                            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 print:bg-white print:p-0 print:shadow-none print:border-none break-inside-avoid">
                                <h2 className="text-xl font-bold mb-4 text-center text-emerald-400 print:text-xl print:text-black print:mt-8">Tabla de Distribución de Probabilidad</h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left print:border-collapse text-sm">
                                        <thead className="bg-gray-700/50 print:bg-gray-300 print:text-black">
                                            <tr>
                                                <th className="p-3 rounded-tl-lg print:border print:border-gray-500">Clientes (n)</th>
                                                <th className="p-3 print:border print:border-gray-500">Probabilidad (Pn)</th>
                                                <th className="p-3 rounded-tr-lg print:border print:border-gray-500">Prob. Acumulada (Fn)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="print:text-black">
                                            {results.probabilityTable.map((row) => (
                                                <tr key={row.n} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700/30 print:border-gray-400">
                                                    <td className="p-3 print:border print:border-gray-400">{row.n}</td>
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
                                to="/" 
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