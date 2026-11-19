import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  parsePositiveInteger,
  sanitizeLocalName,
  sanitizeLocalText,
} from "../utils/helpers";
import useAdminMessageImage from "../hooks/useAdminMessageImage";
import logoProyecto from "../assets/images/logo.jpeg";
import "../styles/trageta.css";

const generarDigitos = (longitud) => {
  let resultado = "";
  const bytes = new Uint8Array(longitud);

  while (resultado.length < longitud) {
    window.crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      if (byte < 250 && resultado.length < longitud) {
        resultado += byte % 10;
      }
    }
  }

  return resultado;
};

const generarEnteroSeguro = (limite) => {
  const maximoAceptable = 256 - (256 % limite);
  const valor = new Uint8Array(1);
  do {
    window.crypto.getRandomValues(valor);
  } while (valor[0] >= maximoAceptable);

  return valor[0] % limite;
};

const generarUltimosDigitos = () => generarDigitos(3);
const generarCVV = () => generarDigitos(3);
const generarPrimerosDigitos = () => generarDigitos(13);

const normalizarTexto = (valor) =>
  String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const generarFechaVencimiento = () => {
  const fecha = new Date();
  const anio = fecha.getFullYear() + 5;
  const mes = String(generarEnteroSeguro(12) + 1).padStart(2, "0");

  return `${anio}-${mes}`;
};

