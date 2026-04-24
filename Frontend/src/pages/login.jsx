import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

function Login() {
  const navigate = useNavigate();

  const [documento, setDocumento] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPass, setMostrarPass] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const irRegistro = () => {
    navigate("/registro");
  };

  const irRecuperar = () => {
    navigate("/recuperar");
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();

    if (!documento || !password) {
      setMensaje("Completa todos los campos");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          documento,
          password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setMensaje(data.detail);
        return;
      }

      // ✅ LOGIN OK
      setMensaje("Login exitoso ✅");

      // 🔥 GUARDAR SOLO LO QUE REALMENTE EXISTE
      localStorage.setItem("token", data.token);
      localStorage.setItem("documento", documento);

      // ⚠️ IMPORTANTE: el backend NO devuelve usuario.nombre
      // el nombre se obtiene en cuenta.jsx desde el backend

      setTimeout(() => {
        navigate("/cuenta");
      }, 800);

    } catch (error) {
      console.error(error);
      setMensaje("Error conectando con el servidor");
    }
  };

  return (
    <div className="container">
      <form className="form-box" onSubmit={manejarSubmit}>
        <h1>Inicio</h1>

        <label>Documento</label>
        <div className="input-icon">
          <input
            type="text"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
          />
        </div>

        <label>Contraseña</label>
        <div className="input-icon">
          <input
            type={mostrarPass ? "text" : "password"}
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

        <button type="submit" className="btn">
          Iniciar sesión
        </button>

        {mensaje && (
          <p style={{ marginTop: "10px", color: "green" }}>
            {mensaje}
          </p>
        )}

        <p className="login">
          ¿No tienes cuenta?{" "}
          <a href="#" onClick={irRegistro}>Regístrate aquí</a>
        </p>

        <p className="login">
          ¿Olvidaste tu contraseña?{" "}
          <a href="#" onClick={irRecuperar}>Recupérala aquí</a>
        </p>

      </form>
    </div>
  );
}

export default Login;