import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Inicio from "./pages/inicio";
import Login from "./pages/login";
import Registro from "./pages/registro";
import Recuperar from "./pages/recuperar";
import Cuenta from "./pages/cuenta";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/recuperar" element={<Recuperar />} />
        <Route path="/cuenta" element={<Cuenta />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;