import React, { useEffect, useRef, useState } from 'react';
// Asumiremos que 'Link' de 'react-router-dom' está disponible en tu proyecto
// import { Link } from 'react-router-dom';

// Componente Link de reemplazo por si react-router-dom no está configurado
const Link = ({ to, children, ...props }) => (
    <a href={to} {...props}>{children}</a>
);

// Función para imprimir (fuera del componente para evitar que se recree en cada render)
const handlePrint = () => {
    window.print();
};

function Server_sin_cola_varios_av() {
    // --- ESTADOS ---
    const [inputs, setInputs] = useState({ lambda: '', mu: '' }); // K eliminado
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1); // Solo 2 pasos ahora

    // Estados del Asistente
    const [showIntro, setShowIntro] = useState(true);
    const [assistantActive, setAssistantActive] = useState(true);
    const [showCongrats, setShowCongrats] = useState(false);

    // Refs para foco automático
    const lambdaRef = useRef(null);
    const muRef = useRef(null);
    // kRef eliminado

    // Efecto para foco automático
    useEffect(() => {
        if (!showIntro && assistantActive) { // Solo enfocar si el asistente está activo y la intro cerrada
           if (step === 1) lambdaRef.current?.focus();
           if (step === 2) muRef.current?.focus();
           // No hay paso 3
        }
    }, [step, showIntro, assistantActive]);


    useEffect(() => {
        // Si se muestra la intro, el asistente no está activo (no mostrar burbujas)
        // Si la intro se cierra, el asistente se activa (mostrar burbujas)
        setAssistantActive(!showIntro);
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

    // --- FUNCIÓN CENTRAL DE CÁLCULO M/M/1 ---
    const computeResultsForMM1 = (lambdaVal, muVal) => {
        const lambdaNum = parseFloat(lambdaVal);
        const muNum = parseFloat(muVal);

        // Validación básica de entradas
        if (isNaN(lambdaNum) || isNaN(muNum) || lambdaNum <= 0 || muNum <= 0) {
            setError('Por favor, ingresa valores numéricos válidos y positivos para λ y μ.');
            setResults(null);
            return null;
        }

        // Condición de estabilidad para el modelo M/M/1
        if (lambdaNum >= muNum) {
            setError('La tasa de llegada (λ) debe ser menor que la tasa de servicio (μ) para que el sistema sea estable.');
            setResults(null);
            return null;
        }
        
        setError(''); // Limpia errores si los datos son válidos

        // Fórmulas del modelo M/M/1
        const rho = lambdaNum / muNum;
        const Ls = lambdaNum / (muNum - lambdaNum);
        const Lq = rho * Ls;
        const Ws = Ls / lambdaNum;
        const Wq = Lq / lambdaNum;
        const P0 = 1 - rho;

        // Generación de la Tabla de Probabilidad (Lógica Dinámica)
        const probabilityTable = [];
        let n = 0;
        const MIN_PROBABILITY = 0.00001; // 1e-5
        const MAX_CUMULATIVE_PROB = 0.999995;
        const SAFETY_MAX_ITERATIONS = 1000;
        let cumulativeFn = 0;

        while (n <= SAFETY_MAX_ITERATIONS) {
            const Pn = (n === 0) ? P0 : probabilityTable[n - 1].Pn * rho;
            cumulativeFn += Pn;
            const Fn = Math.min(cumulativeFn, 1.0);
            probabilityTable.push({ n, Pn, Fn });
            if (n > 0 && (Pn < MIN_PROBABILITY || Fn >= MAX_CUMULATIVE_PROB)) {
                break;
            }
            n++;
        }

        return {
            lambda: lambdaNum, // Guardar numérico
            mu: muNum,       // Guardar numérico
            rho, Ls, Lq, Ws, Wq, P0, probabilityTable
        };
    };

    // --- MANEJADOR DEL BOTÓN CALCULAR ---
    const handleCalculate = (e) => {
        e.preventDefault();
        
        const calculatedResults = computeResultsForMM1(inputs.lambda, inputs.mu);

        if (calculatedResults) {
            // Guardamos los resultados numéricos directamente
            setResults(calculatedResults); 
            
            // Ocultar asistente y mostrar felicitación
            setAssistantActive(false);
            setShowIntro(false); // Asegurarse que la intro esté cerrada
            setShowCongrats(true);
        }
        // Si 'calculatedResults' es null, la función computeResultsForMM1 ya estableció el error.
    };

    // Componente reutilizable para las tarjetas de métricas
    const MetricCard = ({ label, value, highlight }) => (
        <div className={`p-3 rounded-lg text-center print:bg-gray-200 print:text-black print:border print:border-gray-400 ${highlight ? 'bg-emerald-700/30 ring-2 ring-emerald-400' : 'bg-gray-800/70'}`}>
            <p className={`text-xs ${highlight ? 'text-white' : 'text-gray-400'} print:text-gray-600 font-medium`}>{label}</p>
            {/* Formatear a 4 decimales al mostrar */}
            <p className={`text-xl font-bold ${highlight ? 'text-white' : 'text-emerald-400'} print:text-emerald-700 mt-1`}>
                {typeof value === 'number' ? value.toFixed(4) : 'N/A'}
            </p>
        </div>
    );

    // --- GUÍA DE INTERPRETACIÓN ---
    const [showGuide, setShowGuide] = useState(false);
    const [guideStep, setGuideStep] = useState(0);
    const [originalResults, setOriginalResults] = useState(null);
    const [simulated, setSimulated] = useState(false);

    // Guía adaptada para M/M/1 (sin K ni Pk)
    const guideSteps = [
        { key: 'rho', title: 'Utilización (ρ)', desc: 'ρ = λ / μ — indica la fracción del tiempo que el servidor está ocupado. Valores cercanos a 1 implican congestionamiento.', recommendation: 'Si ρ está cerca de 1 (>0.8), considera aumentar μ o reducir λ.', target: 'mu', delta: 1 }, // Simular aumentar mu
        { key: 'Ls', title: 'Clientes en Sistema (Ls)', desc: 'Ls es el número promedio de clientes en el sistema (esperando + en servicio).', recommendation: 'Reducir λ o aumentar μ para bajar Ls.', target: 'lambda', delta: -1 }, // Simular reducir lambda
        { key: 'Lq', title: 'Clientes en Cola (Lq)', desc: 'Lq es el número promedio de clientes esperando en cola.', recommendation: 'Incrementar la capacidad de servicio (μ).', target: 'mu', delta: 1 },
        { key: 'Wq', title: 'Tiempo en Cola (Wq)', desc: 'Wq es el tiempo promedio de espera en cola.', recommendation: 'Si Wq es alto, prioriza aumentar μ.', target: 'mu', delta: 1 },
        { key: 'Ws', title: 'Tiempo en Sistema (Ws)', desc: 'Ws es el tiempo promedio total en el sistema (espera + servicio).', recommendation: 'Mejorar el servicio (aumentar μ) para reducir Ws.', target: 'mu', delta: 1 },
        { key: 'P0', title: 'Prob. Sistema Vacío (P0)', desc: 'P0 = 1 - ρ. Es la probabilidad de que no haya nadie en el sistema.', recommendation: 'Un P0 alto significa baja utilización. Un P0 bajo significa alta utilización.', target: 'lambda', delta: 1 }, // Simular aumentar lambda
    ];


    const simulateChange = (field, delta) => {
        if (!results) return;
        // Guardar original solo la primera vez que se simula
        if (!originalResults) setOriginalResults({...results}); // Copiar objeto
        
        let currentResults = simulated ? results : originalResults || results; // Usar el original si es la primera simulación
        
        // Usamos los valores numéricos actuales
        let newLambda = currentResults.lambda;
        let newMu = currentResults.mu;

        if (field === 'lambda') newLambda = Math.max(0.0001, newLambda + delta);
        if (field === 'mu') newMu = Math.max(0.0001, newMu + delta);
        
        // --- VALIDACIÓN M/M/1 ---
        if (newLambda >= newMu) {
            setError('La simulación produce λ >= μ, lo cual haría el sistema inestable. Ajusta los valores o la simulación.');
            // Opcional: No actualizar los resultados si la simulación no es válida
            // return; 
             // O mejor: Mostrar el error pero permitir ver los inputs inválidos temporalmente
             // (Decidimos recalcular para mostrar el error de computeResultsForMM1)
        }

        // Recalcular con los nuevos valores simulados
        const sim = computeResultsForMM1(newLambda, newMu);
        
        if (!sim) { 
            // computeResultsForMM1 ya estableció el error si la simulación es inválida (lambda >= mu)
            // Podríamos querer mostrar los valores simulados inválidos temporalmente
             setInputs({lambda: newLambda.toFixed(4), mu: newMu.toFixed(4) }); // Actualiza inputs para ver valores inválidos
             setResults(null); // Limpiar resultados válidos
             setSimulated(true); // Indicar que estamos en modo simulación (aunque inválida)

            return; 
        }

        // Si la simulación es válida, actualizar resultados
        setResults(sim);
        setInputs({lambda: sim.lambda.toFixed(4), mu: sim.mu.toFixed(4) }); // Actualiza inputs con valores simulados válidos
        setSimulated(true);
        setError(''); // Limpiar error si la simulación es válida
    };

    const restoreOriginal = () => {
        if (originalResults) {
            setResults(originalResults);
            setInputs({ lambda: originalResults.lambda.toFixed(4), mu: originalResults.mu.toFixed(4) }); // Restaurar inputs
            setOriginalResults(null); // Limpiar el estado original guardado
            setSimulated(false); // Salir del modo simulación
            setError('');
        }
    };

    return (
        <div className="max-w-6xl mx-auto text-white print:text-black print:bg-white p-4 font-sans">
            {/* Estilos específicos para impresión y animaciones */}
            <style>
               {`
                   @media print {
                       body {-webkit-print-color-adjust: exact; color-adjust: exact;}
                       .print\\:hidden { display: none; } .print\\:block { display: block; }
                       .print\\:text-black { color: black; } .print\\:bg-white { background-color: white; }
                       .print\\:border { border-width: 1px; } .print\\:border-gray-400 { border-color: #cbd5e0; }
                       .print\\:p-0 { padding: 0; } .print\\:shadow-none { box-shadow: none; }
                       .print\\:text-xl { font-size: 1.25rem; } .print\\:text-gray-600 { color: #718096; }
                       .print\\:text-emerald-700 { color: #047857; } .print\\:mt-8 { margin-top: 2rem; }
                       .print\\:border-collapse { border-collapse: collapse; } .print\\:bg-gray-300 { background-color: #e2e8f0; }
                       .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
                       table, tr, td, th, thead, tbody { break-inside: avoid !important; page-break-inside: avoid !important; }
                   }
                   @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                   .animate-scale-in { animation: scale-in 0.3s ease-out forwards; }
                   @keyframes float-up { 0% { transform: translateY(10px); opacity: 0; } 100% { transform: translateY(-50%); opacity: 1; } }
                   .animate-float-up { animation: float-up 0.4s ease-out forwards; }
               `}
           </style>

            <div className="flex flex-col md:flex-row gap-8">

                {/* --- COLUMNA 1: FORMULARIO --- */}
                <div className="md:w-1/3 print:hidden">
                    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 h-full relative">
                        {/* Modal Introductorio */}
                        {showIntro && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowIntro(false)}></div>
                                <div className="relative bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl border border-gray-700 animate-scale-in">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-emerald-500 rounded-full p-3">
                                            {/* Icono Robot */}
                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
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

                        <h1 className="text-2xl font-extrabold mb-2 text-center text-white">M/M/1</h1>
                        <p className="text-gray-400 text-center mb-6 text-sm">Un Servidor, Cola Infinita</p>
                        
                        <form onSubmit={handleCalculate}>
                            <div className="space-y-4 mb-6">
                                {/* Paso 1: λ */}
                                <div className="relative">
                                    <label htmlFor="lambda" className="block text-sm font-medium text-gray-300 mb-1">Tasa de llegada (λ)</label>
                                     {step === 1 && ( // Mostrar explicación solo en el paso 1
                                         <div className="bg-gray-700/40 border border-gray-600 p-3 rounded-md mb-2 flex items-start gap-3">
                                             <div className="flex-shrink-0 mt-0.5"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-300" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3a1 1 0 00.293.707l2 2a1 1 0 101.414-1.414L11 9.586V7z" clipRule="evenodd" /></svg></div>
                                             <div><p className="text-xs text-gray-200 font-medium">Explicación</p><p className="text-sm text-gray-300">λ es la tasa promedio de llegadas (clientes/unidad de tiempo). Debe ser positivo.</p></div>
                                         </div>
                                     )}
                                    <input ref={lambdaRef} type="number" step="any" name="lambda" id="lambda" value={inputs.lambda} onChange={handleInputChange}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const v = parseFloat(inputs.lambda); if (!isNaN(v) && v > 0) { setError(''); setStep(2); } else { setError('λ debe ser numérico y positivo.'); setResults(null); } } }}
                                        placeholder="Ej: 8" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                                    />
                                    {/* Burbuja del Asistente - Paso 1 */}
                                    {assistantActive && step === 1 && ( <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 w-64 z-40 hidden md:block"><div className="bg-emerald-600 text-white p-2 rounded-lg shadow-lg animate-float-up"><p className="text-sm font-medium">Paso 1</p><p className="text-xs mt-1">Introduce λ y presiona Enter o usa Siguiente.</p></div></div> )}
                                    <div className="flex justify-end mt-2"> {step === 1 && <button type="button" onClick={() => { const v = parseFloat(inputs.lambda); if (!isNaN(v) && v > 0) { setError(''); setStep(2); } else { setError('λ debe ser numérico y positivo.'); setResults(null); } }} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded-md text-sm">Siguiente</button>} </div>
                                </div>

                                {/* Paso 2: μ */}
                                {step >= 2 && (
                                    <div className="relative">
                                        <label htmlFor="mu" className="block text-sm font-medium text-gray-300 mb-1">Tasa de servicio (μ)</label>
                                         {step === 2 && ( // Mostrar explicación solo en el paso 2
                                            <div className="bg-gray-700/40 border border-gray-600 p-3 rounded-md mb-2 flex items-start gap-3">
                                                 <div className="flex-shrink-0 mt-0.5"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-300" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.974a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.388 2.462a1 1 0 00-.364 1.118l1.287 3.974c.3.921-.755 1.688-1.54 1.118L10 15.347l-3.388 2.462c-.784.57-1.839-.197-1.54-1.118l1.287-3.974a1 1 0 00-.364-1.118L2.608 9.401c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69L9.049 2.927z"/></svg></div>
                                                 {/* CORRECCIÓN: Escapar el carácter '>' */}
                                                 <div><p className="text-xs text-gray-200 font-medium">Explicación</p><p className="text-sm text-gray-300">μ es la tasa promedio de servicio. ¡Importante: μ debe ser mayor que λ (&gt; λ)!</p></div>
                                            </div>
                                         )}
                                        <input ref={muRef} type="number" step="any" name="mu" id="mu" value={inputs.mu} onChange={handleInputChange}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCalculate(e); } }} // Calcular al presionar Enter
                                            placeholder="Ej: 10" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                                        />
                                        {/* Burbuja del Asistente - Paso 2 */}
                                        {/* CORRECCIÓN: Escapar el carácter '>' */}
                                        {assistantActive && step === 2 && ( <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 w-64 z-40 hidden md:block"><div className="bg-emerald-600 text-white p-2 rounded-lg shadow-lg animate-float-up"><p className="text-sm font-medium">Paso 2</p><p className="text-xs mt-1">Introduce μ (debe ser &gt; λ) y presiona Enter o Calcular.</p></div></div> )}
                                        {/* No hay botón Siguiente aquí, se usa Calcular */}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300">Calcular</button>
                                <button type="button" onClick={() => { setStep(1); setInputs({ lambda: '', mu: '' }); setResults(null); setError(''); setAssistantActive(true); setShowIntro(true); setShowCongrats(false); restoreOriginal(); /* Restaura si estaba simulando */ }}
                                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-300"
                                >Reiniciar</button>
                            </div>
                            {error && <p className="text-red-400 text-center mt-4 text-sm">{error}</p>}
                        </form>
                    </div>
                </div>

                 {/* --- COLUMNA 2: RESULTADOS --- */}
                 <div className="md:w-2/3 print:w-full">
                     {/* Encabezado Impresión */}
                     {results && ( <div className="hidden print:block mb-6"><h1 className="text-3xl font-bold mb-2 text-center text-black">Reporte M/M/1</h1><p className="text-center text-gray-600 mb-4">Parámetros: λ = {results.lambda.toFixed(3)} | μ = {results.mu.toFixed(3)}</p></div> )}

                     {/* Contenedor Resultados */}
                     {results ? (
                         <div className="space-y-8">
                             {/* Métricas */}
                             <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 print:bg-white print:p-0 print:shadow-none print:border-none break-inside-avoid">
                                 <h2 className="text-xl font-bold mb-4 text-center text-emerald-400 print:text-xl print:text-black">Métricas de Rendimiento</h2>
                                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                     {/* Usar resultados numéricos del estado */}
                                     <MetricCard label="Utilización (ρ)" value={results.rho} highlight={guideSteps[guideStep].key === 'rho'}/>
                                     <MetricCard label="Clientes en Cola (Lq)" value={results.Lq} highlight={guideSteps[guideStep].key === 'Lq'}/>
                                     <MetricCard label="Clientes en Sistema (Ls)" value={results.Ls} highlight={guideSteps[guideStep].key === 'Ls'}/>
                                     <MetricCard label="Tiempo en Cola (Wq)" value={results.Wq} highlight={guideSteps[guideStep].key === 'Wq'}/>
                                     <MetricCard label="Tiempo en Sistema (Ws)" value={results.Ws} highlight={guideSteps[guideStep].key === 'Ws'}/>
                                     <MetricCard label="Prob. Sistema Vacío (P0)" value={results.P0} highlight={guideSteps[guideStep].key === 'P0'}/>
                                 </div>
                             </div>

                             {/* Tabla Probabilidad */}
                             <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 print:bg-white print:p-0 print:shadow-none print:border-none break-inside-avoid">
                                 <h2 className="text-xl font-bold mb-4 text-center text-emerald-400 print:text-xl print:text-black print:mt-8">Tabla de Probabilidad</h2>
                                 <div className="overflow-x-auto max-h-96">
                                     <table className="w-full text-left print:border-collapse text-sm">
                                         <thead className="bg-gray-700/50 print:bg-gray-300 print:text-black sticky top-0">
                                             <tr>
                                                 <th className="p-3 print:border print:border-gray-500">Clientes (n)</th>
                                                 <th className="p-3 print:border print:border-gray-500">Probabilidad (Pn)</th>
                                                 <th className="p-3 print:border print:border-gray-500">Prob. Acumulada (Fn)</th>
                                             </tr>
                                         </thead>
                                         <tbody className="print:text-black">
                                             {results.probabilityTable.map((row) => (
                                                 <tr key={row.n} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700/30 print:border-gray-400" style={{ breakInside: 'avoid' }}>
                                                     <td className="p-3 print:border print:border-gray-400">{row.n}</td>
                                                     {/* Formato 5 decimales */}
                                                     <td className="p-3 print:border print:border-gray-400">{row.Pn.toFixed(5)}</td>
                                                     <td className="p-3 print:border print:border-gray-400">{row.Fn.toFixed(5)}</td>
                                                 </tr>
                                             ))}
                                         </tbody>
                                     </table>
                                 </div>
                             </div>

                            {/* Guía Interpretación */}
                            <div className="mt-6 print:hidden">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-bold text-emerald-300">Guía de interpretación</h3>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => { setShowGuide(!showGuide); if (!showGuide) setGuideStep(0); }} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm">{showGuide ? 'Cerrar guía' : 'Abrir guía'}</button>
                                        {simulated && <button onClick={restoreOriginal} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">Restaurar Original</button>}
                                    </div>
                                </div>
                                {showGuide && (
                                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 animate-scale-in">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Descripción y Recomendación */}
                                            <div className="md:col-span-2">
                                                <h4 className="text-white font-semibold">{guideSteps[guideStep].title}</h4>
                                                <p className="text-gray-300 text-sm mt-2">{guideSteps[guideStep].desc}</p>
                                                <p className="text-gray-400 text-sm mt-2">Recomendación: {guideSteps[guideStep].recommendation}</p>
                                                {/* Botones Navegación y Simulación */}
                                                <div className="flex gap-2 mt-4">
                                                    <button onClick={() => setGuideStep(Math.max(0, guideStep - 1))} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm" disabled={guideStep === 0}>Anterior</button>
                                                    <button onClick={() => setGuideStep(Math.min(guideSteps.length - 1, guideStep + 1))} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-sm" disabled={guideStep === guideSteps.length - 1}>Siguiente</button>
                                                    <button onClick={() => simulateChange(guideSteps[guideStep].target, guideSteps[guideStep].delta)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">Simular ({guideSteps[guideStep].target} {guideSteps[guideStep].delta > 0 ? `+${guideSteps[guideStep].delta}` : guideSteps[guideStep].delta})</button>
                                                </div>
                                            </div>
                                            {/* Métricas Actuales */}
                                            <div>
                                                <p className="text-xs text-gray-400 mb-2">Métricas actuales</p>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {guideSteps.map((stepInfo, idx) => {
                                                         const value = results[stepInfo.key]; // Acceder al valor numérico
                                                         const isActive = guideStep === idx;
                                                        return (
                                                             <div key={stepInfo.key} role="button" tabIndex={0}
                                                                  onClick={() => { setGuideStep(idx); if (!showGuide) setShowGuide(true); }}
                                                                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setGuideStep(idx); if (!showGuide) setShowGuide(true); } }}
                                                                  className="cursor-pointer"
                                                             >
                                                                  <MetricCard label={stepInfo.title} value={value} highlight={isActive} />
                                                             </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>


                         </div>
                     ) : (
                         <div className="flex items-center justify-center h-full bg-gray-800 p-10 rounded-xl shadow-2xl border border-gray-700 text-center">
                             <p className="text-gray-400 text-lg">Ingresa los datos para ver las métricas M/M/1.</p>
                         </div>
                     )}
                 </div>
            </div>

            {/* Botones Inferiores */}
            <div className="flex justify-between items-center mt-8 print:hidden">
                <Link to="/" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition"> &larr; Volver </Link>
                {results && ( <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition"> Imprimir 🖨️ </button> )}
            </div>

            {/* Toast Felicitación */}
            {showCongrats && ( <div className="fixed top-6 right-6 z-50"><div className="bg-emerald-600 text-white p-3 rounded-lg shadow-xl flex items-center gap-3 animate-scale-in"><div className="bg-white/20 rounded-full p-2">{/* Icon */} <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.974a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.388 2.462a1 1 0 00-.364 1.118l1.287 3.974c.3.921-.755 1.688-1.54 1.118L10 15.347l-3.388 2.462c-.784.57-1.839-.197-1.54-1.118l1.287-3.974a1 1 0 00-.364-1.118L2.608 9.401c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69L9.049 2.927z" /></svg></div><div><p className="font-bold">¡Calculado!</p><p className="text-xs">Resultados M/M/1 listos.</p></div></div></div> )}
        </div>
    );
}
export default Server_sin_cola_varios_av;
