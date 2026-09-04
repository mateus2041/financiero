import React, { useState } from "react";
import axios from "axios";
import "../styles/Administradores.css";

const API_URL = "http://localhost:8000";

export default function Administradores() {
  const [idUsuario, setIdUsuario] = useState("");
  const [codigoAsesor, setCodigoAsesor] = useState("");
  const [criterioConsulta, setCriterioConsulta] = useState("");
  const [asesores, setAsesores] = useState([]);
  const [asesorEditando, setAsesorEditando] = useState(null);
  const [idAsesorEditado, setIdAsesorEditado] = useState("");
  const [codigoAsesorEditado, setCodigoAsesorEditado] = useState("");

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [cargandoConsulta, setCargandoConsulta] = useState(false);

  const consultarAsesores = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");
    setCargandoConsulta(true);

    try {
      const token = localStorage.getItem("token");
      const parametro = criterioConsulta.trim();
      const params = /^\d+$/.test(parametro)
        ? { id_usuario: parametro }
        : parametro
          ? { codigo_asesor: parametro }
          : {};
      const respuesta = await axios.get(`${API_URL}/administradores/asesores`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setAsesores(respuesta.data?.asesores || []);
    } catch (err) {
      setAsesores([]);
      setError(err.response?.data?.detail || "No fue posible consultar los asesores.");
    } finally {
      setCargandoConsulta(false);
    }
  };

  const eliminarAsesor = async (id) => {
    setError("");
    setMensaje("");

    try {
      const token = localStorage.getItem("token");
      const respuesta = await axios.delete(`${API_URL}/administradores/asesores/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMensaje(respuesta.data?.mensaje || "Asesor eliminado correctamente.");
      setAsesores((actuales) => actuales.filter((asesor) => asesor.id_usuario !== id));
    } catch (err) {
      setError(err.response?.data?.detail || "No fue posible eliminar el asesor.");
    }
  };

  const iniciarEdicion = (asesor) => {
    setAsesorEditando(asesor.id_asesor);
    setIdAsesorEditado(String(asesor.id_asesor));
    setCodigoAsesorEditado(asesor.codigo_asesor);
    setError("");
    setMensaje("");
  };

  const cancelarEdicion = () => {
    setAsesorEditando(null);
    setIdAsesorEditado("");
    setCodigoAsesorEditado("");
  };

  const actualizarAsesor = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    try {
      const token = localStorage.getItem("token");
      const respuesta = await axios.put(
        `${API_URL}/administradores/asesores/${asesorEditando}`,
        {
          id_asesor: idAsesorEditado.trim(),
          codigo_asesor: codigoAsesorEditado.trim()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMensaje(respuesta.data?.mensaje || "Asesor actualizado correctamente.");
      setAsesores((actuales) => actuales.map((asesor) => (
        asesor.id_asesor === asesorEditando
          ? { ...asesor, id_asesor: Number(idAsesorEditado), codigo_asesor: codigoAsesorEditado.trim() }
          : asesor
      )));
      cancelarEdicion();
    } catch (err) {
      setError(err.response?.data?.detail || "No fue posible actualizar el asesor.");
    }
  };

  const registrarAsesor = async (e) => {
    e.preventDefault();

    setMensaje("");
    setError("");
    setCargando(true);

    try {
      const token = localStorage.getItem("token");

      const respuesta = await axios.post(
        `${API_URL}/administradores/asesores`,
        {
          id_usuario: idUsuario.trim(),
          codigo_asesor: codigoAsesor.trim()
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMensaje(
        respuesta.data?.mensaje ||
        "El asesor bancario fue registrado correctamente."
      );

      setCodigoAsesor("");
  setIdUsuario("");
    } catch (err) {
      console.error("Error al registrar asesor:", err);

      setError(
        err.response?.data?.detail ||
        "No fue posible registrar el asesor."
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="asesor-container">

      {/* =====================================================
          NAVBAR
          ===================================================== */}
      <nav className="asesor-navbar">

        <div className="asesor-logo">
          FINANCIERO
        </div>

        <ul className="asesor-menu">
          <li>Administradores</li>
          <li>Asesores</li>

          <li>
            <button
              className="asesor-btn-salir"
              onClick={() => {
                localStorage.removeItem("token");
                window.location.href = "/login";
              }}
            >
              Cerrar sesión
            </button>
          </li>
        </ul>

      </nav>

      {/* =====================================================
          HERO
          ===================================================== */}
      <section className="asesor-hero">

        <div className="asesor-hero-text">

          <h1 className="asesor-title">
            Registrar código de asesor
          </h1>

          <p className="asesor-description">
            Ingresa el código del asesor para habilitar su registro
            dentro del sistema financiero.
          </p>

        </div>

      </section>

      {/* =====================================================
          PANEL PRINCIPAL
          ===================================================== */}
      <main className="asesor-panel">

        {/* ===================================================
            FORMULARIO
            =================================================== */}
        <div className="asesor-verificacion">

          <div className="asesor-verificacion-cabecera">

            <span className="asesor-verificacion-etiqueta">
              Código de asesor
            </span>

            <span className="asesor-verificacion-ayuda">
              Ingrese únicamente el código
            </span>

          </div>

          <form onSubmit={registrarAsesor}>

            <div className="usuario-dato">
              <span>ID del asesor</span>

              <input
                className="asesor-buscador input"
                type="number"
                name="id_usuario"
                value={idUsuario}
                onChange={(e) => setIdUsuario(e.target.value)}
                placeholder="Ejemplo: 12"
                min="1"
                required
              />
            </div>

            <div className="usuario-dato">
              <span>Código de asesor</span>

              <input
                className="asesor-buscador input"
                type="text"
                name="codigo_asesor"
                value={codigoAsesor}
                onChange={(e) => setCodigoAsesor(e.target.value)}
                placeholder="Escriba cualquier código"
                maxLength={30}
                autoComplete="off"
                required
              />
            </div>

            {/* BOTÓN */}
            <div
              className="cuenta-acciones"
              style={{ marginTop: "20px" }}
            >

              <button
                type="submit"
                className="btn-habilitar"
                disabled={cargando}
              >
                {cargando
                  ? "Registrando..."
                  : "Registrar código"}
              </button>

            </div>

          </form>

        </div>

        <section className="asesor-verificacion">
          <div className="asesor-verificacion-cabecera">
            <span className="asesor-verificacion-etiqueta">Consultar asesor</span>
            <span className="asesor-verificacion-ayuda">Busque por ID o código</span>
          </div>
          <form className="asesor-buscador" onSubmit={consultarAsesores}>
            <input
              type="search"
              value={criterioConsulta}
              onChange={(e) => setCriterioConsulta(e.target.value)}
              placeholder="ID de usuario o código de asesor"
            />
            <button type="submit" disabled={cargandoConsulta}>
              {cargandoConsulta ? "Consultando..." : "Consultar"}
            </button>
          </form>
          {asesores.length > 0 ? (
            <div className="asesores-lista">
              {asesores.map((asesor) => (
                <article className="asesor-resultado" key={asesor.id_asesor}>
                  {asesorEditando === asesor.id_asesor ? (
                    <form className="asesor-edicion" onSubmit={actualizarAsesor}>
                      <strong>{asesor.nombre}</strong>
                      <input
                        type="number"
                        min="1"
                        value={idAsesorEditado}
                        onChange={(e) => setIdAsesorEditado(e.target.value)}
                        placeholder="ID del asesor"
                        required
                      />
                      <input
                        type="text"
                        maxLength={30}
                        value={codigoAsesorEditado}
                        onChange={(e) => setCodigoAsesorEditado(e.target.value)}
                        placeholder="Código de asesor"
                        required
                      />
                      <div className="asesor-edicion-acciones">
                        <button type="submit" className="btn-habilitar">Guardar</button>
                        <button type="button" className="btn-deshabilitar" onClick={cancelarEdicion}>Cancelar</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div>
                        <strong>{asesor.nombre}</strong>
                        <span>ID asesor: {asesor.id_asesor} | ID usuario: {asesor.id_usuario}</span>
                        <span>Código: {asesor.codigo_asesor}</span>
                        <span>{asesor.email} | Estado: {asesor.estado}</span>
                      </div>
                      <div className="asesor-resultado-acciones">
                        <button type="button" className="btn-habilitar" onClick={() => iniciarEdicion(asesor)}>Editar</button>
                        <button type="button" className="btn-deshabilitar" onClick={() => eliminarAsesor(asesor.id_usuario)}>Eliminar</button>
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          ) : criterioConsulta.trim() && !cargandoConsulta ? (
            <p className="asesor-sin-resultados">No se encontraron asesores.</p>
          ) : null}
        </section>

        {/* ===================================================
            MENSAJE
            =================================================== */}
        {mensaje && (
          <div className="asesor-mensaje">
            {mensaje}
          </div>
        )}

        {/* ===================================================
            ERROR
            =================================================== */}
        {error && (
          <div className="asesor-error">
            {error}
          </div>
        )}

      </main>

    </div>
  );
}