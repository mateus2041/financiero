import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Administradores.css";

const API_URL = "http://localhost:8000";

export default function Administradores() {
  const navigate = useNavigate();

  const [asesores, setAsesores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [errorConsulta, setErrorConsulta] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [codigoAsesorConsulta, setCodigoAsesorConsulta] = useState("");
  const [asesorConsultado, setAsesorConsultado] = useState(null);
  const [consultandoAsesor, setConsultandoAsesor] = useState(false);
  const [nuevoCodigoAsesor, setNuevoCodigoAsesor] = useState("");
  const [guardandoCodigo, setGuardandoCodigo] = useState(false);
  const [editandoCodigo, setEditandoCodigo] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    const cerrarConEscape = (e) => {
      if (e.key === "Escape") {
        setEditandoCodigo(false);
      }
    };

    if (editandoCodigo) {
      document.addEventListener("keydown", cerrarConEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", cerrarConEscape);
      document.body.style.overflow = "";
    };
  }, [editandoCodigo]);

  const formatearError = (error, mensajeFallback) => {
    const detalle = error?.response?.data?.detail;
    const texto = typeof detalle === "string" ? detalle.trim() : "";

    if (texto && !["Not Found", "not found", "NotFound"].includes(texto)) {
      return texto;
    }

    return mensajeFallback;
  };

  const formatearFechaHora = (fechaIngreso) => {
    if (!fechaIngreso) {
      return { fecha: "No disponible", hora: "No disponible" };
    }

    const fecha = new Date(fechaIngreso);
    if (Number.isNaN(fecha.getTime())) {
      return { fecha: "No disponible", hora: "No disponible" };
    }

    return {
      fecha: fecha.toLocaleDateString("es-CO"),
      hora: fecha.toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError("");

      const token = localStorage.getItem("token");

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const respuestaAsesores = await axios.get(
        `${API_URL}/administradores/asesores`,
        config
      );

      setAsesores(respuestaAsesores.data?.asesores || []);
    } catch (error) {
      console.error(error);
      setError(formatearError(error, "No se pudieron cargar los datos."));
    } finally {
      setCargando(false);
    }
  };

  const consultarAsesor = async (e) => {
    e.preventDefault();

    if (!codigoAsesorConsulta.trim()) {
      setErrorConsulta("Ingrese el código del asesor.");
      return;
    }

    try {
      setError("");
      setErrorConsulta("");
      setMensaje("");
      setConsultandoAsesor(true);
      setAsesorConsultado(null);
      setEditandoCodigo(false);

      const token = localStorage.getItem("token");

      const respuesta = await axios.get(
        `${API_URL}/administradores/asesores`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            codigo_asesor: codigoAsesorConsulta.trim(),
          },
        }
      );

      const lista = respuesta.data?.asesores || [];
      setAsesorConsultado(lista[0] || null);
      setNuevoCodigoAsesor(lista[0]?.codigo_asesor || "");

      if (!lista[0]) {
        setErrorConsulta("No se encontró un asesor con ese código.");
      }
    } catch (error) {
      console.error(error);
      setAsesorConsultado(null);
      setErrorConsulta(formatearError(error, "No se pudo consultar el asesor."));
    } finally {
      setConsultandoAsesor(false);
    }
  };

  const cambiarCodigoAsesor = async (e) => {
    e.preventDefault();

    const codigo = nuevoCodigoAsesor.trim();
    if (!codigo) {
      setError("Ingrese el nuevo código del asesor.");
      return;
    }

    try {
      setError("");
      setMensaje("");
      setGuardandoCodigo(true);

      const token = localStorage.getItem("token");
      const respuesta = await axios.put(
        `${API_URL}/administradores/asesores/${asesorConsultado.id_asesor}`,
        {
          id_asesor: asesorConsultado.id_asesor,
          codigo_asesor: codigo,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const codigoActualizado = respuesta.data?.codigo_asesor || codigo;
      setAsesorConsultado((actual) => ({
        ...actual,
        codigo_asesor: codigoActualizado,
      }));
      setCodigoAsesorConsulta(codigoActualizado);
      setNuevoCodigoAsesor(codigoActualizado);
      setEditandoCodigo(false);
      setAsesores((actuales) =>
        actuales.map((asesor) =>
          asesor.id_asesor === asesorConsultado.id_asesor
            ? { ...asesor, codigo_asesor: codigoActualizado }
            : asesor
        )
      );
      setMensaje(respuesta.data?.mensaje || "Código actualizado correctamente.");
    } catch (error) {
      console.error(error);
      setError(formatearError(error, "No se pudo actualizar el código del asesor."));
    } finally {
      setGuardandoCodigo(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario_id");
    localStorage.removeItem("documento");

    navigate("/login");
  };

  if (cargando) {
    return (
      <div className="asesor-container">
        <div className="panel-financiero">
          <main className="contenido-asesores">
            <h1>Cargando...</h1>
          </main>
        </div>
      </div>
    );
  }

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
              <Link to="/lista-asesores">
                📜 Asesores
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
            
          </ul>

          <button
            className="logout"
            onClick={cerrarSesion}
          >
            🚪 Cerrar sesión
          </button>
        </aside>

        <main className="contenido-asesores">

          <h1>Administración de asesores</h1>

          <p className="subtitulo-asesores">
            Gestión de usuarios y asesores bancarios
          </p>

          {error && (
            <p className="mensaje-error">
              {error}
            </p>
          )}

          {mensaje && (
            <p className="mensaje-exito">
              {mensaje}
            </p>
          )}

          <div className="admin-grid-asesores">
            <section className="panel-lista-asesores lista-asesores-panel">

              <h2>Lista de asesores</h2>

              {asesores.length === 0 ? (
                <p>No hay asesores registrados.</p>
              ) : (
                <div className="lista-asesores-compacta">

                  {asesores.map((asesor) => (

                    <div
                      className="fila-asesor"
                      key={
                        asesor.id_asesor ||
                        asesor.id_usuario
                      }
                    >

                      {(() => {
                        const { fecha, hora } = formatearFechaHora(asesor.fecha_ingreso);

                        return (
                          <>
                            <div className="fila-asesor-dato">
                              <span className="fila-label">
                                Fecha de ingreso
                              </span>

                              <strong>{fecha}</strong>
                            </div>

                            <div className="fila-asesor-dato">
                              <span className="fila-label">
                                Hora de ingreso
                              </span>

                              <strong>{hora}</strong>
                            </div>
                          </>
                        );
                      })()}

                      <div className="fila-asesor-dato">
                        <span className="fila-label">
                          Nombre
                        </span>

                        <strong>
                          {asesor.nombre ||
                            asesor.nombres ||
                            asesor.nombre_completo ||
                            "Asesor bancario"}
                        </strong>
                      </div>

                      <div className="fila-asesor-dato">
                        <span className="fila-label">
                          Código
                        </span>

                        <strong>
                          {asesor.codigo_asesor ||
                            asesor.codigo ||
                            "Sin código"}
                        </strong>
                      </div>

                      <div className="fila-asesor-dato fila-estado">

                        <span className="fila-label">
                          Estado
                        </span>

                        <span
                          className={
                            asesor.estado === "inactivo"
                              ? "estado-badge inactivo"
                              : "estado-badge activo"
                          }
                        >
                          {asesor.estado || "activo"}
                        </span>

                      </div>

                    </div>

                  ))}

                </div>
              )}

            </section>

            <aside className="panel-consulta-asesor">
              <h3>Consultar asesor</h3>

              <form onSubmit={consultarAsesor} className="formulario-consulta-asesor">
                <label>
                  Código del asesor
                  <input
                    type="text"
                    value={codigoAsesorConsulta}
                    onChange={(e) => setCodigoAsesorConsulta(e.target.value)}
                    placeholder="Ingrese el código"
                    style={{
                      color: "#ffffff",
                      WebkitTextFillColor: "#ffffff",
                      caretColor: "#ffffff",
                      backgroundColor: "#0b0f16",
                    }}
                  />
                </label>

                <button type="submit" disabled={consultandoAsesor}>
                  {consultandoAsesor ? "Consultando..." : "Consultar"}
                </button>
              </form>

              {errorConsulta && (
                <p className="mensaje-error mensaje-error-consulta">
                  {errorConsulta}
                </p>
              )}

              {asesorConsultado ? (
                <div className="resultado-asesor-consultado">
                  <p>
                    <strong>Nombre:</strong> {asesorConsultado.nombre || "Sin nombre"}
                  </p>
                  <p>
                    <strong>Código actual:</strong>{" "}
                    <span className="codigo-asesor-actual">
                      {asesorConsultado.codigo_asesor || "Sin código"}
                      <button
                        type="button"
                        className="boton-editar-codigo"
                        onClick={() => setEditandoCodigo((actual) => !actual)}
                        aria-label="Editar código del asesor"
                        title="Editar código del asesor"
                      >
                        ✎
                      </button>
                    </span>
                  </p>
                  <p>
                    <strong>Estado:</strong>{" "}
                    <span
                      className={
                        asesorConsultado.estado === "inactivo"
                          ? "estado-badge inactivo"
                          : "estado-badge activo"
                      }
                    >
                      {asesorConsultado.estado || "activo"}
                    </span>
                  </p>
                </div>
              ) : (
                <p className="texto-empty-consulta">
                  Busca un asesor por su código.
                </p>
              )}

              {editandoCodigo && asesorConsultado && (
                <div
                  className="modal-cambio-codigo-overlay"
                  onClick={() => setEditandoCodigo(false)}
                  role="presentation"
                >
                  <div
                    className="modal-cambio-codigo"
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="titulo-modal-cambio-codigo"
                  >
                    <div className="encabezado-modal-cambio-codigo">
                      <h2 id="titulo-modal-cambio-codigo">Cambiar código del asesor</h2>
                      <button
                        type="button"
                        className="boton-cerrar-modal"
                        onClick={() => setEditandoCodigo(false)}
                        aria-label="Cerrar ventana"
                        title="Cerrar"
                      >
                        ×
                      </button>
                    </div>
                    <form onSubmit={cambiarCodigoAsesor} className="formulario-cambio-codigo">
                      <p className="asesor-modal-nombre">
                        {asesorConsultado.nombre || "Asesor bancario"}
                      </p>
                      <label>
                        Nuevo código del asesor
                        <input
                          type="text"
                          value={nuevoCodigoAsesor}
                          onChange={(e) => setNuevoCodigoAsesor(e.target.value)}
                          maxLength={30}
                          autoFocus
                        />
                      </label>
                      <button type="submit" disabled={guardandoCodigo}>
                        {guardandoCodigo ? "Guardando..." : "Cambiar código"}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </aside>
          </div>

        </main>

      </div>
    </div>
  );
}