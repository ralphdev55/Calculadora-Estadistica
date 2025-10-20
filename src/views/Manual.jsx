import React from 'react';
// 1. Importa Outlet y useLocation
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';


const calculators = [
    { name: 'Líneas de espera de un servidor sin límite de cola', path: 'serversincola', description: 'Un servidor, sin límite de cola.' }, 
    { name: 'Líneas de espera de un servidor con límite de cola', path: 'serverconcola', description: 'Un servidor, con límite de cola.' },
];

function Manual() {
    const [activeTooltip, setActiveTooltip] = useState(null); 
    
    // 2. Obtener la ubicación actual
    const location = useLocation();

    // 3. Determinar si estamos exactamente en la ruta padre (/manual).
    // Si la URL termina solo con '/manual', mostramos el menú.
    // Si es '/manual/serversincola', ocultamos el menú.
    const isParentRoute = location.pathname.endsWith('/manual') || location.pathname.endsWith('/manual/');


    return (
        <div className="flex flex-col items-center py-8">
            
            {/* 4. Renderizado Condicional: Solo muestra el menú si estamos en la ruta padre */}
            {isParentRoute ? (
                <>
                    {/* Sección de Encabezado */}
                    <div className="text-center mb-10">
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-3 text-white">
                        Cálculo Manual 🔢
                        </h1>
                        <p className="text-lg text-gray-400">
                        Introduce directamente los parámetros de tu sistema. <br></br>Modelo M/M/1 y M/M/K.
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
                    
                </>
            ) : null}
            
            <Outlet /> 

        </div>
    );
}
export default Manual;