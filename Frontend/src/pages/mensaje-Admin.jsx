import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/mensajeAdmin.css";

export default function Mensajes() {
  const navigate = useNavigate();

  const [mensaje, setMensaje] = useState("");
  const [mensajes, setMensajes] = useState([]);

  useEffect(() => {
    const guardados = JSON.parse(
      localStorage.getItem("mensajes_admin") || "[]"
    );

    const mensajesCargados = guardados.map((item) => ({
      id: item.id ?? item.id_notificacion,
      id_notificacion: item.id_notificacion ?? item.id,
      nombre_asesor:
        item.nombre_asesor ??
        item.nombre ??
        localStorage.getItem("nombre_asesor") ??
        "Sin nombre",
      texto: item.texto ?? item.mensaje ?? item.descripcion ?? "",
      mensaje: item.mensaje ?? item.texto ?? item.descripcion ?? "",
      descripcion: item.descripcion ?? item.mensaje ?? item.texto ?? "",
      titulo: item.titulo ?? "Mensaje para el administrador",
      tipo: item.tipo ?? "mensaje",
      fecha:
        item.fecha ??
        (item.fecha_creacion
          ? new Date(item.fecha_creacion).toLocaleString("es-CO")
          : new Date().toLocaleString("es-CO")),
      fecha_creacion:
        item.fecha_creacion ?? new Date().toISOString(),
      leida: Boolean(item.leida),
    }));

    setMensajes(mensajesCargados);
  }, []);

  const enviarMensaje = () => {
    if (!mensaje.trim()) {
      return;
    }

    const ahora = new Date();
    const nuevoMensaje = {
      id: Date.now(),
      id_notificacion: Date.now(),
      nombre_asesor: localStorage.getItem("nombre_usuario") || "Sin nombre",
      texto: mensaje.trim(),
      mensaje: mensaje.trim(),
      descripcion: mensaje.trim(),
      titulo: "Mensaje para el administrador",
      tipo: "mensaje",
      fecha: ahora.toLocaleString("es-CO"),
      fecha_creacion: ahora.toISOString(),
      leida: false,
    };

    const mensajesGuardados = JSON.parse(
      localStorage.getItem("mensajes_admin") || "[]"
    );

    const actualizados = [nuevoMensaje, ...mensajesGuardados];
    localStorage.setItem(
      "mensajes_admin",
      JSON.stringify(actualizados)
    );

    setMensajes((anteriores) => [nuevoMensaje, ...anteriores]);
    setMensaje("");
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

        <aside className="sidebar">
          <div>
            <ul>
              <li>
                <Link to="/">Inicio</Link>
              </li>

              <li>
                <Link to="/asesorbancario">Asesor Bancario</Link>
              </li>

              <li>
                <Link to="/lista-asesores">Asesores</Link>
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
                  <label className="mensaje-admin-label">
                    Código de mensaje:
                  </label>

                  <input
                    type="text"
                    className="mensaje-admin-input"
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    onKeyDown={manejarTecla}
                    placeholder="Escribe un mensaje"
                    autoComplete="off"
                    style={{
                      color: "#ffffff",
                      backgroundColor: "#0b0f16",
                      WebkitTextFillColor: "#ffffff",
                      fontSize: "18px",
                      fontWeight: 600,
                    }}
                  />

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