export default function TarjetasUsuario({ esAsesor = false }) {
  const rol = (localStorage.getItem("rol") || "")
    .trim()
    .toLowerCase();

  const esAdministrador = rol === "administrador";

  const [tarjetasPorUsuario, setTarjetasPorUsuario] = useState({});
  const [cargandoTarjetas, setCargandoTarjetas] = useState(true);
  const [errorTarjetas, setErrorTarjetas] = useState(false);
  const [tarjetaActualizando, setTarjetaActualizando] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [busquedaUsuario, setBusquedaUsuario] = useState("");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [tarjetaEditando, setTarjetaEditando] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [mostrarMensajeAdmin, setMostrarMensajeAdmin] = useState(false);
  const [mensajeAdmin, setMensajeAdmin] = useState("");
  const [imagenMensaje, setImagenMensaje] = useState(null);
  const [previewImagenMensaje, setPreviewImagenMensaje] = useState("");
  const [errorMensajeAdmin, setErrorMensajeAdmin] = useState("");
  const [esMovil, setEsMovil] = useState(false);
  const [mostrarCVV, setMostrarCVV] = useState(false);

  const [formulario, setFormulario] = useState({
    tipo_tarjeta: "debito",
    fecha_vencimiento: generarFechaVencimiento(),
    cvv: generarCVV(),
    primeros_digitos: generarPrimerosDigitos(),
    ultimos_digitos: generarUltimosDigitos(),
  });

  const [mensaje, setMensaje] = useState("");
  const terminoBusqueda = normalizarTexto(busquedaUsuario.trim());
  const usuariosFiltrados = usuarios.filter((usuario) =>
    [usuario.nombre, usuario.direccion, usuario.codigo_postal].some((dato) =>
      normalizarTexto(dato).includes(terminoBusqueda)
    )
  );

  useEffect(() => {
    void obtenerUsuarios();
  }, []);

  useEffect(() => {
    const comprobarPantalla = () => {
      setEsMovil(window.innerWidth <= 768);
    };

    comprobarPantalla();
    window.addEventListener("resize", comprobarPantalla);

    return () => {
      window.removeEventListener("resize", comprobarPantalla);
    };
  }, []);

  const obtenerUsuarios = async () => {
    try {
      const token = localStorage.getItem("token");

      const respuesta = await axios.get("/usuarios", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsuarios(Array.isArray(respuesta.data) ? respuesta.data : []);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);

      setMensaje(
        error.response?.data?.detail ||
          "No se pudieron obtener los usuarios"
      );
      setCargandoTarjetas(false);
      return;
    }

    setCargandoTarjetas(true);
    setErrorTarjetas(false);
    setTarjetasPorUsuario({});

    try {
      const token = localStorage.getItem("token");
      const respuesta = await axios.get(
        "/administradores/tarjetas",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const tarjetasAgrupadas = {};

      (Array.isArray(respuesta.data) ? respuesta.data : []).forEach(
        (tarjeta) => {
          if (!tarjetasAgrupadas[tarjeta.id_usuario]) {
            tarjetasAgrupadas[tarjeta.id_usuario] = [];
          }
          tarjetasAgrupadas[tarjeta.id_usuario].push(tarjeta);
        }
      );

      setTarjetasPorUsuario(tarjetasAgrupadas);
    } catch (error) {
      console.error("Error al obtener estados de tarjetas:", error);
      setErrorTarjetas(true);
      setMensaje(
        error.response?.data?.detail ||
          "No se pudieron obtener los estados de las tarjetas"
      );
    } finally {
      setCargandoTarjetas(false);
    }
  };

  const obtenerTarjetasDeUsuario = async (usuario) => {
    const usuarioId = parsePositiveInteger(usuario?.id_usuario);
    if (usuarioId === null) {
      setMensaje("El identificador del usuario no es válido");
      return null;
    }

    try {
      const token = localStorage.getItem("token");
      const respuesta = await axios.get(
        `/usuarios/${usuarioId}/tarjetas`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const datos = respuesta.data?.tarjetas ?? respuesta.data;

      return Array.isArray(datos) ? datos : [];
    } catch (error) {
      console.error("Error al obtener las tarjetas del usuario:", error);
      setMensaje(
        error.response?.data?.detail ||
          "No se pudieron obtener las tarjetas del usuario"
      );
      return null;
    }
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    const valorProcesado = name === "cvv"
      ? value.replace(/\D/g, "").slice(0, 3)
      : value;

    setFormulario((formularioActual) => ({
      ...formularioActual,
      [name]: valorProcesado,
    }));

    if (name === "cvv" && tarjetaEditando && valorProcesado) {
      setMostrarCVV(true);
    }
  };

  const agregarTarjeta = async (e) => {
    e.preventDefault();

    if (!usuarioSeleccionado) {
      setMensaje("Debe seleccionar un usuario");
      return;
    }

    const usuarioId = parsePositiveInteger(usuarioSeleccionado.id_usuario);
    if (usuarioId === null) {
      setMensaje("El identificador del usuario no es válido");
      return;
    }

    if (!formulario.fecha_vencimiento) {
      setMensaje("La fecha de vencimiento es obligatoria");
      return;
    }

    if (
      (!tarjetaEditando || formulario.cvv) &&
      !/^\d{3}$/.test(formulario.cvv)
    ) {
      setMensaje("El CVV debe tener exactamente 3 dígitos");
      return;
    }

    if (tarjetaEditando) {
      const tarjetaId = parsePositiveInteger(tarjetaEditando.id_tarjeta);
      if (tarjetaId === null) {
        setMensaje("El identificador de la tarjeta no es válido");
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const datosActualizacion = {
          fecha_vencimiento: formulario.fecha_vencimiento,
        };
        if (formulario.cvv) {
          datosActualizacion.cvv = formulario.cvv;
        }

        const respuestaActualizacion = await axios.patch(
          `/tarjetas/${tarjetaId}`,
          datosActualizacion,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const cvvActualizado = respuestaActualizacion.data?.codigo_seguridad
          ?? (datosActualizacion.cvv || tarjetaEditando.codigo_seguridad);

        setTarjetasPorUsuario((actuales) => ({
          ...actuales,
          [usuarioId]: (actuales[usuarioId] || []).map((tarjeta) =>
            parsePositiveInteger(tarjeta.id_tarjeta) === tarjetaId
              ? {
                  ...tarjeta,
                  codigo_seguridad: cvvActualizado,
                  fecha_vencimiento:
                    respuestaActualizacion.data?.fecha_vencimiento
                    || tarjeta.fecha_vencimiento,
                }
              : tarjeta
          ),
        }));

        setMensaje("Tarjeta actualizada correctamente");
        cerrarModalTarjeta();
        await obtenerTarjetasDeUsuario(usuarioSeleccionado);
      } catch (error) {
        console.error("Error al actualizar tarjeta:", error);
        setMensaje(
          error.response?.data?.detail ||
            "No se pudo actualizar la tarjeta"
        );
      }
      return;
    }

    if (!/^\d{3}$/.test(formulario.ultimos_digitos)) {
      setMensaje("Los últimos 3 dígitos deben ser numéricos");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const numero_tarjeta =
        formulario.primeros_digitos + formulario.ultimos_digitos;

      const respuesta = await axios.post(
        `/usuarios/${usuarioId}/tarjetas`,
        {
          ...formulario,
          numero_tarjeta,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const tarjetaAgregada = respuesta.data
        ? {
            ...respuesta.data,
            id_usuario: usuarioId,
          }
        : null;

      setMensaje("Tarjeta agregada correctamente");

      setFormulario({
        tipo_tarjeta: "debito",
        fecha_vencimiento: generarFechaVencimiento(),
        cvv: generarCVV(),
        primeros_digitos: generarPrimerosDigitos(),
        ultimos_digitos: generarUltimosDigitos(),
      });

      if (tarjetaAgregada) {
        setTarjetasPorUsuario((actuales) => ({
          ...actuales,
          [usuarioId]: [
            ...(actuales[usuarioId] || []).filter(
              (tarjeta) =>
                parsePositiveInteger(tarjeta.id_tarjeta) !==
                parsePositiveInteger(tarjetaAgregada.id_tarjeta)
            ),
            tarjetaAgregada,
          ],
        }));
      }

      setUsuarioSeleccionado(null);
    } catch (error) {
      console.error("Error al agregar tarjeta:", error);

      setMensaje(
        error.response?.data?.detail ||
          "No se pudo agregar la tarjeta"
      );
    }
  };

  const abrirModalTarjeta = (usuario) => {
    setTarjetaEditando(null);
    setUsuarioSeleccionado(usuario);
    setMostrarCVV(false);

    setFormulario({
      tipo_tarjeta: "debito",
      fecha_vencimiento: generarFechaVencimiento(),
      cvv: generarCVV(),
      primeros_digitos: generarPrimerosDigitos(),
      ultimos_digitos: generarUltimosDigitos(),
    });

    setMensaje("");
  };

  const editarTarjetaDeUsuario = async (usuario, tarjetaId) => {
    const tarjetasUsuario = await obtenerTarjetasDeUsuario(usuario);

    if (tarjetasUsuario === null) {
      return;
    }

    if (tarjetasUsuario.length === 0) {
      setMensaje("Este usuario no tiene tarjetas para editar");
      return;
    }

    const tarjeta = tarjetaId
      ? tarjetasUsuario.find(
          (item) =>
            parsePositiveInteger(item.id_tarjeta) ===
            parsePositiveInteger(tarjetaId)
        )
      : tarjetasUsuario[0];
    if (!tarjeta) {
      setMensaje("No se encontró la tarjeta para editar");
      return;
    }

    const [mes, anio] = (tarjeta.fecha_vencimiento || "").split("/");

    setTarjetaEditando(tarjeta);
    setUsuarioSeleccionado(usuario);
    setMostrarCVV(true);
    setFormulario({
      tipo_tarjeta: tarjeta.tipo_tarjeta || "debito",
      fecha_vencimiento: mes && anio
        ? `20${anio}-${mes}`
        : generarFechaVencimiento(),
      cvv: /^\d{3}$/.test(String(tarjeta.ultimos_tres ?? ""))
        ? String(tarjeta.ultimos_tres)
        : "",
      primeros_digitos: "",
      ultimos_digitos: "",
    });
    setMensaje("");
  };

  const cerrarModalTarjeta = () => {
    setUsuarioSeleccionado(null);
    setTarjetaEditando(null);
    setMostrarCVV(false);

    setFormulario({
      tipo_tarjeta: "debito",
      fecha_vencimiento: generarFechaVencimiento(),
      cvv: generarCVV(),
      primeros_digitos: generarPrimerosDigitos(),
      ultimos_digitos: generarUltimosDigitos(),
    });
  };

  const cambiarEstadoTarjeta = async (usuario, tarjeta) => {
    if (!tarjeta) {
      return;
    }

    const tarjetaId = parsePositiveInteger(tarjeta.id_tarjeta);
    if (tarjetaId === null) {
      setMensaje("El identificador de la tarjeta no es válido");
      return;
    }

    const activar = tarjeta.estado !== "activa";
    const accion = activar ? "activar" : "desactivar";

    try {
      setTarjetaActualizando(tarjeta.id_tarjeta);
      const token = localStorage.getItem("token");

      const respuesta = await axios.patch(
        `/tarjetas/${tarjetaId}/${accion}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setTarjetasPorUsuario((actuales) => ({
        ...actuales,
        [usuario.id_usuario]: actuales[usuario.id_usuario].map((item) =>
          item.id_tarjeta === tarjeta.id_tarjeta
            ? { ...item, estado: respuesta.data.estado }
            : item
        ),
      }));
      setMensaje(
        activar
          ? "Tarjeta habilitada correctamente"
          : "Tarjeta inhabilitada correctamente"
      );
    } catch (error) {
      console.error("Error al cambiar el estado de la tarjeta:", error);
      setMensaje(
        error.response?.data?.detail ||
          "No se pudo cambiar el estado de la tarjeta"
      );
    } finally {
      setTarjetaActualizando(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    localStorage.removeItem("usuario_id");
    localStorage.removeItem("documento");
    localStorage.removeItem("fotoPerfil");
    localStorage.removeItem("nombre_usuario");
    localStorage.removeItem("nombre_asesor");

    window.location.href = "/";
  };

  const cerrarModalMensajeAdmin = () => {
    setMostrarMensajeAdmin(false);
    setMensajeAdmin("");
    setImagenMensaje(null);
    setPreviewImagenMensaje("");
    setErrorMensajeAdmin("");
  };

  const handleImagenMensajeChange = useAdminMessageImage({
    setImage: setImagenMensaje,
    setPreview: setPreviewImagenMensaje,
    setError: setErrorMensajeAdmin,
  });

  const enviarMensajeAdmin = (evento) => {
    evento.preventDefault();
    const texto = mensajeAdmin.trim();
    if (!texto && !imagenMensaje) return;

    try {
      const mensajesGuardados = JSON.parse(
        localStorage.getItem("mensajes_admin") || "[]"
      );
      if (!Array.isArray(mensajesGuardados)) {
        throw new Error("El formato de mensajes guardados no es válido");
      }

      const ahora = new Date();
      const textoFinal = sanitizeLocalText(texto || "Imagen adjunta");
      if (!textoFinal && !imagenMensaje) {
        setErrorMensajeAdmin("El mensaje no contiene texto válido.");
        return;
      }

      const mensajesAnteriores = mensajesGuardados
        .filter((item) => item && typeof item === "object" && !Array.isArray(item))
        .map((item, index) => {
          const textoAnterior = [item.texto, item.mensaje, item.descripcion]
            .find((valor) => typeof valor === "string");
          const id = parsePositiveInteger(item.id ?? item.id_notificacion)
            ?? Date.now() + index;
          const imagen = typeof item.imagen === "string" &&
            /^data:image\/(?:png|jpeg|gif|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(item.imagen)
            ? item.imagen
            : null;

          return {
            id,
            id_notificacion: id,
            nombre_asesor: sanitizeLocalName(item.nombre_asesor),
            texto: sanitizeLocalText(textoAnterior || ""),
            mensaje: sanitizeLocalText(textoAnterior || ""),
            descripcion: sanitizeLocalText(textoAnterior || ""),
            titulo: sanitizeLocalText(item.titulo, 100) || "Mensaje para el administrador",
            tipo: sanitizeLocalText(item.tipo, 50) || "mensaje",
            imagen,
            imagen_data_url: imagen,
            fecha: sanitizeLocalText(item.fecha, 100),
            fecha_creacion: sanitizeLocalText(item.fecha_creacion, 64),
            leida: item.leida === true,
          };
        });
      const nuevoMensaje = {
        id: Date.now(),
        id_notificacion: Date.now(),
        nombre_asesor: sanitizeLocalName(
          localStorage.getItem("nombre_asesor") ||
            localStorage.getItem("nombre_usuario")
        ),
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

      localStorage.setItem(
        "mensajes_admin",
        JSON.stringify([nuevoMensaje, ...mensajesAnteriores])
      );
      setMensaje("Mensaje enviado correctamente");
      cerrarModalMensajeAdmin();
    } catch (error) {
      console.error("Error al guardar el mensaje para el administrador:", error);
      setErrorMensajeAdmin("No se pudo enviar el mensaje");
    }
  };

  return (
    <div className="contenedor-lista-cuentas">
      {esMovil && (
        <button
          type="button"
          className={`boton-menu-cuentas ${
            menuAbierto ? "" : "menu-cerrado"
          }`}
          onClick={() => setMenuAbierto((actual) => !actual)}
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuAbierto}
        >
          ☰
        </button>
      )}

      {esMovil && menuAbierto && (
        <button
          type="button"
          className="fondo-menu-cuentas"
          onClick={() => setMenuAbierto(false)}
          aria-label="Cerrar menú"
        />
      )}

      <aside
        className={`sidebar ${
          menuAbierto ? "" : "sidebar-cerrado"
        }`}
      >
        <ul>
          {esAdministrador && (
            <li>
              <Link
                to="/administrador"
                onClick={() => setMenuAbierto(false)}
              >
                📜 Principal
              </Link>
            </li>
          )}

          {!esAsesor && (
            <li>
              <Link
                to="/asesor-bancario"
                onClick={() => setMenuAbierto(false)}
              >
                📜 Asesor
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
          )}

          {esAdministrador && (
            <li>
              <Link
                to="/notoficaciones"
                onClick={() => setMenuAbierto(false)}
              >
                🔔 Notificaciones
              </Link>
            </li>
          )}
          
          <li>
            <Link
              to="/trageta"
              onClick={() => setMenuAbierto(false)}
            >
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
      </aside>

      {mostrarMensajeAdmin && (
        <div
          className="modal-mensaje-tarjeta-overlay"
          role="presentation"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) {
              cerrarModalMensajeAdmin();
            }
          }}
        >
          <section
            className="modal-mensaje-tarjeta"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-mensaje-tarjeta"
          >
            <header className="modal-mensaje-tarjeta-header">
              <h2 id="titulo-mensaje-tarjeta">
                Mensaje para el administrador
              </h2>
              <button
                type="button"
                className="cerrar-modal-mensaje-tarjeta"
                onClick={cerrarModalMensajeAdmin}
                aria-label="Cerrar mensaje"
              >
                ×
              </button>
            </header>
            <form onSubmit={enviarMensajeAdmin}>
              <label htmlFor="mensaje-admin-tarjetas">
                Código de mensaje:
              </label>
              <input
                id="mensaje-admin-tarjetas"
                type="text"
                value={mensajeAdmin}
                onChange={(evento) => setMensajeAdmin(evento.target.value)}
                placeholder="Escribe tu mensaje"
                autoComplete="off"
              />
              <label htmlFor="imagen-admin-tarjetas">Imagen adjunta:</label>
              <input
                id="imagen-admin-tarjetas"
                type="file"
                accept="image/*"
                onChange={handleImagenMensajeChange}
              />
              {previewImagenMensaje && (
                <img
                  className="preview-imagen-mensaje-tarjeta"
                  src={previewImagenMensaje}
                  alt="Vista previa de la imagen adjunta"
                />
              )}
              {errorMensajeAdmin && (
                <p className="error-mensaje-tarjeta" role="alert">
                  {errorMensajeAdmin}
                </p>
              )}
              <button
                type="submit"
                disabled={!mensajeAdmin.trim() && !imagenMensaje}
              >
                Enviar
              </button>
            </form>
          </section>
        </div>
      )}

      <main
        style={{
          flex: 1,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <header className="encabezado-tarjetas">
          <div className="marca-tarjetas">
            <img src={logoProyecto} alt="Logo de Financiero" />
            <span>FINANCIERO</span>
          </div>
          <div className="titulos-tarjetas">
            <h2>Añadir tarjetas de clientes</h2>
            <h3>Nuevas tarjetas para los clientes</h3>
          </div>
        </header>

        <div className="buscador-tarjetas">
          <span aria-hidden="true">🔍</span>
          <input
            type="search"
            value={busquedaUsuario}
            onChange={(evento) => setBusquedaUsuario(evento.target.value)}
            placeholder="Buscar usuario por nombre, dirección o código postal..."
            aria-label="Buscar usuario por nombre, dirección o código postal"
          />
        </div>

        {mensaje && <p>{mensaje}</p>}

        <div
          className="tabla-asesores-contenedor"
          style={{ marginTop: "24px" }}
        >
          <table className="tabla-asesores">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Número de documento</th>
                <th>Dirección</th>
                <th>Código postal</th>
                <th>Tarjetas</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6}>No se encontraron usuarios.</td>
                </tr>
              ) : (
                usuariosFiltrados.map((usuario) => {
                const tarjetasUsuario = [
                  ...(tarjetasPorUsuario[usuario.id_usuario] || []),
                ].sort((a, b) => {
                  const idA = parsePositiveInteger(a.id_tarjeta);
                  const idB = parsePositiveInteger(b.id_tarjeta);
                  return idA !== null && idB !== null ? idA - idB : 0;
                });
                const tarjetasPorFila =
                  tarjetasUsuario.length > 0 ? tarjetasUsuario : [null];

                return tarjetasPorFila.map((tarjetaUsuario) => {
                  const actualizando = Boolean(
                    tarjetaUsuario &&
                      tarjetaActualizando === tarjetaUsuario.id_tarjeta
                  );

                  return (
                    <tr
                      key={`${usuario.id_usuario}-${tarjetaUsuario?.id_tarjeta || "sin-tarjeta"}`}
                    >
                      <td data-label="Nombre">
                        {usuario.nombre || "No registrado"}
                      </td>
                      <td data-label="Número de documento">
                        {usuario.documento || "No registrado"}
                      </td>
                      <td data-label="Dirección">
                        {usuario.direccion || "No registrada"}
                      </td>
                      <td data-label="Código postal">
                        {usuario.codigo_postal || "No registrado"}
                      </td>
                      <td data-label="Tarjetas">
                        {cargandoTarjetas ? (
                          "Consultando..."
                        ) : errorTarjetas ? (
                          "No disponible"
                        ) : tarjetaUsuario ? (
                          <div className="tarjeta-usuario-item">
                            <strong>
                              {tarjetaUsuario.numero_tarjeta ||
                                "Número no disponible"}
                            </strong>
                            {tarjetaUsuario.fecha_vencimiento ? (
                              <small>
                                Vence: {tarjetaUsuario.fecha_vencimiento}
                              </small>
                            ) : null}
                            <span
                              className={`estado-badge ${
                                tarjetaUsuario.estado === "activa"
                                  ? "activo"
                                  : "inactivo"
                              }`}
                            >
                              {tarjetaUsuario.estado === "activa"
                                ? "Activa"
                                : "Inhabilitada"}
                            </span>
                          </div>
                        ) : (
                          <span className="estado-badge sin-tarjeta">
                            Sin tarjeta
                          </span>
                        )}
                      </td>
                      <td data-label="Acciones">
                        <button
                          type="button"
                          className="boton-anadir-tarjeta"
                          onClick={() => abrirModalTarjeta(usuario)}
                        >
                          Añadir tarjeta
                        </button>
                        <button
                          type="button"
                          className="boton-anadir-tarjeta"
                          onClick={() =>
                            editarTarjetaDeUsuario(
                              usuario,
                              tarjetaUsuario?.id_tarjeta
                            )
                          }
                        >
                          Editar tarjeta
                        </button>
                        {cargandoTarjetas ? (
                          <button
                            type="button"
                            className="boton-anadir-tarjeta"
                            disabled
                          >
                            Consultando tarjeta...
                          </button>
                        ) : tarjetaUsuario && !errorTarjetas ? (
                          <button
                            type="button"
                            className="boton-anadir-tarjeta"
                            onClick={() =>
                              cambiarEstadoTarjeta(usuario, tarjetaUsuario)
                            }
                            disabled={actualizando}
                          >
                            {actualizando
                              ? "Actualizando..."
                              : tarjetaUsuario.estado === "activa"
                              ? "Inhabilitar tarjeta"
                              : "Habilitar tarjeta"}
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                });
                })
              )}
            </tbody>
          </table>
        </div>

        {usuarioSeleccionado && (
          <div
            className="modal-tarjeta-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-tarjeta"
            onClick={(evento) => {
              if (evento.target === evento.currentTarget) cerrarModalTarjeta();
            }}
          >
            <form
              className="modal-tarjeta"
              onSubmit={agregarTarjeta}
            >
              <button
                type="button"
                className="cerrar-modal-tarjeta"
                onClick={cerrarModalTarjeta}
                aria-label="Cerrar modal"
              >
                ×
              </button>

              <h2 id="titulo-modal-tarjeta">
                {tarjetaEditando ? "Editar tarjeta" : "Añadir tarjeta"}
              </h2>

              <p className="cliente-modal-tarjeta">
                Cliente:{" "}
                <strong>
                  {usuarioSeleccionado.nombre}
                </strong>
              </p>

              <div>
                <label htmlFor="numero-tarjeta-modal">
                  Número de tarjeta (16 dígitos)
                </label>

                {tarjetaEditando ? (
                  <input
                    id="numero-tarjeta-modal"
                    type="text"
                    value={tarjetaEditando.numero_tarjeta || "No disponible"}
                    readOnly
                    aria-label="Número de tarjeta existente"
                  />
                ) : (
                  <>
                    <div className="numero-tarjeta-modal">
                      <input
                        id="numero-tarjeta-modal"
                        type="text"
                        value={formulario.primeros_digitos}
                        readOnly
                        aria-label="Primeros 13 dígitos generados"
                      />

                      <input
                        type="text"
                        name="ultimos_digitos"
                        value={formulario.ultimos_digitos}
                        onChange={manejarCambio}
                        inputMode="numeric"
                        maxLength={3}
                        pattern="[0-9]{3}"
                        aria-label="Últimos 3 dígitos editables"
                      />
                    </div>

                    <small className="ayuda-numero-tarjeta">
                      Los primeros 13 se generan automáticamente;
                      puedes editar los últimos 3.
                    </small>
                  </>
                )}
              </div>

              <div>
                <label htmlFor="tipo-tarjeta">
                  Tipo de tarjeta
                </label>

                <select
                  id="tipo-tarjeta"
                  name="tipo_tarjeta"
                  value={formulario.tipo_tarjeta}
                  onChange={manejarCambio}
                >
                  <option value="debito">Débito</option>
                  <option value="credito">Crédito</option>
                </select>
              </div>

              <div>
                <label htmlFor="fecha-vencimiento">
                  Fecha de vencimiento
                </label>

                <input
                  id="fecha-vencimiento"
                  type="month"
                  name="fecha_vencimiento"
                  value={formulario.fecha_vencimiento}
                  onChange={manejarCambio}
                  aria-label="Fecha de vencimiento"
                />
              </div>

              <div>
                <label htmlFor="cvv">CVV</label>

                <div className="campo-cvv">
                  <input
                    id="cvv"
                    type={mostrarCVV ? "text" : "password"}
                    name="cvv"
                    value={formulario.cvv}
                    maxLength={3}
                    inputMode="numeric"
                    pattern="[0-9]{3}"
                    onChange={manejarCambio}
                    readOnly={!tarjetaEditando}
                    placeholder={
                      tarjetaEditando && !formulario.cvv ? "••••" : undefined
                    }
                    aria-label={
                      tarjetaEditando
                        ? "CVV de 3 dígitos editable"
                        : "CVV de 3 dígitos, generado automáticamente y no editable"
                    }
                  />
                  <button
                    type="button"
                    className="boton-mostrar-cvv"
                    onClick={() =>
                      setMostrarCVV((mostrarActual) => !mostrarActual)
                    }
                    aria-label={mostrarCVV ? "Ocultar CVV" : "Mostrar CVV"}
                    title={mostrarCVV ? "Ocultar CVV" : "Mostrar CVV"}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
                      <circle cx="12" cy="12" r="3" />
                      {!mostrarCVV && <path d="M3 3l18 18" />}
                    </svg>
                  </button>
                </div>
                {tarjetaEditando && (
                  <small className="ayuda-cvv">
                    Se muestran los tres dígitos marcados de la tarjeta. Puedes
                    editarlos y guardar el cambio.
                  </small>
                )}
              </div>

              <button type="submit">
                {tarjetaEditando ? "Guardar cambios" : "Guardar tarjeta"}
              </button>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}