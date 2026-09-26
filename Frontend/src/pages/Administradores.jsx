import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Administradores.css";
import logoProyecto from "../assets/images/logo.jpeg";

const API_URL = "http://localhost:8000";

export default function Administradores() {
  const navigate = useNavigate();

  const [asesores, setAsesores] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [asesorConsultado, setAsesorConsultado] = useState(null);
  const [nuevoCodigoAsesor, setNuevoCodigoAsesor] = useState("");
  const [nuevoTipoDocumento, setNuevoTipoDocumento] = useState("");
  const [nuevoDocumento, setNuevoDocumento] = useState("");
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [guardandoCodigo, setGuardandoCodigo] = useState(false);
  const [editandoCodigo, setEditandoCodigo] = useState(false);
  const [campoEditando, setCampoEditando] = useState("");
  const [graficaAbierta, setGraficaAbierta] = useState(false);
  const [detalleGraficaVisible, setDetalleGraficaVisible] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    const actualizarEstadoMenu = () => {
      setMenuAbierto(window.innerWidth > 650);
    };

    actualizarEstadoMenu();
    window.addEventListener("resize", actualizarEstadoMenu);

    return () => window.removeEventListener("resize", actualizarEstadoMenu);
  }, []);

  useEffect(() => {
    const cerrarConEscape = (e) => {
      if (e.key === "Escape") {
        setEditandoCodigo(false);
        setCampoEditando("");
      }
    };

    if (editandoCodigo) {
      document.addEventListener("keydown", cerrarConEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", cerrarConEscape);
      document.body.style.overflow = "";
    };
  }, [editandoCodigo]);

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

    const valorFecha = /Z$|[+-]\d{2}:?\d{2}$/.test(fechaIngreso)
      ? fechaIngreso
      : `${fechaIngreso}Z`;

    const fecha = new Date(valorFecha);
    if (Number.isNaN(fecha.getTime())) {
      return { fecha: "No disponible", hora: "No disponible" };
    }

    const fechaBogota = new Intl.DateTimeFormat("es-CO", {
      timeZone: "America/Bogota",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(fecha);

    const horaBogota = new Intl.DateTimeFormat("es-CO", {
      timeZone: "America/Bogota",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(fecha);

    return {
      fecha: fechaBogota,
      hora: horaBogota,
    };
  };

  const obtenerDetalleGrafica = (tipo) => {
    if (tipo === "Asesores") {
      return asesores.map((asesor) => {
        const { fecha, hora } = formatearFechaHora(asesor.fecha_ingreso);
        return `${asesor.nombre || "Asesor"}: ${fecha} ${hora}`;
      });
    }

    if (tipo === "Usuarios") {
      return usuarios.map((usuario) => {
        const { fecha, hora } = formatearFechaHora(usuario.fecha_creacion);
        return `${usuario.nombre || "Usuario"}: ${fecha} ${hora}`;
      });
    }

    if (tipo === "Activos") {
      return usuarios
        .filter(
          (usuario) =>
            String(usuario.estado || "activo").toLowerCase() !== "inactivo"
        )
        .map((usuario) => {
          const { fecha, hora } = formatearFechaHora(usuario.fecha_creacion);
          return `${usuario.nombre || "Usuario"}: ${fecha} ${hora}`;
        });
    }

    return cuentas
      .filter((cuenta) =>
        ["bloqueada", "bloqueado", "inactivo"].includes(
          String(cuenta.estado || "").toLowerCase()
        )
      )
      .map(
        (cuenta) => {
          const { fecha, hora } = formatearFechaHora(cuenta.fecha_estado);
          return `${cuenta.nombre || "Cuenta"}: ${fecha} ${hora}`;
        }
      );
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

      const [respuestaAsesores, respuestaUsuarios, respuestaCuentas] =
        await Promise.all([
          axios.get(`${API_URL}/administradores/asesores`, config),
          axios.get(`${API_URL}/usuarios`, config),
          axios.get(`${API_URL}/administradores/cuentas`, config),
        ]);

      const asesoresObtenidos = respuestaAsesores.data?.asesores || [];
      const usuariosObtenidos = Array.isArray(respuestaUsuarios.data)
        ? respuestaUsuarios.data
        : [];
      const cuentasObtenidas = respuestaCuentas.data?.cuentas || [];

      setAsesores(asesoresObtenidos);
      setUsuarios(usuariosObtenidos);
      setCuentas(cuentasObtenidas);
    } catch (error) {
      console.error(error);
      setError(formatearError(error, "No se pudieron cargar los datos."));
    } finally {
      setCargando(false);
    }
  };

  const cambiarCodigoAsesor = async (e) => {
    e.preventDefault();

    const codigo = nuevoCodigoAsesor.trim();
    const tipoDocumento = nuevoTipoDocumento.trim();
    const documento = nuevoDocumento.trim();
    const email = nuevoEmail.trim();
    if (!codigo || !tipoDocumento || !documento || !email) {
      setError("Complete todos los datos del asesor.");
      return;
    }

    try {
      setError("");
      setMensaje("");
      setGuardandoCodigo(true);

      const token = localStorage.getItem("token");
      const respuesta = await axios.put(
        `${API_URL}/administradores/asesores/${asesorConsultado.id_asesor}`,
        {
          id_asesor: asesorConsultado.id_asesor,
          codigo_asesor: codigo,
          tipo_documento: tipoDocumento,
          documento,
          email,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const codigoActualizado = respuesta.data?.codigo_asesor || codigo;
      setAsesorConsultado((actual) => ({
        ...actual,
        codigo_asesor: codigoActualizado,
        tipo_documento: tipoDocumento,
        documento,
        email,
      }));
      setNuevoCodigoAsesor(codigoActualizado);
      setNuevoTipoDocumento(tipoDocumento);
      setNuevoDocumento(documento);
      setNuevoEmail(email);
      setEditandoCodigo(false);
      setAsesores((actuales) =>
        actuales.map((asesor) =>
          asesor.id_asesor === asesorConsultado.id_asesor
            ? {
                ...asesor,
                codigo_asesor: codigoActualizado,
                tipo_documento: tipoDocumento,
                documento,
                email,
              }
            : asesor
        )
      );
      setMensaje(respuesta.data?.mensaje || "Código actualizado correctamente.");
    } catch (error) {
      console.error(error);
      setError(formatearError(error, "No se pudo actualizar el código del asesor."));
    } finally {
      setGuardandoCodigo(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario_id");
    localStorage.removeItem("documento");

    navigate("/");
  };

  const totalAsesores = asesores.length;
  const totalUsuariosRegistrados = usuarios.length;
  const totalUsuariosActivos = usuarios.filter(
    (usuario) => String(usuario.estado || "activo").toLowerCase() !== "inactivo"
  ).length;
  const totalCuentasBloqueadas = cuentas.filter((cuenta) =>
    ["bloqueada", "bloqueado", "inactivo"].includes(
      String(cuenta.estado || "").toLowerCase()
    )
  ).length;

  const datosGrafica = [
    { label: "Asesores", valor: totalAsesores },
    { label: "Usuarios", valor: totalUsuariosRegistrados },
    { label: "Activos", valor: totalUsuariosActivos },
    { label: "Bloqueadas", valor: totalCuentasBloqueadas },
  ];
  const maxValorGrafica = Math.max(...datosGrafica.map((item) => item.valor), 1);

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

        <button
          type="button"
          className={`boton-menu-administradores ${
            menuAbierto ? "" : "menu-cerrado"
          }`}
          onClick={() => setMenuAbierto((actual) => !actual)}
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuAbierto}
        >
          {menuAbierto ? "×" : "☰"}
        </button>

        <aside className={`sidebar ${menuAbierto ? "" : "sidebar-cerrado"}`}>
          <ul>
            <li>
              <Link to="/Administradores" onClick={() => setMenuAbierto(false)}>
                📜 Principal
              </Link>
            </li>

            <li>
              <Link to="/lista-asesores" onClick={() => setMenuAbierto(false)}>
                👥 Asesores
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
            onClick={() => {
              setMenuAbierto(false);
              cerrarSesion();
            }}
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
                alt="Logo de Financiero"
              />
              <span>Financiero</span>
            </div>
            <h1>Administración de asesores</h1>
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

          <div className="resumen-panel">
            <div className="resumen-administrador">
              <div className="tarjeta-resumen">
                <span className="tarjeta-label">Asesores</span>
                <strong className="tarjeta-valor">{totalAsesores}</strong>
              </div>

              <div className="tarjeta-resumen">
                <span className="tarjeta-label">Usuarios registrados</span>
                <strong className="tarjeta-valor">{totalUsuariosRegistrados}</strong>
              </div>

              <div className="tarjeta-resumen">
                <span className="tarjeta-label">Usuarios activos</span>
                <strong className="tarjeta-valor">{totalUsuariosActivos}</strong>
              </div>

              <div className="tarjeta-resumen">
                <span className="tarjeta-label">Cuentas bloqueadas</span>
                <strong className="tarjeta-valor">{totalCuentasBloqueadas}</strong>
              </div>
            </div>

            <button
              type="button"
              className="boton-ver-grafica"
              onClick={() => setGraficaAbierta(true)}
            >
              Ver gráfica
            </button>
          </div>

          <section className="grafica-detallada">
            <div className="grafica-detallada-header">
              <h3>Detalle del rendimiento</h3>
              <span>Comparación general</span>
            </div>

            <div className="grafica-detallada-body">
              {datosGrafica.map((item) => {
                const porcentaje = maxValorGrafica === 0 ? 0 : (item.valor / maxValorGrafica) * 100;

                return (
                  <div
                    key={item.label}
                    className="fila-grafica-detallada"
                    onMouseEnter={() => setDetalleGraficaVisible(item.label)}
                    onMouseLeave={() => setDetalleGraficaVisible(null)}
                    onFocus={() => setDetalleGraficaVisible(item.label)}
                    onBlur={() => setDetalleGraficaVisible(null)}
                    tabIndex={0}
                  >
                    <div className="fila-grafica-meta">
                      <span>{item.label}</span>
                      <strong>{item.valor}</strong>
                    </div>

                    <div
                      className="barra-detallada-track"
                    >
                      <div
                        className="barra-detallada-fill"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>

                    {detalleGraficaVisible === item.label && (
                      <div className="tooltip-grafica" role="tooltip">
                        <strong>
                          {item.label}: {item.valor}
                        </strong>
                        {obtenerDetalleGrafica(item.label).map((detalle) => (
                          <span key={detalle}>{detalle}</span>
                        ))}
                      </div>
                    )}

                    <span className="porcentaje-grafica">
                      {Math.round(porcentaje)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {graficaAbierta && (
            <div
              className="modal-grafica-overlay"
              onClick={() => setGraficaAbierta(false)}
              role="presentation"
            >
              <div
                className="modal-grafica"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="titulo-modal-grafica"
              >
                <div className="encabezado-modal-grafica">
                  <h2 id="titulo-modal-grafica">Resumen general</h2>
                  <button
                    type="button"
                    className="boton-cerrar-modal"
                    onClick={() => setGraficaAbierta(false)}
                    aria-label="Cerrar gráfica"
                    title="Cerrar"
                  >
                    ×
                  </button>
                </div>

                <div className="grafica-barras" aria-label="Gráfica de resumen administrativo">
                  {datosGrafica.map((item) => (
                    <div key={item.label} className="barra-grupo">
                      <span className="barra-label">{item.label}</span>
                      <div className="barra-espacio">
                        <div
                          className="barra-fill"
                          style={{ height: `${(item.valor / maxValorGrafica) * 100}%` }}
                          title={`${item.label}: ${item.valor}`}
                        />
                      </div>
                      <strong>{item.valor}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {editandoCodigo && asesorConsultado && (
              <div
                className="modal-cambio-codigo-overlay"
                onClick={() => setEditandoCodigo(false)}
                role="presentation"
              >
                <div
                  className="modal-cambio-codigo"
                  onClick={(e) => e.stopPropagation()}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="titulo-modal-cambio-codigo"
                >
                  <div className="encabezado-modal-cambio-codigo">
                    <h2 id="titulo-modal-cambio-codigo">
                      Editar información del asesor
                    </h2>
                    <button
                      type="button"
                      className="boton-cerrar-modal"
                      onClick={() => setEditandoCodigo(false)}
                      aria-label="Cerrar ventana"
                      title="Cerrar"
                    >
                      ×
                    </button>
                  </div>
                  <form onSubmit={cambiarCodigoAsesor} className="formulario-cambio-codigo">
                    <p className="asesor-modal-nombre">
                      {asesorConsultado.nombre || "Asesor bancario"}
                    </p>
                    <label>
                      Tipo de documento
                      <input
                        type="text"
                        value={nuevoTipoDocumento}
                        onChange={(e) => setNuevoTipoDocumento(e.target.value)}
                        maxLength={50}
                        autoFocus
                        required
                      />
                    </label>
                    <label>
                      Número de documento
                      <input
                        type="text"
                        value={nuevoDocumento}
                        onChange={(e) => setNuevoDocumento(e.target.value)}
                        maxLength={50}
                        required
                      />
                    </label>
                    <label>
                      Correo electrónico
                      <input
                        type="email"
                        value={nuevoEmail}
                        onChange={(e) => setNuevoEmail(e.target.value)}
                        maxLength={100}
                        required
                      />
                    </label>
                    <label>
                      Código del asesor
                      <input
                        type="text"
                        value={nuevoCodigoAsesor}
                        onChange={(e) => setNuevoCodigoAsesor(e.target.value)}
                        maxLength={30}
                        required
                      />
                    </label>
                    <button type="submit" disabled={guardandoCodigo}>
                      {guardandoCodigo ? "Guardando..." : "Guardar información"}
                    </button>
                  </form>
                </div>
              </div>
            )}

        </main>

      </div>
    </div>
  );
}