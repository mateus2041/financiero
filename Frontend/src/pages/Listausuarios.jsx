import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Registro from "./registro";
import "../styles/Administradores.css";
import logoProyecto from "../assets/images/logo.jpeg";

const API_URL = "http://localhost:8000";

export default function ListaUsuarios() {
  const navigate = useNavigate();

  const rol = (localStorage.getItem("rol") || "").trim().toLowerCase();
  const esAdministrador = rol === "administrador";
  const esAsesor = rol === "asesor";

  const [usuarios, setUsuarios] = useState([]);
  const [busquedaUsuario, setBusquedaUsuario] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [mensajeAccion, setMensajeAccion] = useState("");
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState("");
  const [menuAbierto, setMenuAbierto] = useState(true);
  const [registroAbierto, setRegistroAbierto] = useState(false);
  const [mostrarMensajeAdmin, setMostrarMensajeAdmin] = useState(false);

  const contenedorTablaRef = useRef(null);
  const arrastreInicioRef = useRef(null);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  useEffect(() => {
    const actualizarEstadoMenu = () => {
      setMenuAbierto(window.innerWidth > 650);
    };

    actualizarEstadoMenu();
    window.addEventListener("resize", actualizarEstadoMenu);

    return () => {
      window.removeEventListener("resize", actualizarEstadoMenu);
    };
  }, []);

  useEffect(() => {
    const cerrarConEscape = (evento) => {
      if (evento.key === "Escape") {
        setRegistroAbierto(false);
        setMostrarMensajeAdmin(false);
        setUsuarioSeleccionado(null);
      }
    };

    if (registroAbierto || mostrarMensajeAdmin || usuarioSeleccionado) {
      document.addEventListener("keydown", cerrarConEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", cerrarConEscape);
      document.body.style.overflow = "";
    };
  }, [registroAbierto, mostrarMensajeAdmin, usuarioSeleccionado]);

  const normalizarTexto = (valor) =>
    String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const textoBusqueda = normalizarTexto(busquedaUsuario.trim());

    if (!textoBusqueda) {
      return true;
    }

    return [
      usuario.nombre,
      usuario.correo,
      usuario.email,
      usuario.telefono,
      usuario.documento,
      usuario.numero_documento,
      usuario.codigo_registro,
      usuario.direccion,
      usuario.estado,
    ].some((valor) => normalizarTexto(valor).includes(textoBusqueda));
  });

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

      setUsuarios(Array.isArray(respuesta.data) ? respuesta.data : []);
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
    localStorage.removeItem("rol");

    navigate("/");
  };

  const verUsuario = async (usuario) => {
    setCargandoDetalle(true);
    setErrorDetalle("");

    setUsuarioSeleccionado({
      ...usuario,
      cuentas: [],
    });

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
        cuentas: respuesta.data?.cuentas || [],
      });
    } catch (error) {
      console.error(
        "Error al cargar las cuentas del usuario:",
        error
      );

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

  const iniciarArrastreTabla = (evento) => {
    const contenedor = contenedorTablaRef.current;

    if (!contenedor) {
      return;
    }

    const punto = evento.touches?.[0] || evento;

    arrastreInicioRef.current = {
      x: punto.clientX,
      y: punto.clientY,
      scrollLeft: contenedor.scrollLeft,
      scrollTop: contenedor.scrollTop,
    };
  };

  const moverArrastreTabla = (evento) => {
    const contenedor = contenedorTablaRef.current;
    const inicio = arrastreInicioRef.current;

    if (!contenedor || !inicio) {
      return;
    }

    const punto = evento.touches?.[0] || evento;

    const deltaX = punto.clientX - inicio.x;
    const deltaY = punto.clientY - inicio.y;

    contenedor.scrollLeft = inicio.scrollLeft - deltaX;
    contenedor.scrollTop = inicio.scrollTop - deltaY;
  };

  const terminarArrastreTabla = () => {
    arrastreInicioRef.current = null;
  };

  return (
    <div className="asesor-container">
      <div className="panel-financiero">

        <button
          type="button"
          className={`boton-menu-administradores ${
            menuAbierto ? "" : "menu-cerrado"
          }`}
          onClick={() => setMenuAbierto((actual) => !actual)}
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuAbierto}
        >
          ☰
        </button>

        <aside
          className={`sidebar ${
            menuAbierto ? "" : "sidebar-cerrado"
          }`}
        >
          <ul>
            {esAdministrador && (
              <li>
                <Link
                  to="/Administradores"
                  onClick={() => setMenuAbierto(false)}
                >
                  📜 Principal
                </Link>
              </li>
            )}

            {esAsesor && (
              <li>
                <Link
                  to="/asesor-bancario"
                  onClick={() => setMenuAbierto(false)}
                >
                  📜 Asesor
                </Link>
              </li>
            )}

            {!esAsesor && (
              <li>
                <Link
                  to="/lista-usuarios"
                  onClick={() => setMenuAbierto(false)}
                >
                  👤 Usuarios
                </Link>
              </li>
            )}

            <li>
              <Link
                to="/lista-cuentas"
                onClick={() => setMenuAbierto(false)}
              >
                🌐 Cuentas
              </Link>
            </li>

            {!esAsesor && (
              <li>
                <Link
                  to="/notoficaciones"
                  onClick={() => setMenuAbierto(false)}
                >
                  🔔 Notificaciones
                </Link>
              </li>
            )}

            {esAsesor && (
              <li>
                <button
                  type="button"
                  className="enlace-mensaje-admin"
                  onClick={() => setMostrarMensajeAdmin(true)}
                >
                  ✉️ Mensaje
                </button>
              </li>
            )}

            {esAsesor && (
              <li>
                <Link
                  to="/trageta"
                    onClick={() => setMenuAbierto(false)}
                    >
                     💳 Tarjetas
                </Link>
              </li>
            )}

          </ul>

          <button
            type="button"
            className="logout"
            onClick={cerrarSesion}
          >
            🚪 Cerrar sesión
          </button>
        </aside>

        <main className="contenido-asesores">

          <div className="encabezado-administracion-asesores">
            <div className="marca-financiera">
              <img
                className="logo-administracion-asesores"
                src={logoProyecto}
                alt="Logo del proyecto"
              />
              <span>Financiero</span>
            </div>
            <h1>Lista de Usuarios</h1>
          </div>

          <p className="subtitulo-asesores">
            Usuarios registrados en el sistema financiero
          </p>

          <div className="buscador-asesores">
            <span
              className="icono-buscador-asesores"
              aria-hidden="true"
            >
              &#128269;
            </span>

            <input
              type="search"
              value={busquedaUsuario}
              onChange={(evento) =>
                setBusquedaUsuario(evento.target.value)
              }
              placeholder="Buscar usuario por nombre, correo, documento, teléfono..."
              aria-label="Buscar usuario"
            />
          </div>

          {cargando && <p>Cargando usuarios...</p>}

          {error && (
            <p className="mensaje-error">
              {error}
            </p>
          )}

          {!cargando &&
            !error &&
            usuarios.length === 0 && (
              <p>No hay usuarios registrados.</p>
            )}

          {!cargando &&
            !error &&
            usuarios.length > 0 &&
            usuariosFiltrados.length === 0 && (
              <p className="mensaje-busqueda-asesores">
                No se encontraron usuarios para “{busquedaUsuario}”.
              </p>
            )}

          {!cargando &&
            !error &&
            usuariosFiltrados.length > 0 && (
              <div
                ref={contenedorTablaRef}
                className="tabla-asesores-contenedor"
                onTouchStart={iniciarArrastreTabla}
                onTouchMove={moverArrastreTabla}
                onTouchEnd={terminarArrastreTabla}
                onTouchCancel={terminarArrastreTabla}
              >
                <table className="tabla-asesores">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Número de documento</th>
                      <th>Dirección</th>
                      <th>Código postal</th>
                    </tr>
                  </thead>

                  <tbody>
                    {usuariosFiltrados.map((usuario) => (
                      <tr key={usuario.id_usuario}>

                        <td>
                          {usuario.nombre || "No registrado"}
                        </td>

                        <td>
                          {usuario.documento || "No registrado"}
                        </td>

                        <td>
                          {usuario.direccion || "No registrada"}
                        </td>

                        <td>
                          {usuario.codigo_postal || "No registrado"}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          <div className="acciones-lista-usuarios">

            {esAsesor && (
              <button
                type="button"
                className="boton-registrar-usuario"
                onClick={() => setRegistroAbierto(true)}
              >
                Registrar nuevo usuario
              </button>
            )}

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
            <p className="mensaje-exito">
              {mensajeAccion}
            </p>
          )}

          {registroAbierto && esAsesor && (
            <div
              className="modal-registro-overlay"
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-registro-modal"
              onMouseDown={(evento) => {
                if (evento.target === evento.currentTarget) {
                  setRegistroAbierto(false);
                }
              }}
            >
              <div className="modal-registro-contenido">

                <div className="modal-registro-cabecera">
                  <h2 id="titulo-registro-modal">
                    Registrar nuevo usuario
                  </h2>

                  <button
                    type="button"
                    className="cerrar-modal-registro"
                    onClick={() => setRegistroAbierto(false)}
                    aria-label="Cerrar registro"
                  >
                    X
                  </button>
                </div>

                <Registro isModal />
              </div>
            </div>
          )}

          {mostrarMensajeAdmin && (
            <div
              className="modal-registro-overlay"
              role="dialog"
              aria-modal="true"
              onMouseDown={(evento) => {
                if (evento.target === evento.currentTarget) {
                  setMostrarMensajeAdmin(false);
                }
              }}
            >
              <div className="modal-registro-contenido">

                <div className="modal-registro-cabecera">
                  <h2>Mensaje</h2>

                  <button
                    type="button"
                    className="cerrar-modal-registro"
                    onClick={() =>
                      setMostrarMensajeAdmin(false)
                    }
                    aria-label="Cerrar mensaje"
                  >
                    X
                  </button>
                </div>

                <div className="contenido-mensaje-admin">
                  <p>
                    Aquí puedes agregar el sistema de mensajes
                    entre usuarios, asesores y administradores.
                  </p>
                </div>

              </div>
            </div>
          )}

          {usuarioSeleccionado && (
            <div
              className="modal-usuario"
              role="dialog"
              aria-modal="true"
            >
              <div className="contenido-modal-usuario">

                <div className="cabecera-modal-usuario">
                  <h2>Detalle del usuario</h2>

                  <button
                    type="button"
                    className="cerrar-modal-usuario"
                    onClick={() =>
                      setUsuarioSeleccionado(null)
                    }
                    aria-label="Cerrar detalle"
                  >
                    X
                  </button>
                </div>

                <p>
                  <strong>Nombre:</strong>{" "}
                  {usuarioSeleccionado.nombre ||
                    "No registrado"}
                </p>

                <p>
                  <strong>Correo:</strong>{" "}
                  {usuarioSeleccionado.correo ||
                    usuarioSeleccionado.email ||
                    "No registrado"}
                </p>

                <p>
                  <strong>Teléfono:</strong>{" "}
                  {usuarioSeleccionado.telefono ||
                    "No registrado"}
                </p>

                <p>
                  <strong>Dirección:</strong>{" "}
                  {usuarioSeleccionado.direccion ||
                    "No registrada"}
                </p>

                <p>
                  <strong>Código de registro:</strong>{" "}
                  {usuarioSeleccionado.codigo_registro ||
                    "No disponible"}
                </p>

                <p>
                  <strong>Estado:</strong>{" "}
                  {usuarioSeleccionado.estado || "Activo"}
                </p>

                <h3>Cuentas del usuario</h3>

                {cargandoDetalle && (
                  <p>Cargando cuentas...</p>
                )}

                {errorDetalle && (
                  <p className="mensaje-error">
                    {errorDetalle}
                  </p>
                )}

                {!cargandoDetalle &&
                  !errorDetalle &&
                  (usuarioSeleccionado.cuentas.length === 0 ? (
                    <p>
                      Este usuario no tiene cuentas registradas.
                    </p>
                  ) : (
                    <div className="cuentas-modal-usuario">
                      {usuarioSeleccionado.cuentas.map(
                        (cuenta) => (
                          <div
                            className="cuenta-modal-usuario"
                            key={cuenta.id_cuenta}
                          >
                            <p>
                              <strong>Número:</strong>{" "}
                              {cuenta.numero_cuenta ||
                                "No disponible"}
                            </p>

                            <p>
                              <strong>Tipo:</strong>{" "}
                              {cuenta.tipo_cuenta ||
                                "No disponible"}
                            </p>

                            <p>
                              <strong>
                                Tipo de operación:
                              </strong>{" "}
                              {cuenta.tipo_operacion ||
                                "debito"}
                            </p>

                            <p>
                              <strong>Saldo:</strong>{" "}
                              $
                              {Number(
                                cuenta.saldo || 0
                              ).toLocaleString("es-CO")}
                            </p>

                            <p>
                              <strong>Estado:</strong>{" "}
                              {cuenta.estado ||
                                "No disponible"}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}