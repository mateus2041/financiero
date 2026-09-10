import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/listausuarios.css";

function ListaUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const token = localStorage.getItem("token");

      const respuesta = await fetch("http://localhost:8000/usuarios", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!respuesta.ok) {
        throw new Error("Error al cargar los usuarios");
      }

      const datos = await respuesta.json();

      setUsuarios(datos);
    } catch (error) {
      console.error(error);
      setError("No se pudieron cargar los usuarios");
    } finally {
      setCargando(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario_id");
    localStorage.removeItem("documento");

    navigate("/login");
  };

  const cambiarEstadoUsuario = async (idUsuario, estadoActual) => {
    const nuevoEstado = estadoActual === "activo" ? "inactivo" : "activo";

    try {
      const token = localStorage.getItem("token");

      const respuesta = await fetch(`http://localhost:8000/usuarios/${idUsuario}/estado`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (!respuesta.ok) {
        throw new Error("No se pudo cambiar el estado del usuario");
      }

      setUsuarios((prevUsuarios) =>
        prevUsuarios.map((usuario) =>
          usuario.id_usuario === idUsuario
            ? { ...usuario, estado: nuevoEstado }
            : usuario
        )
      );
    } catch (error) {
      console.error(error);
      setError("No se pudo cambiar el estado del usuario");
    }
  };

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
              <Link to="lista-cuentas">
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
            onClick={handleLogout}
          >
            🚪 Cerrar sesión
          </button>

        </aside>

        <main className="panel-contenido">

          <section className="asesor-hero">

            <div className="asesor-hero-text">

              <h1 className="asesor-title">
                Lista de Usuarios
              </h1>

              <p className="asesor-description">
                Usuarios registrados en Financiero
              </p>

            </div>

          </section>

          <section className="asesor-panel">

            {cargando && (
              <div className="asesor-cargando">
                Cargando usuarios...
              </div>
            )}

            {error && (
              <div className="asesor-error">
                {error}
              </div>
            )}

            {!cargando && !error && usuarios.length === 0 && (
              <div className="asesor-sin-resultados">
                No hay usuarios registrados.
              </div>
            )}

            {!cargando && !error && usuarios.length > 0 && (

              <div className="asesores-lista">

                {usuarios.map((usuario) => (

                  <div
                    className="asesor-resultado"
                    key={usuario.id_usuario}
                  >

                    <div>

                      <strong>
                        {usuario.nombre || "Sin nombre"}
                      </strong>

                      <span>
                        Documento: {usuario.documento || "No disponible"}
                      </span>

                      <span>
                        Correo: {
                          usuario.correo ||
                          usuario.email ||
                          "No disponible"
                        }
                      </span>

                      <span>
                        Teléfono: {usuario.telefono || "No disponible"}
                      </span>

                      <span>
                        Dirección: {
                          usuario.direccion ||
                          "No disponible"
                        }
                      </span>

                      <span>
                        Código de registro: {
                          usuario.codigo_registro ||
                          "No disponible"
                        }
                      </span>

                      <span>
                        Estado: {usuario.estado || "activo"}
                      </span>

                      <button
                        className="logout"
                        onClick={() => cambiarEstadoUsuario(usuario.id_usuario, usuario.estado || "activo")}
                        style={{
                          marginTop: "12px",
                          width: "auto",
                          minWidth: "180px",
                          alignSelf: "flex-start",
                        }}
                      >
                        {usuario.estado === "inactivo"
                          ? "Activar usuario"
                          : "Inactivar usuario"}
                      </button>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </section>

        </main>

      </div>

    </div>
  );
}

export default ListaUsuarios;