import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";

function App() {
  return (
    <div className="flex min-h-screen bg-gray-900"> 
      
      {/* Sidebar (fijo a la izquierda) */} 
      {/* ... Sidebar ... */}

      {/* Contenedor de Contenido (lo que se estira y scrollea) */}
      <div className="flex-1 flex flex-col">
        <Navbar />
        
        {/* 'main' se estira para empujar el footer hacia abajo */}
        <main className="flex-grow p-6 overflow-y-auto"> 
          <Outlet />
        </main>
        
        {/* El Footer se coloca inmediatamente después del 'main' */}
        <Footer /> 
      </div>
    </div>
  );
}

export default App;
