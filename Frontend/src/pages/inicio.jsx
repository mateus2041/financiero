import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/inicio.css";
import logo from "../assets/images/logo.jpeg";
import Login from "./login";
import Registro from "./registro";

function Home() {
  const [modalActivo, setModalActivo] = useState(null);

  useEffect(() => {
    const cerrarConEscape = (event) => {
      if (event.key === "Escape") {
        setLoginModalOpen(false);
      }
    };

    if (modalActivo) {
      document.addEventListener("keydown", cerrarConEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", cerrarConEscape);
      document.body.style.overflow = "";
    };
  }, [modalActivo]);

  return (
    <div className="home-container">
      {/* NAVBAR */}
      <nav className="home-navbar">
        <div></div>

        <ul className="home-menu">
          <li>Cuentas</li>
          <li>Certificado</li>
          <li>Bre-Be</li>

          <li>
            <button
              className="home-btn-registro"
              type="button"
              onClick={() => setModalActivo("login")}
            >
              Inicio
            </button>
          </li>

          <li>
            <button
              className="home-btn-registro"
              type="button"
              onClick={() => setModalActivo("registro")}
            >
              Registro
            </button>
          </li>
        </ul>
      </nav>

      {/* HERO */}
      <section className="home-hero">
        <div className="home-hero-text">
          <h1 className="home-title">Compromiso Financiero</h1>

          <p>
            Somos una compañía financiera nueva que está transformando lo ya
            existente en algo diferente. Comprender los problemas actuales de
            los usuarios y empresas es crucial para construir un servicio más
            robusto y confiable.
          </p>

          <Link to="/registro">
            <button className="home-btn">
              Regístrate aquí para nuestros servicios
            </button>
          </Link>
        </div>

        <div className="home-hero-img">
          <div className="home-circle">
            <img
              src={logo}
              alt="Logo Financiero"
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          </div>
        </div>
      </section>

      {modalActivo && (
        <div
          className="home-login-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setModalActivo(null);
            }
          }}
        >
          <div
            className={`home-login-modal ${
              modalActivo === "registro" ? "home-register-modal" : ""
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="home-login-modal-title"
          >
            <div className="home-login-modal-header">
              <h2 id="home-login-modal-title">
                {modalActivo === "registro" ? "Registro" : "Inicio de sesión"}
              </h2>
              <button
                className="home-login-modal-close"
                type="button"
                aria-label="Cerrar inicio de sesión"
                onClick={() => setModalActivo(null)}
              >
                ×
              </button>
            </div>
            {modalActivo === "registro" ? (
              <Registro isModal />
            ) : (
              <Login isModal />
            )}
          </div>
        </div>
      )}

      {/* GARANTÍAS */}
      <section className="home-garantias">
        <h2>Las Garantías de Nuestro Compromiso Financiero</h2>

        <div className="home-cards">
          <div className="home-card">
            <div className="home-icon">💲</div>
            <div>
              <h3>Seguridad del dinero</h3>
              <p>El dinero quedará asegurado en todo momento.</p>
            </div>
          </div>

          <div className="home-card">
            <div className="home-icon">🔒</div>
            <div>
              <h3>Seguridad al iniciar sesión</h3>
              <p>Tendrás garantía total de la seguridad de tu acceso.</p>
            </div>
          </div>

          <div className="home-card">
            <div className="home-icon">🔁</div>
            <div>
              <h3>Transferencias</h3>
              <p>Transferencias seguras entre bancos, rápidas y confiables.</p>
            </div>
          </div>

          <div className="home-card">
            <div className="home-icon">⟳</div>
            <div>
              <h3>Actualización de movimientos</h3>
              <p>Actualización en tiempo real del historial.</p>
            </div>
          </div>

          <div className="home-card">
            <div className="home-icon">🚫</div>
            <div>
              <h3>Bloqueo rápido y seguro</h3>
              <p>Bloqueo eficiente en caso de robo o fraude.</p>
            </div>
          </div>

          <div className="home-card">
            <div className="home-icon">📄</div>
            <div>
              <h3>Certificado bancario</h3>
              <p>Documento oficial que certifica tu cuenta bancaria.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="home-footer">
        <p className="footer-text">
          © {new Date().getFullYear()} Financiero. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}

export default Home;