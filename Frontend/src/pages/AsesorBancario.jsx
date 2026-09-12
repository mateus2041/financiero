import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../styles/asesorBancario.css";

const API_URL = "http://127.0.0.1:8000";

export default function AsesorBancario() {
  const [codigoRegistro, setCodigoRegistro] = useState("");
  const [usuarioConsultado, setUsuarioConsultado] = useState(null);
  const [consultasRealizadas, setConsultasRealizadas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const cargarUsuariosRegistrados = async () => {
      try {
        const token = localStorage.getItem("token");
        const respuesta = await axios.get(
          `${API_URL}/asesor-bancario/usuarios`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setConsultasRealizadas(
          respuesta.data.map((usuario) => ({
            id: usuario.id_usuario,
            nombre: usuario.nombre,
            codigoRegistro: usuario.codigo_registro,
            fechaHora: usuario.fecha_creacion
              ? new Date(usuario.fecha_creacion).toLocaleString("es-CO", {
                  dateStyle: "short",
                  timeStyle: "short",
                })
              : "No disponible",
          }))
        );
      } catch (error) {
        setMensaje(
          error.response?.data?.detail ||
            "No fue posible cargar los usuarios registrados."
        );
      } finally {
        setCargandoLista(false);
      }
    };

    cargarUsuariosRegistrados();
  }, []);

  const consultarCodigoRegistro = async (evento) => {
    evento.preventDefault();

    if (!/^\d{6}$/.test(codigoRegistro.trim())) {
      setMensaje("El código de registro debe tener seis dígitos.");
      setUsuarioConsultado(null);
      return;
    }

    setCargando(true);
    setMensaje("");
    setUsuarioConsultado(null);

    try {
      const token = localStorage.getItem("token");
      const respuesta = await axios.get(
        `${API_URL}/asesor-bancario/codigo/${codigoRegistro.trim()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const usuario = respuesta.data.usuario;
      setUsuarioConsultado(usuario);
    } catch (error) {
      setMensaje(
        error.response?.data?.detail ||
          "No fue posible consultar el código de registro."
      );
    } finally {
      setCargando(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario_id");
    localStorage.removeItem("documento");

    window.location.href = "/login";
  };

  return (
    <div className="asesor-container">
      <aside className="asesor-navbar">
        <div className="sidebar">
          <ul>
            <li>
              <Link to="/AsesorBancario">
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
              <Link to="/ChatIA">
                ✉️ Mensaje
              </Link>
            </li>
          </ul>

          <button
            className="logout"
            onClick={handleLogout}
          >
            🚪 Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="asesor-panel">
        <section className="asesor-hero">
          <div className="asesor-hero-text">
            <h1 className="asesor-title">
              Asesor Bancario
            </h1>

            <p className="asesor-description">
              Administre la información bancaria desde este panel.
            </p>
          </div>
        </section>

        <section className="contenido-asesores">
          <div className="contenido-lista-asesores">
            <aside className="lista-consultas-asesor">
              <h2>Usuarios registrados</h2>

              {cargandoLista ? (
                <p>Cargando usuarios registrados...</p>
              ) : consultasRealizadas.length === 0 ? (
                <p>Aún no hay usuarios registrados.</p>
              ) : (
                <div className="tabla-consultas-contenedor">
                  <table className="tabla-consultas">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Código</th>
                        <th>Fecha y hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consultasRealizadas.map((consulta) => (
                        <tr key={consulta.id}>
                          <td>{consulta.nombre}</td>
                          <td>{consulta.codigoRegistro}</td>
                          <td>{consulta.fechaHora}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </aside>

            <div className="panel-lista-asesores">
              <form
                className="formulario-asesor"
                onSubmit={consultarCodigoRegistro}
              >
                <h2>Buscar usuario</h2>

                <div className="campos-asesor">
                  <label htmlFor="codigo-registro">
                    Código de registro
                    <input
                      id="codigo-registro"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Ej. 123456"
                      value={codigoRegistro}
                      onChange={(evento) =>
                        setCodigoRegistro(evento.target.value.replace(/\D/g, ""))
                      }
                    />
                  </label>

                  <button type="submit" disabled={cargando}>
                    {cargando ? "Consultando..." : "Consultar"}
                  </button>
                </div>
              </form>

              {mensaje && <p className="mensaje-error">{mensaje}</p>}

              {usuarioConsultado && (
                <article className="tarjeta-asesor">
                  <h2>Usuario encontrado</h2>
                  <p>
                    <strong>Código de registro:</strong>{" "}
                    {usuarioConsultado.codigo_registro}
                  </p>
                  <p>
                    <strong>Nombre:</strong>{" "}
                    {usuarioConsultado.nombre}
                  </p>
                  <p>
                    <strong>Documento:</strong>{" "}
                    {usuarioConsultado.documento}
                  </p>
                  <p>
                    <strong>Correo:</strong>{" "}
                    {usuarioConsultado.email || "No registrado"}
                  </p>
                </article>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}