import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Administradores.css";

const API_URL = "http://localhost:8000";

export default function Administradores() {
  const navigate = useNavigate();

  const [asesores, setAsesores] = useState([]);
  const [busquedaAsesor, setBusquedaAsesor] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [asesorConsultado, setAsesorConsultado] = useState(null);
  const [nuevoCodigoAsesor, setNuevoCodigoAsesor] = useState("");
  const [nuevoTipoDocumento, setNuevoTipoDocumento] = useState("");
  const [nuevoDocumento, setNuevoDocumento] = useState("");
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [guardandoCodigo, setGuardandoCodigo] = useState(false);
  const [editandoCodigo, setEditandoCodigo] = useState(false);
  const [campoEditando, setCampoEditando] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    const cerrarConEscape = (e) => {
      if (e.key === "Escape") {
        setEditandoCodigo(false);
        setCampoEditando("");
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

    const valorFecha = /Z$|[+-]\d{2}:?\d{2}$/.test(fechaIngreso)
      ? fechaIngreso
      : `${fechaIngreso}Z`;

    const fecha = new Date(valorFecha);
    if (Number.isNaN(fecha.getTime())) {
      return { fecha: "No disponible", hora: "No disponible" };
    }

    const fechaBogota = new Intl.DateTimeFormat("es-CO", {
      timeZone: "America/Bogota",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(fecha);

    const horaBogota = new Intl.DateTimeFormat("es-CO", {
      timeZone: "America/Bogota",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(fecha);

    return {
      fecha: fechaBogota,
      hora: horaBogota,
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

  const cambiarCodigoAsesor = async (e) => {
    e.preventDefault();

    const codigo = nuevoCodigoAsesor.trim();
    const tipoDocumento = nuevoTipoDocumento.trim();
    const documento = nuevoDocumento.trim();
    const email = nuevoEmail.trim();
    if (!codigo || !tipoDocumento || !documento || !email) {
      setError("Complete todos los datos del asesor.");
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
          tipo_documento: tipoDocumento,
          documento,
          email,
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
        tipo_documento: tipoDocumento,
        documento,
        email,
      }));
      setNuevoCodigoAsesor(codigoActualizado);
      setNuevoTipoDocumento(tipoDocumento);
      setNuevoDocumento(documento);
      setNuevoEmail(email);
      setEditandoCodigo(false);
      setAsesores((actuales) =>
        actuales.map((asesor) =>
          asesor.id_asesor === asesorConsultado.id_asesor
            ? {
                ...asesor,
                codigo_asesor: codigoActualizado,
                tipo_documento: tipoDocumento,
                documento,
                email,
              }
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

    navigate("/");
  };

  const asesoresFiltrados = asesores.filter((asesor) =>
    String(asesor.nombre || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .includes(
        busquedaAsesor
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
      )
  );

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

            <li>
              <Link to="/notoficaciones">
                🔔 notoficaciones
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

              <div className="buscador-asesores">
                <label htmlFor="buscar-asesor">Buscar por nombre</label>
                <input
                  id="buscar-asesor"
                  type="search"
                  value={busquedaAsesor}
                  onChange={(e) => setBusquedaAsesor(e.target.value)}
                  placeholder="Escribe el nombre del asesor"
                />
              </div>

              {asesores.length === 0 ? (
                <p>No hay asesores registrados.</p>
              ) : asesoresFiltrados.length === 0 ? (
                <p>No se encontraron asesores con ese nombre.</p>
              ) : (
                <div className="lista-asesores-compacta">

                  {asesoresFiltrados.map((asesor) => (

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

                      <div className="fila-asesor-dato fila-acciones">
                        <span className="fila-label">Acciones</span>
                        <button
                          type="button"
                          className="boton-editar-asesor"
                          onClick={() => {
                            setAsesorConsultado(asesor);
                            setNuevoCodigoAsesor(asesor.codigo_asesor || "");
                            setNuevoTipoDocumento(asesor.tipo_documento || "");
                            setNuevoDocumento(asesor.documento || "");
                            setNuevoEmail(asesor.email || "");
                            setCampoEditando("todos");
                            setEditandoCodigo(true);
                          }}
                        >
                          ✎ Editar información
                        </button>
                      </div>

                    </div>

                  ))}

                </div>
              )}

            </section>

            </div>

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
                    <h2 id="titulo-modal-cambio-codigo">
                      Editar información del asesor
                    </h2>
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
                      Tipo de documento
                      <input
                        type="text"
                        value={nuevoTipoDocumento}
                        onChange={(e) => setNuevoTipoDocumento(e.target.value)}
                        maxLength={50}
                        autoFocus
                        required
                      />
                    </label>
                    <label>
                      Número de documento
                      <input
                        type="text"
                        value={nuevoDocumento}
                        onChange={(e) => setNuevoDocumento(e.target.value)}
                        maxLength={50}
                        required
                      />
                    </label>
                    <label>
                      Correo electrónico
                      <input
                        type="email"
                        value={nuevoEmail}
                        onChange={(e) => setNuevoEmail(e.target.value)}
                        maxLength={100}
                        required
                      />
                    </label>
                    <label>
                      Código del asesor
                      <input
                        type="text"
                        value={nuevoCodigoAsesor}
                        onChange={(e) => setNuevoCodigoAsesor(e.target.value)}
                        maxLength={30}
                        required
                      />
                    </label>
                    <button type="submit" disabled={guardandoCodigo}>
                      {guardandoCodigo ? "Guardando..." : "Guardar información"}
                    </button>
                  </form>
                </div>
              </div>
            )}

        </main>

      </div>
    </div>
  );
}