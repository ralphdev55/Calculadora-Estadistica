import React from 'react';
import { NavLink } from 'react-router-dom';

function Navbar() {
const activeLinkStyle = {
    color: '#3b82f6', // Un azul brillante para el enlace activo
    fontWeight: '600',
  };

  return (
    <header className="bg-gray-800/90 backdrop-blur-sm shadow-lg sticky top-0 z-50 print:hidden">
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
        
        {/* Lado Izquierdo: Tu Marca/Logo */}
        <div className="text-white font-bold text-xl">
          {/* Aquí puedes poner tu logo o simplemente el nombre del proyecto */}
          <a href="/" className="hover:text-blue-400 transition-colors">
            <span className="text-blue-500">Calculadora</span>
          </a>
        </div>

        {/* Lado Derecho: Enlaces de Navegación (Opcional) */}
        <div className="hidden md:flex items-center space-x-6">
          <NavLink 
            to="/" 
            style={({ isActive }) => isActive ? activeLinkStyle : undefined}
            className="text-gray-300 hover:text-blue-400 transition-colors"
          >
            Inicio
          </NavLink>
        </div>

      </nav>
    </header>
  );
}

export default Navbar;