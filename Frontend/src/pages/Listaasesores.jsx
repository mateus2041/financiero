import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/listaasesores.css";

function ListaAsesores() {
  const [asesores, setAsesores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [cambiandoEstadoId, setCambiandoEstadoId] = useState(null);
  const [nuevoCodigoAsesor, setNuevoCodigoAsesor] = useState("");
  const [creandoAsesor, setCreandoAsesor] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    cargarAsesores();
  }, []);

  const cargarAsesores = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error(
          "No hay sesión activa. Inicia sesión como administrador."
        );
      }

      const respuesta = await fetch(
        "http://localhost:8000/administradores/asesores",
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
          datos.detail || "No se pudieron cargar los asesores"
        );
      }

      setAsesores(datos.asesores || []);
      setError("");
    } catch (error) {
      console.error("Error al cargar asesores:", error);
      setAsesores([]);
      setError(error.message || "No se pudieron cargar los asesores");
    } finally {
      setCargando(false);
    }
  };

  const cambiarEstadoAsesor = async (asesor, nuevoEstado) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error(
          "No hay sesión activa. Inicia sesión como administrador."
        );
      }

      const idAsesor = asesor.id_asesor ?? asesor.id_usuario;

      setCambiandoEstadoId(idAsesor);

      const respuesta = await fetch(
        `http://localhost:8000/administradores/asesores/${idAsesor}/estado`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            estado: nuevoEstado,
          }),
        }
      );

      const datos = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          datos.detail || "No se pudo cambiar el estado del asesor"
        );
      }

      setAsesores((prev) =>
        prev.map((item) => {
          const idItem = item.id_asesor ?? item.id_usuario;

          return idItem === idAsesor
            ? { ...item, estado: nuevoEstado }
            : item;
        })
      );

      setError("");
    } catch (error) {
      console.error("Error al cambiar el estado del asesor:", error);

      setError(
        error.message || "No se pudo cambiar el estado del asesor"
      );
    } finally {
      setCambiandoEstadoId(null);
    }
  };

  const registrarAsesor = async (event) => {
    event.preventDefault();

    const codigo = nuevoCodigoAsesor.trim();

    if (!codigo) {
      setError("Ingrese el código del asesor.");
      setMensajeExito("");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error(
          "No hay sesión activa. Inicia sesión como administrador."
        );
      }

      setCreandoAsesor(true);
      setError("");
      setMensajeExito("");

      const respuesta = await fetch(
        "http://localhost:8000/administradores/asesores",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ codigo_asesor: codigo }),
        }
      );

      const datos = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          datos.detail || "No se pudo registrar el asesor"
        );
      }

      setNuevoCodigoAsesor("");
      setMensajeExito(
        datos.mensaje || "Asesor registrado correctamente."
      );
      await cargarAsesores();
    } catch (error) {
      console.error("Error al registrar asesor:", error);
      setError(error.message || "No se pudo registrar el asesor");
    } finally {
      setCreandoAsesor(false);
    }
  };

  const seleccionarAsesor = (asesor) => {
    console.log("Asesor seleccionado:", asesor);

    // Aquí puedes agregar después la navegación
    // navigate(`/asesor/${asesor.id_asesor}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("documento");
    localStorage.removeItem("usuario_id");

    navigate("/login");
  };

  return (
    <div className="asesor-container">

      <div className="panel-financiero">

        <aside className="sidebar">

          <ul>

            <li>
              <Link to="/Administradores">
                📜 principal
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

        <div className="panel-contenido">

          <div className="asesor-panel">

            <h1>Asesores Bancarios</h1>

            <form className="asesor-formulario" onSubmit={registrarAsesor}>
              <div className="asesor-form-header">
                <h2>Registrar nuevo asesor</h2>
              </div>

              <div className="asesor-input-grupo">
                <label htmlFor="codigo-asesor">Código del asesor</label>
                <input
                  id="codigo-asesor"
                  type="text"
                  value={nuevoCodigoAsesor}
                  onChange={(event) =>
                    setNuevoCodigoAsesor(event.target.value)
                  }
                  placeholder="Ej: ASESOR-001"
                  maxLength={30}
                />
              </div>

              <button
                type="submit"
                className="asesor-boton-guardar"
                disabled={creandoAsesor}
              >
                {creandoAsesor ? "Guardando..." : "Agregar asesor"}
              </button>

              {mensajeExito && (
                <p className="asesor-mensaje-exito">{mensajeExito}</p>
              )}
            </form>

            {cargando ? (
              <p className="asesor-cargando">
                Cargando asesores...
              </p>
            ) : error ? (
              <p className="asesor-sin-resultados">
                {error}
              </p>
            ) : asesores.length === 0 ? (
              <p className="asesor-sin-resultados">
                No hay asesores registrados.
              </p>
            ) : (
              <div className="asesores-lista">

                {asesores.map((asesor) => {
                  const idAsesor =
                    asesor.id_asesor ?? asesor.id_usuario;

                  return (
                    <div
                      className="asesor-resultado"
                      key={idAsesor}
                    >

                      <div>
                        <h2>
                          {asesor.nombre}
                        </h2>

                        <p>
                          <strong>Documento:</strong>{" "}
                          {asesor.documento}
                        </p>

                        <p>
                          <strong>Correo:</strong>{" "}
                          {asesor.email}
                        </p>

                        <p>
                          <strong>Código:</strong>{" "}
                          {asesor.codigo_asesor}
                        </p>

                        <p>
                          <strong>Especialidad:</strong>{" "}
                          {asesor.especialidad}
                        </p>

                        <p>
                          <strong>Estado:</strong>{" "}
                          {asesor.estado}
                        </p>
                      </div>

                      <div className="asesor-acciones">

                        <button
                          type="button"
                          onClick={() => seleccionarAsesor(asesor)}
                        >
                          Ver asesor
                        </button>

                        {asesor.estado === "activo" ? (

                          <button
                            type="button"
                            className="asesor-boton-desactivar"
                            onClick={() =>
                              cambiarEstadoAsesor(
                                asesor,
                                "inactivo"
                              )
                            }
                            disabled={
                              cambiandoEstadoId === idAsesor
                            }
                          >
                            {cambiandoEstadoId === idAsesor
                              ? "Cambiando..."
                              : "Desactivar"}
                          </button>

                        ) : (

                          <button
                            type="button"
                            className="asesor-boton-activar"
                            onClick={() =>
                              cambiarEstadoAsesor(
                                asesor,
                                "activo"
                              )
                            }
                            disabled={
                              cambiandoEstadoId === idAsesor
                            }
                          >
                            {cambiandoEstadoId === idAsesor
                              ? "Cambiando..."
                              : "Activar"}
                          </button>

                        )}

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

export default ListaAsesores;