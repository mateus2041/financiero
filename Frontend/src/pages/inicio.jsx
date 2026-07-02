import React from "react";
import { Link } from "react-router-dom";
import "../styles/inicio.css";
import logo from "../assets/images/logo.jpeg";

function Home() {
  return (
    <div className="container">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo-text">
          Financiero
        </div>

        <ul className="menu">
          <li>Cuentas</li>
          <li>Certificado</li>
          <li>Bre-Be</li>

          <li>
            <Link to="/login">
              <button className="btn-login">
                Inicio
              </button>
            </Link>
          </li>

          <li>
            <Link to="/registro">
              <button className="btn-registro">
                Registro
              </button>
            </Link>
          </li>
        </ul>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-text">
          <h1>Compromiso Financiero</h1>

          <p>
            Somos una compañía financiera nueva que está transformando lo ya
            existente en algo diferente. Comprender los problemas actuales de
            los usuarios y empresas es crucial para construir un servicio más
            robusto y confiable.
          </p>

          <button className="btn">
            COME MEET US
          </button>
        </div>

        <div className="hero-img">
          <div className="circle">
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

      {/* GARANTÍAS */}
      <section className="garantias">
        <h2>Las Garantías De Nuestro Compromiso Financiero</h2>

        <div className="cards">
          <div className="card">
            <div className="icon">💲</div>
            <div>
              <h3>Seguridad del dinero</h3>
              <p>El dinero quedará asegurado en todo momento.</p>
            </div>
          </div>

          <div className="card">
            <div className="icon">🔒</div>
            <div>
              <h3>Seguridad al iniciar sesión</h3>
              <p>Tendrás garantía total de la seguridad de tu acceso.</p>
            </div>
          </div>

          <div className="card">
            <div className="icon">🔁</div>
            <div>
              <h3>Transferencias</h3>
              <p>Transferencias seguras entre bancos, rápidas y confiables.</p>
            </div>
          </div>

          <div className="card">
            <div className="icon">⟳</div>
            <div>
              <h3>Actualización de movimientos</h3>
              <p>Actualización en tiempo real del historial.</p>
            </div>
          </div>

          <div className="card">
            <div className="icon">🚫</div>
            <div>
              <h3>Bloqueo rápido y seguro</h3>
              <p>Bloqueo eficiente en caso de robo o fraude.</p>
            </div>
          </div>

          <div className="card">
            <div className="icon">📄</div>
            <div>
              <h3>Certificado bancario</h3>
              <p>Documento oficial que certifica tu cuenta bancaria.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;