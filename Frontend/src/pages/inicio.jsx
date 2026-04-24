import React from "react";
import { Link } from "react-router-dom";
import "../styles/inicio.css";

function Inicio() {
  return (
    <div className="container">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">Financiero</div>
        <ul className="menu">
          <li>Cuenta</li>
          <li>Certificado</li>
          <li>Bre-be</li>
          <li>
            <Link to="/login" className="btn-nav">
              inicio
            </Link>
          </li>

          <li>
            <Link to="/registro" className="btn-nav">
              Registro
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
          <button className="btn">Registrarse</button>
        </div>

        <div className="hero-img">
          <div className="circle"></div>
        </div>
      </section>

      {/* CARDS */}
      <section className="garantias">
        <h2>Las Garantías De Nuestro Compromiso Financiero</h2>

        <div className="cards">
          <div className="card">
            <div className="icon">$</div>
            <div>
              <h3>Seguridad del dinero</h3>
              <p>El dinero quedará asegurado en todo momento.</p>
            </div>
          </div>

          <div className="card">
            <div className="icon">🔒</div>
            <div>
              <h3>Seguridad al iniciar sesión</h3>
              <p>Garantía total de seguridad al acceder a tu cuenta.</p>
            </div>
          </div>

          <div className="card">
            <div className="icon">🔄</div>
            <div>
              <h3>Transferencias</h3>
              <p>Transferencias seguras entre bancos rápidas y confiables.</p>
            </div>
          </div>

          <div className="card">
            <div className="icon">⟳</div>
            <div>
              <h3>Actualización de movimientos</h3>
              <p>Historial actualizado en tiempo real.</p>
            </div>
          </div>

          <div className="card">
            <div className="icon">🚫</div>
            <div>
              <h3>Bloqueo rápido</h3>
              <p>Bloqueo eficiente en caso de robo o actividades sospechosas.</p>
            </div>
          </div>

          <div className="card">
            <div className="icon">📄</div>
            <div>
              <h3>Certificado bancario</h3>
              <p>Documento oficial que confirma la existencia de tu cuenta.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Inicio;