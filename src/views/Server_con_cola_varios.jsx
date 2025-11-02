import React from 'react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

// --- FUNCIÓN AUXILIAR ---
// Se necesita para las fórmulas de M/M/s/K
const factorial = (n) => {
    if (n < 0) return -1;
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

function Server_con_cola_varios() {
    // Añadido 's' a los inputs
    const [inputs, setInputs] = useState({ lambda: '', mu: '', s: '', k: '' });
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

        // 1. OBTENER Y VALIDAR ENTRADAS
        const lambda = parseFloat(inputs.lambda);
        const mu = parseFloat(inputs.mu);
        const s = parseInt(inputs.s, 10); // Número de servidores
        const k = parseInt(inputs.k, 10); // Capacidad TOTAL del sistema

        if (isNaN(lambda) || isNaN(mu) || isNaN(s) || isNaN(k) || lambda <= 0 || mu <= 0 || s <= 0 || k <= 0) {
            setError('Por favor, ingresa valores numéricos positivos para λ, μ, s, y K.');
            setResults(null);
            return;
        }

        if (s !== parseFloat(inputs.s) || k !== parseFloat(inputs.k)) {
            setError('El número de servidores (s) y la capacidad (K) deben ser enteros.');
            setResults(null);
            return;
        }

        // Validación clave: K debe ser al menos tan grande como s
        if (k < s) {
            setError('La capacidad total (K) debe ser mayor o igual al número de servidores (s).');
            setResults(null);
            return;
        }
        
        setError(''); // Limpia errores

        // --- 2. CÁLCULO DE MÉTRICAS M/M/s/K ---
        
        const r = lambda / mu;
        const rho = r / s;
        let P0;

        // --- Cálculo de P0 (Probabilidad de 0 clientes) ---
        let sum_part1 = 0;
        for (let n = 0; n < s; n++) {
            sum_part1 += Math.pow(r, n) / factorial(n);
        }

        let sum_part2;
        const part2_factor = Math.pow(r, s) / factorial(s);

        // Caso especial: rho = 1 (lambda = s * mu)
        if (rho === 1) {
            sum_part2 = part2_factor * (k - s + 1);
        } 
        // Caso normal: rho != 1
        else {
            sum_part2 = part2_factor * ((1 - Math.pow(rho, k - s + 1)) / (1 - rho));
        }

        P0 = 1 / (sum_part1 + sum_part2);

        // --- Cálculo de la tabla de probabilidad (Pn) y Pk ---
        const probabilityTable = [];
        let accumulatedFn = 0;
        let Pk = 0; // Probabilidad de sistema lleno (n=k)

        for (let n = 0; n <= k; n++) {
            let Pn;
            
            // Fórmula para n < s
            if (n < s) {
                Pn = (Math.pow(r, n) / factorial(n)) * P0;
            } 
            // Fórmula para s <= n <= k
            else {
                Pn = (Math.pow(r, n) / (factorial(s) * Math.pow(s, n - s))) * P0;
            }
            
            accumulatedFn += Pn;
            probabilityTable.push({ n, Pn, Fn: accumulatedFn });

            if (n === k) {
                Pk = Pn; // Guarda la probabilidad de que el sistema esté lleno
            }
        }

        // --- Cálculo de Lq (Clientes en cola) ---
        let Lq;
        // Caso especial: rho = 1
        if (rho === 1) {
            Lq = P0 * (part2_factor) * (( (k - s) * (k - s + 1) ) / 2);
        }
        // Caso normal: rho != 1
        else {
            Lq = P0 * (part2_factor * rho / Math.pow(1 - rho, 2)) * (1 - Math.pow(rho, k - s + 1) - (1 - rho) * (k - s + 1) * Math.pow(rho, k - s));
        }

        // --- Cálculo de métricas restantes usando Little's Law ---
        const lambdaEfectiva = lambda * (1 - Pk);
        const lambdaPerdida = lambda - lambdaEfectiva;
        
        // Wq, Ws, Ls se calculan sobre la tasa EFECTIVA
        const Wq = Lq / lambdaEfectiva;
        const Ws = Wq + (1 / mu);
        const Ls = lambdaEfectiva * Ws;

        // 3. ACTUALIZAR ESTADO PARA MOSTRAR RESULTADOS
        setResults({ 
            lambda: lambda.toFixed(3), 
            mu: mu.toFixed(3),
            s: s,
            k: k,
            rho, Ls, Lq, Ws, Wq, lambdaEfectiva, lambdaPerdida, Pk, probabilityTable 
        });
    };

    // Componente reutilizable para las tarjetas de métricas
    const MetricCard = ({ label, value }) => (
        <div className="bg-gray-800/70 p-3 rounded-lg text-center print:bg-gray-200 print:text-black print:border print:border-gray-400 break-inside-avoid">
            <p className="text-xs text-gray-400 print:text-gray-600 font-medium">{label}</p>
            <p className="text-xl font-bold text-emerald-400 print:text-emerald-700 mt-1">{value}</p>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto text-white print:text-black print:bg-white p-4">
            
            <div className="flex flex-col md:flex-row gap-8">

                {/* --- COLUMNA 1: FORMULARIO DE ENTRADA --- */}
                <div className="md:w-1/3 print:hidden">
                    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 h-full">
                        <h1 className="text-2xl font-extrabold mb-2 text-center text-white">
                            M/M/s/K
                        </h1>
                        <p className="text-gray-400 text-center mb-6 text-sm">Varios Servidores, Cola Finita (Capacidad K)</p>
                        
                        <form onSubmit={handleCalculate}>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label htmlFor="lambda" className="block text-sm font-medium text-gray-300 mb-1">Tasa de llegada (λ)</label>
                                    <input type="number" step="any" name="lambda" id="lambda" value={inputs.lambda} onChange={handleInputChange} placeholder="Ej: 10" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"/>
                                </div>
                                <div>
                                    <label htmlFor="mu" className="block text-sm font-medium text-gray-300 mb-1">Tasa de servicio (μ) <span className='text-xs text-gray-400'>(por servidor)</span></label>
                                    <input type="number" step="any" name="mu" id="mu" value={inputs.mu} onChange={handleInputChange} placeholder="Ej: 6" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"/>
                                </div>
                                <div>
                                    <label htmlFor="s" className="block text-sm font-medium text-gray-300 mb-1">Número de servidores (s)</label>
                                    <input type="number" step="1" name="s" id="s" value={inputs.s} onChange={handleInputChange} placeholder="Ej: 2" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"/>
                                </div>
                                <div>
                                    {/* Etiqueta corregida para mayor claridad */}
                                    <label htmlFor="k" className="block text-sm font-medium text-gray-300 mb-1">Capacidad Total del Sistema (K)</label>
                                    <input type="number" step="1" name="k" id="k" value={inputs.k} onChange={handleInputChange} placeholder="Ej: 5 (s + cola)" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"/>
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
                    
                    {/* --- REPORTE PARA IMPRESIÓN --- */}
                    {results && (
                        <div className="hidden print:block mt-6 text-black">
                            <div className="max-w-4xl mx-auto p-4 border-t border-gray-300">
                                <h1 className="text-3xl font-bold mb-2 text-center text-black">Reporte de Resultados - M/M/s/K</h1>
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
                                                <td className="py-1 font-medium">s (Número de servidores)</td>
                                                <td className="py-1">{results.s}</td>
                                            </tr>
                                            <tr>
                                                <td className="py-1 font-medium">K (Capacidad Total del Sistema)</td>
                                                <td className="py-1">{results.k}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </section>

                                {/* Explicaciones */}
                                <section className="mb-4">
                                    <h3 className="font-semibold">Explicaciones</h3>
                                    <ol className="list-decimal ml-5 text-sm">
                                        <li><strong>λ:</strong> tasa promedio de llegadas.</li>
                                        <li><strong>μ:</strong> tasa promedio de servicio por servidor.</li>
                                        <li><strong>s:</strong> número de servidores.</li>
                                        <li><strong>K:</strong> capacidad máxima total del sistema.</li>
                                        <li><strong>ρ = λ/(s*μ):</strong> utilización del servidor (tráfico ofrecido).</li>
                                        <li><strong>Pk:</strong> probabilidad de que el sistema esté lleno (n=K) y rechace clientes.</li>
                                        <li><strong>λ Efectiva:</strong> tasa real de clientes que entran al sistema.</li>
                                        <li><strong>Ls:</strong> número promedio de clientes en el sistema.</li>
                                        <li><strong>Lq:</strong> número promedio de clientes en la cola.</li>
                                        <li><strong>Ws:</strong> tiempo promedio en el sistema.</li>
                                        <li><strong>Wq:</strong> tiempo promedio en la cola.</li>
                                    </ol>
                                </section>
                            </div>
                        </div>
                    )}
                    {/* --- FIN REPORTE IMPRESIÓN --- */}


                    {/* Contenedor de Resultados (Visible en pantalla) */}
                    {results ? (
                        <div className="space-y-8">
                            
                            {/* 1. Métricas de Rendimiento */}
                            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 print:bg-white print:p-0 print:shadow-none print:border-none break-inside-avoid">
                                <h2 className="text-xl font-bold mb-4 text-center text-emerald-400 print:text-xl print:text-black">Métricas de Rendimiento</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:gap-4 print:grid-cols-4">
                                    <MetricCard label="Utilización (ρ)" value={results.rho.toFixed(4)} />
                                    <MetricCard label="Clientes en Cola (Lq)" value={results.Lq.toFixed(4)} />
                                    <MetricCard label="Clientes en Sistema (Ls)" value={results.Ls.toFixed(4)} />
                                    <MetricCard label="Tiempo en Cola (Wq)" value={results.Wq.toFixed(4)} />
                                    <MetricCard label="Tiempo en Sistema (Ws)" value={results.Ws.toFixed(4)} />
                                    <MetricCard label="λ Efectiva" value={results.lambdaEfectiva.toFixed(4)} />
                                    <MetricCard label="λ Perdida" value={results.lambdaPerdida.toFixed(4)} />
                                    <MetricCard label="Prob. de Rechazo (PK)" value={results.Pk.toFixed(4)} />
                                </div>
                            </div>

                            {/* 2. Tabla de Probabilidad */}
                            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 print:bg-white print:p-0 print:shadow-none print:border-none break-inside-avoid">
                                <h2 className="text-xl font-bold mb-4 text-center text-emerald-400 print:text-xl print:text-black print:mt-8">Tabla de Distribución de Probabilidad</h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left print:border-collapse text-sm">
                                        <thead className="bg-gray-700/50 print:bg-gray-300 print:text-black">
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
                                                    className="border-b border-gray-700 hover:bg-gray-700/30 print:border-gray-400 print:hover:bg-gray-100 break-inside-avoid"
                                                >
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
                            <p className="text-gray-400 text-lg">Ingresa los datos en el formulario para ver las métricas del sistema M/M/s/K.</p>
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

export default Server_con_cola_varios;