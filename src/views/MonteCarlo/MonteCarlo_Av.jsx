import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Función para imprimir o guardar en PDF desde el navegador
const handlePrint = () => {
    window.print();
};

function MonteCarlo_Av() {

    // --- CONFIGURACIÓN DEL ESTADO (LO QUE PIDE LA RÚBRICA) ---
    const [config, setConfig] = useState({
        distType: 'poisson', // Por defecto Poisson
        lambda: '',          // El parámetro Lambda es crucial para ambas
        numVariables: 1,     // Cuántas columnas (Variables)
        numObservations: 100 // Cuántas filas (Observaciones)
    });

    const [results, setResults] = useState(null);
    const [error, setError] = useState('');

    // Actualizar formulario
    const handleInputChange = (e) => {
        setConfig({
            ...config,
            [e.target.name]: e.target.value
        });
    };

    // --- ALGORITMO PRINCIPAL (EL CORAZÓN DEL EXAMEN) ---
    const calculateSimulation = (e) => {
        e.preventDefault();
        setError('');
        setResults(null);

        // 1. Convertir inputs a números
        const lambda = parseFloat(config.lambda);
        const nVars = parseInt(config.numVariables);
        const nObs = parseInt(config.numObservations);

        // 2. Validaciones de seguridad
        if (isNaN(lambda) || lambda <= 0) {
            setError('El parámetro Lambda (λ) debe ser mayor a 0.');
            return;
        }
        if (isNaN(nVars) || nVars < 1) {
            setError('Debes simular al menos 1 variable.');
            return;
        }
        if (isNaN(nObs) || nObs < 1) {
            setError('Debes simular al menos 1 observación.');
            return;
        }

        // --- GENERACIÓN DE DATOS ---
        const database = []; // Aquí guardaremos las columnas
        const statsPerVariable = []; // Para calcular el promedio de cada columna

        // Bucle 1: Iterar por cada Variable (Columna) que pidió el usuario
        for (let v = 0; v < nVars; v++) {
            const colData = [];
            let sumX = 0;

            // Bucle 2: Iterar por cada Observación (Fila)
            for (let i = 0; i < nObs; i++) {
                const R = Math.random(); // Generamos número aleatorio (0 a 1)
                let X = 0; // Valor resultante

                if (config.distType === 'exponential') {
                    // --- ALGORITMO EXPONENCIAL (6 Puntos) ---
                    // DEFENSA: Usamos el método de la Transformada Inversa.
                    // Fórmula: X = -ln(1 - R) / lambda
                    // Explicación: Despejamos X de la función acumulada F(x) = 1 - e^(-lambda*x)
                    X = -Math.log(1 - R) / lambda;
                } 
                else {
                    // --- ALGORITMO POISSON (6 Puntos) ---
                    // DEFENSA: Usamos el método de búsqueda inversa acumulativa.
                    // Explicación: Sumamos las probabilidades P(x) una a una hasta superar el número aleatorio R.
                    // P(x) = (e^-lambda * lambda^x) / x!
                    
                    const Limit = Math.exp(-lambda); // e^-lambda
                    let p = Limit;      // Probabilidad actual
                    let F = Limit;      // Probabilidad acumulada
                    let k = 0;          // Contador de eventos

                    // Mientras el aleatorio sea mayor que lo acumulado, seguimos sumando eventos
                    while (R > F) {
                        k++;
                        // Recurrencia para calcular el siguiente término de Poisson eficientemente
                        p = (p * lambda) / k; 
                        F += p;
                    }
                    X = k; // El valor simulado es k
                }

                colData.push(X);
                sumX += X;
            }

            database.push(colData);

            // Guardamos el promedio de esta columna para validación
            statsPerVariable.push({
                variableIndex: v + 1,
                meanSimulated: sumX / nObs
            });
        }

        // 3. Formatear los datos para la tabla (Transponer filas y columnas)
        const tableRows = [];
        for (let i = 0; i < nObs; i++) {
            const rowObj = { id: i + 1 };
            for (let v = 0; v < nVars; v++) {
                rowObj[`var_${v+1}`] = database[v][i];
            }
            tableRows.push(rowObj);
        }

        // 4. Calcular Datos Teóricos para comparar
        let theoreticalMean = 0;
        let theoreticalDesc = '';
        
        if (config.distType === 'poisson') {
            theoreticalMean = lambda; 
            theoreticalDesc = 'En Poisson, el promedio teórico es igual a λ.';
        } else {
            theoreticalMean = 1 / lambda; 
            theoreticalDesc = 'En Exponencial, el promedio teórico es 1/λ.';
        }

        setResults({
            tableRows,
            statsPerVariable,
            theoreticalMean,
            theoreticalDesc,
            config
        });
    };

    // --- VISTA (RENDER) ---
    return (
        <div className="max-w-7xl mx-auto text-white print:text-black print:bg-white sm:p-6 lg:p-8 font-sans">
            
            <div className="flex flex-col md:flex-row gap-8">

                {/* --- FORMULARIO DE ENTRADA (Izquierda) --- */}
                <div className="md:w-1/3 print:hidden">
                    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 sticky top-6">
                        <h1 className="text-2xl font-extrabold mb-2 text-center text-white">
                            Generador Monte Carlo
                        </h1>
                        <p className="text-gray-400 text-center mb-6 text-sm">Evaluación Tema 5</p>
                        
                        <form onSubmit={calculateSimulation} className="space-y-5">
                            
                            {/* SELECCIÓN DE DISTRIBUCIÓN (Requerimiento 1) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">1. Tipo de Distribución</label>
                                <select 
                                    name="distType" 
                                    value={config.distType} 
                                    onChange={handleInputChange}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="poisson">Distribución Poisson (Discreta)</option>
                                    <option value="exponential">Distribución Exponencial (Continua)</option>
                                </select>
                            </div>

                            {/* INPUT LAMBDA (Requerimiento 2) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    2. Parámetro Lambda (λ)
                                </label>
                                <input 
                                    type="number" 
                                    step="any"
                                    name="lambda"
                                    value={config.lambda} 
                                    onChange={handleInputChange} 
                                    placeholder={config.distType === 'poisson' ? "Ej: 5 (tasa media)" : "Ej: 0.5"}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-emerald-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {config.distType === 'poisson' 
                                        ? "Número promedio de eventos." 
                                        : "Tasa de ocurrencia (Media = 1/λ)."}
                                </p>
                            </div>

                            {/* INPUT VARIABLES (Requerimiento 3) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">3. Variables a Simular (Columnas)</label>
                                <input 
                                    type="number" 
                                    name="numVariables"
                                    value={config.numVariables} 
                                    onChange={handleInputChange} 
                                    min="1"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            {/* INPUT OBSERVACIONES (Requerimiento 4) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">4. Cantidad de Observaciones (Filas)</label>
                                <input 
                                    type="number" 
                                    name="numObservations"
                                    value={config.numObservations} 
                                    onChange={handleInputChange} 
                                    min="1"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg mt-4">
                                Generar Base de Datos
                            </button>
                            
                            {error && <div className="bg-red-900/30 border border-red-500/50 text-red-300 p-3 rounded text-sm text-center">{error}</div>}
                        </form>
                    </div>
                </div>

                {/* --- RESULTADOS (Derecha) --- */}
                <div className="md:w-2/3 print:w-full">
                    {results ? (
                        <div className="space-y-6 animate-fade-in">
                            
                            {/* Título para Impresión */}
                            <div className="hidden print:block mb-4 border-b pb-2">
                                <h2 className="text-2xl font-bold text-black">Reporte de Simulación</h2>
                                <div className="text-sm grid grid-cols-2 gap-4 mt-2 text-gray-700">
                                    <p>Distribución: <b>{results.config.distType.toUpperCase()}</b></p>
                                    <p>Lambda: <b>{results.config.lambda}</b></p>
                                </div>
                            </div>

                            {/* VALIDACIÓN (Punto clave para la defensa) */}
                            <div className="bg-gray-800/80 p-5 rounded-xl border border-gray-600 print:bg-gray-100 print:border-gray-300 print:text-black">
                                <h3 className="text-lg font-bold text-emerald-400 mb-3 print:text-emerald-700">📊 Validación del Modelo</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    
                                    {/* Tarjeta Media Teórica */}
                                    <div className="bg-gray-700/50 p-3 rounded print:bg-white print:border">
                                        <p className="text-xs text-gray-400 print:text-gray-600 font-bold uppercase">Media Teórica</p>
                                        <p className="text-2xl font-bold text-blue-300 print:text-black">{results.theoreticalMean.toFixed(4)}</p>
                                        <p className="text-[10px] text-gray-500 leading-tight mt-1">{results.theoreticalDesc}</p>
                                    </div>
                                    
                                    {/* Tarjeta Media Simulada */}
                                    <div className="bg-gray-700/50 p-3 rounded print:bg-white print:border col-span-2">
                                        <p className="text-xs text-gray-400 mb-2 print:text-gray-600 font-bold uppercase">Medias Simuladas (Promedio de los datos generados)</p>
                                        <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto custom-scrollbar">
                                            {results.statsPerVariable.map(stat => (
                                                <div key={stat.variableIndex} className="flex items-center gap-2 text-xs bg-gray-800 px-2 py-1 rounded border border-gray-600 print:bg-gray-200 print:text-black">
                                                    <span className="font-bold text-gray-400">Var {stat.variableIndex}:</span>
                                                    <span className={`${
                                                        Math.abs(stat.meanSimulated - results.theoreticalMean) < (results.theoreticalMean * 0.15) 
                                                        ? 'text-emerald-400 font-bold' 
                                                        : 'text-yellow-400'
                                                    } print:text-black`}>
                                                        {stat.meanSimulated.toFixed(4)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1">
                                            * Si los valores simulados son cercanos a la teórica, el modelo es correcto.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* TABLA DE BASE DE DATOS (Lo que pide el requerimiento 1) */}
                            <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700 print:bg-white print:shadow-none print:border-gray-300 print:p-0">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-bold text-emerald-400 print:text-black">Base de Datos Generada</h2>
                                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded print:hidden">
                                        {results.tableRows.length} Observaciones
                                    </span>
                                </div>
                                
                                <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar border border-gray-700 rounded-lg print:border-gray-300">
                                    <table className="w-full text-sm text-left border-collapse">
                                        <thead className="bg-gray-900 text-gray-200 sticky top-0 z-10 print:bg-gray-200 print:text-black">
                                            <tr>
                                                <th className="p-3 border-b border-gray-700 font-mono w-16 text-center print:border-gray-400 bg-gray-900 print:bg-gray-200">ID</th>
                                                {Array.from({ length: parseInt(results.config.numVariables) }).map((_, i) => (
                                                    <th key={i} className="p-3 border-b border-gray-700 print:border-gray-400 whitespace-nowrap bg-gray-900 print:bg-gray-200">
                                                        Variable {i + 1}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700 print:divide-gray-300 print:text-black bg-gray-800/50 print:bg-white">
                                            {results.tableRows.slice(0, 500).map((row) => (
                                                <tr key={row.id} className="hover:bg-gray-700/50 transition-colors">
                                                    <td className="p-2 text-center font-mono text-gray-500 border-r border-gray-700 print:border-gray-300 print:text-black">
                                                        {row.id}
                                                    </td>
                                                    {Array.from({ length: parseInt(results.config.numVariables) }).map((_, i) => (
                                                        <td key={i} className="p-2 font-mono text-emerald-300 print:text-black">
                                                            {config.distType === 'exponential' 
                                                                ? row[`var_${i+1}`].toFixed(5) 
                                                                : row[`var_${i+1}`]}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {results.tableRows.length > 500 && (
                                    <p className="text-center text-xs text-gray-500 mt-2 p-2 bg-gray-900/50 rounded">
                                        ⚠️ Se muestran solo los primeros 500 registros para mantener la fluidez.
                                    </p>
                                )}
                            </div>

                        </div>
                    ) : (
                        // ESTADO VACÍO (Instrucciones)
                        <div className="h-full flex flex-col items-center justify-center bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-xl p-12 text-center min-h-[400px]">
                            <div className="text-6xl mb-4 opacity-50 grayscale">🎲</div>
                            <h3 className="text-xl font-bold text-white mb-2">Simulador de Bases de Datos</h3>
                            <p className="text-gray-400 max-w-md text-sm">
                                Configura los parámetros a la izquierda para generar variables aleatorias usando el Método de Monte Carlo (Transformada Inversa).
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- BOTONES DE NAVEGACIÓN --- */}
            <div className="flex justify-between items-center mt-8 print:hidden">
                <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                     &larr; Volver al menú
                </Link>
                
                {results && (
                    <button 
                        onClick={handlePrint} 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300 shadow-lg flex items-center gap-2"
                    >
                        <span>Imprimir Reporte</span>
                        <span className="text-lg">🖨️</span>
                    </button>
                )}
            </div>

        </div>
    );
}

export default MonteCarlo_Av
