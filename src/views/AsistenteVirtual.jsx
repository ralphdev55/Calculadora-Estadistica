import React from 'react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import Footer from '../components/Footer';  

const calculators = [
    { name: 'Líneas de espera de un servidor sin límite de cola', path: 'serversincola', description: 'Un servidor, sin límite de cola.' }, 
    { name: 'Líneas de espera de un servidor con límite de cola', path: 'serverconcola', description: 'Un servidor, con límite de cola.' },
];

function AsistenteVirtual() {

    const [activeTooltip, setActiveTooltip] = useState(null); 

return (
    <div className="flex flex-col items-center py-8"> {/* Añadí un padding vertical */}
    
    {/* Sección de Encabezado */}
    <div className="text-center mb-10"> {/* Reduje el margen inferior */}
        <h1 className="text-4xl md:text-5xl font-extrabold mb-3 text-white">
        Asistente Virtual 🤖
        </h1>
        <p className="text-lg text-gray-400">
        Un asistente de IA te guiará con preguntas sencillas <br></br>para determinar el modelo adecuado
        </p>
    </div>

    {/* Contenedor de los botones */}
    <div className="flex flex-col items-center gap-4 w-full max-w-lg"> {/* Aumenté el gap */}
        {calculators.map((calc) => (
        // Cada Link ahora es un contenedor para el botón y su tooltip
        <div 
            key={calc.name} 
            className="relative w-full" // Establece el contexto para el posicionamiento absoluto del tooltip
            onMouseEnter={() => setActiveTooltip(calc.name)} // Guarda el nombre de la calc. activa
            onMouseLeave={() => setActiveTooltip(null)} // Limpia el estado cuando el mouse sale
        >
            <Link 
            to={calc.path} 
            className="group block w-full bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-md hover:border-blue-500 hover:bg-gray-700/50 transition-all duration-200 text-center"
            >
            <h3 className="font-semibold text-gray-100 group-hover:text-white transition-colors">
                {calc.name}
            </h3>
            </Link>

            {/* Tooltip flotante */}
            {activeTooltip === calc.name && ( // Solo se muestra si este botón es el activo
            <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 
                            bg-blue-800/90 backdrop-blur-sm text-white text-sm 
                            p-3 rounded-lg shadow-xl border border-blue-700 
                            w-72 z-50 animate-fade-in-up origin-left"> {/* Clases de animación y ancho */}
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
    <Footer />
    </div>
);
}
export default AsistenteVirtual;