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
  const [mensaje, setMensaje] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const [mensajeAdmin, setMensajeAdmin] = useState("");
  const [imagenMensaje, setImagenMensaje] = useState(null);
  const [previewImagenMensaje, setPreviewImagenMensaje] = useState("");
  const [mostrarMensajeAdmin, setMostrarMensajeAdmin] = useState(false);
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [mostrarGrafica, setMostrarGrafica] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [cargandoDetalleUsuario, setCargandoDetalleUsuario] = useState(false);
  const [errorDetalleUsuario, setErrorDetalleUsuario] = useState("");
  const [edicionCuenta, setEdicionCuenta] = useState({});
  const [guardandoCuenta, setGuardandoCuenta] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [estadisticas, setEstadisticas] = useState({
    usuariosRegistrados: 0,
    cuentasHabilitadas: 0,
    cuentasDeshabilitadas: 0,
    tarjetasActivas: 0,
  });
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(true);

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

    const cargarEstadisticas = async () => {
      try {
        const [usuariosRes, cuentasRes] = await Promise.all([
          axios.get(`${API_URL}/usuarios`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/administradores/cuentas`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const usuarios = Array.isArray(usuariosRes.data) ? usuariosRes.data : [];
        const cuentas = Array.isArray(cuentasRes.data?.cuentas)
          ? cuentasRes.data.cuentas
          : [];

        const cuentasHabilitadas = cuentas.filter(
          (cuenta) => String(cuenta.estado || "").toLowerCase() === "activa"
        ).length;

        const cuentasDeshabilitadas = cuentas.filter(
          (cuenta) => String(cuenta.estado || "").toLowerCase() === "inactiva"
        ).length;

        const tarjetasActivas = (
          await Promise.all(
            usuarios.map(async (usuario) => {
              try {
                const respuesta = await axios.get(
                  `${API_URL}/usuarios/${usuario.id_usuario}/tarjetas`,
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );

                const tarjetas = Array.isArray(respuesta.data)
                  ? respuesta.data
                  : [];

                return tarjetas.filter(
                  (tarjeta) => String(tarjeta.estado || "").toLowerCase() === "activa"
                ).length;
              } catch (error) {
                return 0;
              }
            })
          )
        ).reduce((total, cantidad) => total + cantidad, 0);

        setEstadisticas({
          usuariosRegistrados: usuarios.length,
          cuentasHabilitadas,
          cuentasDeshabilitadas,
          tarjetasActivas,
        });
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
            "No fue posible cargar las estadísticas del panel."
        );
      } finally {
        setCargandoEstadisticas(false);
      }
    };

    cargarEstadisticas();
  }, [navigate, rolActual]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario_id");
    localStorage.removeItem("documento");
    localStorage.removeItem("rol");
    localStorage.removeItem("nombre_asesor");
    localStorage.removeItem("codigo_verificacion");

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

  const iniciarEdicionCuenta = (cuenta) => {
    setEdicionCuenta((actual) => ({
      ...actual,
      [cuenta.id_cuenta]: {
        tipo_cuenta: cuenta.tipo_cuenta || "ahorros",
        tipo_operacion: cuenta.tipo_operacion || "debito",
        saldo: Number(cuenta.saldo || 0).toString(),
      },
    }));
    setErrorDetalleUsuario("");
  };

  const cerrarEdicionCuenta = (idCuenta) => {
    setEdicionCuenta((actual) => {
      const siguiente = { ...actual };
      delete siguiente[idCuenta];
      return siguiente;
    });
  };

  const guardarCuenta = async (idCuenta) => {
    const datos = edicionCuenta[idCuenta];
    if (!datos) {
      return;
    }

    const saldo = Number(datos.saldo);
    if (!Number.isFinite(saldo) || saldo < 0) {
      setErrorDetalleUsuario("El saldo debe ser un número válido y no puede ser negativo.");
      return;
    }

    const token = localStorage.getItem("token");

    try {
      setGuardandoCuenta(idCuenta);
      setErrorDetalleUsuario("");

      await Promise.all([
        axios.put(
          `${API_URL}/asesor-bancario/cuenta/${idCuenta}/tipo-cuenta`,
          { tipo_cuenta: datos.tipo_cuenta },
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.put(
          `${API_URL}/asesor-bancario/cuenta/${idCuenta}/tipo-operacion`,
          { tipo_operacion: datos.tipo_operacion },
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.put(
          `${API_URL}/asesor-bancario/cuenta/${idCuenta}/saldo`,
          { saldo },
          { headers: { Authorization: `Bearer ${token}` } }
        ),
      ]);

      setUsuarioSeleccionado((actual) => ({
        ...actual,
        cuentas: (actual?.cuentas || []).map((cuenta) =>
          cuenta.id_cuenta === idCuenta
            ? {
                ...cuenta,
                tipo_cuenta: datos.tipo_cuenta,
                tipo_operacion: datos.tipo_operacion,
                saldo,
              }
            : cuenta
        ),
      }));

      setEdicionCuenta((actual) => {
        const siguiente = { ...actual };
        delete siguiente[idCuenta];
        return siguiente;
      });

      setMensajeExito("Cuenta actualizada correctamente.");
    } catch (error) {
      setErrorDetalleUsuario(
        error.response?.data?.detail ||
          "No se pudo actualizar la cuenta del usuario."
      );
    } finally {
      setGuardandoCuenta(null);
    }
  };

  const maximoEstadistica = Math.max(
    1,
    estadisticas.usuariosRegistrados,
    estadisticas.cuentasHabilitadas,
    estadisticas.cuentasDeshabilitadas,
    estadisticas.tarjetasActivas
  );

  const datosGrafica = [
    {
      nombre: "Usuarios",
      valor: estadisticas.usuariosRegistrados,
      clase: "grafica-usuarios",
    },
    {
      nombre: "Habilitadas",
      valor: estadisticas.cuentasHabilitadas,
      clase: "grafica-habilitadas",
    },
    {
      nombre: "Deshabilitadas",
      valor: estadisticas.cuentasDeshabilitadas,
      clase: "grafica-deshabilitadas",
    },
    {
      nombre: "Tarjetas",
      valor: estadisticas.tarjetasActivas,
      clase: "grafica-tarjetas",
    },
  ];

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
              <Link to="/lista-usuarios">
                👤 Usuarios
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

            <li>
              <Link to="/trageta" onClick={() => setMenuAbierto(false)}>
                💳 Tarjetas
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
          <div
            className="registro-asesor-modal"
            onClick={(evento) => evento.stopPropagation()}
          >
            <Registro isModal />
          </div>
        </div>
      )}

      {mostrarGrafica && (
        <div
          className="modal-grafica-asesor-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-grafica-asesor"
          onClick={() => setMostrarGrafica(false)}
        >
          <section
            className="modal-grafica-asesor"
            onClick={(evento) => evento.stopPropagation()}
          >
            <div className="modal-grafica-header">
              <h3 id="titulo-grafica-asesor">Resumen estadístico</h3>
              <button
                type="button"
                className="cerrar-grafica-asesor"
                aria-label="Cerrar gráfica"
                onClick={() => setMostrarGrafica(false)}
              >
                ×
              </button>
            </div>

            <div className="grafica-asesor-barras modal-version" aria-label="Gráfica amplia de estadísticas">
              {datosGrafica.map((dato) => (
                <div className="grafica-columna-asesor" key={dato.nombre}>
                  <span className="grafica-valor-asesor">{dato.valor}</span>
                  <div className="grafica-eje-asesor">
                    <div
                      className={`grafica-barra-asesor ${dato.clase}`}
                      style={{ height: `${(dato.valor / maximoEstadistica) * 100}%` }}
                      title={`${dato.nombre}: ${dato.valor}`}
                    />
                  </div>
                  <span className="grafica-label-asesor">{dato.nombre}</span>
                </div>
              ))}
            </div>

            <div className="grafica-resumen-datos-asesor">
              {datosGrafica.map((dato) => (
                <div key={`resumen-${dato.nombre}`}>
                  <span>{dato.nombre}</span>
                  <strong>{dato.valor}</strong>
                </div>
              ))}
            </div>
          </section>
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

                    {edicionCuenta[cuenta.id_cuenta] ? (
                      <div className="formulario-edicion-cuenta-asesor">
                        <label>
                          Tipo de cuenta
                          <select
                            value={edicionCuenta[cuenta.id_cuenta].tipo_cuenta}
                            onChange={(evento) =>
                              setEdicionCuenta((actual) => ({
                                ...actual,
                                [cuenta.id_cuenta]: {
                                  ...actual[cuenta.id_cuenta],
                                  tipo_cuenta: evento.target.value,
                                },
                              }))
                            }
                          >
                            <option value="ahorros">Ahorros</option>
                            <option value="corriente">Corriente</option>
                          </select>
                        </label>

                        <label>
                          Tipo de operación
                          <select
                            value={edicionCuenta[cuenta.id_cuenta].tipo_operacion}
                            onChange={(evento) =>
                              setEdicionCuenta((actual) => ({
                                ...actual,
                                [cuenta.id_cuenta]: {
                                  ...actual[cuenta.id_cuenta],
                                  tipo_operacion: evento.target.value,
                                },
                              }))
                            }
                          >
                            <option value="debito">Débito</option>
                            <option value="credito">Crédito</option>
                          </select>
                        </label>

                        <label>
                          Saldo
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={edicionCuenta[cuenta.id_cuenta].saldo}
                            onChange={(evento) =>
                              setEdicionCuenta((actual) => ({
                                ...actual,
                                [cuenta.id_cuenta]: {
                                  ...actual[cuenta.id_cuenta],
                                  saldo: evento.target.value,
                                },
                              }))
                            }
                          />
                        </label>

                        <div className="acciones-edicion-cuenta-asesor">
                          <button
                            type="button"
                            className="boton-cancelar-edicion-asesor"
                            onClick={() => cerrarEdicionCuenta(cuenta.id_cuenta)}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            className="boton-guardar-edicion-asesor"
                            onClick={() => guardarCuenta(cuenta.id_cuenta)}
                            disabled={guardandoCuenta === cuenta.id_cuenta}
                          >
                            {guardandoCuenta === cuenta.id_cuenta ? "Guardando..." : "Guardar"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="boton-editar-cuenta-asesor"
                        onClick={() => iniciarEdicionCuenta(cuenta)}
                      >
                        Editar cuenta
                      </button>
                    )}
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
              <h1 className="asesor-title">bienvenido Asesor </h1>
            </div>
            <p className="asesor-description">
              Administre la información bancaria desde este panel.
            </p>
          </div>
        </section>

        <section className="contenido-asesores">
          <div className="estadisticas-asesor">
            <div className="estadistica-asesor tarjeta-usuarios">
              <span className="estadistica-label">Usuarios registrados</span>
              <strong>{cargandoEstadisticas ? "..." : estadisticas.usuariosRegistrados}</strong>
            </div>

            <div className="estadistica-asesor tarjeta-cuentas-habilitadas">
              <span className="estadistica-label">Cuentas habilitadas</span>
              <strong>{cargandoEstadisticas ? "..." : estadisticas.cuentasHabilitadas}</strong>
            </div>

            <div className="estadistica-asesor tarjeta-cuentas-deshabilitadas">
              <span className="estadistica-label">Cuentas deshabilitadas</span>
              <strong>{cargandoEstadisticas ? "..." : estadisticas.cuentasDeshabilitadas}</strong>
            </div>

            <div className="estadistica-asesor tarjeta-tarjetas-activas">
              <span className="estadistica-label">Tarjetas activas</span>
              <strong>{cargandoEstadisticas ? "..." : estadisticas.tarjetasActivas}</strong>
            </div>
          </div>

          <div className="acciones-grafica-asesor">
            <button
              type="button"
              className="boton-grafica-asesor"
              onClick={() => setMostrarGrafica(true)}
            >
              Ver gráfica
            </button>
          </div>

          <div className="grafica-detallada-asesor" aria-label="Resumen estadístico">
            <div className="grafica-detallada-header">
              <h3>Resumen estadístico</h3>
            </div>

            <div className="grafica-asesor-barras">
              {datosGrafica.map((dato) => (
                <div className="grafica-columna-asesor" key={dato.nombre}>
                  <span className="grafica-valor-asesor">{dato.valor}</span>
                  <div className="grafica-eje-asesor">
                    <div
                      className={`grafica-barra-asesor ${dato.clase}`}
                      style={{ height: `${(dato.valor / maximoEstadistica) * 100}%` }}
                      title={`${dato.nombre}: ${dato.valor}`}
                    />
                  </div>
                  <span className="grafica-label-asesor">{dato.nombre}</span>
                </div>
              ))}
            </div>
          </div>

          {mensaje && <p className="mensaje-error">{mensaje}</p>}
          {mensajeExito && <p className="mensaje-exito">{mensajeExito}</p>}
        </section>
      </main>
    </div>
  );
}