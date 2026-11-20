import React, { useEffect } from "react";
import { Navigate, Routes, Route, useLocation } from "react-router-dom";

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
import TarjetasUsuario from "./pages/trageta";
import ListaAsesores from "./pages/Listaasesores";

function App() {
  const location = useLocation();

  useEffect(() => {
    const bloqueaCopia = (evento) => {
      evento.preventDefault();
    };

    const bloqueaSeleccion = (evento) => {
      const elementoEditable =
        evento.target instanceof HTMLInputElement ||
        evento.target instanceof HTMLTextAreaElement ||
        evento.target?.isContentEditable;

      if (!elementoEditable) {
        evento.preventDefault();
      }
    };

    const bloqueaAtajos = (evento) => {
      const tecla = typeof evento.key === "string"
        ? evento.key.toLowerCase()
        : "";
      if (
        (evento.ctrlKey || evento.metaKey) &&
        (tecla === "c" || tecla === "x")
      ) {
        evento.preventDefault();
      }
    };

    const estiloProteccion = document.createElement("style");
    estiloProteccion.id = "proteccion-copia";
    estiloProteccion.textContent = `
      html, body, #root, #root * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }

      #root input,
      #root textarea,
      #root [contenteditable="true"] {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }

      ::selection {
        background: transparent;
        color: inherit;
      }
    `;
    document.head.appendChild(estiloProteccion);

    document.addEventListener("copy", bloqueaCopia);
    document.addEventListener("cut", bloqueaCopia);
    document.addEventListener("contextmenu", bloqueaCopia);
    document.addEventListener("dragstart", bloqueaCopia);
    document.addEventListener("selectstart", bloqueaSeleccion);
    document.addEventListener("keydown", bloqueaAtajos);

    return () => {
      document.removeEventListener("copy", bloqueaCopia);
      document.removeEventListener("cut", bloqueaCopia);
      document.removeEventListener("contextmenu", bloqueaCopia);
      document.removeEventListener("dragstart", bloqueaCopia);
      document.removeEventListener("selectstart", bloqueaSeleccion);
      document.removeEventListener("keydown", bloqueaAtajos);
      document.getElementById("proteccion-copia")?.remove();
    };
  }, []);

  useEffect(() => {
    if (location.pathname !== "/cuenta") return;

    try {
      sessionStorage.removeItem("ultimo_mensaje_asistente");
    } catch (error) {
      console.error("No fue posible reiniciar la conversación del asistente:", error);
    }
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/inicio" element={<Inicio />} />

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

      <Route
        path="/trageta"
        element={<Navigate to="/tarjetas" replace />}
      />

      <Route
        path="/tarjetas"
        element={<TarjetasUsuario />}
      />

      <Route
        path="/lista-asesores"
        element={<ListaAsesores />}
      />
    </Routes>
  );
}

export default App;
