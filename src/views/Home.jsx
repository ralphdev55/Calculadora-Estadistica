import React from 'react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const calculators = [
    { name: 'Cálculo Manual', path: 'serversincola', description: 'Introduce directamente los parámetros de tu sistema. Selecciona y calcula modelos de líneas de espera M/M/1 (sin límite) o M/M/K (con límite de cola) según tus necesidades.' }, 
    { name: 'Asistente Virtual', path: 'serverconcola', description: 'Un asistente virtual te guiará con preguntas sencillas para determinar tus parámetros y seleccionar el modelo M/M/1 (sin límite) o M/M/K (con límite de cola) adecuado.' },
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

    {/* Contenedor de los botones - AUMENTADO el ancho máximo a 'max-w-xl' (Extra Grande) */}
    <div className="grid grid-cols-2 gap-8 w-full max-w-2xl mx-auto"> 
        {calculators.map((calc) => (
        <div 
            key={calc.name} 
            className="relative w-full" 
            onMouseEnter={() => setActiveTooltip(calc.name)} 
            onMouseLeave={() => setActiveTooltip(null)} 
        >
            <Link 
            to={calc.path} 
            // CAMBIO CLAVE: Aumentamos el padding a p-8 (muy grande)
            className="group block w-full bg-gray-800 p-14 rounded-lg border border-gray-700 shadow-xl hover:border-blue-500 hover:bg-gray-700/50 transition-all duration-200 text-center"
            >
            {/* CAMBIO CLAVE: Aumentamos el tamaño del texto a text-2xl (Máximo impacto) */}
            <h3 className="font-extrabold text-gray-100 group-hover:text-white transition-colors text-2xl"> 
                {calc.name}
            </h3>
            </Link>

            {/* Tooltip flotante - Mantenemos la estructura para el tooltip */}
            {activeTooltip === calc.name && ( 
            <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 
                                    bg-blue-800/90 backdrop-blur-sm text-white text-base 
                                    p-4 rounded-lg shadow-2xl border border-blue-700 
                                    w-80 z-50 animate-fade-in-up origin-left"> 
                {calc.description}
                {/* Flecha del tooltip */}
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 
                                        border-t-8 border-t-transparent 
                                        border-b-8 border-b-transparent 
                                        border-r-8 border-r-blue-800/90"></div>
            </div>
            )}
        </div>
        ))}
    </div>
    </div>
);
}
export default Home;