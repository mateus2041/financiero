import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/ajustes.css";

function Ajustes() {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("http://127.0.0.1:8000/usuario", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setUsuario(data))
      .catch((err) => console.error(err));
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  if (!usuario) {
    return <h2>Cargando...</h2>;
  }

  return (
    <div className="ajustes-container">
      <h1 className="titulo">Mi Cuenta</h1>

      <section className="bloque">
        <h2>Información de la Cuenta</h2>

        <div className="item">
          <span>Nombre:</span>
          <strong>{usuario.nombre}</strong>
        </div>

        <div className="item">
          <span>Correo:</span>
          <strong>{usuario.correo}</strong>
        </div>

        <div className="item">
          <span>Número de Cuenta:</span>
          <strong>{usuario.numero_cuenta}</strong>
        </div>

        <div className="item">
          <span>Saldo:</span>
          <strong>
            ${Number(usuario.saldo).toLocaleString()}
          </strong>
        </div>
      </section>

      <section className="bloque">
        <h2>Seguridad</h2>

        <button
          className="btn"
          onClick={() => window.location.href = "/cambiar-password"}
        >
          Cambiar Contraseña
        </button>

        <button
          className="btn danger"
          onClick={() => window.location.href = "/bloquear-cuenta"}
        >
          Bloqueo Rápido
        </button>
      </section>

      <section className="bloque">
        <h2>Documentos</h2>

        <button
          className="btn"
          onClick={() => window.location.href = "/certificado"}
        >
          Descargar Certificado Bancario
        </button>
      </section>

      <section className="bloque">
        <button
          className="btn danger"
          onClick={cerrarSesion}
        >
          Cerrar Sesión
        </button>
      </section>
    </div>
  );
}

export default Ajustes;
