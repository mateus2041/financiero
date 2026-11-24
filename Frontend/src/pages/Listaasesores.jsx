import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "../styles/listaasesores.css";
import logoProyecto from "../assets/images/logo.jpeg";

const API_URL = "http://localhost:8000";

export default function Administradores() {
  const navigate = useNavigate();

  const [asesores, setAsesores] = useState([]);
  const [busquedaAsesor, setBusquedaAsesor] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [menuAbierto, setMenuAbierto] = useState(true);
  const [esMovil, setEsMovil] = useState(() => window.innerWidth <= 650);
  const [asesorEditando, setAsesorEditando] = useState(null);
  const [registroModalAbierto, setRegistroModalAbierto] = useState(false);
  const [archivoAdicional, setArchivoAdicional] = useState(null);
  const [formularioRegistro, setFormularioRegistro] = useState({
    nombre: "",
    documento: "",
    email: "",
    tipo_documento: "",
    documento_adicional: "",
  });
  const [formularioEdicion, setFormularioEdicion] = useState({});
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [guardandoRegistro, setGuardandoRegistro] = useState(false);
  const [actualizandoEstado, setActualizandoEstado] = useState(null);
  const [eliminandoAsesor, setEliminandoAsesor] = useState(null);
  const [modalEliminacion, setModalEliminacion] = useState(null);
  const [restableciendoCodigo, setRestableciendoCodigo] = useState(false);
  const [confirmacionRestablecerAbierta, setConfirmacionRestablecerAbierta] =
    useState(false);

  useEffect(() => {
    void cargarDatos();
  }, []);

  useEffect(() => {
    const actualizarEstadoMenu = () => {
      const movil = window.innerWidth <= 650;
      setEsMovil(movil);
      setMenuAbierto(!movil);
    };

    actualizarEstadoMenu();
    window.addEventListener("resize", actualizarEstadoMenu);

    return () => window.removeEventListener("resize", actualizarEstadoMenu);
  }, []);

  useEffect(() => {
    const cerrarConEscape = (evento) => {
      if (evento.key === "Escape") {
        if (modalEliminacion) {
          if (!eliminandoAsesor) {
            setModalEliminacion(null);
          }
          return;
        }
        setAsesorEditando(null);
        setRegistroModalAbierto(false);
      }
    };

    if (asesorEditando || registroModalAbierto || modalEliminacion) {
      document.addEventListener("keydown", cerrarConEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", cerrarConEscape);
      document.body.style.overflow = "";
    };
  }, [asesorEditando, registroModalAbierto, modalEliminacion, eliminandoAsesor]);

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

  const normalizarTexto = (valor) =>
    String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const asesoresFiltrados = asesores.filter((asesor) => {
    const textoBusqueda = normalizarTexto(busquedaAsesor.trim());
    if (!textoBusqueda) {
      return true;
    }

    return [
      asesor.nombre,
      asesor.nombres,
      asesor.nombre_completo,
      asesor.documento,
      asesor.tipo_documento,
      asesor.cargo,
      asesor.email,
      asesor.correo,
      asesor.codigo_asesor,
      asesor.codigo,
    ].some((valor) => normalizarTexto(valor).includes(textoBusqueda));
  });

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

  const abrirEdicion = (asesor) => {
    setError("");
    setMensaje("");
    setAsesorEditando(asesor);
    setFormularioEdicion({
      nombre: asesor.nombre || "",
      documento: asesor.documento || "",
      tipo_documento: asesor.tipo_documento || "",
      cargo: asesor.cargo || "Asesor bancario",
      email: asesor.email || asesor.correo || "",
      codigo_asesor: asesor.codigo_asesor || asesor.codigo || "",
      estado: asesor.estado || "activo",
    });
  };

  const cambiarFormularioEdicion = (evento) => {
    const { name, value } = evento.target;
    setFormularioEdicion((actual) => ({ ...actual, [name]: value }));
  };

  const cambiarFormularioRegistro = (evento) => {
    const { name, value, files } = evento.target;

    if (name === "documento_adicional") {
      const archivo = files && files[0] ? files[0] : null;
      setArchivoAdicional(archivo);
      setFormularioRegistro((actual) => ({
        ...actual,
        documento_adicional: archivo ? archivo.name : "",
      }));
      return;
    }

    setFormularioRegistro((actual) => ({ ...actual, [name]: value }));
  };

  const registrarAsesor = async (evento) => {
    evento.preventDefault();

    try {
      setError("");
      setMensaje("");
      setGuardandoRegistro(true);

      const token = localStorage.getItem("token");
      const payload = {
        ...formularioRegistro,
        documento_adicional: formularioRegistro.documento_adicional || archivoAdicional?.name || "",
      };

      const respuesta = await axios.post(
        `${API_URL}/administradores/asesores`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setFormularioRegistro({
        nombre: "",
        documento: "",
        email: "",
        tipo_documento: "",
        documento_adicional: "",
      });
      setArchivoAdicional(null);
      setRegistroModalAbierto(false);
      setMensaje(
        `${respuesta.data?.mensaje || "Asesor registrado correctamente."}${
          respuesta.data?.codigo_asesor
            ? ` Código: ${respuesta.data.codigo_asesor}`
            : ""
        }`
      );
      await cargarDatos();
    } catch (error) {
      console.error(error);
      setError(formatearError(error, "No se pudo registrar el asesor."));
    } finally {
      setGuardandoRegistro(false);
    }
  };

  const guardarEdicion = async (evento) => {
    evento.preventDefault();

    const datos = {
      ...formularioEdicion,
      nombre: formularioEdicion.nombre.trim(),
      documento: formularioEdicion.documento.trim(),
      tipo_documento: formularioEdicion.tipo_documento.trim(),
      cargo: formularioEdicion.cargo.trim(),
      email: formularioEdicion.email.trim(),
      codigo_asesor: formularioEdicion.codigo_asesor.trim(),
    };

    if (!datos.nombre || !datos.documento || !datos.tipo_documento || !datos.cargo || !datos.codigo_asesor) {
      setError("Complete los campos obligatorios del asesor.");
      return;
    }

    try {
      setError("");
      setMensaje("");
      setGuardandoEdicion(true);

      const token = localStorage.getItem("token");
      const respuesta = await axios.put(
        `${API_URL}/administradores/asesores/${asesorEditando.id_asesor}`,
        {
          id_asesor: asesorEditando.id_asesor,
          ...datos,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAsesores((actuales) =>
        actuales.map((asesor) =>
          asesor.id_asesor === asesorEditando.id_asesor
            ? { ...asesor, ...datos }
            : asesor
        )
      );
      setAsesorEditando(null);
      setMensaje(respuesta.data?.mensaje || "Asesor actualizado correctamente.");
    } catch (error) {
      console.error(error);
      setError(formatearError(error, "No se pudo actualizar el asesor."));
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const restablecerCodigoAsesor = async () => {
    if (!asesorEditando || guardandoEdicion || restableciendoCodigo) {
      return;
    }

    try {
      setError("");
      setMensaje("");
      setConfirmacionRestablecerAbierta(false);
      setRestableciendoCodigo(true);

      const token = localStorage.getItem("token");
      const respuesta = await axios.post(
        `${API_URL}/administradores/asesores/${asesorEditando.id_asesor}/restablecer-codigo`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const codigoActualizado = respuesta.data?.codigo_asesor;
      if (typeof codigoActualizado !== "string" || !codigoActualizado) {
        throw new Error("No se recibió el nuevo código del asesor.");
      }

      setFormularioEdicion((actual) => ({
        ...actual,
        codigo_asesor: codigoActualizado,
      }));
      setAsesorEditando((actual) =>
        actual ? { ...actual, codigo_asesor: codigoActualizado } : actual
      );
      setAsesores((actuales) =>
        actuales.map((asesor) =>
          asesor.id_asesor === asesorEditando.id_asesor
            ? { ...asesor, codigo_asesor: codigoActualizado }
            : asesor
        )
      );
      setMensaje(respuesta.data?.mensaje || "Código del asesor restablecido correctamente.");
    } catch (error) {
      console.error(error);
      setError(formatearError(error, "No se pudo restablecer el código del asesor."));
    } finally {
      setRestableciendoCodigo(false);
    }
  };

  const cambiarEstadoAsesor = async (asesor, estado) => {
    try {
      setError("");
      setMensaje("");
      setActualizandoEstado(asesor.id_asesor);

      const token = localStorage.getItem("token");
      const respuesta = await axios.put(
        `${API_URL}/administradores/asesores/${asesor.id_asesor}`,
        {
          id_asesor: asesor.id_asesor,
          codigo_asesor: asesor.codigo_asesor || asesor.codigo,
          estado,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAsesores((actuales) =>
        actuales.map((asesorActual) =>
          asesorActual.id_asesor === asesor.id_asesor
            ? { ...asesorActual, estado }
            : asesorActual
        )
      );
      setMensaje(
        respuesta.data?.mensaje ||
        `Asesor ${estado === "activo" ? "habilitado" : "deshabilitado"} correctamente.`
      );
    } catch (error) {
      console.error(error);
      setError(formatearError(error, "No se pudo actualizar el estado del asesor."));
    } finally {
      setActualizandoEstado(null);
    }
  };

  const confirmarEliminacionAsesor = async () => {
    const asesor = modalEliminacion?.asesor;
    if (!asesor || modalEliminacion.tipo !== "confirmacion") {
      return;
    }

    try {
      setError("");
      setMensaje("");
      setEliminandoAsesor(asesor.id_asesor);

      const token = localStorage.getItem("token");
      const respuesta = await axios.delete(
        `${API_URL}/administradores/asesores/${asesor.id_asesor}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAsesores((actuales) =>
        actuales.filter(
          (asesorActual) => asesorActual.id_asesor !== asesor.id_asesor
        )
      );
      if (asesorEditando?.id_asesor === asesor.id_asesor) {
        setAsesorEditando(null);
      }
      setModalEliminacion({
        tipo: "resultado",
        exito: true,
        mensaje: respuesta.data?.mensaje || "Asesor eliminado correctamente.",
      });
    } catch (error) {
      console.error(error);
      setModalEliminacion({
        tipo: "resultado",
        exito: false,
        mensaje: formatearError(error, "No se pudo eliminar el asesor."),
      });
    } finally {
      setEliminandoAsesor(null);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario_id");
    localStorage.removeItem("documento");

    navigate("/");
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
        {esMovil && (
          <button
            type="button"
            className={`boton-menu-administradores ${menuAbierto ? "" : "menu-cerrado"}`}
            onClick={() => setMenuAbierto((actual) => !actual)}
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuAbierto}
          >
            ☰
          </button>
        )}

        <aside className={`sidebar ${menuAbierto ? "" : "sidebar-cerrado"}`}>
          <ul>
            <li>
              <Link to="/Administradores" onClick={() => setMenuAbierto(false)}>
                📜 Principal
              </Link>
            </li>

            <li>
              <Link to="/lista-asesores" onClick={() => setMenuAbierto(false)}>
                👥Asesores
              </Link>
            </li>

            <li>
              <Link to="/lista-usuarios" onClick={() => setMenuAbierto(false)}>
                👤 Usuarios
              </Link>
            </li>

            <li>
              <Link to="/lista-cuentas" onClick={() => setMenuAbierto(false)}>
                🌐 Cuentas
              </Link>
            </li>

            <li>
              <Link to="/notoficaciones" onClick={() => setMenuAbierto(false)}>
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

          <div className="encabezado-administracion-asesores">
            <div className="marca-financiera">
              <img
                className="logo-administracion-asesores"
                src={logoProyecto}
                alt="Logo del proyecto"
              />
              <span>Financiero</span>
            </div>
            <h1>Lista de asesores</h1>
          </div>

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

              <div className="encabezado-lista-asesores">
                <h2>asesores</h2>
                <button
                  type="button"
                  className="boton-registrar-asesor"
                  onClick={() => {
                    setError("");
                    setMensaje("");
                    setRegistroModalAbierto(true);
                  }}
                >
                  + Registrar asesor
                </button>
              </div>

              <div className="buscador-asesores">
                <span className="icono-buscador-asesores" aria-hidden="true">
                  &#128269;
                </span>
                <input
                  type="search"
                  value={busquedaAsesor}
                  onChange={(evento) => setBusquedaAsesor(evento.target.value)}
                  placeholder="Buscar asesor por nombre, documento, tipo de documento, cargo..."
                  aria-label="Buscar asesor"
                />
              </div>

              {asesores.length === 0 ? (
                <p>No hay asesores registrados.</p>
              ) : asesoresFiltrados.length === 0 ? (
                <p className="mensaje-busqueda-asesores">
                  No se encontraron asesores para “{busquedaAsesor}”.
                </p>
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
                          Correo
                        </span>

                        <strong>
                          {asesor.email || asesor.correo || "No registrado"}
                        </strong>
                      </div>

                      <div className="fila-asesor-dato">
                        <span className="fila-label">
                          Código
                        </span>

                        <strong
                          className="codigo-asesor-no-copiable"
                          onCopy={(evento) => evento.preventDefault()}
                          onContextMenu={(evento) => evento.preventDefault()}
                        >
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
                        <span className="fila-label">
                          Acciones
                        </span>

                        <div className="grupo-acciones-asesor">
                          <button
                            type="button"
                            className="boton-editar-asesor"
                            onClick={() => abrirEdicion(asesor)}
                            disabled={
                              actualizandoEstado === asesor.id_asesor ||
                              eliminandoAsesor === asesor.id_asesor
                            }
                            aria-label={`Editar información de ${asesor.nombre || "asesor"}`}
                            title="Editar información del asesor"
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            className={`boton-estado-asesor ${
                              asesor.estado === "inactivo"
                                ? "boton-habilitar-asesor"
                                : "boton-deshabilitar-asesor"
                            }`}
                            onClick={() =>
                              cambiarEstadoAsesor(
                                asesor,
                                asesor.estado === "inactivo" ? "activo" : "inactivo"
                              )
                            }
                            disabled={
                              actualizandoEstado === asesor.id_asesor ||
                              eliminandoAsesor === asesor.id_asesor
                            }
                            aria-label={
                              asesor.estado === "inactivo"
                                ? "Habilitar asesor"
                                : "Deshabilitar asesor"
                            }
                            title={
                              asesor.estado === "inactivo"
                                ? "Habilitar asesor"
                                : "Deshabilitar asesor"
                            }
                          >
                            {asesor.estado === "inactivo" ? "✓" : "⛔"}
                          </button>
                          <button
                            type="button"
                            className="boton-eliminar-asesor"
                            onClick={() => {
                              setError("");
                              setMensaje("");
                              setModalEliminacion({ tipo: "confirmacion", asesor });
                            }}
                            disabled={
                              actualizandoEstado === asesor.id_asesor ||
                              eliminandoAsesor === asesor.id_asesor
                            }
                            aria-label={`Eliminar a ${asesor.nombre || "este asesor"}`}
                            title="Eliminar asesor"
                          >
                            🗑
                          </button>
                        </div>
                      </div>

                    </div>

                  ))}

                </div>
              )}

            </section>

          </div>

          {registroModalAbierto && (
            <div
              className="modal-edicion-asesor-overlay"
              role="presentation"
              onMouseDown={(evento) => {
                if (evento.target === evento.currentTarget) setRegistroModalAbierto(false);
              }}
            >
              <section
                className="modal-edicion-asesor"
                role="dialog"
                aria-modal="true"
                aria-labelledby="titulo-registro-asesor"
              >
                <div className="encabezado-modal-edicion-asesor">
                  <h2 id="titulo-registro-asesor">Registrar asesor</h2>
                  <button
                    type="button"
                    className="boton-cerrar-edicion-asesor"
                    onClick={() => setRegistroModalAbierto(false)}
                    aria-label="Cerrar ventana"
                    title="Cerrar"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={registrarAsesor} className="formulario-edicion-asesor">
                  <div className="campos-edicion-asesor">
                    <label>
                      Nombre
                      <input
                        name="nombre"
                        type="text"
                        value={formularioRegistro.nombre}
                        onChange={cambiarFormularioRegistro}
                        required
                        autoFocus
                      />
                    </label>
                    <label>
                      Documento
                      <input
                        name="documento"
                        type="text"
                        value={formularioRegistro.documento}
                        onChange={cambiarFormularioRegistro}
                        required
                      />
                    </label>
                    <label>
                      Correo
                      <input
                        name="email"
                        type="email"
                        value={formularioRegistro.email}
                        onChange={cambiarFormularioRegistro}
                        required
                      />
                    </label>
                    <label className="campo-archivo-asesor">
                      Documento adicional
                      <input
                        name="documento_adicional"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={cambiarFormularioRegistro}
                      />
                      {archivoAdicional && archivoAdicional.name ? (
                        <span className="nombre-archivo-asesor">
                          {archivoAdicional.name}
                        </span>
                      ) : null}
                    </label>
                    <label>
                      Tipo de documento
                      <select
                        name="tipo_documento"
                        value={formularioRegistro.tipo_documento}
                        onChange={cambiarFormularioRegistro}
                        required
                      >
                        <option value="">Seleccione una opción</option>
                        <option value="Cedula de ciudadania">Cédula de ciudadanía</option>
                        <option value="Tarjeta de identidad">Tarjeta de identidad</option>
                        <option value="Cedula de extranjeria">Cédula de extranjería</option>
                        <option value="Pasaporte">Pasaporte</option>
                      </select>
                    </label>
                  </div>

                  <button type="submit" disabled={guardandoRegistro}>
                    {guardandoRegistro ? "Registrando..." : "Registrar asesor"}
                  </button>
                </form>
              </section>
            </div>
          )}

          {asesorEditando && (
            <div
              className="modal-edicion-asesor-overlay"
              role="presentation"
              onMouseDown={(evento) => {
                if (evento.target === evento.currentTarget) setAsesorEditando(null);
              }}
            >
              <section
                className="modal-edicion-asesor"
                role="dialog"
                aria-modal="true"
                aria-labelledby="titulo-edicion-asesor"
              >
                <div className="encabezado-modal-edicion-asesor">
                  <h2 id="titulo-edicion-asesor">Editar información del asesor</h2>
                  <button
                    type="button"
                    className="boton-cerrar-edicion-asesor"
                    onClick={() => setAsesorEditando(null)}
                    aria-label="Cerrar ventana"
                    title="Cerrar"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={guardarEdicion} className="formulario-edicion-asesor">
                  <div className="campos-edicion-asesor">
                    <label>
                      Nombre
                      <input
                        name="nombre"
                        type="text"
                        value={formularioEdicion.nombre || ""}
                        onChange={cambiarFormularioEdicion}
                        maxLength={100}
                        autoFocus
                        required
                      />
                    </label>
                    <label>
                      Documento
                      <input
                        name="documento"
                        type="text"
                        value={formularioEdicion.documento || ""}
                        onChange={cambiarFormularioEdicion}
                        maxLength={50}
                        required
                      />
                    </label>
                    <label>
                      Tipo de documento
                      <select
                        name="tipo_documento"
                        value={formularioEdicion.tipo_documento || ""}
                        onChange={cambiarFormularioEdicion}
                        required
                      >
                        <option value="">Seleccione una opción</option>
                        <option value="Cedula de ciudadania">Cédula de ciudadanía</option>
                        <option value="Tarjeta de identidad">Tarjeta de identidad</option>
                        <option value="Cedula de extranjeria">Cédula de extranjería</option>
                        <option value="Pasaporte">Pasaporte</option>
                      </select>
                    </label>
                    <label>
                      Cargo
                      <input
                        name="cargo"
                        type="text"
                        value={formularioEdicion.cargo || ""}
                        onChange={cambiarFormularioEdicion}
                        maxLength={100}
                        required
                      />
                    </label>
                    <label>
                      Correo
                      <input
                        name="email"
                        type="email"
                        value={formularioEdicion.email || ""}
                        onChange={cambiarFormularioEdicion}
                        maxLength={100}
                      />
                    </label>
                    <div className="campo-codigo-asesor">
                      <label htmlFor="codigo-asesor-edicion">
                        Código del asesor
                      </label>
                      <input
                        id="codigo-asesor-edicion"
                        name="codigo_asesor"
                        type="text"
                        value={formularioEdicion.codigo_asesor || ""}
                        onChange={cambiarFormularioEdicion}
                        maxLength={30}
                        required
                      />
                      <button
                        type="button"
                        className="boton-restablecer-codigo"
                        onClick={() => setConfirmacionRestablecerAbierta(true)}
                        disabled={
                          guardandoEdicion ||
                          restableciendoCodigo ||
                          confirmacionRestablecerAbierta
                        }
                      >
                        {restableciendoCodigo ? "Restableciendo..." : "Restablecer código"}
                      </button>
                      {error && (
                        <span className="mensaje-codigo-asesor error" role="alert">
                          {error}
                        </span>
                      )}
                      {mensaje && (
                        <span className="mensaje-codigo-asesor" role="status">
                          {mensaje}
                        </span>
                      )}
                    </div>
                    <label>
                      Estado
                      <select
                        name="estado"
                        value={formularioEdicion.estado || "activo"}
                        onChange={cambiarFormularioEdicion}
                      >
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                      </select>
                    </label>
                  </div>

                  <div className="datos-sistema-asesor">
                    <div>
                      <span>ID del asesor</span>
                      <strong>{asesorEditando.id_asesor || "No disponible"}</strong>
                    </div>
                    <div>
                      <span>Fecha de ingreso</span>
                      <strong>{formatearFechaHora(asesorEditando.fecha_ingreso).fecha}</strong>
                    </div>
                    <div>
                      <span>Hora de ingreso</span>
                      <strong>{formatearFechaHora(asesorEditando.fecha_ingreso).hora}</strong>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={guardandoEdicion || restableciendoCodigo}
                  >
                    {guardandoEdicion ? "Guardando..." : "Guardar cambios"}
                  </button>
                </form>
                {confirmacionRestablecerAbierta && (
                  <div
                    className="confirmacion-codigo-overlay"
                    role="presentation"
                    onMouseDown={(evento) => {
                      if (evento.target === evento.currentTarget) setConfirmacionRestablecerAbierta(false);
                    }}
                  >
                    <section
                      className="confirmacion-codigo-modal"
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="titulo-confirmacion-codigo"
                    >
                      <h2 id="titulo-confirmacion-codigo">Restablecer código</h2>
                      <p>
                        Se generará un nuevo código para este asesor. ¿Desea continuar?
                      </p>
                      <div className="acciones-confirmacion-codigo">
                        <button
                          type="button"
                          className="boton-cancelar-codigo"
                          onClick={() => setConfirmacionRestablecerAbierta(false)}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="boton-confirmar-codigo"
                          onClick={restablecerCodigoAsesor}
                          disabled={restableciendoCodigo}
                        >
                          Confirmar
                        </button>
                      </div>
                    </section>
                  </div>
                )}
              </section>
            </div>
          )}

          {modalEliminacion && (
            <div
              className="modal-eliminacion-overlay"
              role="presentation"
              onMouseDown={(evento) => {
                if (
                  evento.target === evento.currentTarget &&
                  !eliminandoAsesor
                ) {
                  setModalEliminacion(null);
                }
              }}
            >
              <section
                className="modal-eliminacion-asesor"
                role="dialog"
                aria-modal="true"
                aria-labelledby="titulo-modal-eliminacion"
                aria-describedby="mensaje-modal-eliminacion"
              >
                <h2
                  id="titulo-modal-eliminacion"
                  className={
                    modalEliminacion.tipo === "resultado" &&
                    modalEliminacion.exito
                      ? "resultado-exitoso"
                      : ""
                  }
                >
                  {modalEliminacion.tipo === "confirmacion"
                    ? "Eliminar asesor"
                    : modalEliminacion.exito
                      ? "Asesor eliminado"
                      : "No se pudo eliminar"}
                </h2>
                <p
                  id="mensaje-modal-eliminacion"
                  role={
                    modalEliminacion.tipo === "resultado"
                      ? modalEliminacion.exito
                        ? "status"
                        : "alert"
                      : undefined
                  }
                >
                  {modalEliminacion.tipo === "confirmacion"
                    ? `¿Deseas eliminar permanentemente a ${
                        modalEliminacion.asesor.nombre || "este asesor"
                      }? Esta acción no se puede deshacer.`
                    : modalEliminacion.mensaje}
                </p>
                <div className="acciones-modal-eliminacion">
                  {modalEliminacion.tipo === "confirmacion" ? (
                    <>
                      <button
                        type="button"
                        className="boton-cancelar-eliminacion"
                        onClick={() => setModalEliminacion(null)}
                        disabled={Boolean(eliminandoAsesor)}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="boton-confirmar-eliminacion"
                        onClick={confirmarEliminacionAsesor}
                        disabled={Boolean(eliminandoAsesor)}
                      >
                        {eliminandoAsesor ? "Eliminando..." : "Eliminar"}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className={
                        modalEliminacion.exito
                          ? "boton-aceptar-eliminacion"
                          : "boton-confirmar-eliminacion"
                      }
                      onClick={() => setModalEliminacion(null)}
                    >
                      Aceptar
                    </button>
                  )}
                </div>
              </section>
            </div>
          )}

        </main>

      </div>
    </div>
  );
}