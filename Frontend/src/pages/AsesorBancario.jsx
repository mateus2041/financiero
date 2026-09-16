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
  const [mensajeExito, setMensajeExito] = useState("");
  const [mensajeAdmin, setMensajeAdmin] = useState("");
  const [imagenMensaje, setImagenMensaje] = useState(null);
  const [previewImagenMensaje, setPreviewImagenMensaje] = useState("");
  const [mostrarMensajeAdmin, setMostrarMensajeAdmin] = useState(false);

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

    window.location.href = "/";
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
              <button
                type="button"
                className="enlace-mensaje-admin"
                onClick={() => setMostrarMensajeAdmin(true)}
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

              {mensajeExito && (
                <p
                  style={{
                    marginTop: "12px",
                    color: "#82d6a5",
                    fontWeight: 600,
                  }}
                >
                  {mensajeExito}
                </p>
              )}

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