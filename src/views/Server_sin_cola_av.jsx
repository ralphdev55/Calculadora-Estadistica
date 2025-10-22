import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

// Función para imprimir (fuera del componente para evitar que se recree en cada render)
const handlePrint = () => {
    window.print();
};

function Server_sin_cola_av() {

    // --- ESTADOS ---
    // Almacena los valores de entrada del usuario (lambda y mu)
    const [inputs, setInputs] = useState({ lambda: '', mu: '' });
    // Almacena los resultados calculados para mostrarlos en la UI
    const [results, setResults] = useState(null);
    // Almacena cualquier mensaje de error de validación
    const [error, setError] = useState('');
    // Estado para controlar pasos del asistente (1: lambda, 2: mu)
    const [step, setStep] = useState(1);

    // Estado para mostrar modal de introducción del asistente
    const [showIntro, setShowIntro] = useState(true);
    // Estado para mostrar la burbuja / asistente activo
    const [assistantActive, setAssistantActive] = useState(true);
    // Estado para mostrar mensaje de felicitación al completar
    const [showCongrats, setShowCongrats] = useState(false);

    // Refs para controlar foco automático
    const lambdaRef = useRef(null);
    const muRef = useRef(null);

    // --- MANEJADORES DE EVENTOS ---

    // Actualiza el estado 'inputs' cada vez que el usuario escribe en un campo
    const handleInputChange = (e) => {
        setInputs({
            ...inputs,
            [e.target.name]: e.target.value
        });
    };

    // Effect para gestionar foco según el paso
    useEffect(() => {
        if (step === 1) {
            lambdaRef.current?.focus();
        } else if (step === 2) {
            muRef.current?.focus();
        }
    }, [step]);

    // Re-trigger simple animation by advancing a message key (optional)
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

    // Se ejecuta al enviar el formulario para realizar los cálculos
    const handleCalculate = (e) => {
        if (e && e.preventDefault) e.preventDefault(); // Evita que la página se recargue al enviar el formulario

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

        // Al calcular, escondemos la burbuja del asistente para no molestar
        setAssistantActive(false);
        setShowIntro(false);
        // Mostrar mensaje de felicitación
        setShowCongrats(true);
    };
    
    // Función para activar la impresión de la ventana
    const handlePrint = () => {
        window.print();
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
                            Modelo M/M/1
                        </h1>
                        <p className="text-gray-400 text-center mb-6 text-sm">Un Servidor, Cola Infinita</p>
                        
                        <form onSubmit={handleCalculate} className="space-y-4">
                            {/* Asistente secuencial: primero lambda, luego mu */}
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
                                        <p className="text-sm text-gray-300">λ es la tasa promedio de llegadas por unidad de tiempo (por ejemplo, clientes/horas). Ingresa un valor positivo.</p>
                                    </div>
                                </div>
                                <input
                                    ref={lambdaRef}
                                    type="number"
                                    step="any"
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
                                    placeholder="Ej: 8"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                                    aria-label="lambda"
                                />

                                {/* Burbuja junto al input activo (λ) */}
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
                                                // Validar λ antes de avanzar
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

                            {/* Mostrar el campo μ sólo cuando el usuario avanzó al paso 2 */}
                            {step === 2 && (
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
                                            <p className="text-sm text-gray-300">μ es la tasa promedio de servicio por unidad de tiempo. Para que el sistema sea estable, μ debe ser mayor que λ.</p>
                                        </div>
                                    </div>

                                        <input
                                            ref={muRef}
                                            type="number"
                                            step="any"
                                            name="mu"
                                            id="mu"
                                            value={inputs.mu}
                                            onChange={handleInputChange}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    // si se presiona Enter en μ, enviamos el formulario
                                                    handleCalculate(e);
                                                }
                                            }}
                                            placeholder="Ej: 10"
                                            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                                            aria-label="mu"
                                        />

                                        {/* Burbuja junto al input activo (μ) */}
                                        {assistantActive && !showIntro && step === 2 && (
                                            <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 w-64 z-40">
                                                <div className="bg-emerald-600 text-white p-2 rounded-lg shadow-lg animate-float-up">
                                                    <p className="text-sm font-medium">Paso 2</p>
                                                    <p className="text-xs mt-1">Ahora ingresa μ. Puedes presionar Enter para calcular.</p>
                                                </div>
                                            </div>
                                        )}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 mt-2">
                                    Calcular
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep(1);
                                        setInputs({ lambda: '', mu: '' });
                                        setResults(null);
                                        setError('');
                                        // Reactivar asistente y modal introductorio
                                        setAssistantActive(true);
                                        setShowIntro(true);
                                        setShowCongrats(false);
                                    }}
                                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-300 mt-2"
                                >Reiniciar</button>
                            </div>
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
                                Parámetros: $\lambda$ = {results.lambda} | $\mu$ = {results.mu}
                            </p>
                        </div>
                    )}

                    {/* Muestra los resultados o un mensaje inicial */}
                    {results ? (
                        <div className="space-y-full">
                            
                            {/* Sección de Métricas de Rendimiento */}
                            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 print:bg-white print:p-0 print:shadow-none print:border-none">
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

                            {/* Sección de la Tabla de Probabilidad */}
                            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 print:bg-white print:p-0 print:shadow-none print:border-none">
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
                            <p className="text-gray-400 text-lg">Ingresa los datos en el formulario para calcular y ver las métricas del sistema.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Botón de Imprimir que solo aparece si hay resultados (se oculta al imprimir) */}
            {results && (
                 <div className="flex justify-end items-center mt-8 print:hidden">
                    <button 
                        onClick={handlePrint} 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300"
                    >
                        Imprimir Resultados 🖨️
                    </button>
                </div>
            )}

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

export default Server_sin_cola_av;