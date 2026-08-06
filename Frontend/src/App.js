import React from "react";
import { Routes, Route } from "react-router-dom";

import Inicio from "./pages/inicio";
import Login from "./pages/login";
import Registro from "./pages/registro";
import Cuenta from "./pages/cuenta";
import Transferencias from "./pages/transferencias";
import Certificado from "./pages/certificado";
import Ajustes from "./pages/ajustes";
import Recuperacion from "./pages/recuperacion";
import Corriente from "./pages/corriente";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/cuenta" element={<Cuenta />} />
      <Route path="/transferencias" element={<Transferencias />} />
      <Route path="/corriente" element={<Corriente />} />
      <Route path="/certificado" element={<Certificado />} />
      <Route path="/recuperacion" element={<Recuperacion />} />
      <Route path="/ajustes" element={<Ajustes />} />
    </Routes>
  );
}

export default App;