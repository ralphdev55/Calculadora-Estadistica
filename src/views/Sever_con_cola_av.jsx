import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

// Función para imprimir (fuera del componente para evitar que se recree en cada render)
const handlePrint = () => {
    window.print();
};

function Server_con_cola_av() {
    const [inputs, setInputs] = useState({ lambda: '', mu: '', k: '' });
    const [results, setResults] = useState(null); 
    const [error, setError] = useState('');
    // Paso del asistente: 1=lambda, 2=mu, 3=k
    const [step, setStep] = useState(1);

    // Estado para mostrar modal de introducción del asistente
    const [showIntro, setShowIntro] = useState(true);
    // Estado para mostrar la burbuja / asistente activo
    const [assistantActive, setAssistantActive] = useState(true);
    // Estado para mostrar mensaje de felicitación al completar
    const [showCongrats, setShowCongrats] = useState(false);

    // Refs para foco automático
    const lambdaRef = useRef(null);
    const muRef = useRef(null);
    const kRef = useRef(null);

    useEffect(() => {
        if (step === 1) lambdaRef.current?.focus();
        if (step === 2) muRef.current?.focus();
        if (step === 3) kRef.current?.focus();
    }, [step]);

    useEffect(() => {
        if (showIntro) setAssistantActive(false);
        else setAssistantActive(true);
    }, [showIntro]);

    // Auto-hide del toast de felicitación
    useEffect(() => {
        if (!showCongrats) return;
        const t = setTimeout(() => setShowCongrats(false), 3000);
        return () => clearTimeout(t);
    }, [showCongrats]);


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

        // 3. ACTUALIZAR ESTADO PARA MOSTRAR RESULTADOS
        setResults({ 
            lambda: lambda.toFixed(3), 
            mu: mu.toFixed(3),
            k: k,
            rho, Ls, Lq, Ws, Wq, lambdaEfectiva, lambdaPerdida, Pk, probabilityTable 
        });
        // Ocultar asistente y mostrar felicitación
        setAssistantActive(false);
        setShowIntro(false);
        setShowCongrats(true);
    };

    // Componente reutilizable para las tarjetas de métricas (ESTILO REDISEÑADO)
    const MetricCard = ({ label, value }) => (
        // Nuevo estilo de tarjeta, más claro y compacto con acento en verde esmeralda
        <div className="bg-gray-800/70 p-3 rounded-lg text-center print:bg-gray-200 print:text-black print:border print:border-gray-400 **break-inside-avoid**">
            <p className="text-xs text-gray-400 print:text-gray-600 font-medium">{label}</p>
            <p className="text-xl font-bold text-emerald-400 print:text-emerald-700 mt-1">{value}</p>
        </div>
    );

    return (
        // Contenedor principal con max-w-6xl para aprovechar más el espacio
        <div className="max-w-6xl mx-auto text-white print:text-black print:bg-white p-4">
            
            {/* Contenedor principal para la estructura de dos columnas en escritorio */}
            <div className="flex flex-col md:flex-row gap-8">

                {/* --- COLUMNA 1: FORMULARIO DE ENTRADA (OCULTAR EN IMPRESIÓN) --- */}
                <div className="md:w-1/3 print:hidden">
                    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 h-full relative">
                        {/* Modal introductorio del asistente "Calculon" */}
                        {showIntro && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowIntro(false)}></div>
                                <div className="relative bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl border border-gray-700 animate-scale-in">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-emerald-500 rounded-full p-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.974a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.388 2.462a1 1 0 00-.364 1.118l1.287 3.974c.3.921-.755 1.688-1.54 1.118L10 15.347l-3.388 2.462c-.784.57-1.839-.197-1.54-1.118l1.287-3.974a1 1 0 00-.364-1.118L2.608 9.401c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69L9.049 2.927z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">Hola, soy Calculon 🤖</h3>
                                            <p className="text-sm text-gray-300">Te guiaré paso a paso. Empecemos por la tasa de llegada (λ).</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-end gap-2">
                                        <button onClick={() => setShowIntro(false)} className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded">Cerrar</button>
                                        <button onClick={() => { setShowIntro(false); setStep(1); }} className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded">Empezar</button>
                                    </div>
                                </div>
                            </div>
                        )}
                        <h1 className="text-2xl font-extrabold mb-2 text-center text-white">
                            M/M/1/K
                        </h1>
                        <p className="text-gray-400 text-center mb-6 text-sm">Un Servidor, Cola Finita (Capacidad K)</p>
                        
                        <form onSubmit={handleCalculate}>
                            <div className="space-y-4 mb-6">
                                {/* Paso 1: λ */}
                                <div className="relative">
                                    <label htmlFor="lambda" className="block text-sm font-medium text-gray-300 mb-1">Tasa de llegada ($\lambda$)</label>
                                    <div className="bg-gray-700/40 border border-gray-600 p-3 rounded-md mb-2 flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-0.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-300" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3a1 1 0 00.293.707l2 2a1 1 0 101.414-1.414L11 9.586V7z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-200 font-medium">Explicación</p>
                                            <p className="text-sm text-gray-300">λ es la tasa promedio de llegadas por unidad de tiempo (clientes por unidad de tiempo). Debe ser un número positivo.</p>
                                        </div>
                                    </div>
                                    <input
                                        ref={lambdaRef}
                                        type="number"
                                        name="lambda"
                                        id="lambda"
                                        value={inputs.lambda}
                                        onChange={handleInputChange}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const lambdaVal = parseFloat(inputs.lambda);
                                                if (isNaN(lambdaVal) || lambdaVal <= 0) {
                                                    setError('Por favor, ingresa un valor numérico y positivo para λ antes de continuar.');
                                                    setResults(null);
                                                    return;
                                                }
                                                setError('');
                                                setStep(2);
                                            }
                                        }}
                                        placeholder="Ej: 10"
                                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                                    />

                                    {assistantActive && !showIntro && step === 1 && (
                                        <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 w-64 z-40">
                                            <div className="bg-emerald-600 text-white p-2 rounded-lg shadow-lg animate-float-up">
                                                <p className="text-sm font-medium">Paso 1</p>
                                                <p className="text-xs mt-1">Introduce λ y presiona Enter o usa el botón Siguiente.</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex justify-end mt-2">
                                        {step === 1 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const lambdaVal = parseFloat(inputs.lambda);
                                                    if (isNaN(lambdaVal) || lambdaVal <= 0) {
                                                        setError('Por favor, ingresa un valor numérico y positivo para λ antes de continuar.');
                                                        setResults(null);
                                                        return;
                                                    }
                                                    setError('');
                                                    setStep(2);
                                                }}
                                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded-md text-sm"
                                            >Siguiente</button>
                                        )}
                                    </div>
                                </div>

                                {/* Paso 2: μ (se muestra solo si step >= 2) */}
                                {step >= 2 && (
                                    <div className="relative">
                                        <label htmlFor="mu" className="block text-sm font-medium text-gray-300 mb-1">Tasa de servicio ($\mu$)</label>
                                        <div className="bg-gray-700/40 border border-gray-600 p-3 rounded-md mb-2 flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-0.5">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-300" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.974a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.388 2.462a1 1 0 00-.364 1.118l1.287 3.974c.3.921-.755 1.688-1.54 1.118L10 15.347l-3.388 2.462c-.784.57-1.839-.197-1.54-1.118l1.287-3.974a1 1 0 00-.364-1.118L2.608 9.401c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69L9.049 2.927z"/>
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-200 font-medium">Explicación</p>
                                                <p className="text-sm text-gray-300">μ es la tasa promedio de servicio por unidad de tiempo. Para estabilidad, μ debe ser mayor que λ.</p>
                                            </div>
                                        </div>
                                        <input
                                            ref={muRef}
                                            type="number"
                                            name="mu"
                                            id="mu"
                                            value={inputs.mu}
                                            onChange={handleInputChange}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    const muVal = parseFloat(inputs.mu);
                                                    if (isNaN(muVal) || muVal <= 0) {
                                                        setError('Por favor, ingresa un valor numérico y positivo para μ antes de continuar.');
                                                        setResults(null);
                                                        return;
                                                    }
                                                    setError('');
                                                    setStep(3);
                                                }
                                            }}
                                            placeholder="Ej: 12"
                                            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                                        />

                                        {assistantActive && !showIntro && step === 2 && (
                                            <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 w-64 z-40">
                                                <div className="bg-emerald-600 text-white p-2 rounded-lg shadow-lg animate-float-up">
                                                    <p className="text-sm font-medium">Paso 2</p>
                                                    <p className="text-xs mt-1">Introduce μ y presiona Enter o usa el botón Siguiente.</p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex justify-end mt-2">
                                            {step === 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const muVal = parseFloat(inputs.mu);
                                                        if (isNaN(muVal) || muVal <= 0) {
                                                            setError('Por favor, ingresa un valor numérico y positivo para μ antes de continuar.');
                                                            setResults(null);
                                                            return;
                                                        }
                                                        setError('');
                                                        setStep(3);
                                                    }}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded-md text-sm"
                                                >Siguiente</button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Paso 3: k (solo si step === 3) */}
                                {step === 3 && (
                                    <div className="relative">
                                        <label htmlFor="k" className="block text-sm font-medium text-gray-300 mb-1">Capacidad de la cola (K)</label>
                                        <div className="bg-gray-700/40 border border-gray-600 p-3 rounded-md mb-2 flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-0.5">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-300" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M3 3a1 1 0 000 2h1v10H3a1 1 0 100 2h14a1 1 0 100-2h-1V5h1a1 1 0 100-2H3z"/>
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-200 font-medium">Explicación</p>
                                                <p className="text-sm text-gray-300">K es la capacidad total del sistema (incluye al que está en servicio). Ingresa un entero positivo.</p>
                                            </div>
                                        </div>
                                        <input
                                            ref={kRef}
                                            type="number"
                                            name="k"
                                            id="k"
                                            value={inputs.k}
                                            onChange={handleInputChange}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleCalculate(e);
                                                }
                                            }}
                                            placeholder="Ej: 5"
                                            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                                        />

                                        {assistantActive && !showIntro && (
                                            <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 w-64 z-40">
                                                <div className="bg-emerald-600 text-white p-2 rounded-lg shadow-lg animate-float-up">
                                                    <p className="text-sm font-medium">Paso 3</p>
                                                    <p className="text-xs mt-1">Introduce K y presiona Enter para calcular.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300">
                                    Calcular
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setStep(1); setInputs({ lambda: '', mu: '', k: '' }); setResults(null); setError(''); setAssistantActive(true); setShowIntro(true); setShowCongrats(false); }}
                                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-300"
                                >Reiniciar</button>
                            </div>
                            {error && <p className="text-red-400 text-center mt-4">{error}</p>}
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
                                Parámetros: $\lambda$ = {results.lambda} | $\mu$ = {results.mu} | Capacidad (K) = {results.k}
                            </p>
                        </div>
                    )}

                    {/* Contenedor de Resultados */}
                    {results ? (
                        <div className="space-y-8">
                            
                            {/* 1. Métricas de Rendimiento */}
                            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 print:bg-white print:p-0 print:shadow-none print:border-none **break-inside-avoid**">
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
                            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 print:bg-white print:p-0 print:shadow-none print:border-none **break-inside-avoid**">
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
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-800 p-10 rounded-xl shadow-2xl border border-gray-700 text-center">
                            <p className="text-gray-400 text-lg">Ingresa los datos en el formulario para ver las métricas del sistema M/M/1/K.</p>
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

            {/* Toast de felicitación de Calculon (esquina superior derecha) */}
            {showCongrats && (
                <div className="fixed top-6 right-6 z-50">
                    <div className="bg-emerald-600 text-white p-3 rounded-lg shadow-xl flex items-center gap-3 animate-scale-in">
                        <div className="bg-white/20 rounded-full p-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.974a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.388 2.462a1 1 0 00-.364 1.118l1.287 3.974c.3.921-.755 1.688-1.54 1.118L10 15.347l-3.388 2.462c-.784.57-1.839-.197-1.54-1.118l1.287-3.974a1 1 0 00-.364-1.118L2.608 9.401c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69L9.049 2.927z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-bold">¡Buen trabajo!</p>
                            <p className="text-xs">Calculon: Has completado los pasos correctamente.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Server_con_cola_av;