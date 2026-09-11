import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/listaasesores.css";

function ListaAsesores() {
  const [asesores, setAsesores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [formulario, setFormulario] = useState({
    nombre: "",
    documento: "",
    tipo_documento: "",
    cargo: "Asesor",
  });
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    cargarAsesores();
  }, []);

  const cargarAsesores = async () => {
    try {
      setError("");
      const token = localStorage.getItem("token");

      const respuesta = await fetch("http://localhost:8000/administradores/asesores", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!respuesta.ok) {
        throw new Error("No se pudieron cargar los asesores");
      }

      const datos = await respuesta.json();

      setAsesores(datos.asesores || []);
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "No fue posible cargar los asesores.");
    } finally {
      setCargando(false);
    }
  };

  const eliminarAsesor = async (idAsesor) => {
    try {
      setError("");
      setMensaje("");
      const token = localStorage.getItem("token");
      const respuesta = await fetch(
        `http://localhost:8000/administradores/asesores/${idAsesor}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!respuesta.ok) {
        const contenido = await respuesta.text();
        let datos = {};

        try {
          datos = JSON.parse(contenido);
        } catch {
          datos = {};
        }

        throw new Error(datos.detail || "No se pudo eliminar el asesor.");
      }

      const datos = await respuesta.json();
      setAsesores((actuales) =>
        actuales.filter((asesor) => asesor.id_asesor !== idAsesor)
      );
      setMensaje(datos.mensaje || "Asesor eliminado correctamente.");
    } catch (error) {
      setError(error.message || "No fue posible eliminar el asesor.");
    }
  };

  const cambiarFormulario = (evento) => {
    const { name, value } = evento.target;
    setFormulario((actual) => ({ ...actual, [name]: value }));
  };

  const registrarAsesor = async (evento) => {
    evento.preventDefault();
    setError("");
    setMensaje("");
    setGuardando(true);

    try {
      const token = localStorage.getItem("token");
      const respuesta = await fetch("http://localhost:8000/administradores/asesores", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formulario),
      });

      const datos = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(datos.detail || "No se pudo registrar el asesor.");
      }

      setFormulario({
        nombre: "",
        documento: "",
        tipo_documento: "",
        cargo: "Asesor",
      });
      setMensaje(
        `${datos.mensaje || "Asesor registrado correctamente."} Código: ${datos.codigo_asesor}`
      );
      await cargarAsesores();
    } catch (error) {
      setError(error.message || "No fue posible registrar el asesor.");
    } finally {
      setGuardando(false);
    }
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

        <main className="contenido-asesores">
          <h1>Lista de asesores</h1>
          <p className="subtitulo-asesores">Gestión de asesores</p>

          <div className="contenido-lista-asesores">
            <form className="formulario-asesor" onSubmit={registrarAsesor}>
              <h2>Registrar asesor</h2>
              <div className="campos-asesor">
                <label>
                  Nombre
                  <input
                    name="nombre"
                    value={formulario.nombre}
                    onChange={cambiarFormulario}
                    required
                  />
                </label>
                <label>
                  N.° documento
                  <input
                    name="documento"
                    value={formulario.documento}
                    onChange={cambiarFormulario}
                    required
                  />
                </label>
                <label>
                  Tipo de documento
                  <select
                    name="tipo_documento"
                    value={formulario.tipo_documento}
                    onChange={cambiarFormulario}
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
                    value={formulario.cargo}
                    readOnly
                    aria-readonly="true"
                  />
                </label>
                <button type="submit" disabled={guardando}>
                  {guardando ? "Guardando..." : "Registrar asesor"}
                </button>
              </div>
            </form>

            <section className="panel-lista-asesores">
              {error && <p className="mensaje-error">{error}</p>}
              {mensaje && <p className="mensaje-exito">{mensaje}</p>}

              {cargando ? (
                <p className="mensaje-tabla">Cargando asesores...</p>
              ) : asesores.length === 0 ? (
                <p className="mensaje-tabla">No hay asesores registrados.</p>
              ) : (
                <div className="tabla-asesores-contenedor">
                  <table className="tabla-asesores">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>N.° documento</th>
                    <th>Tipo documento</th>
                    <th>Cargo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {asesores.map((asesor) => {
                    const estado = (asesor.estado || "activo").toLowerCase();
                    const estadoTexto = estado === "activo" ? "Activo" : "Inactivo";

                    return (
                      <tr key={asesor.id_asesor}>
                        <td>{asesor.nombre || "Sin nombre"}</td>
                        <td>{asesor.documento || "Sin documento"}</td>
                        <td>{asesor.tipo_documento || "Cédula de ciudadanía"}</td>
                        <td>{asesor.cargo || "Asesor bancario"}</td>
                        <td>
                          <span
                            className={`estado-badge ${estado === "activo" ? "activo" : "inactivo"}`}
                          >
                            {estadoTexto}
                          </span>
                        </td>
                        <td>
                          <button
                            className="boton-eliminar"
                            onClick={() => eliminarAsesor(asesor.id_asesor)}
                            type="button"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </main>

      </div>
    </div>
  );
}

export default ListaAsesores;