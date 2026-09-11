import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Administradores.css";

const API_URL = "http://localhost:8000";

export default function ListaUsuarios() {
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [mensajeAccion, setMensajeAccion] = useState("");
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState("");

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      setError("");

      const token = localStorage.getItem("token");

      const respuesta = await axios.get(`${API_URL}/usuarios`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsuarios(respuesta.data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);

      if (error.response) {
        setError(
          error.response.data?.detail ||
            "No se pudieron cargar los usuarios"
        );
      } else {
        setError("No se pudo conectar con el servidor");
      }
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("documento");
    localStorage.removeItem("usuario_id");

    navigate("/login");
  };

  const verUsuario = async (usuario) => {
    setCargandoDetalle(true);
    setErrorDetalle("");
    setUsuarioSeleccionado({ ...usuario, cuentas: [] });

    try {
      const token = localStorage.getItem("token");
      const respuesta = await axios.get(
        `${API_URL}/usuarios/${usuario.id_usuario}/cuentas`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUsuarioSeleccionado({
        ...usuario,
        cuentas: respuesta.data.cuentas || [],
      });
    } catch (error) {
      console.error("Error al cargar las cuentas del usuario:", error);
      setErrorDetalle(
        error.response?.data?.detail ||
          "No se pudieron cargar las cuentas del usuario"
      );
    } finally {
      setCargandoDetalle(false);
    }
  };

  const inhabilitarUsuario = (idUsuario) => {
    const usuario = usuarios.find(
      (item) => item.id_usuario === idUsuario
    );

    if (!usuario || usuario.estado === "inactivo") {
      return;
    }

    const confirmar = window.confirm(
      `¿Deseas inhabilitar a ${usuario.nombre || "este usuario"}?`
    );

    if (!confirmar) {
      return;
    }

    setUsuarios((usuariosActuales) =>
      usuariosActuales.map((item) =>
        item.id_usuario === idUsuario
          ? { ...item, estado: "inactivo" }
          : item
      )
    );
    setMensajeAccion(
      "Usuario inhabilitado en la lista. La persistencia requiere conectar el endpoint del backend."
    );
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

          <h1>Lista de Usuarios</h1>

          <p className="subtitulo-asesores">
            Usuarios registrados en el sistema financiero
          </p>

          {cargando && (
            <p>
              Cargando usuarios...
            </p>
          )}

          {error && (
            <p className="mensaje-error">
              {error}
            </p>
          )}

          {!cargando &&
            !error &&
            usuarios.length === 0 && (
              <p>
                No hay usuarios registrados.
              </p>
            )}

          {!cargando &&
            !error &&
            usuarios.length > 0 && (
              <div className="tabla-asesores-contenedor">

                <table className="tabla-asesores">

                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Correo</th>
                      <th>Teléfono</th>
                      <th>Dirección</th>
                      <th>Código de registro</th>
                      <th>Contraseña</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {usuarios.map((usuario) => (
                      <tr key={usuario.id_usuario}>

                        <td>
                          {usuario.nombre || "No registrado"}
                        </td>

                        <td>
                          {usuario.correo || "No registrado"}
                        </td>

                        <td>
                          {usuario.telefono || "No registrado"}
                        </td>

                        <td>
                          {usuario.direccion || "No registrada"}
                        </td>

                        <td>
                          {usuario.codigo_registro || "No disponible"}
                        </td>

                        <td>
                          <span className="contrasena-protegida">
                            Protegida
                          </span>
                        </td>

                        <td>
                          <span
                            className={`estado-badge ${
                              usuario.estado === "activo"
                                ? "activo"
                                : "inactivo"
                            }`}
                          >
                            {usuario.estado || "Activo"}
                          </span>
                        </td>

                        <td className="acciones-usuarios">
                          <button
                            type="button"
                            className="boton-ver"
                            onClick={() => verUsuario(usuario)}
                          >
                            Ver
                          </button>
                          <button
                            type="button"
                            className="boton-inhabilitar"
                            onClick={() =>
                              inhabilitarUsuario(usuario.id_usuario)
                            }
                            disabled={usuario.estado === "inactivo"}
                          >
                            {usuario.estado === "inactivo"
                              ? "Inhabilitado"
                              : "Inhabilitar"}
                          </button>
                        </td>

                      </tr>
                    ))}
                  </tbody>

                </table>

              </div>
            )}

          <div className="acciones-lista-usuarios">
            <button
              type="button"
              className="boton-actualizar"
              onClick={cargarUsuarios}
              disabled={cargando}
            >
              {cargando ? "Actualizando..." : "Actualizar"}
            </button>
          </div>

          {mensajeAccion && (
            <p className="mensaje-exito">{mensajeAccion}</p>
          )}

          {usuarioSeleccionado && (
            <div className="modal-usuario" role="dialog" aria-modal="true">
              <div className="contenido-modal-usuario">
                <div className="cabecera-modal-usuario">
                  <h2>Detalle del usuario</h2>
                  <button
                    type="button"
                    className="cerrar-modal-usuario"
                    onClick={() => setUsuarioSeleccionado(null)}
                    aria-label="Cerrar detalle"
                  >
                    X
                  </button>
                </div>

                <p><strong>Nombre:</strong> {usuarioSeleccionado.nombre || "No registrado"}</p>
                <p><strong>Correo:</strong> {usuarioSeleccionado.correo || "No registrado"}</p>
                <p><strong>Teléfono:</strong> {usuarioSeleccionado.telefono || "No registrado"}</p>
                <p><strong>Dirección:</strong> {usuarioSeleccionado.direccion || "No registrada"}</p>
                <p><strong>Código de registro:</strong> {usuarioSeleccionado.codigo_registro || "No disponible"}</p>
                <p><strong>Estado:</strong> {usuarioSeleccionado.estado || "Activo"}</p>

                <h3>Cuentas del usuario</h3>

                {cargandoDetalle && <p>Cargando cuentas...</p>}
                {errorDetalle && (
                  <p className="mensaje-error">{errorDetalle}</p>
                )}

                {!cargandoDetalle && !errorDetalle && (
                  usuarioSeleccionado.cuentas.length === 0 ? (
                    <p>Este usuario no tiene cuentas registradas.</p>
                  ) : (
                    <div className="cuentas-modal-usuario">
                      {usuarioSeleccionado.cuentas.map((cuenta) => (
                        <div
                          className="cuenta-modal-usuario"
                          key={cuenta.id_cuenta}
                        >
                          <p><strong>Número:</strong> {cuenta.numero_cuenta || "No disponible"}</p>
                          <p><strong>Tipo:</strong> {cuenta.tipo_cuenta || "No disponible"}</p>
                          <p><strong>Saldo:</strong> ${Number(cuenta.saldo || 0).toLocaleString("es-CO")}</p>
                          <p><strong>Estado:</strong> {cuenta.estado || "No disponible"}</p>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}