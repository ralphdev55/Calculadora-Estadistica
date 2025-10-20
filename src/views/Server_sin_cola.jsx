import React from 'react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

// Función para imprimir (fuera del componente para evitar que se recree en cada render)
const handlePrint = () => {
    window.print();
};

function Server_sin_cola() {

    const [inputs, setInputs] = useState({ lambda: '', mu: '', k: '' });
    const [results, setResults] = useState(null); 
    const [error, setError] = useState('');

    // Maneja los cambios en los campos del formulario
    const handleInputChange = (e) => {
        setInputs({
            ...inputs,
            [e.target.name]: e.target.value
        });
    };

    // Se ejecuta al enviar el formulario (botón o tecla Enter)
    const handleCalculate = (e) => {
        e.preventDefault();

        // 2. VALIDACIÓN Y CÁLCULO
        const lambda = parseFloat(inputs.lambda);
        const mu = parseFloat(inputs.mu);
        const k = parseInt(inputs.k, 10);

        // --- VALIDACIONES ---
        if (isNaN(lambda) || isNaN(mu) || isNaN(k) || lambda <= 0 || mu <= 0 || k < 0) {
            setError('Por favor, ingresa valores numéricos válidos y positivos.');
            setResults(null);
            return;
        }

        if (lambda >= mu) {
            setError('La tasa de llegada (λ) debe ser menor que la tasa de servicio (μ) para que el sistema sea estable.');
            setResults(null);
            return;
        }

        setError('');

        // Fórmulas del modelo M/M/1
        const rho = lambda / mu;
        const Ls = lambda / (mu - lambda);
        const Lq = Math.pow(lambda, 2) / (mu * (mu - lambda));
        const Ws = 1 / (mu - lambda);
        const Wq = lambda / (mu * (mu - lambda));
        const P0 = 1 - rho;

        // Generar la tabla de probabilidad
        const probabilityTable = [];
        for (let n = 0; n <= k; n++) {
            const Pn = (1 - rho) * Math.pow(rho, n);
            const Fn = 1 - Math.pow(rho, n + 1);
            probabilityTable.push({ n, Pn, Fn });
        }

        // 3. ACTUALIZAR ESTADO PARA MOSTRAR RESULTADOS
        setResults({ 
            lambda: lambda.toFixed(3), 
            mu: mu.toFixed(3), 
            rho, Ls, Lq, Ws, Wq, P0, probabilityTable 
        });
    };

    // Componente reutilizable para las tarjetas de métricas
    const MetricCard = ({ label, value }) => (
        <div className="bg-gray-700/50 p-4 rounded-lg text-center print:bg-gray-200 print:text-black print:border print:border-gray-400">
            <p className="text-sm text-gray-400 print:text-gray-600">{label}</p>
            <p className="text-2xl font-bold text-blue-400 print:text-blue-700">{value}</p>
        </div>
    );

    return (
        // Envolvente principal: Se usa 'print:' para vista de impresión limpia
        <div className="max-w-4xl mx-auto text-white animate-fade-in-up print:text-black print:bg-white p-4">
            
            {/* --- FORMULARIO DE ENTRADA (OCULTAR EN IMPRESIÓN) --- */}
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 print:hidden">
                <h1 className="text-2xl font-bold mb-2 text-center">
                    Línea de Espera: Un Servidor, Cola Infinita (M/M/1)
                </h1>
                <p className="text-gray-400 text-center mb-6">Ingresa los parámetros del sistema.</p>
                
                <form onSubmit={handleCalculate}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div>
                            <label htmlFor="lambda" className="block text-sm font-medium text-gray-300 mb-1">Tasa de llegada ($\lambda$)</label>
                            <input type="number" name="lambda" id="lambda" value={inputs.lambda} onChange={handleInputChange} placeholder="Ej: 8" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"/>
                        </div>
                        <div>
                            <label htmlFor="mu" className="block text-sm font-medium text-gray-300 mb-1">Tasa de servicio ($\mu$)</label>
                            <input type="number" name="mu" id="mu" value={inputs.mu} onChange={handleInputChange} placeholder="Ej: 10" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"/>
                        </div>
                        <div>
                            <label htmlFor="k" className="block text-sm font-medium text-gray-300 mb-1">Clientes para tabla (k)</label>
                            <input type="number" name="k" id="k" value={inputs.k} onChange={handleInputChange} placeholder="Ej: 5" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"/>
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300">
                        Calcular Métricas
                    </button>
                    {error && <p className="text-red-400 text-center mt-4">{error}</p>}
                </form>
            </div>

            {/* --- SECCIÓN DE RESULTADOS (RENDERIZADO CONDICIONAL) --- */}
            {results && (
                <div className="mt-12 animate-fade-in-up print:mt-0 print:pt-4">
                    {/* Título y Parámetros solo para la impresión */}
                    <div className="hidden print:block mb-6">
                        <h1 className="text-3xl font-bold mb-2 text-center text-black">
                            Reporte de Resultados - M/M/1
                        </h1>
                        <p className="text-center text-gray-600 mb-4">
                            Parámetros: $\lambda$ = {results.lambda} | $\mu$ = {results.mu} | Clientes (k) = {inputs.k}
                        </p>
                    </div>

                    {/* Métricas de Rendimiento */}
                    <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 print:bg-white print:p-0 print:shadow-none print:border-none">
                        <h2 className="text-xl font-bold mb-6 text-center print:text-xl print:text-black">Métricas de Rendimiento</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 print:gap-4 print:grid-cols-3">
                            <MetricCard label="Factor de Utilización (ρ)" value={results.rho.toFixed(4)} />
                            <MetricCard label="Clientes en Cola (Lq)" value={results.Lq.toFixed(4)} />
                            <MetricCard label="Clientes en Sistema (Ls)" value={results.Ls.toFixed(4)} />
                            <MetricCard label="Tiempo en Cola (Wq)" value={results.Wq.toFixed(4)} />
                            <MetricCard label="Tiempo en Sistema (Ws)" value={results.Ws.toFixed(4)} />
                            <MetricCard label="Prob. de Sistema Vacío (P0)" value={results.P0.toFixed(4)} />
                        </div>
                    </div>

                    {/* Tabla de Probabilidad */}
                    <div className="mt-8 bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 print:bg-white print:p-0 print:shadow-none print:border-none">
                        <h2 className="text-xl font-bold mb-6 text-center print:text-xl print:text-black print:mt-8">Tabla de Distribución de Probabilidad</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left print:border-collapse">
                                <thead className="bg-gray-700/50 print:bg-gray-300 print:text-black">
                                    <tr>
                                        <th className="p-3 print:border print:border-gray-500">Clientes (n)</th>
                                        <th className="p-3 print:border print:border-gray-500">Probabilidad (Pn)</th>
                                        <th className="p-3 print:border print:border-gray-500">Prob. Acumulada (Fn)</th>
                                    </tr>
                                </thead>
                                <tbody className="print:text-black">
                                    {results.probabilityTable.map((row) => (
                                        // 🚨 CLASE CORREGIDA: Solo se usa 'break-inside-avoid' 🚨
                                        <tr 
                                            key={row.n} 
                                            className="border-b border-gray-700 hover:bg-gray-700/30 print:border-gray-400 print:hover:bg-gray-100 **break-inside-avoid**"
                                        >
                                            <td className="p-3 print:border print:border-gray-400">{row.n}</td>
                                            <td className="p-3 print:border print:border-gray-400">{row.Pn.toFixed(5)}</td>
                                            <td className="p-3 print:border print:border-gray-400">{row.Fn.toFixed(5)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Botón para Imprimir Resultados (OCULTAR EN IMPRESIÓN) */}
                        <div className="text-right mt-4 print:hidden">
                            <button 
                                onClick={handlePrint} 
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300"
                            >
                                Imprimir Resultados
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Botón para volver (OCULTAR EN IMPRESIÓN) */}
            <div className="text-center mt-8 print:hidden">
                <Link to="/" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300">
                    Volver al menú
                </Link>
            </div>
        </div>
    );
}

export default Server_sin_cola;