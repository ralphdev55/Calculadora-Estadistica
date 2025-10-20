import React from 'react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import Footer from '../components/Footer';  

const calculators = [
    { 
        name: 'Cálculo Manual', 
        path: 'manual', 
        description: 'Introduce directamente los parámetros de tu sistema. Modelo M/M/1 y M/M/K.',
        icon: '🔢' 
    }, 
    { 
        name: 'Asistente Virtual', 
        path: 'asistentevirtual', 
        description: 'Un asistente de IA te guiará con preguntas sencillas para determinar el modelo adecuado.', 
        icon: '🤖'
    },
];

function Home() {

    const [activeTooltip, setActiveTooltip] = useState(null); 

return (
    <div className="flex flex-col items-center py-8"> {/* Añadí un padding vertical */}
    
    {/* Sección de Encabezado */}
    <div className="text-center mb-10"> {/* Reduje el margen inferior */}
        <h1 className="text-4xl md:text-5xl font-extrabold mb-3 text-white">
        Calculadora de Procesos
        </h1>
        <p className="text-lg text-gray-400">
        Selecciona una herramienta para comenzar tu análisis.
        </p>
    </div>

    {/* Contenedor de los botones - Mantenemos el tamaño y el grid */}
    <div className="grid grid-cols-2 gap-8 w-full max-w-2xl mx-auto"> 
        {calculators.map((calc, index) => (
        <div 
            key={calc.name} 
            className="relative w-full" 
            onMouseEnter={() => setActiveTooltip(calc.name)} 
            onMouseLeave={() => setActiveTooltip(null)} 
        >
            <Link 
            to={calc.path} 
            className="group block w-full bg-gray-800 p-14 rounded-lg border border-gray-700 shadow-xl hover:border-blue-500 hover:bg-gray-700/50 transition-all duration-200 text-center"
            >
                <h3 className="font-extrabold text-gray-100 group-hover:text-white transition-colors text-2xl 
                            flex flex-col items-center justify-center gap-2"> 
                    
                    <span className="text-5xl mb-2">{calc.icon}</span> 
                    
                    {calc.name}
                </h3>
            </Link>

            {activeTooltip === calc.name && ( 
            <div className={`absolute top-1/2 -translate-y-1/2 
                                    bg-blue-800/90 backdrop-blur-sm text-white text-base 
                                    p-4 rounded-lg shadow-2xl border border-blue-700 
                                    w-80 z-50 animate-fade-in-up ${index === 0 
                ? 'right-full mr-4 origin-right' 
                : 'left-full ml-4 origin-left'}`}> 
                
                {calc.description}
                
                <div className={`absolute top-1/2 -translate-y-1/2 w-0 h-0 
                                        border-t-8 border-t-transparent 
                                        border-b-8 border-b-transparent 
                                        ${index === 0 
                    ? 'right-[-8px] border-l-8 border-l-blue-800/90' 
                    : 'left-[-8px] border-r-8 border-r-blue-800/90'}`}></div>
            </div>
            )}
        </div>
        ))}
    </div>
    <Footer />
    </div>
);
}
export default Home;