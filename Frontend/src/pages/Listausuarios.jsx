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
  const [editandoUsuario, setEditandoUsuario] = useState(false);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState("");
  const [mensajeEdicion, setMensajeEdicion] = useState("");
  const [formularioEdicion, setFormularioEdicion] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    codigo_postal: "",
    ciudad: "",
    localidad: "",
    barrio: "",
  });
  const [tarjetasCuenta, setTarjetasCuenta] = useState({});
  const [cuentaTarjetasAbierta, setCuentaTarjetasAbierta] = useState(null);
  const [cargandoTarjetasCuenta, setCargandoTarjetasCuenta] = useState(null);
  const [errorTarjetasCuenta, setErrorTarjetasCuenta] = useState("");
  const [edicionCuenta, setEdicionCuenta] = useState({});
  const [guardandoCuenta, setGuardandoCuenta] = useState(null);

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
        setEditandoUsuario(false);
        setCuentaTarjetasAbierta(null);
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

  const ubicacionesPorCiudad = {
    Bogotá: {
      "Usaquén": ["Cedritos", "Santa Bárbara", "San Patricio", "Otro"],
      "Chapinero": ["Chapinero Alto", "Chapinero Central", "Rosales", "Otro"],
      "La Candelaria": ["La Catedral", "Las Aguas", "Centro Administrativo", "Otro"],
      "Santa Fe": ["Las Nieves", "San Diego", "La Perseverancia", "Otro"],
      "San Cristóbal": ["20 de Julio", "San Blas", "San Martín de Loba", "Otro"],
      Usme: ["Usme Centro", "La Flora", "Gran Yomasa", "Otro"],
      Tunjuelito: ["Venecia", "Fátima", "San Vicente Ferrer", "Otro"],
      Bosa: ["Bosa Centro", "La Despensa", "El Porvenir", "Bosa La Estación", "Bosa Nova", "Bosa Piamonte", "Ciudadela El Recreo", "El Corzo", "La Libertad", "San Bernardino", "San Pablo Bosa", "Santa Fe Bosa", "Antonia Santos", "Brasil", "Campo Verde", "Carlos Albán Holguín", "El Anhelo", "El Progreso", "Escocia", "Islandia", "Jiménez de Quesada", "La Paz Bosa", "Olarte", "Paso Ancho", "Villa del Río", "Villa Sonia", "Villa Anny", "Villas del Progreso", "Otro"],
      Kennedy: ["Ciudad Kennedy", "Castilla", "Timiza", "Otro"],
      Fontibón: ["Fontibón Centro", "Modelia", "Villemar", "Otro"],
      Engativá: ["Engativá Centro", "Las Ferias", "Boyacá Real", "Otro"],
      Suba: ["Suba Centro", "Niza", "La Campiña", "Otro"],
      "Barrios Unidos": ["Doce de Octubre", "La Castellana", "Metrópolis", "Otro"],
      Teusaquillo: ["Teusaquillo", "La Soledad", "Galerías", "Otro"],
      "Los Mártires": ["Ricaurte", "Paloquemao", "Santa Isabel", "Otro"],
      "Antonio Nariño": ["Restrepo", "Ciudad Berna", "Policarpa", "Otro"],
      "Puente Aranda": ["Ciudad Montes", "Alcalá", "Muzu", "Otro"],
      "Rafael Uribe Uribe": ["Quiroga", "Marruecos", "Diana Turbay", "Otro"],
      "Ciudad Bolívar": ["Arborizadora", "San Francisco", "Lucero", "Otro"],
      Sumapaz: ["San Juan", "Nazareth", "Betania", "Otro"],
    },
    Medellín: { Centro: ["Centro", "Boston", "Prado", "Otro"] },
    Cali: { Centro: ["Centro", "San Fernando", "Granada", "Otro"] },
    Barranquilla: { Centro: ["Centro", "El Prado", "Alto Prado", "Otro"] },
    Cartagena: { Centro: ["Centro", "Getsemaní", "Manga", "Otro"] },
    Bucaramanga: { Centro: ["Centro", "Cabecera", "San Francisco", "Otro"] },
    Pereira: { Centro: ["Centro", "Cuba", "Alamos", "Otro"] },
    Cúcuta: { Centro: ["Centro", "Caobos", "La Riviera", "Otro"] },
    Ibagué: { Centro: ["Centro", "La Pola", "Piedrapintada", "Otro"] },
    Manizales: { Centro: ["Centro", "Palogrande", "Chipre", "Otro"] },
    Armenia: { Centro: ["Centro", "Granada", "La Castellana", "Otro"] },
    Pasto: { Centro: ["Centro", "San Ignacio", "Las Cuadras", "Otro"] },
    Villavicencio: { Centro: ["Centro", "Barzal", "La Esperanza", "Otro"] },
    Neiva: { Centro: ["Centro", "Quirinal", "La Toma", "Otro"] },
    Montería: { Centro: ["Centro", "La Castellana", "La Coquera", "Otro"] },
    Sincelejo: { Centro: ["Centro", "La Pajuela", "Venecia", "Otro"] },
    Tunja: { Centro: ["Centro", "Las Nieves", "Maldonado", "Otro"] },
    Popayán: { Centro: ["Centro", "San Camilo", "El Recuerdo", "Otro"] },
    "Santa Marta": { Centro: ["Centro", "Bellavista", "El Rodadero", "Otro"] },
    Valledupar: { Centro: ["Centro", "Novalito", "Mayales", "Otro"] },
  };

  const ciudadesDisponibles = Object.keys(ubicacionesPorCiudad);
  const localidadesDisponibles = formularioEdicion.ciudad
    ? Object.keys(ubicacionesPorCiudad[formularioEdicion.ciudad] || {})
    : [];
  const barriosDisponibles = formularioEdicion.ciudad && formularioEdicion.localidad
    ? ubicacionesPorCiudad[formularioEdicion.ciudad]?.[formularioEdicion.localidad] || []
    : [];

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
    setEditandoUsuario(false);
    setMensajeEdicion("");
    setErrorEdicion("");
    setEdicionCuenta({});
    setGuardandoCuenta(null);
    setTarjetasCuenta({});
    setCuentaTarjetasAbierta(null);
    setErrorTarjetasCuenta("");
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

  const iniciarEdicionCuenta = (cuenta) => {
    if (!esAsesor) {
      return;
    }

    setEdicionCuenta((actual) => ({
      ...actual,
      [cuenta.id_cuenta]: {
        tipo_cuenta: cuenta.tipo_cuenta || "ahorros",
        tipo_operacion: cuenta.tipo_operacion || "debito",
        saldo: Number(cuenta.saldo || 0).toString(),
      },
    }));
    setErrorDetalle("");
  };

  const cerrarEdicionCuenta = (idCuenta) => {
    setEdicionCuenta((actual) => {
      const siguiente = { ...actual };
      delete siguiente[idCuenta];
      return siguiente;
    });
  };

  const guardarEdicionCuenta = async (idCuenta) => {
    if (!esAsesor) {
      return;
    }

    const datos = edicionCuenta[idCuenta];
    if (!datos) {
      return;
    }

    const saldo = Number(datos.saldo);
    if (!Number.isFinite(saldo) || saldo < 0) {
      setErrorDetalle("El saldo debe ser un número válido y no puede ser negativo.");
      return;
    }

    try {
      setGuardandoCuenta(idCuenta);
      setErrorDetalle("");

      const token = localStorage.getItem("token");
      const encabezados = {
        headers: { Authorization: `Bearer ${token}` },
      };

      await Promise.all([
        axios.put(
          `${API_URL}/asesor-bancario/cuenta/${idCuenta}/tipo-cuenta`,
          { tipo_cuenta: datos.tipo_cuenta },
          encabezados
        ),
        axios.put(
          `${API_URL}/asesor-bancario/cuenta/${idCuenta}/tipo-operacion`,
          { tipo_operacion: datos.tipo_operacion },
          encabezados
        ),
        axios.put(
          `${API_URL}/asesor-bancario/cuenta/${idCuenta}/saldo`,
          { saldo },
          encabezados
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
      cerrarEdicionCuenta(idCuenta);
      setMensajeEdicion("Cuenta actualizada correctamente.");
    } catch (error) {
      setErrorDetalle(
        error.response?.data?.detail ||
          "No se pudo actualizar la cuenta del usuario."
      );
    } finally {
      setGuardandoCuenta(null);
    }
  };

  const verTarjetasCuenta = async (cuenta) => {
    if (cuentaTarjetasAbierta === cuenta.id_cuenta) {
      setCuentaTarjetasAbierta(null);
      return;
    }

    setCuentaTarjetasAbierta(cuenta.id_cuenta);
    setErrorTarjetasCuenta("");

    if (Object.prototype.hasOwnProperty.call(tarjetasCuenta, cuenta.id_cuenta)) {
      return;
    }

    try {
      setCargandoTarjetasCuenta(cuenta.id_cuenta);
      const token = localStorage.getItem("token");
      const respuesta = await axios.get(
        `${API_URL}/cuentas/${cuenta.id_cuenta}/tarjetas`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setTarjetasCuenta((actual) => ({
        ...actual,
        [cuenta.id_cuenta]: respuesta.data?.tarjetas || [],
      }));
    } catch (error) {
      console.error("Error al cargar las tarjetas de la cuenta:", error);
      setErrorTarjetasCuenta(
        error.response?.data?.detail ||
          "No se pudieron cargar las tarjetas de la cuenta."
      );
    } finally {
      setCargandoTarjetasCuenta(null);
    }
  };

  const abrirEdicionUsuario = () => {
    if (!esAsesor || !usuarioSeleccionado) {
      return;
    }

    setFormularioEdicion({
      nombre: usuarioSeleccionado.nombre || "",
      email: usuarioSeleccionado.correo || usuarioSeleccionado.email || "",
      telefono: usuarioSeleccionado.telefono || "",
      direccion: usuarioSeleccionado.direccion || "",
      codigo_postal: usuarioSeleccionado.codigo_postal || "",
      ciudad: usuarioSeleccionado.ciudad || "",
      localidad: usuarioSeleccionado.localidad || "",
      barrio: usuarioSeleccionado.barrio || "",
    });
    setErrorEdicion("");
    setMensajeEdicion("");
    setEditandoUsuario(true);
  };

  const cambiarCampoEdicion = (evento) => {
    const { name, value } = evento.target;

    setFormularioEdicion((actual) => {
      const nuevoFormulario = { ...actual, [name]: value };

      if (name === "ciudad") {
        nuevoFormulario.localidad = "";
        nuevoFormulario.barrio = "";
      }

      if (name === "localidad") {
        nuevoFormulario.barrio = "";
      }

      return nuevoFormulario;
    });
  };

  const guardarEdicionUsuario = async (evento) => {
    evento.preventDefault();

    const datos = Object.fromEntries(
      Object.entries(formularioEdicion).map(([campo, valor]) => [
        campo,
        valor.trim(),
      ])
    );

    if (!datos.nombre || !datos.email) {
      setErrorEdicion("El nombre y el correo son obligatorios.");
      return;
    }

    try {
      setGuardandoEdicion(true);
      setErrorEdicion("");
      setMensajeEdicion("");

      const token = localStorage.getItem("token");
      const respuesta = await axios.put(
        `${API_URL}/usuarios/${usuarioSeleccionado.id_usuario}/perfil`,
        datos,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const usuarioActualizado = respuesta.data?.usuario || datos;

      setUsuarios((usuariosActuales) =>
        usuariosActuales.map((usuario) =>
          usuario.id_usuario === usuarioSeleccionado.id_usuario
            ? { ...usuario, ...usuarioActualizado }
            : usuario
        )
      );

      setUsuarioSeleccionado((actual) => ({
        ...actual,
        ...usuarioActualizado,
        cuentas: actual.cuentas,
      }));
      setMensajeEdicion(
        respuesta.data?.message ||
          "Información actualizada correctamente."
      );
      setEditandoUsuario(false);
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      setErrorEdicion(
        error.response?.data?.detail ||
          "No se pudo actualizar la información del usuario."
      );
    } finally {
      setGuardandoEdicion(false);
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
              <Link to="/lista-asesores">
                👥 Asesores
              </Link>
            </li>
            )}

              <li>
                <Link
                  to="/lista-usuarios"
                  onClick={() => setMenuAbierto(false)}
                >
                  👤 Usuarios
                </Link>
              </li>

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
                      <th>Acciones</th>
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

                        <td className="acciones-usuarios">
                          <button
                            type="button"
                            className="boton-ver"
                            onClick={() => verUsuario(usuario)}
                            disabled={cargandoDetalle}
                          >
                            Ver
                          </button>
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

                {!editandoUsuario && (
                  <>
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
                      <strong>Documento:</strong>{" "}
                      {usuarioSeleccionado.documento ||
                        usuarioSeleccionado.numero_documento ||
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
                      <strong>Código postal:</strong>{" "}
                      {usuarioSeleccionado.codigo_postal ||
                        "No registrado"}
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

                    {esAsesor && (
                      <div className="acciones-estado-usuario">
                        <button
                          type="button"
                          className="boton-editar-usuario"
                          onClick={abrirEdicionUsuario}
                        >
                          Editar
                        </button>
                      </div>
                    )}
                  </>
                )}

                {mensajeEdicion && (
                  <p className="mensaje-exito">{mensajeEdicion}</p>
                )}

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
                            {edicionCuenta[cuenta.id_cuenta] ? (
                              <div className="formulario-edicion-cuenta-usuario">
                                <h3>Editar cuenta</h3>
                                <p>
                                  <strong>Número:</strong>{" "}
                                  {cuenta.numero_cuenta || "No disponible"}
                                </p>

                                <label>
                                  Tipo
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

                                <div className="acciones-edicion-cuenta-usuario">
                                  <button
                                    type="button"
                                    className="boton-cancelar-edicion-usuario"
                                    onClick={() => cerrarEdicionCuenta(cuenta.id_cuenta)}
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    className="boton-guardar-edicion-usuario"
                                    onClick={() => guardarEdicionCuenta(cuenta.id_cuenta)}
                                    disabled={guardandoCuenta === cuenta.id_cuenta}
                                  >
                                    {guardandoCuenta === cuenta.id_cuenta
                                      ? "Guardando..."
                                      : "Guardar"}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="boton-ver-tarjetas-cuenta"
                                  onClick={() => verTarjetasCuenta(cuenta)}
                                  aria-label={
                                    cuentaTarjetasAbierta === cuenta.id_cuenta
                                      ? "Ocultar tarjetas de la cuenta"
                                      : "Ver tarjetas de la cuenta"
                                  }
                                  title={
                                    cuentaTarjetasAbierta === cuenta.id_cuenta
                                      ? "Ocultar tarjetas"
                                      : "Ver tarjetas"
                                  }
                                >
                                  💳
                                </button>

                                <p>
                                  <strong>Número:</strong>{" "}
                                  {cuenta.numero_cuenta || "No disponible"}
                                </p>

                                <p>
                                  <strong>Tipo:</strong>{" "}
                                  {cuenta.tipo_cuenta || "No disponible"}
                                </p>

                                <p>
                                  <strong>Tipo de operación:</strong>{" "}
                                  {cuenta.tipo_operacion || "debito"}
                                </p>

                                <p>
                                  <strong>Saldo:</strong> $
                                  {Number(cuenta.saldo || 0).toLocaleString("es-CO")}
                                </p>

                                <p>
                                  <strong>Estado:</strong>{" "}
                                  {cuenta.estado || "No disponible"}
                                </p>

                                {esAsesor && (
                                  <button
                                    type="button"
                                    className="boton-editar-cuenta-usuario"
                                    onClick={() => iniciarEdicionCuenta(cuenta)}
                                  >
                                    Editar cuenta
                                  </button>
                                )}

                                {cuentaTarjetasAbierta === cuenta.id_cuenta && (
                                  <div className="tarjetas-modal-cuenta">
                                    <strong>Tarjetas asociadas</strong>

                                    {cargandoTarjetasCuenta === cuenta.id_cuenta && (
                                      <p>Cargando tarjetas...</p>
                                    )}

                                    {errorTarjetasCuenta && (
                                      <p className="mensaje-error">
                                        {errorTarjetasCuenta}
                                      </p>
                                    )}

                                    {cargandoTarjetasCuenta !== cuenta.id_cuenta &&
                                      !errorTarjetasCuenta &&
                                      tarjetasCuenta[cuenta.id_cuenta]?.length === 0 && (
                                        <p>Esta cuenta no tiene tarjetas asociadas.</p>
                                      )}

                                    {tarjetasCuenta[cuenta.id_cuenta]?.map((tarjeta) => (
                                      <div
                                        className="tarjeta-modal-cuenta"
                                        key={tarjeta.id_tarjeta}
                                      >
                                        <p>
                                          <strong>Número:</strong>{" "}
                                          {tarjeta.numero_tarjeta || "No disponible"}
                                        </p>
                                        <p>
                                          <strong>Vencimiento:</strong>{" "}
                                          {tarjeta.fecha_vencimiento || "No disponible"}
                                        </p>
                                        <p>
                                          <strong>Tipo:</strong>{" "}
                                          {tarjeta.tipo_tarjeta || "No disponible"}
                                        </p>
                                        <p>
                                          <strong>Estado:</strong>{" "}
                                          {tarjeta.estado || "No disponible"}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {editandoUsuario && (
            <div
              className="modal-registro-overlay"
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-editar-modal"
              onMouseDown={(evento) => {
                if (evento.target === evento.currentTarget) {
                  setEditandoUsuario(false);
                }
              }}
            >
              <div className="modal-registro-contenido">
                <div className="modal-registro-cabecera">
                  <h2 id="titulo-editar-modal">Editar usuario</h2>

                  <button
                    type="button"
                    className="cerrar-modal-registro"
                    onClick={() => setEditandoUsuario(false)}
                    aria-label="Cerrar edición"
                  >
                    X
                  </button>
                </div>

                <form
                  className="formulario-edicion-usuario"
                  onSubmit={guardarEdicionUsuario}
                >
                  <label>
                    Nombre
                    <input
                      name="nombre"
                      value={formularioEdicion.nombre}
                      onChange={cambiarCampoEdicion}
                      required
                    />
                  </label>

                  <label>
                    Correo
                    <input
                      type="email"
                      name="email"
                      value={formularioEdicion.email}
                      onChange={cambiarCampoEdicion}
                      required
                    />
                  </label>

                  <label>
                    Teléfono
                    <input
                      name="telefono"
                      value={formularioEdicion.telefono}
                      onChange={cambiarCampoEdicion}
                    />
                  </label>

                  <label>
                    Dirección
                    <input
                      name="direccion"
                      value={formularioEdicion.direccion}
                      onChange={cambiarCampoEdicion}
                    />
                  </label>

                  <label>
                    Código postal
                    <input
                      name="codigo_postal"
                      value={formularioEdicion.codigo_postal}
                      onChange={cambiarCampoEdicion}
                      maxLength={6}
                    />
                  </label>

                  <label>
                    Ciudad
                    <select
                      name="ciudad"
                      value={formularioEdicion.ciudad}
                      onChange={cambiarCampoEdicion}
                    >
                      <option value="">Seleccione una ciudad</option>
                      {ciudadesDisponibles.map((ciudad) => (
                        <option key={ciudad} value={ciudad}>
                          {ciudad}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Localidad
                    <select
                      name="localidad"
                      value={formularioEdicion.localidad}
                      onChange={cambiarCampoEdicion}
                      disabled={!formularioEdicion.ciudad}
                    >
                      <option value="">Seleccione una localidad</option>
                      {localidadesDisponibles.map((localidad) => (
                        <option key={localidad} value={localidad}>
                          {localidad}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Barrio
                    <select
                      name="barrio"
                      value={formularioEdicion.barrio}
                      onChange={cambiarCampoEdicion}
                      disabled={!formularioEdicion.localidad}
                    >
                      <option value="">Seleccione un barrio</option>
                      {barriosDisponibles.map((barrio) => (
                        <option key={barrio} value={barrio}>
                          {barrio}
                        </option>
                      ))}
                    </select>
                  </label>

                  {errorEdicion && (
                    <p className="mensaje-error">{errorEdicion}</p>
                  )}

                  <div className="acciones-edicion-usuario">
                    <button
                      type="button"
                      className="boton-cancelar-edicion"
                      onClick={() => setEditandoUsuario(false)}
                      disabled={guardandoEdicion}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="boton-guardar-edicion"
                      disabled={guardandoEdicion}
                    >
                      {guardandoEdicion ? "Guardando..." : "Guardar"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}