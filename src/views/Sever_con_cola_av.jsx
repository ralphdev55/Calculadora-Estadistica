import React from 'react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

// Se puede reintroducir la función de impresión si se desea más adelante.
// const handlePrint = () => { window.print(); }; 

function Server_con_cola_av() {
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
        const k = parseInt(inputs.k, 10);

        if (isNaN(lambda) || isNaN(mu) || isNaN(k) || lambda <= 0 || mu <= 0 || k <= 0) {
            setError('Por favor, ingresa valores numéricos válidos y positivos.');
            setResults(null);
            return;
        }
        
        setError(''); // Limpia errores

        // Fórmulas del modelo M/M/1/K (cola finita)
        const rho = lambda / mu;
        let P0;

        if (rho === 1) {
            P0 = 1 / (k + 1);
        } else {
            P0 = (1 - rho) / (1 - Math.pow(rho, k + 1));
        }

        const Pk = P0 * Math.pow(rho, k);
        const lambdaEfectiva = lambda * (1 - Pk);
        const lambdaPerdida = lambda - lambdaEfectiva;

        let Ls;
        if (rho === 1) {
            Ls = k / 2;
        } else {
            Ls = rho * (1 - (k + 1) * Math.pow(rho, k) + k * Math.pow(rho, k + 1)) / ((1 - rho) * (1 - Math.pow(rho, k + 1)));
        }
        
        const Ws = Ls / lambdaEfectiva;
        const Wq = Ws - (1 / mu);
        const Lq = lambdaEfectiva * Wq;
        
        // Generar la tabla de probabilidad
        const probabilityTable = [];
        let accumulatedFn = 0;
        for (let n = 0; n <= k; n++) {
            const Pn = P0 * Math.pow(rho, n);
            accumulatedFn += Pn;
            probabilityTable.push({ n, Pn, Fn: accumulatedFn });
        }
        // Nota: Se elimina la fila extra (n=k+1) ya que Pk se muestra en las métricas.
        // La suma de Pn hasta n=k debe ser aproximadamente 1.

        // 3. ACTUALIZAR ESTADO PARA MOSTRAR RESULTADOS
        setResults({ 
            lambda: lambda.toFixed(3), 
            mu: mu.toFixed(3),
            k: k,
            rho, Ls, Lq, Ws, Wq, lambdaEfectiva, lambdaPerdida, Pk, probabilityTable 
        });
    };

    // Componente reutilizable para las tarjetas de métricas (DISEÑO CONSISTENTE)
    const MetricCard = ({ label, value }) => (
        // Nuevo estilo de tarjeta, más claro y compacto con acento en verde esmeralda
        <div className="bg-gray-800/70 p-3 rounded-lg text-center **break-inside-avoid**">
            <p className="text-xs text-gray-400 font-medium">{label}</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">{value}</p>
        </div>
    );

    return (
        // Contenedor principal con max-w-6xl
        <div className="max-w-6xl mx-auto text-white p-4">
            
            {/* Contenedor principal para la estructura de dos columnas en escritorio */}
            <div className="flex flex-col md:flex-row gap-8">

                {/* --- COLUMNA 1: FORMULARIO DE ENTRADA --- */}
                <div className="md:w-1/3">
                    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 h-full">
                        <h1 className="text-2xl font-extrabold mb-2 text-center text-white">
                            M/M/1/K
                        </h1>
                        <p className="text-gray-400 text-center mb-6 text-sm">Un Servidor, Cola Finita (Capacidad K)</p>
                        
                        <form onSubmit={handleCalculate}>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label htmlFor="lambda" className="block text-sm font-medium text-gray-300 mb-1">Tasa de llegada ($\lambda$)</label>
                                    <input type="number" name="lambda" id="lambda" value={inputs.lambda} onChange={handleInputChange} placeholder="Ej: 10" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"/>
                                </div>
                                <div>
                                    <label htmlFor="mu" className="block text-sm font-medium text-gray-300 mb-1">Tasa de servicio ($\mu$)</label>
                                    <input type="number" name="mu" id="mu" value={inputs.mu} onChange={handleInputChange} placeholder="Ej: 12" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"/>
                                </div>
                                <div>
                                    <label htmlFor="k" className="block text-sm font-medium text-gray-300 mb-1">Capacidad de la cola (K)</label>
                                    <input type="number" name="k" id="k" value={inputs.k} onChange={handleInputChange} placeholder="Ej: 5" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"/>
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300">
                                Calcular
                            </button>
                            {error && <p className="text-red-400 text-center mt-4">{error}</p>}
                        </form>
                    </div>
                </div>

                {/* --- COLUMNA 2: RESULTADOS (MÉTRICAS y TABLA) --- */}
                <div className="md:w-2/3">
                    {results ? (
                        <div className="space-y-8">
                            
                            {/* 1. Métricas de Rendimiento */}
                            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 **break-inside-avoid**">
                                <h2 className="text-xl font-bold mb-4 text-center text-emerald-400">Métricas de Rendimiento</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <MetricCard label="Factor de Utilización (ρ)" value={results.rho.toFixed(4)} />
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
                            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 **break-inside-avoid**">
                                <h2 className="text-xl font-bold mb-4 text-center text-emerald-400">Tabla de Distribución de Probabilidad</h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-700/50">
                                            <tr>
                                                <th className="p-3">Clientes (n)</th>
                                                <th className="p-3">Probabilidad (Pn)</th>
                                                <th className="p-3">Prob. Acumulada (Fn)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.probabilityTable.map((row) => (
                                                <tr 
                                                    key={row.n} 
                                                    className="border-b border-gray-700 hover:bg-gray-700/30 **break-inside-avoid**"
                                                >
                                                    <td className="p-3">{row.n}</td>
                                                    <td className="p-3">{row.Pn.toFixed(5)}</td>
                                                    <td className="p-3">{row.Fn.toFixed(5)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-800 p-10 rounded-xl shadow-2xl border border-gray-700 text-center">
                            <p className="text-gray-400 text-lg">Ingresa los datos en el formulario para ver las métricas del sistema M/M/1/K.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- BOTÓN INFERIOR --- */}
            <div className="text-center mt-8">
                <Link 
                    to="/" 
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300"
                >
                    &larr; Volver al menú
                </Link>
            </div>
        </div>
    );
}

export default Server_con_cola_av;