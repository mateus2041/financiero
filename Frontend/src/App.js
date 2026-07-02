import React from "react";
import { Routes, Route } from "react-router-dom";

// Páginas
import Inicio from "./pages/inicio";
import Login from "./pages/login";
import Registro from "./pages/registro";
import Cuenta from "./pages/cuenta";
import Transferencias from "./pages/transferencias";
import Certificado from "./pages/certificado";
import Ajustes from "./pages/ajustes";

function App() {
  return (
    <Routes>
      {/* Página principal */}
      <Route path="/" element={<Inicio />} />

      {/* Autenticación */}
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      {/* Panel */}
      <Route path="/cuenta" element={<Cuenta />} />
      <Route path="/transferencias" element={<Transferencias />} /> 
      <Route path="/certificado" element={<Certificado />} />
      <Route path="/ajustes" element={<Ajustes />} />
    </Routes>
  );
}

export default App;