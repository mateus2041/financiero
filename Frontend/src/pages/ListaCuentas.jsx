import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/ListaCuentas.css";

function ListaCuentas() {
  const [cuentas, setCuentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    cargarCuentas();
  }, []);

  const cargarCuentas = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error(
          "No hay sesión activa. Inicia sesión como administrador."
        );
      }

      const respuesta = await fetch(
        "http://localhost:8000/administradores/cuentas",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const datos = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          datos.detail || "No se pudieron cargar las cuentas"
        );
      }

      setCuentas(datos.cuentas || []);
      setError("");
    } catch (error) {
      console.error("Error al cargar cuentas:", error);

      setCuentas([]);
      setError(
        error.message || "No se pudieron cargar las cuentas"
      );
    } finally {
      setCargando(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("documento");
    localStorage.removeItem("usuario_id");

    navigate("/login");
  };

  const verCuenta = (cuenta) => {
    console.log("Cuenta seleccionada:", cuenta);

    // Después puedes agregar:
    // navigate(`/cuenta/${cuenta.id_cuenta}`);
  };

  return (
    <div className="cuentas-container">

      <div className="panel-financiero">

        {/* SIDEBAR */}
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
                💳 Cuentas
              </Link>
            </li>

            <li>
              <Link to="/">
                💲 Devolución
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

        {/* CONTENIDO */}
        <div className="panel-contenido">

          <div className="cuentas-panel">

            <h1>Cuentas de Usuarios</h1>

            {cargando ? (

              <p className="cuentas-cargando">
                Cargando cuentas...
              </p>

            ) : error ? (

              <p className="cuentas-error">
                {error}
              </p>

            ) : cuentas.length === 0 ? (

              <p className="cuentas-sin-resultados">
                No hay cuentas registradas.
              </p>

            ) : (

              <div className="tabla-cuentas">

                {/* ENCABEZADO */}
                <div className="cuenta-fila cuenta-header">

                  <div>Usuario</div>
                  <div>Documento</div>
                  <div>Número de cuenta</div>
                  <div>Tipo</div>
                  <div>Saldo</div>
                  <div>Estado</div>
                  <div>Acciones</div>

                </div>

                {/* CUENTAS */}
                {cuentas.map((cuenta) => {

                  const idCuenta =
                    cuenta.id_cuenta ?? cuenta.id;

                  return (

                    <div
                      className="cuenta-fila"
                      key={idCuenta}
                    >

                      <div>
                        <strong>
                          {cuenta.nombre ||
                            cuenta.usuario ||
                            "Sin nombre"}
                        </strong>
                      </div>

                      <div>
                        {cuenta.documento ||
                          cuenta.numero_documento ||
                          "No disponible"}
                      </div>

                      <div>
                        {cuenta.numero_cuenta ||
                          cuenta.numero ||
                          "No disponible"}
                      </div>

                      <div>
                        {cuenta.tipo_cuenta ||
                          cuenta.tipo ||
                          "No disponible"}
                      </div>

                      <div className="saldo">
                        $
                        {Number(
                          cuenta.saldo || 0
                        ).toLocaleString("es-CO")}
                      </div>

                      <div>

                        <span
                          className={
                            cuenta.estado === "activo"
                              ? "estado-activo"
                              : "estado-inactivo"
                          }
                        >
                          {cuenta.estado ||
                            "Sin estado"}
                        </span>

                      </div>

                      <div>

                        <button
                          type="button"
                          className="boton-ver-cuenta"
                          onClick={() =>
                            verCuenta(cuenta)
                          }
                        >
                          Ver cuenta
                        </button>

                      </div>

                    </div>

                  );

                })}

              </div>

            )}

          </div>

        </div>

      </div>

    </div>
  );
}

export default ListaCuentas;