import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

function Login() {
  const navigate = useNavigate();

  const [documento, setDocumento] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPass, setMostrarPass] = useState(false);

  const irRegistro = () => {
    navigate("/registro");
  };

  const irRecuperar = () => {
    navigate("/recuperar");
  };

  const manejarSubmit = (e) => {
    e.preventDefault();

    if (!documento || !password) {
      alert("Completa todos los campos");
      return;
    }

    console.log({ documento, password });

    navigate("/cuenta");
  };

  return (
    <div className="container">
      <form className="form-box" onSubmit={manejarSubmit}>
        <h1>Inicio</h1>

        {/* DOCUMENTO */}
        <label>Documento</label>
        <div className="input-icon">
          <input
            type="text"
            placeholder="XXX.XXX.XXX"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
          />
        </div>

        {/* PASSWORD */}
        <label>Contraseña</label>
        <div className="input-icon">
          <input
            type={mostrarPass ? "text" : "password"}
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            className="eye-btn"
            onClick={() => setMostrarPass(!mostrarPass)}
          >
            {mostrarPass ? "🙈" : "👁️"}
          </button>
        </div>

        {/* BOTÓN */}
        <button type="submit" className="btn">
          Iniciar sesión
        </button>

        {/* LINKS */}
        <p className="login">
          ¿No tienes cuenta?{" "}
          <a href="#" onClick={irRegistro}>
            Regístrate aquí
          </a>
        </p>

        <p className="login">
          ¿Olvidaste tu contraseña?{" "}
          <a href="#" onClick={irRecuperar}>
            Recupérala aquí
          </a>
        </p>
      </form>
    </div>
  );
}

export default Login;