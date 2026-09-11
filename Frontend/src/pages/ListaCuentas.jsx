import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "../styles/ListaCuentas.css";

const API_URL = "http://localhost:8000";

export default function ListaCuentas() {
  const navigate = useNavigate();

  const [cuentas, setCuentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

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
                            <button
                              className="boton-actualizar"
                              onClick={cargarCuentas}
                            >
                              Actualizar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

        </main>
      </div>
    </div>
  );
}