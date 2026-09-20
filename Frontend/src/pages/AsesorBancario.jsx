import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Registro from "./registro";
import logo from "../assets/images/logo.jpeg";
import "../styles/asesorBancario.css";

const API_URL = "http://127.0.0.1:8000";

export default function AsesorBancario() {
  const navigate = useNavigate();
  const rolActual = (localStorage.getItem("rol") || "").trim().toLowerCase();
  const [consultasRealizadas, setConsultasRealizadas] = useState([]);
  const [busquedaUsuario, setBusquedaUsuario] = useState("");
  const [cargandoLista, setCargandoLista] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const [mensajeAdmin, setMensajeAdmin] = useState("");
  const [imagenMensaje, setImagenMensaje] = useState(null);
  const [previewImagenMensaje, setPreviewImagenMensaje] = useState("");
  const [mostrarMensajeAdmin, setMostrarMensajeAdmin] = useState(false);
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [cargandoDetalleUsuario, setCargandoDetalleUsuario] = useState(false);
  const [errorDetalleUsuario, setErrorDetalleUsuario] = useState("");
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    const actualizarEstadoMenu = () => {
      setMenuAbierto(window.innerWidth > 650);
    };

    actualizarEstadoMenu();
    window.addEventListener("resize", actualizarEstadoMenu);

    return () => window.removeEventListener("resize", actualizarEstadoMenu);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token || rolActual !== "asesor") {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario_id");
      localStorage.removeItem("documento");
      localStorage.removeItem("rol");
      localStorage.removeItem("nombre_asesor");
      localStorage.removeItem("codigo_verificacion");
      navigate("/login", { replace: true });
      return;
    }

    const cargarUsuariosRegistrados = async () => {
      try {
        const respuesta = await axios.get(`${API_URL}/usuarios`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setConsultasRealizadas(
          respuesta.data.map((usuario) => ({
            id: usuario.id_usuario,
            nombre: usuario.nombre,
            correo: usuario.correo || usuario.email,
            telefono: usuario.telefono,
            direccion: usuario.direccion,
            codigoRegistro: usuario.codigo_registro,
            estado: usuario.estado || "activo",
          }))
        );
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("usuario_id");
          localStorage.removeItem("documento");
          localStorage.removeItem("rol");
          localStorage.removeItem("nombre_asesor");
          localStorage.removeItem("codigo_verificacion");
          navigate("/login", { replace: true });
          return;
        }

        setMensaje(
          error.response?.data?.detail ||
            "No fue posible cargar los usuarios registrados."
        );
      } finally {
        setCargandoLista(false);
      }
    };

    cargarUsuariosRegistrados();
  }, [navigate, rolActual]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario_id");
    localStorage.removeItem("documento");
    localStorage.removeItem("rol");
    localStorage.removeItem("nombre_asesor");
    localStorage.removeItem("codigo_verificacion");

    window.location.href = "/login";
  };

  const convertirArchivoADataUrl = (archivo) =>
    new Promise((resolver, rechazar) => {
      const lector = new FileReader();
      lector.onload = () => resolver(lector.result);
      lector.onerror = () => rechazar(new Error("No se pudo leer la imagen"));
      lector.readAsDataURL(archivo);
    });

  const handleImagenChange = async (evento) => {
    const archivo = evento.target.files?.[0];

    if (!archivo) {
      return;
    }

    if (!archivo.type.startsWith("image/")) {
      setMensaje("El archivo adjunto debe ser una imagen.");
      return;
    }

    try {
      const imagenBase64 = await convertirArchivoADataUrl(archivo);
      setImagenMensaje({
        nombre: archivo.name,
        dataUrl: imagenBase64,
      });
      setPreviewImagenMensaje(imagenBase64);
      setMensaje("");
    } catch (error) {
      setMensaje("No se pudo cargar la imagen.");
    }
  };

  const enviarMensajeAdmin = async () => {
    const texto = mensajeAdmin.trim();

    if (!texto && !imagenMensaje) {
      return;
    }

    const ahora = new Date();
    const textoFinal = texto || "Imagen adjunta";
    const nuevoMensaje = {
      id: Date.now(),
      id_notificacion: Date.now(),
      nombre_asesor:
        localStorage.getItem("nombre_asesor") ||
        localStorage.getItem("nombre_usuario") ||
        "Sin nombre",
      texto: textoFinal,
      mensaje: textoFinal,
      descripcion: textoFinal,
      titulo: "Mensaje para el administrador",
      tipo: "mensaje",
      imagen: imagenMensaje?.dataUrl || null,
      imagen_data_url: imagenMensaje?.dataUrl || null,
      fecha: ahora.toLocaleString("es-CO"),
      fecha_creacion: ahora.toISOString(),
      leida: false,
    };

    const mensajesGuardados = JSON.parse(
      localStorage.getItem("mensajes_admin") || "[]"
    );

    localStorage.setItem(
      "mensajes_admin",
      JSON.stringify([nuevoMensaje, ...mensajesGuardados])
    );

    setMensajeAdmin("");
    setImagenMensaje(null);
    setPreviewImagenMensaje("");
    setMostrarMensajeAdmin(false);
    setMensaje("");
    setMensajeExito("Mensaje enviado");
  };

  const verUsuario = async (usuario) => {
    const token = localStorage.getItem("token");

    setUsuarioSeleccionado({ ...usuario, cuentas: [] });
    setCargandoDetalleUsuario(true);
    setErrorDetalleUsuario("");

    try {
      const respuesta = await axios.get(
        `${API_URL}/usuarios/${usuario.id}/cuentas`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUsuarioSeleccionado((usuarioActual) => ({
        ...usuarioActual,
        cuentas: respuesta.data?.cuentas || [],
      }));
    } catch (error) {
      setErrorDetalleUsuario(
        error.response?.data?.detail ||
          "No se pudieron cargar las cuentas del usuario."
      );
    } finally {
      setCargandoDetalleUsuario(false);
    }
  };

  const usuariosFiltrados = consultasRealizadas.filter((usuario) => {
    const texto = busquedaUsuario.trim().toLowerCase();

    if (!texto) {
      return true;
    }

    return [
      usuario.nombre,
      usuario.correo,
      usuario.telefono,
      usuario.direccion,
      usuario.codigoRegistro,
      usuario.estado,
    ].some((valor) => String(valor || "").toLowerCase().includes(texto));
  });

  return (
    <div className="asesor-container">
      <button
        type="button"
        className={`asesor-menu-movil ${menuAbierto ? "menu-abierto" : ""}`}
        onClick={() => setMenuAbierto((actual) => !actual)}
        aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={menuAbierto}
      >
        ☰
      </button>

      {menuAbierto && (
        <button
          type="button"
          className="fondo-menu-asesor"
          aria-label="Cerrar menú móvil"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      <aside className={`asesor-navbar ${menuAbierto ? "" : "menu-asesor-cerrado"}`}>
        <div className="sidebar">
          <ul>
            <li>
              <Link to="/asesor-bancario" onClick={() => setMenuAbierto(false)}>
                📜 asesor
              </Link>
            </li>

            <li>
              <Link to="/lista-cuentas" onClick={() => setMenuAbierto(false)}>
                🌐 Cuentas
              </Link>
            </li>

            <li>
              <button
                type="button"
                className="enlace-mensaje-admin"
                onClick={() => {
                  setMenuAbierto(false);
                  setMostrarMensajeAdmin(true);
                }}
              >
                ✉️ Mensaje
              </button>
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

      {mostrarMensajeAdmin && (
        <div
          className="modal-mensaje-admin-overlay"
          role="presentation"
          onClick={() => setMostrarMensajeAdmin(false)}
        >
          <section
            className="modal-mensaje-admin"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-mensaje-admin"
            onClick={(evento) => evento.stopPropagation()}
          >
            <div className="modal-mensaje-admin-header">
              <h2 id="titulo-mensaje-admin">Mensaje para el administrador</h2>
              <button
                type="button"
                className="cerrar-mensaje-admin"
                aria-label="Cerrar mensaje para el administrador"
                onClick={() => setMostrarMensajeAdmin(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-mensaje-admin-body">
              <label htmlFor="mensaje-admin-input" className="modal-mensaje-admin-label">
                Código de mensaje:
              </label>

              <input
                id="mensaje-admin-input"
                type="text"
                className="codigo-mensaje-admin-input"
                value={mensajeAdmin}
                onChange={(evento) => setMensajeAdmin(evento.target.value)}
                placeholder="Escribe un mensaje"
                autoComplete="off"
                style={{
                  color: "#ffffff",
                  backgroundColor: "#0b0f16",
                  WebkitTextFillColor: "#ffffff",
                  fontSize: "18px",
                  fontWeight: 600,
                  border: "1px solid rgba(242, 201, 76, 0.8)",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />

              <label htmlFor="imagen-admin-input" className="modal-mensaje-admin-label">
                Imagen adjunta:
              </label>

              <input
                id="imagen-admin-input"
                type="file"
                accept="image/*"
                onChange={handleImagenChange}
                style={{
                  width: "100%",
                  marginTop: "8px",
                  marginBottom: "12px",
                  color: "#ffffff",
                }}
              />

              {previewImagenMensaje && (
                <img
                  src={previewImagenMensaje}
                  alt="Vista previa del mensaje"
                  style={{
                    width: "100%",
                    maxHeight: "180px",
                    objectFit: "cover",
                    borderRadius: "10px",
                    marginBottom: "12px",
                    border: "1px solid rgba(242, 201, 76, 0.8)",
                  }}
                />
              )}

              <button
                type="button"
                className="boton-enviar-mensaje-admin"
                onClick={enviarMensajeAdmin}
                disabled={!mensajeAdmin.trim() && !imagenMensaje}
              >
                Enviar
              </button>
            </div>
          </section>
        </div>
      )}

      {mostrarRegistro && (
        <div
          className="registro-asesor-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setMostrarRegistro(false)}
        >
          <div onClick={(evento) => evento.stopPropagation()}>
            <Registro isModal />
          </div>
        </div>
      )}

      {usuarioSeleccionado && (
        <div
          className="detalle-usuario-asesor-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-detalle-usuario-asesor"
          onClick={() => setUsuarioSeleccionado(null)}
        >
          <section
            className="detalle-usuario-asesor-modal"
            onClick={(evento) => evento.stopPropagation()}
          >
            <div className="detalle-usuario-asesor-header">
              <h2 id="titulo-detalle-usuario-asesor">Información del usuario</h2>
              <button
                type="button"
                className="cerrar-detalle-usuario-asesor"
                onClick={() => setUsuarioSeleccionado(null)}
                aria-label="Cerrar información del usuario"
              >
                ×
              </button>
            </div>

            <div className="detalle-usuario-asesor-datos">
              <p><strong>Nombre:</strong> {usuarioSeleccionado.nombre || "No registrado"}</p>
              <p><strong>Correo:</strong> {usuarioSeleccionado.correo || "No registrado"}</p>
              <p><strong>Teléfono:</strong> {usuarioSeleccionado.telefono || "No registrado"}</p>
              <p><strong>Dirección:</strong> {usuarioSeleccionado.direccion || "No registrada"}</p>
              <p><strong>Código de registro:</strong> {usuarioSeleccionado.codigoRegistro || "No disponible"}</p>
              <p><strong>Contraseña:</strong> Protegida</p>
              <p><strong>Estado:</strong> {usuarioSeleccionado.estado || "Activo"}</p>
            </div>

            <h3 className="detalle-usuario-asesor-subtitulo">Cuentas del usuario</h3>

            {cargandoDetalleUsuario ? (
              <p className="detalle-usuario-asesor-mensaje">Cargando cuentas...</p>
            ) : errorDetalleUsuario ? (
              <p className="mensaje-error">{errorDetalleUsuario}</p>
            ) : usuarioSeleccionado.cuentas.length === 0 ? (
              <p className="detalle-usuario-asesor-mensaje">
                Este usuario no tiene cuentas registradas.
              </p>
            ) : (
              <div className="cuentas-detalle-asesor">
                {usuarioSeleccionado.cuentas.map((cuenta) => (
                  <div className="cuenta-detalle-asesor" key={cuenta.id_cuenta}>
                    <p><strong>Número:</strong> {cuenta.numero_cuenta || "No disponible"}</p>
                    <p><strong>Tipo:</strong> {cuenta.tipo_cuenta || "No disponible"}</p>
                    <p><strong>Operación:</strong> {cuenta.tipo_operacion || "debito"}</p>
                    <p><strong>Saldo:</strong> ${Number(cuenta.saldo || 0).toLocaleString("es-CO")}</p>
                    <p><strong>Estado:</strong> {cuenta.estado || "activa"}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <main className="asesor-panel">
        <section className="asesor-hero">
          <div className="asesor-hero-text">
            <div className="asesor-brand">
              <div className="asesor-brand-left">
                <img className="asesor-logo" src={logo} alt="Logo Financiero" />
                <span className="asesor-brand-name">Financiero</span>
              </div>
              <h1 className="asesor-title">Asesor Bancario</h1>
            </div>
            <p className="asesor-description">
              Administre la información bancaria desde este panel.
            </p>
          </div>
        </section>

        <section className="contenido-asesores">
          <div className="buscador-usuarios-asesor">
            <span className="icono-buscador-usuarios-asesor" aria-hidden="true">
              &#128269;
            </span>
            <input
              type="search"
              value={busquedaUsuario}
              onChange={(evento) => setBusquedaUsuario(evento.target.value)}
              placeholder="Buscar usuario por nombre, correo, documento, teléfono..."
              aria-label="Buscar usuario"
            />
          </div>

          <div className="contenido-lista-asesores">
            <div className="tabla-usuarios-asesor-contenedor">
              {cargandoLista ? (
                <p>Cargando usuarios registrados...</p>
              ) : usuariosFiltrados.length === 0 ? (
                <p>Aún no hay usuarios registrados.</p>
              ) : (
                <table className="tabla-usuarios-asesor">
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
                      {usuariosFiltrados.map((usuario) => (
                        <tr key={usuario.id}>
                          <td>{usuario.nombre || "No registrado"}</td>
                          <td>{usuario.correo || "No registrado"}</td>
                          <td>{usuario.telefono || "No registrado"}</td>
                          <td>{usuario.direccion || "No registrada"}</td>
                          <td>{usuario.codigoRegistro || "No disponible"}</td>
                          <td><span className="contrasena-protegida">Protegida</span></td>
                          <td>
                            <span className={`estado-badge ${usuario.estado}`}>
                              {usuario.estado}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="boton-ver-asesor"
                              onClick={() => verUsuario(usuario)}
                            >
                              Ver
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                </table>
              )}
            </div>

            {mensaje && <p className="mensaje-error">{mensaje}</p>}
            {mensajeExito && <p className="mensaje-exito">{mensajeExito}</p>}
          </div>

          <div className="acciones-usuarios-asesor">
            <button
              type="button"
              className="boton-registrar-asesor"
              onClick={() => setMostrarRegistro(true)}
            >
              Registrar nuevo usuario
            </button>
            <button
              type="button"
              className="boton-actualizar-asesor"
              onClick={() => window.location.reload()}
            >
              Actualizar
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}