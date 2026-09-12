import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "../styles/ListaCuentas.css";

const API_URL = "http://localhost:8000";

export default function ListaCuentas() {
  const navigate = useNavigate();
  const rol = String(localStorage.getItem("rol") || "")
    .trim()
    .toLowerCase();
  const esAsesor = rol === "asesor";

  const [cuentas, setCuentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);
  const [autorizandoSaldo, setAutorizandoSaldo] = useState(false);
  const [editandoSaldo, setEditandoSaldo] = useState(false);
  const [nuevoSaldo, setNuevoSaldo] = useState("");
  const [codigoAutorizacion, setCodigoAutorizacion] = useState("");
  const [guardandoSaldo, setGuardandoSaldo] = useState(false);

  useEffect(() => {
    cargarCuentas();
  }, []);

  const cargarCuentas = async () => {
    try {
      setCargando(true);
      setError("");
      setMensaje("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
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
        (cuenta) => String(cuenta.rol || "").toLowerCase() === "usuario"
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
        error.response?.data?.detail ||
          "No se pudieron cargar las cuentas."
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
      const accion = estado === "activa"
        ? "habilitar"
        : "deshabilitar";

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
      setMensaje(respuesta.data?.mensaje || "Estado actualizado correctamente.");
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      setError(
        error.response?.data?.detail ||
          "No se pudo actualizar el estado de la cuenta."
      );
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

    if (valor === null || valor === undefined || valor === "") {
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
      setError("Ingrese el código de administrador o asesor.");
      return;
    }

    try {
      setError("");
      setMensaje("");
      setGuardandoSaldo(true);

      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/administradores/cuenta/${cuentaSeleccionada.id_cuenta}/autorizar-saldo`,
        { codigo_autorizacion: codigoAutorizacion.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNuevoSaldo(String(cuentaSeleccionada.saldo ?? ""));
      setAutorizandoSaldo(false);
      setEditandoSaldo(true);
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "No se pudo validar el código de autorización."
      );
    } finally {
      setGuardandoSaldo(false);
    }
  };

  const actualizarSaldoCuenta = async (evento) => {
    evento.preventDefault();

    const saldo = Number(nuevoSaldo);
    if (!Number.isFinite(saldo) || saldo < 0) {
      setError("Ingrese un saldo válido mayor o igual a cero.");
      return;
    }

    if (!codigoAutorizacion.trim()) {
      setError("Ingrese el código de administrador o asesor.");
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
          codigo_autorizacion: codigoAutorizacion.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const saldoActualizado = respuesta.data?.saldo ?? saldo;
      setCuentas((cuentasActuales) =>
        cuentasActuales.map((cuenta) =>
          cuenta.id_cuenta === cuentaSeleccionada.id_cuenta
            ? { ...cuenta, saldo: saldoActualizado }
            : cuenta
        )
      );
      setCuentaSeleccionada((cuenta) => ({
        ...cuenta,
        saldo: saldoActualizado,
      }));
      setEditandoSaldo(false);
      setCodigoAutorizacion("");
      setMensaje(respuesta.data?.mensaje || "Saldo actualizado correctamente.");
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "No se pudo actualizar el saldo."
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

        <aside className="sidebar">
          <ul>
            {!esAsesor && (
              <>
                <li>
                  <Link to="/Administradores">
                    📜 Principal
                  </Link>
                </li>

                <li>
                  <Link to="/lista-asesores">
                    📜 Asesores
                  </Link>
                </li>
              </>
            )}

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
              {cargando ? "Actualizando..." : "Actualizar lista"}
            </button>
          </div>

          <p className="subtitulo-cuentas">
            Consulta el estado y saldo de las cuentas bancarias.
          </p>

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
            cuentas.length > 0 && (
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
                    {cuentas.map((cuenta) => {
                      const estado = String(
                        cuenta.estado || ""
                      ).toLowerCase();

                      return (
                        <tr key={cuenta.id_cuenta}>
                          <td>
                            {cuenta.numero_cuenta ||
                              cuenta.id_cuenta}
                          </td>
                          <td>{cuenta.nombre}</td>
                          <td>{cuenta.tipo_cuenta}</td>
                          <td>{formatearSaldo(cuenta.saldo)}</td>
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
                              onClick={() => setCuentaSeleccionada(cuenta)}
                            >
                              Ver
                            </button>
                            <button
                              className="boton-habilitar"
                              onClick={() =>
                                cambiarEstadoCuenta(
                                  cuenta.id_cuenta,
                                  "activa"
                                )
                              }
                              disabled={estado === "activa"}
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
                              disabled={estado === "inactiva"}
                            >
                              Inhabilitar
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
              onClick={() => navigate("/asesor-bancario")}
            >
              Volver al inicio del asesor
            </button>
          )}

        </main>

        {cuentaSeleccionada && (
          <div
            className="modal-cuenta-overlay"
            role="presentation"
            onClick={() => setCuentaSeleccionada(null)}
          >
            <section
              className="modal-cuenta"
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-modal-cuenta"
              onClick={(evento) => evento.stopPropagation()}
            >
              <div className="encabezado-modal-cuenta">
                <h2 id="titulo-modal-cuenta">Información de la cuenta</h2>
                <button
                  type="button"
                  className="boton-cerrar-modal"
                  onClick={() => setCuentaSeleccionada(null)}
                  aria-label="Cerrar información de la cuenta"
                >
                  ×
                </button>
              </div>

              <div className="detalles-cuenta">
                {Object.entries(cuentaSeleccionada).map(([clave, valor]) => (
                  <div className="detalle-cuenta" key={clave}>
                    <strong>{clave.replaceAll("_", " ")}</strong>
                    <div className="valor-detalle-cuenta">
                      <span>{formatearValor(clave, valor)}</span>
                      {clave === "saldo" && (
                        <button
                          type="button"
                          className="boton-editar-saldo"
                          onClick={abrirEdicionSaldo}
                          aria-label="Editar saldo"
                          title="Editar saldo"
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
                onClick={() => setAutorizandoSaldo(false)}
              >
                <form
                  className="modal-edicion-saldo"
                  onSubmit={autorizarEdicionSaldo}
                  onClick={(evento) => evento.stopPropagation()}
                >
                  <h2>Autorización para editar saldo</h2>
                  <p>Ingrese el código de administrador o asesor.</p>
                  <label htmlFor="codigo-autorizacion">
                    Código de autorización
                  </label>
                  <input
                    id="codigo-autorizacion"
                    type="password"
                    value={codigoAutorizacion}
                    onChange={(evento) =>
                      setCodigoAutorizacion(evento.target.value)
                    }
                    autoComplete="off"
                    required
                    autoFocus
                  />
                  <div className="acciones-formulario-saldo">
                    <button
                      type="button"
                      className="boton-cancelar-saldo"
                      onClick={() => setAutorizandoSaldo(false)}
                      disabled={guardandoSaldo}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="boton-guardar-saldo"
                      disabled={guardandoSaldo}
                    >
                      {guardandoSaldo ? "Validando..." : "Continuar"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {editandoSaldo && (
              <div
                className="modal-edicion-overlay"
                role="presentation"
                onClick={() => setEditandoSaldo(false)}
              >
                <form
                  className="modal-edicion-saldo"
                  onSubmit={actualizarSaldoCuenta}
                  onClick={(evento) => evento.stopPropagation()}
                >
                  <h2>Editar saldo de la cuenta</h2>
                  <label htmlFor="nuevo-saldo">Nuevo saldo</label>
                  <input
                    id="nuevo-saldo"
                    type="number"
                    min="0"
                    step="0.01"
                    value={nuevoSaldo}
                    onChange={(evento) => setNuevoSaldo(evento.target.value)}
                    required
                  />
                  <div className="acciones-formulario-saldo">
                    <button
                      type="button"
                      className="boton-cancelar-saldo"
                      onClick={() => setEditandoSaldo(false)}
                      disabled={guardandoSaldo}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="boton-guardar-saldo"
                      disabled={guardandoSaldo}
                    >
                      {guardandoSaldo ? "Guardando..." : "Guardar saldo"}
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