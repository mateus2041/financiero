import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Administradores.css";
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
  const [formularioRegistro, setFormularioRegistro] = useState({
    nombre: "",
    documento: "",
    email: "",
    tipo_documento: "",
  });
  const [formularioEdicion, setFormularioEdicion] = useState({});
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [guardandoRegistro, setGuardandoRegistro] = useState(false);
  const [actualizandoEstado, setActualizandoEstado] = useState(null);

  useEffect(() => {
    cargarDatos();
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
        setAsesorEditando(null);
        setRegistroModalAbierto(false);
      }
    };

    if (asesorEditando || registroModalAbierto) {
      document.addEventListener("keydown", cerrarConEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", cerrarConEscape);
      document.body.style.overflow = "";
    };
  }, [asesorEditando, registroModalAbierto]);

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
    const { name, value } = evento.target;
    setFormularioRegistro((actual) => ({ ...actual, [name]: value }));
  };

  const registrarAsesor = async (evento) => {
    evento.preventDefault();

    try {
      setError("");
      setMensaje("");
      setGuardandoRegistro(true);

      const token = localStorage.getItem("token");
      const respuesta = await axios.post(
        `${API_URL}/administradores/asesores`,
        formularioRegistro,
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
      });
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
            <h1>Bienvenido Administración</h1>
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
                <h2>Lista de asesores</h2>
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
                        <span className="fila-label">
                          Acciones
                        </span>

                        <div className="grupo-acciones-asesor">
                          <button
                            type="button"
                            className="boton-editar-asesor"
                            onClick={() => abrirEdicion(asesor)}
                            aria-label={`Editar información de ${asesor.nombre || "asesor"}`}
                            title="Editar información del asesor"
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            className="boton-estado-asesor boton-deshabilitar-asesor"
                            onClick={() => cambiarEstadoAsesor(asesor, "inactivo")}
                            disabled={asesor.estado === "inactivo" || actualizandoEstado === asesor.id_asesor}
                            aria-label="Deshabilitar asesor"
                            title="Deshabilitar asesor"
                          >
                            ⛔
                          </button>
                          <button
                            type="button"
                            className="boton-estado-asesor boton-habilitar-asesor"
                            onClick={() => cambiarEstadoAsesor(asesor, "activo")}
                            disabled={asesor.estado !== "inactivo" || actualizandoEstado === asesor.id_asesor}
                            aria-label="Habilitar asesor"
                            title="Habilitar asesor"
                          >
                            ✓
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
              onClick={() => setRegistroModalAbierto(false)}
              role="presentation"
            >
              <section
                className="modal-edicion-asesor"
                onClick={(evento) => evento.stopPropagation()}
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
              onClick={() => setAsesorEditando(null)}
              role="presentation"
            >
              <section
                className="modal-edicion-asesor"
                onClick={(evento) => evento.stopPropagation()}
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
                    <label>
                      Código del asesor
                      <input
                        name="codigo_asesor"
                        type="text"
                        value={formularioEdicion.codigo_asesor || ""}
                        onChange={cambiarFormularioEdicion}
                        maxLength={30}
                        required
                      />
                    </label>
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

                  <button type="submit" disabled={guardandoEdicion}>
                    {guardandoEdicion ? "Guardando..." : "Guardar cambios"}
                  </button>
                </form>
              </section>
            </div>
          )}

        </main>

      </div>
    </div>
  );
}