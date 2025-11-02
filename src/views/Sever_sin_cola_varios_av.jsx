import React from 'react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

// --- FUNCIÓN AUXILIAR ---
// Se necesita para las fórmulas de M/M/s
// Se coloca fuera del componente para evitar que se recree en cada render
const factorial = (n) => {
    if (n < 0) return -1; // Error, no debería pasar
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
};


// Función para imprimir
const handlePrint = () => {
    window.print();
};

function Server_sin_cola_varios() {

    // --- ESTADOS ---
    // Almacena los valores de entrada (lambda, mu y s)
    const [inputs, setInputs] = useState({ lambda: '', mu: '', s: '' });
    // Almacena los resultados calculados
    const [results, setResults] = useState(null);
    // Almacena mensajes de error
    const [error, setError] = useState('');

    // --- MANEJADORES DE EVENTOS ---

    // Actualiza el estado 'inputs'
    const handleInputChange = (e) => {
        setInputs({
            ...inputs,
            [e.target.name]: e.target.value
        });
    };

    // Se ejecuta al enviar el formulario
    const handleCalculate = (e) => {
        e.preventDefault(); 

        // Convierte las entradas a números
        const lambda = parseFloat(inputs.lambda);
        const mu = parseFloat(inputs.mu);
        const s = parseInt(inputs.s); // 's' debe ser un entero
        
        // --- VALIDACIONES ---
        if (isNaN(lambda) || isNaN(mu) || isNaN(s) || lambda <= 0 || mu <= 0 || s <= 0) {
            setError('Por favor, ingresa valores numéricos positivos para λ, μ y s.');
            setResults(null);
            return;
        }

        if (s !== parseFloat(inputs.s)) {
            setError('El número de servidores (s) debe ser un número entero.');
            setResults(null);
            return;
        }

        // Condición de estabilidad para M/M/s
        if (lambda >= (s * mu)) {
            setError('La tasa de llegada (λ) debe ser menor que la tasa total de servicio (s * μ) para que el sistema sea estable.');
            setResults(null);
            return;
        }

        setError('');

        // --- CÁLCULO DE MÉTRICAS (Fórmulas del modelo M/M/s) ---

        const r = lambda / mu;   // Carga de trabajo (Erlangs)
        const rho = r / s;       // Factor de utilización (probabilidad de que un servidor esté ocupado)

        // 1. Cálculo de P0 (Probabilidad de 0 clientes en el sistema)
        let sumPn_part1 = 0;
        for (let n = 0; n < s; n++) {
            sumPn_part1 += Math.pow(r, n) / factorial(n);
        }
        
        const Pn_part2 = (Math.pow(r, s) / factorial(s)) * (1 / (1 - rho));
        
        const P0 = 1 / (sumPn_part1 + Pn_part2);

        // 2. Cálculo de Lq (Número promedio de clientes en la cola)
        const Lq = (P0 * Math.pow(r, s) * rho) / (factorial(s) * Math.pow(1 - rho, 2));

        // 3. Cálculo de Wq, Ws, Ls (Usando Little's Law)
        const Wq = Lq / lambda;             // Tiempo promedio en cola
        const Ws = Wq + (1 / mu);           // Tiempo promedio en el sistema
        const Ls = lambda * Ws;             // Número promedio en el sistema (o Ls = Lq + r)

        // 4. Genera los datos para la tabla de distribución de probabilidad
        const probabilityTable = [];
        const maxNForTable = 1000; // Límite de seguridad
        let cumulativeP = 0;
        
        for (let n = 0; n <= maxNForTable; n++) {
            let Pn;
            
            // Fórmula para n < s
            if (n < s) {
                Pn = (Math.pow(r, n) / factorial(n)) * P0;
            } 
            // Fórmula para n >= s
            else {
                Pn = (Math.pow(r, n) / (factorial(s) * Math.pow(s, n - s))) * P0;
            }
            
            cumulativeP += Pn;
            const Fn = cumulativeP;
            
            probabilityTable.push({ n, Pn, Fn });
            
            if (Fn >= 0.999995) {
                break; // Detener si la probabilidad acumulada es casi 1
            }
        }

        // Almacena todos los resultados en el estado
        setResults({
            lambda, mu, s,
            rho, Ls, Lq, Ws, Wq, P0, 
            probabilityTable
        });
    };
    
    // --- SUBCOMPONENTES DE RENDERIZADO ---

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

                {/* --- COLUMNA IZQUIERDA: FORMULARIO DE ENTRADA --- */}
                <div className="md:w-1/3 print:hidden">
                    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 h-full">
                        <h1 className="text-2xl font-extrabold mb-2 text-center text-white">
                            Modelo M/M/s
                        </h1>
                        <p className="text-gray-400 text-center mb-6 text-sm">Varios Servidores, Cola Infinita</p>
                        
                        <form onSubmit={handleCalculate} className="space-y-4">
                            <div>
                                <label htmlFor="lambda" className="block text-sm font-medium text-gray-300 mb-1">Tasa de llegada (λ)</label>
                                <input type="number" step="any" name="lambda" id="lambda" value={inputs.lambda} onChange={handleInputChange} placeholder="Ej: 8" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"/>
                            </div>
                            <div>
                                <label htmlFor="mu" className="block text-sm font-medium text-gray-300 mb-1">Tasa de servicio (μ) <span className='text-xs text-gray-400'>(por servidor)</span></label>
                                <input type="number" step="any" name="mu" id="mu" value={inputs.mu} onChange={handleInputChange} placeholder="Ej: 5" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"/>
                            </div>
                            <div>
                                <label htmlFor="s" className="block text-sm font-medium text-gray-300 mb-1">Número de servidores (s)</label>
                                <input type="number" step="1" name="s" id="s" value={inputs.s} onChange={handleInputChange} placeholder="Ej: 2" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"/>
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
                    
                    {/* --- INICIO DE LA SECCIÓN DE REPORTE PARA IMPRESIÓN --- */}
                    {results && (
                        <div className="hidden print:block mt-6 text-black">
                            <div className="max-w-4xl mx-auto p-4 border-t border-gray-300">
                                <h1 className="text-3xl font-bold mb-2 text-center text-black">Reporte de Resultados - M/M/s</h1>
                                <p className="text-center text-gray-700 mb-4">Este reporte contiene los parámetros usados, las métricas principales y la distribución de probabilidad.</p>

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
                                                <td className="py-1 font-medium">μ (tasa de servicio por servidor)</td>
                                                <td className="py-1">{results.mu}</td>
                                            </tr>
                                            <tr>
                                                <td className="py-1 font-medium">s (número de servidores)</td>
                                                <td className="py-1">{results.s}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </section>

                                {/* Explicaciones */}
                                <section className="mb-4">
                                    <h3 className="font-semibold">Explicaciones</h3>
                                    <ol className="list-decimal ml-5 text-sm">
                                        <li><strong>λ:</strong> tasa promedio de llegadas por unidad de tiempo.</li>
                                        <li><strong>μ:</strong> tasa promedio de servicio por servidor.</li>
                                        <li><strong>s:</strong> número de servidores.</li>
                                        <li><strong>ρ = λ/(s*μ):</strong> utilización promedio de cada servidor.</li>
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
                    {/* --- FIN DE LA SECCIÓN DE REPORTE PARA IMPRESIÓN --- */}


                    {/* Muestra los resultados o un mensaje inicial */}
                    {results ? (
                        <div className="space-y-full">
                            
                            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 print:bg-white print:p-0 print:shadow-none print:border-none break-inside-avoid">
                                <h2 className="text-xl font-bold mb-4 text-center text-emerald-400 print:text-xl print:text-black">Métricas de Rendimiento</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {/* ρ es la utilización del servidor, no del sistema total */}
                                    <MetricCard label="Utilización (ρ)" value={results.rho.toFixed(4)} /> 
                                    <MetricCard label="Clientes en Cola (Lq)" value={results.Lq.toFixed(4)} />
                                    <MetricCard label="Clientes en Sistema (Ls)" value={results.Ls.toFixed(4)} />
                                    <MetricCard label="Tiempo en Cola (Wq)" value={results.Wq.toFixed(4)} />
                                    <MetricCard label="Tiempo en Sistema (Ws)" value={results.Ws.toFixed(4)} />
                                    <MetricCard label="Prob. Sistema Vacío (P0)" value={results.P0.toFixed(4)} />
                                </div>
                            </div>

                            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 print:bg-white print:p-0 print:shadow-none print:border-none break-inside-avoid mt-8">
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
                            <p className="text-gray-400 text-lg">Ingresa los datos en el formulario para calcular y ver las métricas del sistema M/M/s.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- BOTONES INFERIORES --- */}
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

export default Server_sin_cola_varios;