import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../styles/trageta.css";

const API_URL = "http://localhost:8000";

const generarUltimosDigitos = () =>
  String(Math.floor(Math.random() * 1000)).padStart(3, "0");

const generarPrimerosDigitos = () =>
  String(Math.floor(Math.random() * 10 ** 13)).padStart(13, "0");

const generarFechaVencimiento = () => {
  const fecha = new Date();
  const anio = fecha.getFullYear() + 5;
  const mes = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");

  return `${anio}-${mes}`;
};

export default function TarjetasUsuario({
  id_usuario,
  esAsesor = false,
}) {
  const rol = (localStorage.getItem("rol") || "")
    .trim()
    .toLowerCase();

  const esAdministrador = rol === "administrador";

  const [tarjetas, setTarjetas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [tarjetaEditando, setTarjetaEditando] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [mostrarMensajeAdmin, setMostrarMensajeAdmin] = useState(false);
  const [esMovil, setEsMovil] = useState(false);

  const [formulario, setFormulario] = useState({
    tipo_tarjeta: "debito",
    fecha_vencimiento: generarFechaVencimiento(),
    cvv: "",
    primeros_digitos: generarPrimerosDigitos(),
    ultimos_digitos: generarUltimosDigitos(),
  });

  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (id_usuario) {
      obtenerTarjetas();
    }

    obtenerUsuarios();
  }, [id_usuario]);

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

  const obtenerTarjetas = async () => {
    try {
      const token = localStorage.getItem("token");

      const respuesta = await axios.get(
        `${API_URL}/usuarios/${id_usuario}/tarjetas`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setTarjetas(Array.isArray(respuesta.data) ? respuesta.data : []);
    } catch (error) {
      console.error("Error al obtener tarjetas:", error);

      setMensaje(
        error.response?.data?.detail ||
          "No se pudieron obtener las tarjetas"
      );
    }
  };

  const obtenerUsuarios = async () => {
    try {
      const token = localStorage.getItem("token");

      const respuesta = await axios.get(`${API_URL}/usuarios`, {
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
    }
  };

  const obtenerTarjetasDeUsuario = async (usuario) => {
    try {
      const token = localStorage.getItem("token");
      const respuesta = await axios.get(
        `${API_URL}/usuarios/${usuario.id_usuario}/tarjetas`,
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
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value,
    });
  };

  const agregarTarjeta = async (e) => {
    e.preventDefault();

    if (!usuarioSeleccionado) {
      setMensaje("Debe seleccionar un usuario");
      return;
    }

    if (!formulario.fecha_vencimiento) {
      setMensaje("La fecha de vencimiento es obligatoria");
      return;
    }

    if (!tarjetaEditando && !formulario.cvv) {
      setMensaje("El CVV es obligatorio");
      return;
    }

    if (formulario.cvv && !/^\d{3,4}$/.test(formulario.cvv)) {
      setMensaje("El CVV debe tener entre 3 y 4 dígitos");
      return;
    }

    if (tarjetaEditando) {
      try {
        const token = localStorage.getItem("token");

        await axios.patch(
          `${API_URL}/tarjetas/${tarjetaEditando.id_tarjeta}`,
          {
            fecha_vencimiento: formulario.fecha_vencimiento,
            cvv: formulario.cvv,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setMensaje("Tarjeta actualizada correctamente");
        cerrarModalTarjeta();
        obtenerTarjetasDeUsuario(usuarioSeleccionado);
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

      await axios.post(
        `${API_URL}/usuarios/${usuarioSeleccionado.id_usuario}/tarjetas`,
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

      setMensaje("Tarjeta agregada correctamente");

      setFormulario({
        tipo_tarjeta: "debito",
        fecha_vencimiento: generarFechaVencimiento(),
        cvv: "",
        primeros_digitos: generarPrimerosDigitos(),
        ultimos_digitos: generarUltimosDigitos(),
      });

      setUsuarioSeleccionado(null);

      if (id_usuario === usuarioSeleccionado.id_usuario) {
        obtenerTarjetas();
      }

      obtenerUsuarios();
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

    setFormulario({
      tipo_tarjeta: "debito",
      fecha_vencimiento: generarFechaVencimiento(),
      cvv: "",
      primeros_digitos: generarPrimerosDigitos(),
      ultimos_digitos: generarUltimosDigitos(),
    });

    setMensaje("");
  };

  const editarTarjetaDeUsuario = async (usuario) => {
    const tarjetasUsuario = await obtenerTarjetasDeUsuario(usuario);

    if (tarjetasUsuario === null) {
      return;
    }

    if (tarjetasUsuario.length === 0) {
      setMensaje("Este usuario no tiene tarjetas para editar");
      return;
    }

    const tarjeta = tarjetasUsuario[0];
    const [mes, anio] = (tarjeta.fecha_vencimiento || "").split("/");

    setTarjetaEditando(tarjeta);
    setUsuarioSeleccionado(usuario);
    setFormulario({
      tipo_tarjeta: tarjeta.tipo_tarjeta || "debito",
      fecha_vencimiento: mes && anio
        ? `20${anio}-${mes}`
        : generarFechaVencimiento(),
      cvv: "",
      primeros_digitos: "",
      ultimos_digitos: "",
    });
    setMensaje("");
  };

  const cerrarModalTarjeta = () => {
    setUsuarioSeleccionado(null);
    setTarjetaEditando(null);

    setFormulario({
      tipo_tarjeta: "debito",
      fecha_vencimiento: generarFechaVencimiento(),
      cvv: "",
      primeros_digitos: generarPrimerosDigitos(),
      ultimos_digitos: generarUltimosDigitos(),
    });
  };

  const eliminarTarjeta = async (id_tarjeta) => {
    try {
      const token = localStorage.getItem("token");

      await axios.delete(`${API_URL}/tarjetas/${id_tarjeta}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMensaje("Tarjeta eliminada correctamente");

      obtenerTarjetas();
    } catch (error) {
      console.error("Error al eliminar tarjeta:", error);

      setMensaje(
        error.response?.data?.detail ||
          "No se pudo eliminar la tarjeta"
      );
    }
  };

  const activarTarjeta = async (id_tarjeta) => {
    try {
      const token = localStorage.getItem("token");

      await axios.patch(
        `${API_URL}/tarjetas/${id_tarjeta}/activar`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMensaje("Tarjeta activada correctamente");
      obtenerTarjetas();
    } catch (error) {
      console.error("Error al activar tarjeta:", error);

      setMensaje(
        error.response?.data?.detail ||
          "No se pudo activar la tarjeta"
      );
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
              to="/targeta"
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

      <main
        style={{
          flex: 1,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <h2
          style={{
            color: "#EAB94B",
            textAlign: "center",
            width: "100%",
          }}
        >
          Añadir tarjetas de clientes
        </h2>

        <h3
          style={{
            color: "#9EA1A7",
            textAlign: "center",
            width: "100%",
          }}
        >
          Nuevas tarjetas para los clientes
        </h3>

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
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id_usuario}>
                  <td>{usuario.nombre || "No registrado"}</td>
                  <td>
                    {usuario.documento || "No registrado"}
                  </td>
                  <td>
                    {usuario.direccion || "No registrada"}
                  </td>
                  <td>
                    {usuario.codigo_postal || "No registrado"}
                  </td>
                  <td>
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
                      onClick={() => editarTarjetaDeUsuario(usuario)}
                    >
                      Editar tarjeta
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {usuarioSeleccionado && (
          <div
            className="modal-tarjeta-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-tarjeta"
            onClick={cerrarModalTarjeta}
          >
            <form
              className="modal-tarjeta"
              onSubmit={agregarTarjeta}
              onClick={(e) => e.stopPropagation()}
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

                <input
                  id="cvv"
                  type="password"
                  name="cvv"
                  value={formulario.cvv}
                  onChange={manejarCambio}
                  maxLength={4}
                  inputMode="numeric"
                  pattern="[0-9]{3,4}"
                />
              </div>

              <button type="submit">
                {tarjetaEditando ? "Guardar cambios" : "Guardar tarjeta"}
              </button>
            </form>
          </div>
        )}

        {tarjetas.length > 0 &&
          tarjetas.map((tarjeta) => (
            <div key={tarjeta.id_tarjeta}>
              <p>
                <strong>Tipo:</strong>{" "}
                {tarjeta.tipo_tarjeta}
              </p>

              <p>
                <strong>Tarjeta:</strong>{" "}
                **** **** ****{" "}
                {tarjeta.numero_tarjeta
                  ? tarjeta.numero_tarjeta.slice(-4)
                  : "****"}
              </p>

              <p>
                <strong>Vencimiento:</strong>{" "}
                {tarjeta.fecha_vencimiento}
              </p>

              <p>
                <strong>Estado:</strong>{" "}
                {tarjeta.estado || "No disponible"}
              </p>

              {tarjeta.estado !== "activa" && (
                <button
                  type="button"
                  onClick={() => activarTarjeta(tarjeta.id_tarjeta)}
                >
                  Activar tarjeta
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  eliminarTarjeta(tarjeta.id_tarjeta)
                }
              >
                Eliminar tarjeta
              </button>

              <hr />
            </div>
          ))}
      </main>
    </div>
  );
}