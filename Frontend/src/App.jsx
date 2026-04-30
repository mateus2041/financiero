import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Inicio from "./pages/inicio";
import Login from "./pages/login";
import Registro from "./pages/registro";
import Recuperar from "./pages/recuperar";
import Cuenta from "./pages/cuenta";
import Transferencias from "./pages/Transferencias";
import Certificado from "./pages/certificado";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/recuperar" element={<Recuperar />} />
        <Route path="/cuenta" element={<Cuenta />} />
        <Route path="/transferencias" element={<Transferencias />} />
        <Route path="/certificado" element={<Certificado />} />
      </Routes>
    </Router>
  );
}

export default App;