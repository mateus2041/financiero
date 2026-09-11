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
  const [mensaje, setMensaje] = useState("");
  const [codigoAsesorConsulta, setCodigoAsesorConsulta] = useState("");
  const [asesorConsultado, setAsesorConsultado] = useState(null);
  const [consultandoAsesor, setConsultandoAsesor] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const formatearError = (error, mensajeFallback) => {
    const detalle = error?.response?.data?.detail;
    const texto = typeof detalle === "string" ? detalle.trim() : "";

    if (texto && !["Not Found", "not found", "NotFound"].includes(texto)) {
      return texto;
    }

    return mensajeFallback;
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
      setError("Ingrese el código del asesor.");
      return;
    }

    try {
      setError("");
      setMensaje("");
      setConsultandoAsesor(true);
      setAsesorConsultado(null);

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

      if (!lista[0]) {
        setError("No se encontró un asesor con ese código.");
      }
    } catch (error) {
      console.error(error);
      setAsesorConsultado(null);
      setError(formatearError(error, "No se pudo consultar el asesor."));
    } finally {
      setConsultandoAsesor(false);
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

            <li>
              <Link to="/">
                💲 Devolución
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

              {asesorConsultado ? (
                <div className="resultado-asesor-consultado">
                  <p>
                    <strong>Nombre:</strong> {asesorConsultado.nombre || "Sin nombre"}
                  </p>
                  <p>
                    <strong>Código:</strong> {asesorConsultado.codigo_asesor || "Sin código"}
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
            </aside>
          </div>

        </main>

      </div>
    </div>
  );
}