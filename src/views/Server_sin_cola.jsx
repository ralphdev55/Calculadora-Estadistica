import React from 'react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

function Server_sin_cola() {

const [inputs, setInputs] = useState({ lambda: '', mu: '', k: '' });
const [results, setResults] = useState(null); // 'null' para ocultar los resultados al inicio
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
    e.preventDefault(); // Evita que la página se recargue

    // 2. VALIDACIÓN Y CÁLCULO
    const lambda = parseFloat(inputs.lambda);
    const mu = parseFloat(inputs.mu);
    const k = parseInt(inputs.k, 10);

    if (isNaN(lambda) || isNaN(mu) || isNaN(k) || lambda <= 0 || mu <= 0 || k < 0) {
    setError('Por favor, ingresa valores numéricos válidos y positivos.');
    setResults(null);
    return;
    }

    if (lambda >= mu) {
    setError('La tasa de llegada (λ) debe ser menor que la tasa de servicio (μ).');
    setResults(null);
    return;
    }
    
    setError(''); // Limpia errores si todo está bien

    // Fórmulas del modelo M/M/1
    const rho = lambda / mu; // Factor de utilización (ρ)
    const Ls = lambda / (mu - lambda); // Clientes en el sistema
    const Lq = Math.pow(lambda, 2) / (mu * (mu - lambda)); // Clientes en la cola
    const Ws = 1 / (mu - lambda); // Tiempo en el sistema
    const Wq = lambda / (mu * (mu - lambda)); // Tiempo en la cola
    const P0 = 1 - rho; // Probabilidad de que el sistema esté vacío

    // Generar la tabla de probabilidad
    const probabilityTable = [];
    for (let n = 0; n <= k; n++) {
    const Pn = (1 - rho) * Math.pow(rho, n);
    const Fn = 1 - Math.pow(rho, n + 1);
    probabilityTable.push({ n, Pn, Fn });
    }

    // 3. ACTUALIZAR ESTADO PARA MOSTRAR RESULTADOS
    setResults({ rho, Ls, Lq, Ws, Wq, P0, probabilityTable });
};

// Componente reutilizable para las tarjetas de métricas
const MetricCard = ({ label, value }) => (
    <div className="bg-gray-700/50 p-4 rounded-lg text-center">
    <p className="text-sm text-gray-400">{label}</p>
    <p className="text-2xl font-bold text-blue-400">{value}</p>
    </div>
);

return (
    <div className="max-w-4xl mx-auto text-white animate-fade-in-up">
    {/* --- FORMULARIO DE ENTRADA --- */}
    <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
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
        <div className="mt-12 animate-fade-in-up">
        {/* Métricas de Rendimiento */}
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
            <h2 className="text-xl font-bold mb-6 text-center">Métricas de Rendimiento</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <MetricCard label="Factor de Utilización (ρ)" value={results.rho.toFixed(3)} />
            <MetricCard label="Clientes en Cola (Lq)" value={results.Lq.toFixed(3)} />
            <MetricCard label="Clientes en Sistema (Ls)" value={results.Ls.toFixed(3)} />
            <MetricCard label="Tiempo en Cola (Wq)" value={results.Wq.toFixed(3)} />
            <MetricCard label="Tiempo en Sistema (Ws)" value={results.Ws.toFixed(3)} />
            <MetricCard label="Prob. de Sistema Vacío (P0)" value={results.P0.toFixed(3)} />
            </div>
        </div>

        {/* Tabla de Probabilidad */}
        <div className="mt-8 bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
            <h2 className="text-xl font-bold mb-6 text-center">Tabla de Distribución de Probabilidad</h2>
            <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-700/50">
                <tr>
                    <th className="p-3">Clientes (n)</th>
                    <th className="p-3">Probabilidad (Pn)</th>
                    <th className="p-3">Prob. Acumulada (Fn)</th>
                </tr>
                </thead>
                <tbody>
                {results.probabilityTable.map((row) => (
                    <tr key={row.n} className="border-b border-gray-700 hover:bg-gray-700/30">
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
    )}

    {/* Botón para volver */}
    <div className="text-center mt-8">
        <Link to="/" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300">
        Volver al menú
        </Link>
    </div>
    </div>
);
}

export default Server_sin_cola;   