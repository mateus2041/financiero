import React from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Lock,
  RefreshCw,
  Ban,
  FileText,
  ArrowLeftRight,
} from "lucide-react";

import "../styles/inicio.css";
import logo from "../assets/logo.jpeg";

function Inicio() {
  const cards = [
    {
      icon: <Shield size={35} color="#3ddc84" />,
      title: "Seguridad del dinero",
      desc: "El dinero queda asegurado en todo momento.",
    },
    {
      icon: <Lock size={35} color="#f7b733" />,
      title: "Seguridad al iniciar sesión",
      desc: "Garantía total de seguridad en tu acceso.",
    },
    {
      icon: <ArrowLeftRight size={35} color="#6ea8fe" />,
      title: "Transferencias",
      desc: "Transferencias rápidas y seguras.",
    },
    {
      icon: <RefreshCw size={35} color="#ffffff" />,
      title: "Actualización de movimientos",
      desc: "Historial actualizado en tiempo real.",
    },
    {
      icon: <Ban size={35} color="#ff5a5f" />,
      title: "Bloqueo rápido y seguro",
      desc: "Protección ante actividades sospechosas.",
    },
    {
      icon: <FileText size={35} color="#d1c4e9" />,
      title: "Certificado bancario",
      desc: "Documento oficial de tu cuenta.",
    },
  ];

  return (
    <div className="container">

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">Financiero</div>

        <ul className="menu">
          <li>Cuenta</li>
          <li>Certificado</li>
          <li>Pre-Be</li>

          <li>
            <Link to="/" className="btn-nav">
              Inicio
            </Link>
          </li>

          <li>
            <Link to="/registro" className="btn-nav">
              Registrate
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

          <Link to="/registro">
            <button className="btn">
              Registrate
            </button>
          </Link>
        </div>

        <div className="hero-img">
          <img
            src={logo}
            alt="Logo Financiero"
            className="circle-image"
          />
        </div>
      </section>

      {/* GARANTÍAS */}
      <section className="garantias">
        <h2>
          Las Garantías De Nuestro Compromiso Financiero
        </h2>

        <div className="cards">
          {cards.map((item, index) => (
            <div key={index} className="card">

              <div className="icon-container">
                {item.icon}
              </div>

              <div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>

            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <p>
          © {new Date().getFullYear()} Financiero — Todos los derechos reservados
        </p>
      </footer>

    </div>
  );
}

export default Inicio;