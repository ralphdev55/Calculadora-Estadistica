import React from 'react';
// 👈 Importa Outlet y useLocation
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Footer from '../components/Footer';  

const calculators = [
    { name: 'Líneas de espera de un servidor sin límite de cola', path: 'serversincola', description: 'Un servidor, sin límite de cola.' }, 
    { name: 'Líneas de espera de un servidor con límite de cola', path: 'serverconcola', description: 'Un servidor, con límite de cola.' },
];

function AsistenteVirtual() {

    const [activeTooltip, setActiveTooltip] = useState(null); 
    
    // Obtener la ubicación actual
    const location = useLocation();

    // Determinar si estamos exactamente en la ruta padre (/asistentevirtual)
    const isParentRoute = location.pathname.endsWith('/asistentevirtual') || location.pathname.endsWith('/asistentevirtual/');


    return (
        <div className="flex flex-col items-center py-8">
            
            {/* Renderizado Condicional: Solo muestra el menú si estamos en la ruta padre */}
            {isParentRoute ? (
                <>
                    {/* Sección de Encabezado */}
                    <div className="text-center mb-10">
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-3 text-white">
                        Asistente Virtual 🤖
                        </h1>
                        <p className="text-lg text-gray-400">
                        Un asistente virtual te guiará con preguntas sencillas <br></br>para determinar el modelo adecuado
                        </p>
                    </div>

                    {/* Contenedor de los botones */}
                    <div className="flex flex-col items-center gap-4 w-full max-w-lg">
                        {calculators.map((calc) => (
                        <div 
                            key={calc.name} 
                            className="relative w-full"
                            onMouseEnter={() => setActiveTooltip(calc.name)}
                            onMouseLeave={() => setActiveTooltip(null)}
                        >
                            {/* NOTA: La ruta debe ser relativa al padre: 'serversincola' */}
                            <Link 
                            to={calc.path} 
                            className="group block w-full bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-md hover:border-blue-500 hover:bg-gray-700/50 transition-all duration-200 text-center"
                            >
                            <h3 className="font-semibold text-gray-100 group-hover:text-white transition-colors">
                                {calc.name}
                            </h3>
                            </Link>

                            {/* Tooltip flotante */}
                            {activeTooltip === calc.name && (
                            <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 
                                            bg-blue-800/90 backdrop-blur-sm text-white text-sm 
                                            p-3 rounded-lg shadow-xl border border-blue-700 
                                            w-72 z-50 animate-fade-in-up origin-left">
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
                </>
            ) : null}
            
            <Outlet /> 

        </div>
    );
}
export default AsistenteVirtual;