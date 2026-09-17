import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Inicio from "./pages/inicio";
import Login from "./pages/login";
import Registro from "./pages/registro";
import Recuperacion from "./pages/recuperacion";
import VerificacionIdentidad from "./pages/VerificacionIdentidad";
import Administradores from "./pages/Administradores";
import ListaUsuarios from "./pages/Listausuarios";
import ListaCuentas from "./pages/ListaCuentas";
import Cuenta from "./pages/cuenta";
import Historial from "./pages/historial";
import DesbloquearTarjeta from "./pages/desbloquearTarjeta";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/recuperacion" element={<Recuperacion />} />
      <Route path="/verificacion-identidad" element={<VerificacionIdentidad />} />
      <Route path="/Administradores" element={<Administradores />} />
      <Route path="/lista-usuarios" element={<ListaUsuarios />} />
      <Route path="/lista-cuentas" element={<ListaCuentas />} />
      <Route path="/cuenta" element={<Cuenta />} />
      <Route path="/historial" element={<Historial />} />
      <Route path="/desbloquear-tarjeta" element={<DesbloquearTarjeta />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;