import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import AsistenteMovil from "../components/AsistenteMovil";
import FinancialSidebar from "../components/FinancialSidebar";
import AssistantModal from "../components/AssistantModal";
import useResponsiveMenu from "../hooks/useResponsiveMenu";
import useModalDismissal from "../hooks/useModalDismissal";
import "../styles/Certificado.css";
import "../styles/navegacionMovil.css";

const obtenerFechaLocal = () => {
  const fecha = new Date();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
};

const formatearFecha = (fecha) => {
  if (!fecha) return "";

  return new Date(`${fecha}T12:00:00`).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const CertificadoBancario = () => {
  const navigate = useNavigate();
  const certificadoRef = useRef(null);

  // Estado para abrir/cerrar el menú Otros
  const [menuAbierto, setMenuAbierto] = useResponsiveMenu();
  const [asistenteAbierto, setAsistenteAbierto] = useState(false);
  const [edicionAbierta, setEdicionAbierta] = useState(false);

  const [usuario, setUsuario] = useState({
    nombre: "",
    documento: "",
    cuenta: "",
    tipoCuenta: "Ahorros",
    saldo: "0",
    fechaApertura: obtenerFechaLocal(),
    destinatario: "",
    ciudad: "Bogotá",
    fechaExpedicion: obtenerFechaLocal(),
  });
  const [numeroCuentaConsultada, setNumeroCuentaConsultada] = useState("");
  const [tipoCuentaConsultada, setTipoCuentaConsultada] = useState("");
  const [cargandoCuentas, setCargandoCuentas] = useState(true);
  const [errorCuentas, setErrorCuentas] = useState("");
  const [borradorCertificado, setBorradorCertificado] = useState(usuario);

  useModalDismissal(asistenteAbierto, setAsistenteAbierto);
  useModalDismissal(edicionAbierta, setEdicionAbierta);

  // 🔥 Obtener datos desde la base de datos
  useEffect(() => {
    const documentoGuardado = localStorage.getItem("documento");
    const token = localStorage.getItem("token");

    if (!documentoGuardado || !token) {
      navigate("/inicio");
      return;
    }

    const obtenerUsuario = async () => {
      try {
        const response = await axios.get("/usuario", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = response.data;
        const tipoCuenta = data.tipo_cuenta
          ? data.tipo_cuenta.toLowerCase()
          : "ahorros";
        setUsuario({
          nombre: data.nombre || "Usuario",
          documento: data.documento || documentoGuardado,
          cuenta: "",
          tipoCuenta:
            tipoCuenta === "corriente" ? "Corriente" : "Ahorros",
          saldo: data.saldo
            ? `$${Number(data.saldo).toLocaleString("es-CO")} COP`
            : "$0 COP",
          fechaApertura: data.fecha_apertura
            ? String(data.fecha_apertura).slice(0, 10)
            : obtenerFechaLocal(),
          destinatario: data.nombre || "Usuario",
          ciudad: "Bogotá",
          fechaExpedicion: obtenerFechaLocal(),
        });
      } catch (error) {
        console.error("Error al obtener usuario:", error);

        setUsuario({
          nombre: "Usuario",
          documento: documentoGuardado,
          cuenta: "",
          tipoCuenta: "Ahorros",
          saldo: "$0 COP",
          fechaApertura: obtenerFechaLocal(),
          destinatario: "Usuario",
          ciudad: "Bogotá",
          fechaExpedicion: obtenerFechaLocal(),
        });
      }
    };

    void obtenerUsuario();
  }, [navigate]);

  const tipoCuentaSeleccionado = (
    edicionAbierta ? borradorCertificado.tipoCuenta : usuario.tipoCuenta
  ).toLowerCase();

  useEffect(() => {
    let consultaCancelada = false;

    const obtenerNumeroCuenta = async () => {
      setCargandoCuentas(true);
      setErrorCuentas("");
      setNumeroCuentaConsultada("");
      setTipoCuentaConsultada("");

      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No hay una sesión activa.");

        const response = await fetch(
          "http://127.0.0.1:8000/cuentas/saldos",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            data.detail || "No se pudo consultar el número de cuenta."
          );
        }

        const campoNumero =
          tipoCuentaSeleccionado === "corriente"
            ? "cuenta_corriente_numero"
            : "cuenta_ahorro_numero";
        const numeroCuenta = data[campoNumero]
          ? String(data[campoNumero]).trim()
          : "";

        if (!numeroCuenta) {
          throw new Error(
            `No tienes una cuenta ${tipoCuentaSeleccionado} activa en la base de datos.`
          );
        }

        if (consultaCancelada) return;

        setNumeroCuentaConsultada(numeroCuenta);
        setTipoCuentaConsultada(tipoCuentaSeleccionado);

        if (edicionAbierta) {
          setBorradorCertificado((actual) => ({
            ...actual,
            cuenta: numeroCuenta,
          }));
        } else {
          setUsuario((actual) => ({
            ...actual,
            cuenta: numeroCuenta,
          }));
        }
      } catch (error) {
        if (consultaCancelada) return;
        console.error("Error al consultar el número de cuenta:", error);
        setErrorCuentas(error.message);
      } finally {
        if (!consultaCancelada) setCargandoCuentas(false);
      }
    };

    void obtenerNumeroCuenta();

    return () => {
      consultaCancelada = true;
    };
  }, [edicionAbierta, tipoCuentaSeleccionado, usuario.documento]);

  // 🔥 Bloquear botón atrás
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);

    const bloquear = () => {
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", bloquear);

    return () => {
      window.removeEventListener("popstate", bloquear);
    };
  }, []);

  // 🔥 Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("documento");
    navigate("/inicio");
  };

  // 🔥 Descargar PDF
  const descargarPDF = () => {
    if (!certificadoRef.current) return;

    const opciones = {
      margin: 0.25,
      filename: `Certificado_${usuario.documento}.pdf`,
      image: {
        type: "jpeg",
        quality: 1,
      },
      html2canvas: {
        scale: 2,
        useCORS: true,
        scrollY: 0,
        backgroundColor: "#ffffff",
      },
      jsPDF: {
        unit: "in",
        format: "letter",
        orientation: "portrait",
      },
      pagebreak: {
        mode: ["css"],
      },
    };

    html2pdf().set(opciones).from(certificadoRef.current).save();
  };

  const abrirEdicion = () => {
    setBorradorCertificado({ ...usuario });
    setEdicionAbierta(true);
  };

  const guardarCertificado = (event) => {
    event.preventDefault();
    setUsuario({
      ...borradorCertificado,
      cuenta: numeroCuentaConsultada,
      nombre: borradorCertificado.nombre.trim(),
      documento: borradorCertificado.documento.trim(),
      destinatario: borradorCertificado.destinatario.trim(),
      ciudad: borradorCertificado.ciudad.trim(),
    });
    setEdicionAbierta(false);
  };

  const actualizarBorrador = (event) => {
    const { name, value } = event.target;
    setBorradorCertificado((actual) => {
      if (name === "tipoCuenta") {
        return {
          ...actual,
          tipoCuenta: value,
          cuenta: "",
        };
      }

      return { ...actual, [name]: value };
    });
  };

  const fechaExpedicion = formatearFecha(usuario.fechaExpedicion);

  return (
    <div className="panel-financiero">

      <button
        type="button"
        className={`menu-hamburguesa ${menuAbierto ? "activo" : ""}`}
        onClick={() => setMenuAbierto((actual) => !actual)}
        aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={menuAbierto}
      >
        ☰
      </button>

      <AsistenteMovil onClick={() => setAsistenteAbierto(true)} />

      <FinancialSidebar
        menuAbierto={menuAbierto}
        onLogout={handleLogout}
        onAssistantOpen={() => setAsistenteAbierto(true)}
        accountClassName=""
        reportLabel="📊 Reportes"
        certificateClassName="active"
      />

      {/* CONTENIDO PRINCIPAL */}
      <main className="main">

        <header className="main-header">
          <h1>Certificado Bancario</h1>
        </header>

        <div className="certificado-page">

          <div
            className="certificado-real"
            ref={certificadoRef}
          >

            {/* ENCABEZADO */}
            <div className="certificado-top">

              <div className="logo-section">
                <h1>FINANCIERO</h1>
              </div>

              <div className="empresa-box">
                <p>UNA EMPRESA DEL</p>
                <h3>FINANCIERO</h3>
              </div>

            </div>

            {/* TÍTULO */}
            <h2 className="titulo-certificado">
              HACE CONSTAR:
            </h2>

            {/* DATOS PRINCIPALES */}
            <div className="cliente-info">

              <p>Que el(la) cliente(s)</p>

              <div className="cliente-line">

                <span className="nombre-cliente">
                  {usuario.nombre}
                </span>

                <span>
                  Identificado con
                </span>

                <span className="documento-cliente">
                  CC {usuario.documento}
                </span>

              </div>

              <p>
                Actualmente tiene el producto Cuenta {usuario.tipoCuenta}
                radicado en nuestra entidad financiera con las
                siguientes características:
              </p>

            </div>

            {/* TABLA DE DATOS */}
            <div className="tabla-datos">

              <h3>Cuenta {usuario.tipoCuenta}</h3>

              <div className="fila">

                <strong>Número:</strong>

                <span>
                  {usuario.cuenta}
                </span>

              </div>

              <div className="fila">

                <strong>
                  Fecha de apertura:
                </strong>

                <span>
                  {formatearFecha(usuario.fechaApertura)}
                </span>

              </div>

            </div>

            {/* TEXTO FINAL */}
            <div className="texto-final">

              <p>
                Esta constancia se expide con destino a{" "}
                {usuario.destinatario}, realizada en el Canal Digital
                de la ciudad de {usuario.ciudad}, el día{" "}
                {fechaExpedicion}.
              </p>

              <p className="cordialmente">
                Cordialmente
              </p>

              <div className="certificado-footer">

                <p>
                  Firma autorizada
                </p>

                <p>
                  financiera
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* BOTÓN PDF */}
        <div className="pdf-btn-container">

          <button
            className="volver-btn"
            onClick={() => navigate("/cuenta")}
          >
            Volver
          </button>

          <button
            type="button"
            className="volver-btn"
            onClick={abrirEdicion}
          >
            ✏️ Editar certificado
          </button>

          <button
            type="button"
            className="descargar-btn"
            onClick={descargarPDF}
          >
            📥 Descargar Certificado en PDF
          </button>

        </div>

      </main>

      {edicionAbierta && (
        <div
          className="certificado-editar-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEdicionAbierta(false);
          }}
        >
          <form
            className="certificado-editar-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="certificado-editar-titulo"
            onSubmit={guardarCertificado}
          >
            <div className="certificado-editar-encabezado">
              <h2 id="certificado-editar-titulo">Editar certificado</h2>
              <button
                type="button"
                className="certificado-editar-cerrar"
                aria-label="Cerrar edición"
                onClick={() => setEdicionAbierta(false)}
              >
                ×
              </button>
            </div>

            <div className="certificado-editar-campos">
              <label>
                Nombre del cliente
                <input
                  name="nombre"
                  value={borradorCertificado.nombre}
                  onChange={actualizarBorrador}
                  required
                />
              </label>

              <label>
                Documento
                <input
                  name="documento"
                  value={borradorCertificado.documento}
                  onChange={actualizarBorrador}
                  required
                />
              </label>

              <label>
                Tipo de cuenta
                <select
                  name="tipoCuenta"
                  value={borradorCertificado.tipoCuenta}
                  onChange={actualizarBorrador}
                  required
                >
                  <option value="Ahorros">Ahorros</option>
                  <option value="Corriente">Corriente</option>
                </select>
              </label>

              <label>
                Número de cuenta
                <input
                  name="cuenta"
                  type="text"
                  value={
                    tipoCuentaConsultada ===
                    borradorCertificado.tipoCuenta.toLowerCase()
                      ? numeroCuentaConsultada
                      : ""
                  }
                  readOnly
                  required
                />
              </label>

              <label>
                Fecha de apertura
                <input
                  name="fechaApertura"
                  type="date"
                  value={borradorCertificado.fechaApertura}
                  onChange={actualizarBorrador}
                  required
                />
              </label>

              <label>
                Destinatario
                <input
                  name="destinatario"
                  value={borradorCertificado.destinatario}
                  onChange={actualizarBorrador}
                  required
                />
              </label>

              <label>
                Ciudad de expedición
                <input
                  name="ciudad"
                  value={borradorCertificado.ciudad}
                  onChange={actualizarBorrador}
                  required
                />
              </label>

              <label>
                Fecha de expedición
                <input
                  name="fechaExpedicion"
                  type="date"
                  value={borradorCertificado.fechaExpedicion}
                  onChange={actualizarBorrador}
                  required
                />
              </label>
            </div>

            {errorCuentas && (
              <p className="certificado-editar-mensaje" role="alert">
                {errorCuentas}
              </p>
            )}

            {!errorCuentas && cargandoCuentas && (
              <p className="certificado-editar-mensaje" role="status">
                Cargando números de cuenta...
              </p>
            )}

            {!errorCuentas &&
              !cargandoCuentas &&
              tipoCuentaConsultada !==
                borradorCertificado.tipoCuenta.toLowerCase() && (
              <p className="certificado-editar-mensaje" role="status">
                No hay una cuenta activa de tipo{" "}
                {borradorCertificado.tipoCuenta.toLowerCase()} para mostrar.
              </p>
              )}

            <div className="certificado-editar-acciones">
              <button
                type="button"
                className="certificado-editar-cancelar"
                onClick={() => setEdicionAbierta(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="descargar-btn"
                disabled={
                  cargandoCuentas ||
                  Boolean(errorCuentas) ||
                  tipoCuentaConsultada !==
                    borradorCertificado.tipoCuenta.toLowerCase() ||
                  !numeroCuentaConsultada
                }
              >
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
      )}

      {asistenteAbierto && (
        <AssistantModal onClose={() => setAsistenteAbierto(false)} />
      )}

    </div>
  );
};

export default CertificadoBancario;