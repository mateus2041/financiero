import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  parsePositiveInteger,
  sanitizeLocalName,
} from "../utils/helpers";
import "../styles/mensajeAdmin.css";

export default function Mensajes() {
  const navigate = useNavigate();

  const [mensaje, setMensaje] = useState("");
  const [mensajes, setMensajes] = useState([]);
  const [errorAlmacenamiento, setErrorAlmacenamiento] = useState("");
  const [menuAbierto, setMenuAbierto] = useState(true);

  const leerMensajesGuardados = () => {
    const contenido = localStorage.getItem("mensajes_admin");
    if (!contenido) return [];

    try {
      const guardados = JSON.parse(contenido);
      if (!Array.isArray(guardados)) {
        throw new TypeError("El contenido almacenado no es una lista");
      }

      return guardados
        .filter((item) => item && typeof item === "object" && !Array.isArray(item))
        .map((item, index) => {
          const texto = [item.texto, item.mensaje, item.descripcion].find(
            (valor) => typeof valor === "string"
          ) || "";
          const fechaCreacion = typeof item.fecha_creacion === "string"
            ? item.fecha_creacion.slice(0, 64)
            : new Date().toISOString();
          const fecha = typeof item.fecha === "string"
            ? item.fecha.slice(0, 100)
            : new Date(fechaCreacion).toLocaleString("es-CO");
          const id = parsePositiveInteger(item.id ?? item.id_notificacion)
            ?? Date.now() + index;

          return {
            id,
            id_notificacion: id,
            nombre_asesor: [
              item.nombre_asesor,
              item.nombre,
              localStorage.getItem("nombre_asesor"),
            ].find((valor) => typeof valor === "string")?.slice(0, 100)
              || "Sin nombre",
            texto: texto.slice(0, 500),
            mensaje: texto.slice(0, 500),
            descripcion: texto.slice(0, 500),
            titulo: typeof item.titulo === "string"
              ? item.titulo.slice(0, 100)
              : "Mensaje para el administrador",
            tipo: typeof item.tipo === "string" ? item.tipo.slice(0, 50) : "mensaje",
            fecha,
            fecha_creacion: fechaCreacion,
            leida: Boolean(item.leida),
          };
        });
    } catch (error) {
      if (!(error instanceof SyntaxError || error instanceof TypeError)) {
        throw error;
      }

      localStorage.removeItem("mensajes_admin");
      setErrorAlmacenamiento("Se descartaron mensajes locales dañados.");
      return [];
    }
  };

  useEffect(() => {
    setMensajes(leerMensajesGuardados());
  }, []);

  const enviarMensaje = () => {
    if (!mensaje.trim()) {
      return;
    }

    const ahora = new Date();
    const textoMensaje = mensaje.trim().slice(0, 500);
    const nuevoMensaje = {
      id: Date.now(),
      id_notificacion: Date.now(),
      nombre_asesor: sanitizeLocalName(
        localStorage.getItem("nombre_usuario")
      ),
      texto: textoMensaje,
      mensaje: textoMensaje,
      descripcion: textoMensaje,
      titulo: "Mensaje para el administrador",
      tipo: "mensaje",
      fecha: ahora.toLocaleString("es-CO"),
      fecha_creacion: ahora.toISOString(),
      leida: false,
    };

    const mensajesGuardados = leerMensajesGuardados();

    const actualizados = [nuevoMensaje, ...mensajesGuardados];
    localStorage.setItem("mensajes_admin", JSON.stringify(actualizados));

    setMensajes((anteriores) => [nuevoMensaje, ...anteriores]);
    setMensaje("");
    setErrorAlmacenamiento("");
  };

  const manejarTecla = (e) => {
    if (e.key === "Enter") {
      enviarMensaje();
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario_id");
    localStorage.removeItem("documento");
    localStorage.removeItem("mensajes_admin");
    navigate("/login");
  };

  return (
    <div className="asesor-container">
      <div className="panel-financiero">

        <button
          type="button"
          className={`boton-menu-lateral ${menuAbierto ? "" : "menu-cerrado"}`}
          onClick={() => setMenuAbierto((abierto) => !abierto)}
          aria-label={menuAbierto ? "Ocultar menú" : "Mostrar menú"}
          aria-expanded={menuAbierto}
        >
          {menuAbierto ? "‹" : "☰"}
        </button>

        <aside className={`sidebar ${menuAbierto ? "" : "sidebar-cerrado"}`}>
          <div>
            <ul>
              <li>
                <Link to="/">Inicio</Link>
              </li>

              <li>
                <Link to="/asesorbancario">Asesor Bancario</Link>
              </li>

              <li>
                <Link to="/lista-usuarios">Usuarios</Link>
              </li>

              <li>
                <Link to="/lista-cuentas">Cuentas</Link>
              </li>

              <li>
                <Link to="/mensajes" className="active">
                  Mensajes
                </Link>
              </li>
            </ul>
          </div>

          <button
            className="logout"
            onClick={cerrarSesion}
          >
            Cerrar sesión
          </button>
        </aside>

        <main className="contenido-asesores">

          <h1>Mensajes</h1>

          <p className="subtitulo-asesores">
            Escribe y administra tus mensajes
          </p>

          <div className="contenido-lista-asesores">

            <div className="panel-lista-asesores">

              <div className="mensaje-admin-card">
                <div className="mensaje-admin-header">
                  <button type="button" className="cerrar-mensaje-admin" aria-label="Cerrar">
                    ×
                  </button>
                </div>

                <div className="mensaje-admin-body">
                  <label className="mensaje-admin-label" htmlFor="mensaje-admin-input">
                    Código de mensaje:
                  </label>

                  <input
                    id="mensaje-admin-input"
                    type="text"
                    className="mensaje-admin-input"
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    onKeyDown={manejarTecla}
                    placeholder="Escribe un mensaje"
                    autoComplete="off"
                    maxLength={500}
                    style={{
                      color: "#ffffff",
                      backgroundColor: "#0b0f16",
                      WebkitTextFillColor: "#ffffff",
                      fontSize: "18px",
                      fontWeight: 600,
                    }}
                  />

                  {errorAlmacenamiento && (
                    <p role="alert">{errorAlmacenamiento}</p>
                  )}

                  <button
                    type="button"
                    className="mensaje-admin-boton"
                    onClick={enviarMensaje}
                    disabled={!mensaje.trim()}
                  >
                    Enviar
                  </button>
                </div>
              </div>

              <br />

              <div className="tabla-asesores-contenedor">

                <table className="tabla-asesores">

                  <thead>
                    <tr>
                      <th>Mensaje</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>

                  <tbody>

                    {mensajes.length === 0 ? (
                      <tr>
                        <td colSpan="2">
                          No hay mensajes registrados
                        </td>
                      </tr>
                    ) : (
                      mensajes.map((item) => (
                        <tr key={item.id}>
                          <td>{item.texto}</td>
                          <td>{item.fecha}</td>
                        </tr>
                      ))
                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </div>

        </main>

      </div>
    </div>
  );
}