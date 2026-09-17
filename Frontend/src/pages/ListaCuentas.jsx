import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "../styles/ListaCuentas.css";

const API_URL = "http://localhost:8000";

const obtenerMensajeError = (error, mensajePredeterminado) => {
  const detalle = error.response?.data?.detail;

  if (Array.isArray(detalle)) {
    return detalle
      .map((item) => item?.msg || item?.message || String(item))
      .join(" ");
  }

  if (detalle && typeof detalle === "object") {
    return detalle.msg || detalle.message || JSON.stringify(detalle);
  }

  return detalle || mensajePredeterminado;
};

export default function ListaCuentas() {
  const navigate = useNavigate();

  const rol = String(localStorage.getItem("rol") || "")
    .trim()
    .toLowerCase();

  const esAsesor = rol === "asesor";

  const [cuentas, setCuentas] = useState([]);
  const [busquedaCuenta, setBusquedaCuenta] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);

  const [autorizandoSaldo, setAutorizandoSaldo] = useState(false);
  const [editandoSaldo, setEditandoSaldo] = useState(false);
  const [nuevoSaldo, setNuevoSaldo] = useState("");
  const [codigoAutorizacion, setCodigoAutorizacion] = useState("");
  const [guardandoSaldo, setGuardandoSaldo] = useState(false);

  const [autorizandoTipoOperacion, setAutorizandoTipoOperacion] =
    useState(false);
  const [editandoTipoOperacion, setEditandoTipoOperacion] = useState(false);
  const [nuevoTipoOperacion, setNuevoTipoOperacion] = useState("");

  const [usuarioNuevaCuenta, setUsuarioNuevaCuenta] = useState(null);
  const [opcionNuevaCuenta, setOpcionNuevaCuenta] = useState("ahorros");
  const [nuevoSaldoCuenta, setNuevoSaldoCuenta] = useState("0");
  const [guardandoCuenta, setGuardandoCuenta] = useState(false);
  const [mostrarMensajeAdmin, setMostrarMensajeAdmin] = useState(false);

  const [menuAbierto, setMenuAbierto] = useState(true);

  useEffect(() => {
    cargarCuentas();
  }, []);

  useEffect(() => {
    const actualizarEstadoMenu = () => {
      setMenuAbierto(window.innerWidth > 650);
    };

    actualizarEstadoMenu();
    window.addEventListener("resize", actualizarEstadoMenu);

    return () => window.removeEventListener("resize", actualizarEstadoMenu);
  }, []);

  const normalizarTexto = (valor) =>
    String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const cuentasFiltradas = cuentas.filter((cuenta) => {
    const textoBusqueda = normalizarTexto(busquedaCuenta.trim());

    if (!textoBusqueda) {
      return true;
    }

    return [
      cuenta.nombre,
      cuenta.numero_cuenta,
      cuenta.tipo_cuenta,
      cuenta.estado,
      cuenta.id_cuenta,
      cuenta.usuario,
    ].some((valor) =>
      normalizarTexto(valor).includes(textoBusqueda)
    );
  });

  const cargarCuentas = async () => {
    try {
      setCargando(true);
      setError("");
      setMensaje("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/");
        return;
      }

      const respuesta = await axios.get(
        `${API_URL}/administradores/cuentas`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const cuentasUsuario = (respuesta.data?.cuentas || []).filter(
        (cuenta) =>
          String(cuenta.rol || "").toLowerCase() === "usuario"
      );

      setCuentas(cuentasUsuario);
    } catch (error) {
      console.error("Error al cargar las cuentas:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      setError(
        obtenerMensajeError(
          error,
          "No se pudieron cargar las cuentas."
        )
      );
    } finally {
      setCargando(false);
    }
  };

  const cambiarEstadoCuenta = async (idCuenta, estado) => {
    try {
      setError("");
      setMensaje("");

      const token = localStorage.getItem("token");

      const accion =
        estado === "activa" ? "habilitar" : "deshabilitar";

      const respuesta = await axios.put(
        `${API_URL}/asesor-bancario/cuenta/${idCuenta}/${accion}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCuentas((cuentasActuales) =>
        cuentasActuales.map((cuenta) =>
          cuenta.id_cuenta === idCuenta
            ? { ...cuenta, estado }
            : cuenta
        )
      );

      setCuentaSeleccionada((cuenta) =>
        cuenta?.id_cuenta === idCuenta
          ? { ...cuenta, estado }
          : cuenta
      );

      setMensaje(
        respuesta.data?.mensaje ||
          "Estado actualizado correctamente."
      );
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      setError(
        obtenerMensajeError(
          error,
          "No se pudo actualizar el estado de la cuenta."
        )
      );
    }
  };

  const abrirNuevaCuenta = (cuenta) => {
    const tiposExistentes =
      cuenta.tipos_cuenta || [cuenta.tipo_cuenta];

    setError("");
    setMensaje("");
    setUsuarioNuevaCuenta(cuenta);

    setOpcionNuevaCuenta(
      tiposExistentes.includes("ahorros")
        ? "credito"
        : "ahorros"
    );

    setNuevoSaldoCuenta("0");
  };

  const crearNuevaCuenta = async (evento) => {
    evento.preventDefault();

    const saldo = Number(nuevoSaldoCuenta);

    if (!Number.isFinite(saldo) || saldo < 0) {
      setError(
        "Ingrese un saldo válido mayor o igual a cero."
      );
      return;
    }

    try {
      setError("");
      setMensaje("");
      setGuardandoCuenta(true);

      const token = localStorage.getItem("token");

      const respuesta = await axios.post(
        `${API_URL}/usuarios/${usuarioNuevaCuenta.id_usuario}/cuentas`,
        {
          tipo_cuenta:
            opcionNuevaCuenta === "ahorros"
              ? "ahorros"
              : "corriente",
          tipo_operacion:
            opcionNuevaCuenta === "credito"
              ? "credito"
              : "debito",
          opcion_cuenta: opcionNuevaCuenta,
          saldo,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUsuarioNuevaCuenta(null);
      await cargarCuentas();

      setMensaje(
        respuesta.data?.mensaje ||
          "Cuenta creada correctamente."
      );
    } catch (error) {
      setError(
        obtenerMensajeError(
          error,
          "No se pudo crear la cuenta."
        )
      );
    } finally {
      setGuardandoCuenta(false);
    }
  };

  const formatearSaldo = (saldo) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(Number(saldo || 0));
  };

  const formatearValor = (clave, valor) => {
    if (clave === "saldo") {
      return formatearSaldo(valor);
    }

    if (
      valor === null ||
      valor === undefined ||
      valor === ""
    ) {
      return "No registrado";
    }

    if (typeof valor === "object") {
      return JSON.stringify(valor);
    }

    return String(valor);
  };

  const abrirEdicionSaldo = () => {
    setCodigoAutorizacion("");
    setError("");
    setAutorizandoSaldo(true);
  };

  const autorizarEdicionSaldo = async (evento) => {
    evento.preventDefault();

    if (!codigoAutorizacion.trim()) {
      setError(
        "Ingrese el código de administrador o asesor."
      );
      return;
    }

    try {
      setError("");
      setMensaje("");
      setGuardandoSaldo(true);

      const token = localStorage.getItem("token");

      await axios.post(
        `${API_URL}/administradores/cuenta/${cuentaSeleccionada.id_cuenta}/autorizar-saldo`,
        {
          codigo_autorizacion:
            codigoAutorizacion.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNuevoSaldo(
        String(cuentaSeleccionada.saldo ?? "")
      );

      setAutorizandoSaldo(false);
      setEditandoSaldo(true);
    } catch (error) {
      setError(
        obtenerMensajeError(
          error,
          "No se pudo validar el código de autorización."
        )
      );
    } finally {
      setGuardandoSaldo(false);
    }
  };

  const actualizarSaldoCuenta = async (evento) => {
    evento.preventDefault();

    const saldo = Number(nuevoSaldo);

    if (!Number.isFinite(saldo) || saldo < 0) {
      setError(
        "Ingrese un saldo válido mayor o igual a cero."
      );
      return;
    }

    if (!codigoAutorizacion.trim()) {
      setError(
        "Ingrese el código de administrador o asesor."
      );
      return;
    }

    try {
      setError("");
      setMensaje("");
      setGuardandoSaldo(true);

      const token = localStorage.getItem("token");

      const respuesta = await axios.put(
        `${API_URL}/administradores/cuenta/${cuentaSeleccionada.id_cuenta}/saldo`,
        {
          saldo,
          codigo_autorizacion:
            codigoAutorizacion.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const saldoActualizado =
        respuesta.data?.saldo ?? saldo;

      setCuentas((cuentasActuales) =>
        cuentasActuales.map((cuenta) =>
          cuenta.id_cuenta ===
          cuentaSeleccionada.id_cuenta
            ? {
                ...cuenta,
                saldo: saldoActualizado,
              }
            : cuenta
        )
      );

      setCuentaSeleccionada((cuenta) => ({
        ...cuenta,
        saldo: saldoActualizado,
      }));

      setEditandoSaldo(false);
      setCodigoAutorizacion("");

      setMensaje(
        respuesta.data?.mensaje ||
          "Saldo actualizado correctamente."
      );
    } catch (error) {
      setError(
        obtenerMensajeError(
          error,
          "No se pudo actualizar el saldo."
        )
      );
    } finally {
      setGuardandoSaldo(false);
    }
  };

  const abrirEdicionTipoOperacion = () => {
    setCodigoAutorizacion("");
    setError("");
    setAutorizandoTipoOperacion(true);
  };

  const autorizarEdicionTipoOperacion = async (evento) => {
    evento.preventDefault();

    if (!codigoAutorizacion.trim()) {
      setError(
        "Ingrese el código de administrador o asesor."
      );
      return;
    }

    try {
      setError("");
      setMensaje("");
      setGuardandoSaldo(true);

      const token = localStorage.getItem("token");

      await axios.post(
        `${API_URL}/administradores/cuenta/${cuentaSeleccionada.id_cuenta}/autorizar-tipo-operacion`,
        {
          codigo_autorizacion:
            codigoAutorizacion.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNuevoTipoOperacion(
        cuentaSeleccionada.tipo_operacion || "debito"
      );

      setAutorizandoTipoOperacion(false);
      setEditandoTipoOperacion(true);
    } catch (error) {
      setError(
        obtenerMensajeError(
          error,
          "No se pudo validar el código de autorización."
        )
      );
    } finally {
      setGuardandoSaldo(false);
    }
  };

  const actualizarTipoOperacion = async (evento) => {
    evento.preventDefault();

    if (!codigoAutorizacion.trim()) {
      setError(
        "Ingrese el código de administrador o asesor."
      );
      return;
    }

    try {
      setError("");
      setMensaje("");
      setGuardandoSaldo(true);

      const token = localStorage.getItem("token");

      const respuesta = await axios.put(
        `${API_URL}/administradores/cuenta/${cuentaSeleccionada.id_cuenta}/tipo-operacion`,
        {
          tipo_operacion: nuevoTipoOperacion,
          codigo_autorizacion:
            codigoAutorizacion.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const tipoActualizado =
        respuesta.data?.tipo_operacion ??
        nuevoTipoOperacion;

      setCuentas((cuentasActuales) =>
        cuentasActuales.map((cuenta) =>
          cuenta.id_cuenta ===
          cuentaSeleccionada.id_cuenta
            ? {
                ...cuenta,
                tipo_operacion: tipoActualizado,
              }
            : cuenta
        )
      );

      setCuentaSeleccionada((cuenta) => ({
        ...cuenta,
        tipo_operacion: tipoActualizado,
      }));

      setEditandoTipoOperacion(false);
      setCodigoAutorizacion("");

      setMensaje(
        respuesta.data?.mensaje ||
          "Tipo de operación actualizado correctamente."
      );
    } catch (error) {
      setError(
        obtenerMensajeError(
          error,
          "No se pudo actualizar el tipo de operación."
        )
      );
    } finally {
      setGuardandoSaldo(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario_id");
    localStorage.removeItem("documento");
    localStorage.removeItem("fotoPerfil");

    navigate("/login");
  };

  return (
    <div className="lista-cuentas-container">
      <div className="panel-financiero">

        <button
          type="button"
          className={`boton-menu-cuentas ${
            menuAbierto ? "" : "menu-cerrado"
          }`}
          onClick={() =>
            setMenuAbierto((actual) => !actual)
          }
          aria-label={
            menuAbierto ? "Cerrar menú" : "Abrir menú"
          }
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
            {!esAsesor && (
              <>
                <li>
                  <Link
                    to="/administrador"
                    onClick={() =>
                      setMenuAbierto(false)
                    }
                  >
                    📜 Principal
                  </Link>
                </li>

                <li>
                  <Link
                    to="/asesor-bancario"
                    onClick={() =>
                      setMenuAbierto(false)
                    }
                  >
                    📜 Asesor bancario
                  </Link>
                </li>
              </>
            )}

            {esAsesor && (
              <>
                <li>
                  <Link
                    to="/asesor-bancario"
                    onClick={() =>
                      setMenuAbierto(false)
                    }
                  >
                    📜 Asesor bancario
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
              </>
            )}

            {!esAsesor && (
              <li>
                <Link
                  to="/lista-usuarios"
                  onClick={() =>
                    setMenuAbierto(false)
                  }
                >
                  👤 Usuarios
                </Link>
              </li>
            )}

            <li>
              <Link
                to="/lista-cuentas"
                onClick={() =>
                  setMenuAbierto(false)
                }
              >
                🌐 Cuentas
              </Link>
            </li>

            {!esAsesor && (
              <li>
                <Link
                  to="/notoficaciones"
                  onClick={() =>
                    setMenuAbierto(false)
                  }
                >
                  🔔 Notificaciones
                </Link>
              </li>
            )}

          </ul>

          <button
            className="logout"
            onClick={handleLogout}
          >
            🚪 Cerrar sesión
          </button>
        </aside>

        <main className="contenido-cuentas">
          <div className="encabezado-cuentas">
            <h1>Lista de Cuentas</h1>

            <button
              type="button"
              className="boton-actualizar-lista"
              onClick={cargarCuentas}
              disabled={cargando}
            >
              {cargando
                ? "Actualizando..."
                : "Actualizar lista"}
            </button>
          </div>

          <p className="subtitulo-cuentas">
            Consulta el estado y saldo de las cuentas bancarias.
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
              value={busquedaCuenta}
              onChange={(evento) =>
                setBusquedaCuenta(evento.target.value)
              }
              placeholder="Buscar cuenta por nombre, número, tipo, estado..."
              aria-label="Buscar cuenta"
            />
          </div>

          {cargando && (
            <p className="cargando-cuentas">
              Cargando cuentas...
            </p>
          )}

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

          {!cargando &&
            !error &&
            cuentas.length === 0 && (
              <p className="sin-cuentas">
                No tienes cuentas registradas.
              </p>
            )}

          {!cargando &&
            !error &&
            cuentas.length > 0 &&
            cuentasFiltradas.length === 0 && (
              <p className="mensaje-busqueda-asesores">
                No se encontraron cuentas para “
                {busquedaCuenta}”.
              </p>
            )}

          {!cargando &&
            !error &&
            cuentasFiltradas.length > 0 && (
              <div className="tabla-cuentas-contenedor">
                <table className="tabla-cuentas">
                  <thead>
                    <tr>
                      <th>Número de cuenta</th>
                      <th>Nombre</th>
                      <th>Tipo de cuenta</th>
                      <th>Saldo</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {cuentasFiltradas.map((cuenta) => {
                      const estado = String(
                        cuenta.estado || ""
                      ).toLowerCase();

                      return (
                        <tr
                          key={cuenta.id_cuenta}
                        >
                          <td>
                            {cuenta.numero_cuenta ||
                              cuenta.id_cuenta}
                          </td>

                          <td>
                            {cuenta.nombre}
                          </td>

                          <td>
                            {cuenta.tipo_cuenta}
                          </td>

                          <td>
                            {formatearSaldo(
                              cuenta.saldo
                            )}
                          </td>

                          <td>
                            <span
                              className={`estado-cuenta ${estado}`}
                            >
                              {cuenta.estado}
                            </span>
                          </td>

                          <td className="acciones-cuenta">
                            <button
                              className="boton-ver"
                              onClick={() =>
                                setCuentaSeleccionada(
                                  cuenta
                                )
                              }
                            >
                              Ver
                            </button>

                            <button
                              className="boton-habilitar"
                              onClick={() => {
                                setCuentaSeleccionada(
                                  cuenta
                                );

                                cambiarEstadoCuenta(
                                  cuenta.id_cuenta,
                                  "activa"
                                );
                              }}
                              disabled={
                                estado === "activa"
                              }
                            >
                              Habilitar
                            </button>

                            <button
                              className="boton-inhabilitar"
                              onClick={() =>
                                cambiarEstadoCuenta(
                                  cuenta.id_cuenta,
                                  "inactiva"
                                )
                              }
                              disabled={
                                estado === "inactiva"
                              }
                            >
                              Inhabilitar
                            </button>

                            <button
                              className="boton-nueva-cuenta"
                              onClick={() =>
                                abrirNuevaCuenta(
                                  cuenta
                                )
                              }
                            >
                              Añadir cuenta
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          {esAsesor && (
            <button
              type="button"
              className="boton-volver-asesor"
              onClick={() =>
                navigate("/asesor-bancario")
              }
            >
              Volver al inicio del asesor
            </button>
          )}
        </main>

        {usuarioNuevaCuenta && (
          <div
            className="modal-edicion-overlay"
            role="presentation"
            onClick={() =>
              setUsuarioNuevaCuenta(null)
            }
          >
            <form
              className="modal-edicion-saldo"
              onSubmit={crearNuevaCuenta}
              onClick={(evento) =>
                evento.stopPropagation()
              }
            >
              <h2>
                Añadir cuenta a{" "}
                {usuarioNuevaCuenta.nombre}
              </h2>

              <p>
                La cuenta se creará activa y aparecerá
                en la cuenta del usuario.
              </p>

              <div className="tipo-cuenta-principal">
                <strong>
                  Cuenta principal corriente
                </strong>

                <span>
                  Cuenta para operaciones bancarias y
                  uso de tarjeta débito o crédito.
                </span>
              </div>

              <label htmlFor="opcion-nueva-cuenta">
                Opción para la cuenta
              </label>

              <select
                id="opcion-nueva-cuenta"
                className="selector-tipo-cuenta"
                value={opcionNuevaCuenta}
                onChange={(evento) =>
                  setOpcionNuevaCuenta(
                    evento.target.value
                  )
                }
                required
              >
                {!(
                  usuarioNuevaCuenta.tipos_cuenta ||
                  []
                ).includes("ahorros") && (
                  <option value="ahorros">
                    Ahorros
                  </option>
                )}

                <option value="credito">
                  Crédito
                </option>
              </select>

              <p className="ayuda-tipo-operacion">
                {opcionNuevaCuenta === "credito"
                  ? "Se verificará la cuenta principal y se configurará como crédito."
                  : "Se creará una cuenta de ahorros adicional."}
              </p>

              <label htmlFor="nuevo-saldo-cuenta">
                Saldo inicial
              </label>

              <input
                id="nuevo-saldo-cuenta"
                type="number"
                min="0"
                step="0.01"
                value={nuevoSaldoCuenta}
                onChange={(evento) =>
                  setNuevoSaldoCuenta(
                    evento.target.value
                  )
                }
                required
              />

              <div className="acciones-formulario-saldo">
                <button
                  type="button"
                  className="boton-cancelar-saldo"
                  onClick={() =>
                    setUsuarioNuevaCuenta(null)
                  }
                  disabled={guardandoCuenta}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="boton-guardar-saldo"
                  disabled={guardandoCuenta}
                >
                  {guardandoCuenta
                    ? "Creando..."
                    : "Crear cuenta"}
                </button>
              </div>
            </form>
          </div>
        )}

        {cuentaSeleccionada && (
          <div
            className="modal-cuenta-overlay"
            role="presentation"
            onClick={() =>
              setCuentaSeleccionada(null)
            }
          >
            <section
              className="modal-cuenta"
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-modal-cuenta"
              onClick={(evento) =>
                evento.stopPropagation()
              }
            >
              <div className="encabezado-modal-cuenta">
                <h2 id="titulo-modal-cuenta">
                  Información de la cuenta
                </h2>

                <button
                  type="button"
                  className="boton-cerrar-modal"
                  onClick={() =>
                    setCuentaSeleccionada(null)
                  }
                  aria-label="Cerrar información de la cuenta"
                >
                  ×
                </button>
              </div>

              <div className="detalles-cuenta">
                {Object.entries(cuentaSeleccionada)
                  .filter(
                    ([clave]) =>
                      ![
                        "id_cuenta",
                        "id_usuario",
                        "tipos_cuenta",
                      ].includes(clave)
                  )
                  .map(([clave, valor]) => (
                    <div
                      className="detalle-cuenta"
                      key={clave}
                    >
                      <strong>
                        {clave.replaceAll(
                          "_",
                          " "
                        )}
                      </strong>

                      <div className="valor-detalle-cuenta">
                        <span>
                          {formatearValor(
                            clave,
                            valor
                          )}
                        </span>

                        {clave === "saldo" && (
                          <button
                            type="button"
                            className="boton-editar-saldo"
                            onClick={
                              abrirEdicionSaldo
                            }
                            aria-label="Editar saldo"
                            title="Editar saldo"
                          >
                            ✎
                          </button>
                        )}

                        {clave ===
                          "tipo_operacion" && (
                          <button
                            type="button"
                            className="boton-editar-saldo"
                            onClick={
                              abrirEdicionTipoOperacion
                            }
                            aria-label="Editar tipo de operación"
                            title="Editar tipo de operación"
                          >
                            ✎
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </section>

            {autorizandoSaldo && (
              <div
                className="modal-edicion-overlay"
                role="presentation"
                onClick={() =>
                  setAutorizandoSaldo(false)
                }
              >
                <form
                  className="modal-edicion-saldo"
                  onSubmit={
                    autorizarEdicionSaldo
                  }
                  onClick={(evento) =>
                    evento.stopPropagation()
                  }
                >
                  <h2>
                    Autorización para editar saldo
                  </h2>

                  <p>
                    Ingrese el código de administrador
                    o asesor.
                  </p>

                  <label htmlFor="codigo-autorizacion">
                    Código de autorización
                  </label>

                  <input
                    id="codigo-autorizacion"
                    type="password"
                    value={codigoAutorizacion}
                    onChange={(evento) =>
                      setCodigoAutorizacion(
                        evento.target.value
                      )
                    }
                    autoComplete="off"
                    required
                    autoFocus
                  />

                  <div className="acciones-formulario-saldo">
                    <button
                      type="button"
                      className="boton-cancelar-saldo"
                      onClick={() =>
                        setAutorizandoSaldo(false)
                      }
                      disabled={guardandoSaldo}
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      className="boton-guardar-saldo"
                      disabled={guardandoSaldo}
                    >
                      {guardandoSaldo
                        ? "Validando..."
                        : "Continuar"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {editandoSaldo && (
              <div
                className="modal-edicion-overlay"
                role="presentation"
                onClick={() =>
                  setEditandoSaldo(false)
                }
              >
                <form
                  className="modal-edicion-saldo"
                  onSubmit={
                    actualizarSaldoCuenta
                  }
                  onClick={(evento) =>
                    evento.stopPropagation()
                  }
                >
                  <h2>
                    Editar saldo de la cuenta
                  </h2>

                  <label htmlFor="nuevo-saldo">
                    Nuevo saldo
                  </label>

                  <input
                    id="nuevo-saldo"
                    type="number"
                    min="0"
                    step="0.01"
                    value={nuevoSaldo}
                    onChange={(evento) =>
                      setNuevoSaldo(
                        evento.target.value
                      )
                    }
                    required
                  />

                  <div className="acciones-formulario-saldo">
                    <button
                      type="button"
                      className="boton-cancelar-saldo"
                      onClick={() =>
                        setEditandoSaldo(false)
                      }
                      disabled={guardandoSaldo}
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      className="boton-guardar-saldo"
                      disabled={guardandoSaldo}
                    >
                      {guardandoSaldo
                        ? "Guardando..."
                        : "Guardar saldo"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {autorizandoTipoOperacion && (
              <div
                className="modal-edicion-overlay"
                role="presentation"
                onClick={() =>
                  setAutorizandoTipoOperacion(false)
                }
              >
                <form
                  className="modal-edicion-saldo"
                  onSubmit={
                    autorizarEdicionTipoOperacion
                  }
                  onClick={(evento) =>
                    evento.stopPropagation()
                  }
                >
                  <h2>
                    Autorización para editar tipo de
                    operación
                  </h2>

                  <p>
                    Ingrese el código de administrador
                    o asesor.
                  </p>

                  <label htmlFor="codigo-autorizacion-operacion">
                    Código de autorización
                  </label>

                  <input
                    id="codigo-autorizacion-operacion"
                    type="password"
                    value={codigoAutorizacion}
                    onChange={(evento) =>
                      setCodigoAutorizacion(
                        evento.target.value
                      )
                    }
                    autoComplete="off"
                    required
                    autoFocus
                  />

                  <div className="acciones-formulario-saldo">
                    <button
                      type="button"
                      className="boton-cancelar-saldo"
                      onClick={() =>
                        setAutorizandoTipoOperacion(
                          false
                        )
                      }
                      disabled={guardandoSaldo}
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      className="boton-guardar-saldo"
                      disabled={guardandoSaldo}
                    >
                      {guardandoSaldo
                        ? "Validando..."
                        : "Continuar"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {editandoTipoOperacion && (
              <div
                className="modal-edicion-overlay"
                role="presentation"
                onClick={() =>
                  setEditandoTipoOperacion(false)
                }
              >
                <form
                  className="modal-edicion-saldo"
                  onSubmit={
                    actualizarTipoOperacion
                  }
                  onClick={(evento) =>
                    evento.stopPropagation()
                  }
                >
                  <h2>
                    Editar tipo de operación
                  </h2>

                  <label htmlFor="nuevo-tipo-operacion">
                    Tipo de operación
                  </label>

                  <select
                    id="nuevo-tipo-operacion"
                    value={nuevoTipoOperacion}
                    onChange={(evento) =>
                      setNuevoTipoOperacion(
                        evento.target.value
                      )
                    }
                    required
                  >
                    <option value="debito">
                      Débito
                    </option>

                    <option value="credito">
                      Crédito
                    </option>
                  </select>

                  <div className="acciones-formulario-saldo">
                    <button
                      type="button"
                      className="boton-cancelar-saldo"
                      onClick={() =>
                        setEditandoTipoOperacion(
                          false
                        )
                      }
                      disabled={guardandoSaldo}
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      className="boton-guardar-saldo"
                      disabled={guardandoSaldo}
                    >
                      {guardandoSaldo
                        ? "Guardando..."
                        : "Guardar tipo"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}