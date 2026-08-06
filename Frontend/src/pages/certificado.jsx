import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import html2pdf from "html2pdf.js";
import "../styles/Certificado.css";

const CertificadoBancario = () => {
  const navigate = useNavigate();
  const certificadoRef = useRef(null);

  const [usuario, setUsuario] = useState({
    nombre: "",
    documento: "",
    cuenta: "",
    tipoCuenta: "Ahorros",
    saldo: "0",
  });

  // 🔥 Obtener datos desde la base de datos
  useEffect(() => {
    const documentoGuardado = localStorage.getItem("documento");

    if (!documentoGuardado) {
      navigate("/inicio");
      return;
    }

    const obtenerUsuario = async () => {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/usuario-documento/${documentoGuardado}`
        );

        if (!response.ok) {
          throw new Error("No se pudo obtener usuario");
        }

        const data = await response.json();

        setUsuario({
          nombre: data.nombre || "Usuario",
          documento: data.documento || documentoGuardado,
          cuenta: data.numero_cuenta || "9800456721",
          tipoCuenta: data.tipo_cuenta || "Ahorros",
          saldo: data.saldo
            ? `$${Number(data.saldo).toLocaleString("es-CO")} COP`
            : "$0 COP",
        });
      } catch (error) {
        console.error("Error al obtener usuario:", error);

        setUsuario({
          nombre: "Usuario",
          documento: documentoGuardado,
          cuenta: "9800456721",
          tipoCuenta: "Ahorros",
          saldo: "$0 COP",
        });
      }
    };

    obtenerUsuario();
  }, [navigate]);

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
      margin: [0.3, 0.3, 0.3, 0.3],
      filename: `Certificado_${usuario.documento}.pdf`,
      image: {
        type: "jpeg",
        quality: 1,
      },
      html2canvas: {
        scale: 2,
        useCORS: true,
        scrollY: 0,
      },
      jsPDF: {
        unit: "in",
        format: "letter",
        orientation: "portrait",
      },
      pagebreak: {
        mode: ["avoid-all", "css", "legacy"],
      },
    };

    html2pdf().set(opciones).from(certificadoRef.current).save();
  };

  // 🔥 Fecha actual
  const fechaActual = new Date().toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="panel-financiero">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <ul>
          <li>
            <Link to="/cuenta">💷 Cuenta</Link>
          </li>

          <li>
            <Link to="#">📜 Historial Monetario</Link>
          </li>

          <li>
            <Link to="/transferencias">💳 Transferencias</Link>
          </li>

          <li>
            <Link to="/certificado" className="active">
              📄 Certificado Bancario
            </Link>
          </li>

          <li>
            <Link to="#">⚙️ Ajustes</Link>
          </li>
        </ul>

        <button className="logout" onClick={handleLogout}>
          🚪 Cerrar sesión
        </button>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="main">
        <header className="main-header">
          <h1>Certificado Bancario</h1>
        </header>

        <div className="certificado-page">
          <div className="certificado-real" ref={certificadoRef}>
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
            <h2 className="titulo-certificado">HACE CONSTAR:</h2>

            {/* DATOS PRINCIPALES */}
            <div className="cliente-info">
              <p>Que el(la) cliente(s)</p><div className="cliente-line">
                <span className="nombre-cliente">{usuario.nombre}</span>
                <span>Identificado con</span>
                <span className="documento-cliente">
                  CC {usuario.documento}
                </span>
              </div>

              <p>
                Actualmente tiene el producto Cuenta Ahorros radicado en nuestra
                entidad financiera con las siguientes características:
              </p>
            </div>

            {/* TABLA DE DATOS */}
            <div className="tabla-datos">
              <h3>Cuenta Ahorro</h3>

              <div className="fila">
                <strong>Número:</strong>
                <span>{usuario.cuenta}</span>
              </div>

              <div className="fila">
                <strong>Fecha de apertura:</strong>
                <span>{fechaActual}</span>
              </div>
            </div>

            {/* TEXTO FINAL */}
            <div className="texto-final">
              <p>
                Esta constancia se expide con destino a {usuario.nombre},
                realizada en el Canal Digital de la ciudad de Bogotá, el día{" "}
                {fechaActual}.
              </p>

              <p className="cordialmente">Cordialmente</p>

              <div className="certificado-footer">
                <p>Firma autorizada</p>
                <p>financiera</p>
              </div>
            </div>
          </div>
        </div>

        {/* BOTÓN PDF */}
        <div className="pdf-btn-container">
          <button className="descargar-btn" onClick={descargarPDF}>
            📥 Descargar Certificado en PDF
          </button>
        </div>
      </main>
    </div>
  );
};

export default CertificadoBancario;