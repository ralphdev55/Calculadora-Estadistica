import React from 'react';
import { NavLink } from 'react-router-dom';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
    <footer 
        className="bg-gray-800 text-white text-center py-6 w-full" 
    >
        <div className="max-w-6xl mx-auto px-4">
        
        {/* Derechos Reservados */}
        <p className="text-sm mb-1">
            MacaTeam &copy; {currentYear} Todos los derechos reservados.
        </p>
        
        {/* Nombres del Equipo */}
        <p className="text-xs text-gray-400">
            Grupo de desarrollo: Ralph Serra, Luis Malaver, Wilson Goncalves y Luis Rodriguez.
        </p>
        

    </div>
    </footer>
);
};

export default Footer;