import React from "react";
import { Navigate, Routes, Route } from "react-router-dom";

import Inicio from "./pages/inicio";
import Login from "./pages/login";
import Registro from "./pages/registro";
import Cuenta from "./pages/cuenta";
import Transferencias from "./pages/transferencias";
import Certificado from "./pages/certificado";
import Ajustes from "./pages/ajustes";
import Recuperacion from "./pages/recuperacion";
import Corriente from "./pages/corriente";
import Historial from "./pages/historial";
import Reporte from "./pages/reporte";
import VerificacionIdentidad from "./pages/VerificacionIdentidad";
import AsesorBancario from "./pages/AsesorBancario";
import ChatIA from "./pages/ChatIA";
import Administradores from "./pages/Administradores";
import ListaCuentas from "./pages/ListaCuentas";
import ListaUsuarios from "./pages/Listausuarios";
import TransferenciasScr from "./pages/transferenciascr";
import Notificaciones from "./pages/notificaiones";
import Mensajes from "./pages/mensaje-Admin";
import DesbloquearTarjeta from "./pages/desbloquearTarjeta";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />

      <Route path="/login" element={<Login />} />

      <Route path="/registro" element={<Registro />} />

      <Route path="/cuenta" element={<Cuenta />} />

      <Route
        path="/transferencias"
        element={<Transferencias />}
      />

      <Route
        path="/corriente"
        element={<Corriente />}
      />

      <Route
        path="/certificado"
        element={<Certificado />}
      />

      <Route
        path="/recuperacion"
        element={<Recuperacion />}
      />

      <Route
        path="/ajustes"
        element={<Ajustes />}
      />

      <Route
        path="/historial"
        element={<Historial />}
      />

      <Route
        path="/reporte"
        element={<Reporte />}
      />

      <Route
        path="/verificacion-identidad"
        element={<VerificacionIdentidad />}
      />

      <Route
        path="/asesor-bancario"
        element={<AsesorBancario />}
      />

      <Route
        path="/AsesorBancario"
        element={<Navigate to="/asesor-bancario" replace />}
      />

      <Route
        path="/asesorbancario"
        element={<Navigate to="/asesor-bancario" replace />}
      />

      <Route
        path="/ChatIA"
        element={<ChatIA />}
      />

      <Route
        path="/administradores"
        element={<Administradores />}
      />

      <Route
        path="/administrador"
        element={<Navigate to="/administradores" replace />}
      />

      <Route
        path="/Administradores"
        element={<Navigate to="/administradores" replace />}
      />

      <Route
        path="/lista-cuentas"
        element={<ListaCuentas />}
      />

      <Route
        path="/lista-usuarios"
        element={<ListaUsuarios />}
      />

      <Route
        path="/transferencias-scr"
        element={<TransferenciasScr />}
      />

      <Route
        path="/transferenciascr"
        element={<TransferenciasScr />}
      />

      <Route
        path="/notificaciones"
        element={<Notificaciones />}
      />

      <Route
        path="/notoficaciones"
        element={<Navigate to="/notificaciones" replace />}
      />

      <Route
        path="/mensajes"
        element={<Mensajes />}
      />

      <Route
        path="/mensaje-Admin"
        element={<Navigate to="/mensajes" replace />}
      />

      <Route
        path="/desbloquear-cuenta"
        element={<DesbloquearTarjeta />}
      />
    </Routes>
  );
}

export default App;
