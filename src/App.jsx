import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";

function App() {
return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar (fijo a la izquierda) */}
      {/* Contenido principal (ocupa el resto del espacio) */}
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet /> {/* <-- ¡Aquí es donde la magia ocurre! */}  
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default App;
