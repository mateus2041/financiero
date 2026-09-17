import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "../styles/notificaiones.css";

const API_URL = "http://127.0.0.1:8000";

export default function Notificaciones() {
  const navigate = useNavigate();

  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [notificacionSeleccionada, setNotificacionSeleccionada] =
    useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const textoConfirmacion = localStorage.getItem("mensaje_admin_enviado");

    if (textoConfirmacion) {
      setMensaje(textoConfirmacion);
      setTimeout(() => {
        setMensaje("");
        localStorage.removeItem("mensaje_admin_enviado");
      }, 3000);
    }

    cargarNotificaciones();
  }, [navigate, token]);

  const leerNotificacionesLocales = () => {
    try {
      const mensajesGuardados = JSON.parse(
        localStorage.getItem("mensajes_admin") || "[]"
      );

      return mensajesGuardados.map((item) => ({
        id_notificacion: item.id_notificacion ?? item.id,
        local: true,
        nombre_asesor:
          item.nombre_asesor ??
          item.nombre ??
          localStorage.getItem("nombre_asesor") ??
          "Sin nombre",
        titulo: item.titulo ?? "Mensaje para el administrador",
        mensaje: item.mensaje ?? item.texto ?? item.descripcion ?? "Sin mensaje",
        descripcion: item.descripcion ?? item.mensaje ?? item.texto ?? "Sin mensaje",
        imagen: item.imagen ?? item.imagen_data_url ?? item.imagen_url ?? null,
        fecha_creacion: item.fecha_creacion ?? new Date().toISOString(),
        leida: Boolean(item.leida),
        tipo: item.tipo ?? "mensaje",
      }));
    } catch (error) {
      console.error("Error leyendo mensajes locales:", error);
      return [];
    }
  };

  const actualizarNotificacionLocal = (idNotificacion, cambios) => {
    try {
      const mensajesGuardados = JSON.parse(
        localStorage.getItem("mensajes_admin") || "[]"
      );

      localStorage.setItem(
        "mensajes_admin",
        JSON.stringify(
          mensajesGuardados.map((item) => {
            const id = item.id_notificacion ?? item.id;
            return String(id) === String(idNotificacion)
              ? { ...item, ...cambios }
              : item;
          })
        )
      );
    } catch (error) {
      console.error("Error actualizando la notificación local:", error);
    }
  };

  const eliminarNotificacionLocal = (idNotificacion) => {
    try {
      const mensajesGuardados = JSON.parse(
        localStorage.getItem("mensajes_admin") || "[]"
      );

      localStorage.setItem(
        "mensajes_admin",
        JSON.stringify(
          mensajesGuardados.filter((item) => {
            const id = item.id_notificacion ?? item.id;
            return String(id) !== String(idNotificacion);
          })
        )
      );
    } catch (error) {
      console.error("Error eliminando la notificación local:", error);
    }
  };

  const cargarNotificaciones = async () => {
    try {
      setCargando(true);
      setError("");

      const respuesta = await axios.get(
        `${API_URL}/notificaciones`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const locales = leerNotificacionesLocales();
      const combinadas = [...locales, ...(respuesta.data || [])];

      const unicas = combinadas.filter(
        (notificacion, index, arreglo) =>
          arreglo.findIndex(
            (item) =>
              String(item.id_notificacion ?? item.id) ===
              String(notificacion.id_notificacion ?? notificacion.id)
          ) === index
      );

      const ordenadas = unicas.sort(
        (a, b) =>
          new Date(b.fecha_creacion || b.fecha || 0) -
          new Date(a.fecha_creacion || a.fecha || 0)
      );

      setNotificaciones(ordenadas);
    } catch (err) {
      console.error("Error al cargar notificaciones:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }

      setNotificaciones(leerNotificacionesLocales());
      setError("No se pudieron cargar las notificaciones.");
    } finally {
      setCargando(false);
    }
  };

  const mostrarMensaje = (texto) => {
    setMensaje(texto);

    setTimeout(() => {
      setMensaje("");
    }, 3000);
  };

  const cerrarMensajeCompleto = () => {
    setNotificacionSeleccionada(null);
  };

  const marcarLeida = async (idNotificacion) => {
    try {
      const notificacion = notificaciones.find(
        (item) => item.id_notificacion === idNotificacion
      );

      if (notificacion?.local) {
        actualizarNotificacionLocal(idNotificacion, { leida: true });
      } else {
        await axios.put(
          `${API_URL}/notificaciones/${idNotificacion}/leer`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      setNotificaciones((actuales) =>
        actuales.map((notificacion) =>
          notificacion.id_notificacion === idNotificacion
            ? { ...notificacion, leida: true }
            : notificacion
        )
      );

      setError("");
      mostrarMensaje("Notificación marcada como leída.");
    } catch (err) {
      console.error("Error:", err);
      setError("No se pudo marcar la notificación como leída.");
    }
  };

  const marcarTodasLeidas = async () => {
    try {
      await axios.put(
        `${API_URL}/notificaciones/leer-todas`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotificaciones((actuales) =>
        actuales.map((notificacion) => ({
          ...notificacion,
          leida: true,
        }))
      );

      const mensajesLocales = leerNotificacionesLocales();
      mensajesLocales.forEach((notificacion) =>
        actualizarNotificacionLocal(notificacion.id_notificacion, {
          leida: true,
        })
      );

      setError("");
      mostrarMensaje(
        "Todas las notificaciones fueron marcadas como leídas."
      );
    } catch (err) {
      console.error("Error:", err);
      setError("No se pudieron marcar todas las notificaciones.");
    }
  };

  const eliminarNotificacion = async (idNotificacion) => {
    try {
      const notificacion = notificaciones.find(
        (item) => item.id_notificacion === idNotificacion
      );

      if (notificacion?.local) {
        eliminarNotificacionLocal(idNotificacion);
      } else {
        await axios.delete(
          `${API_URL}/notificaciones/${idNotificacion}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      setNotificaciones((actuales) =>
        actuales.filter(
          (notificacion) =>
            notificacion.id_notificacion !== idNotificacion
        )
      );

      setError("");
      mostrarMensaje("Notificación eliminada.");
    } catch (err) {
      console.error("Error:", err);
      setError("No se pudo eliminar la notificación.");
    }
  };

  const eliminarTodas = async () => {
    const confirmar = window.confirm(
      "¿Está seguro de eliminar todas las notificaciones?"
    );

    if (!confirmar) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/notificaciones`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      localStorage.removeItem("mensajes_admin");
      setNotificaciones([]);
      setError("");
      mostrarMensaje("Todas las notificaciones fueron eliminadas.");
    } catch (err) {
      console.error("Error:", err);
      setError("No se pudieron eliminar las notificaciones.");
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario_id");
    localStorage.removeItem("documento");
    localStorage.removeItem("fotoPerfil");
    localStorage.removeItem("mensajes_admin");

    navigate("/login");
  };

  const noLeidas = notificaciones.filter(
    (notificacion) => !notificacion.leida
  ).length;

  return (
    <div className="asesor-container">
      <div className="panel-financiero">

        <aside className="sidebar">
          <ul>
            <li>
              <Link to="/Administradores">
                📜 Principal
              </Link>
            </li>

            <li>
              <Link to="/lista-usuarios">
                👤 Usuarios
              </Link>
            </li>

            <li>
              <Link to="/lista-cuentas">
                🌐 Cuentas
              </Link>
            </li>

            <li>
              <Link to="/notificaciones">
                🔔 Notificaciones
              </Link>
            </li>
          </ul>

          <button
            className="logout"
            onClick={cerrarSesion}
          >
            🚪 Cerrar sesión
          </button>
        </aside>

        <main className="contenido-asesores">

          <div className="encabezado-cuentas">
            <h1>Notificaciones</h1>
          </div>

          <p className="subtitulo-asesores">
            Total: {notificaciones.length} | No leídas: {noLeidas}
          </p>

          {mensaje && (
            <p className="mensaje-exito">
              {mensaje}
            </p>
          )}

          {error && (
            <p className="mensaje-error">
              {error}
            </p>
          )}

          <div className="acciones-cuenta">
            <button
              className="boton-actualizar"
              onClick={marcarTodasLeidas}
              disabled={
                notificaciones.length === 0 ||
                noLeidas === 0
              }
            >
              Marcar todas como leídas
            </button>

            <button
              className="boton-inhabilitar"
              onClick={eliminarTodas}
              disabled={notificaciones.length === 0}
            >
              Eliminar todas
            </button>
          </div>

          <br />

          {cargando ? (
            <p>Cargando notificaciones...</p>
          ) : notificaciones.length === 0 ? (
            <p>
              No tienes notificaciones actualmente.
            </p>
          ) : (
            <div className="tabla-asesores-contenedor">
              <table className="tabla-asesores">
                <thead>
                  <tr>
                    <th>Nombre del asesor</th>
                    <th>Título</th>
                    <th>Mensaje</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {notificaciones.map((notificacion) => (
                    <tr
                      key={notificacion.id_notificacion}
                    >
                      <td>
                        {notificacion.nombre_asesor || "Sin nombre"}
                      </td>

                      <td>
                        {notificacion.titulo ||
                          notificacion.tipo ||
                          "Notificación"}
                      </td>

                      <td>
                        {notificacion.mensaje ||
                          notificacion.descripcion ||
                          "Sin mensaje"}
                      </td>

                      <td>
                        {notificacion.fecha_creacion
                          ? new Date(
                              notificacion.fecha_creacion
                            ).toLocaleString("es-CO")
                          : "Sin fecha"}
                      </td>

                      <td>
                        <span
                          className={`estado-badge ${
                            notificacion.leida
                              ? "activo"
                              : "inactivo"
                          }`}
                        >
                          {notificacion.leida
                            ? "Leída"
                            : "No leída"}
                        </span>
                      </td>

                      <td className="acciones-cuenta">
                        <button
                          className="boton-ver"
                          onClick={() =>
                            setNotificacionSeleccionada(notificacion)
                          }
                        >
                          Ver mensaje
                        </button>

                        {!notificacion.leida && (
                          <button
                            className="boton-habilitar"
                            onClick={() =>
                              marcarLeida(
                                notificacion.id_notificacion
                              )
                            }
                          >
                            Marcar leída
                          </button>
                        )}

                        <button
                          className="boton-eliminar"
                          onClick={() =>
                            eliminarNotificacion(
                              notificacion.id_notificacion
                            )
                          }
                        >
                          Eliminar
                        </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="acciones-lista-notificaciones">
              <button
                className="boton-actualizar-lista"
                onClick={cargarNotificaciones}
                disabled={cargando}
              >
                {cargando ? "Actualizando..." : "Actualizar lista"}
              </button>
            </div>

            {notificacionSeleccionada && (
              <div
                className="modal-cuenta-overlay"
                role="presentation"
                onClick={cerrarMensajeCompleto}
              >
                <section
                  className="modal-cuenta"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="titulo-mensaje-completo"
                  onClick={(evento) => evento.stopPropagation()}
                >
                  <div className="encabezado-modal-cuenta">
                    <h2 id="titulo-mensaje-completo">
                      {notificacionSeleccionada.titulo ||
                        notificacionSeleccionada.tipo ||
                        "Notificación"}
                    </h2>
                    <button
                      className="boton-cerrar-modal"
                      onClick={cerrarMensajeCompleto}
                      aria-label="Cerrar mensaje"
                    >
                      &times;
                    </button>
                  </div>

                  <p className="mensaje-completo">
                    {notificacionSeleccionada.mensaje ||
                      notificacionSeleccionada.descripcion ||
                      "Sin mensaje"}
                  </p>

                  {(notificacionSeleccionada.imagen ||
                    notificacionSeleccionada.imagen_data_url ||
                    notificacionSeleccionada.imagen_url) && (
                    <div style={{ marginTop: "16px" }}>
                      <img
                        src={
                          notificacionSeleccionada.imagen ||
                          notificacionSeleccionada.imagen_data_url ||
                          notificacionSeleccionada.imagen_url
                        }
                        alt="Imagen adjunta en la notificación"
                        style={{
                          maxWidth: "100%",
                          maxHeight: "300px",
                          borderRadius: "12px",
                          display: "block",
                          margin: "0 auto",
                          border: "1px solid rgba(255, 255, 255, 0.18)",
                        }}
                      />
                    </div>
                  )}
                </section>
              </div>
            )}

          </main>
        </div>
      </div>
    );
  }