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

      setMensaje("Login exitoso ✅");

      localStorage.setItem("token", data.token);
      localStorage.setItem("documento", documento);

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

        {/* Mensaje de error o éxito */}
        {mensaje && (
          <p
            id="mensajeError"
            style={{
              color: mensaje.includes("exitoso") ? "green" : "#ff4c4c",
              fontWeight: "bold",
              marginTop: "10px"
            }}
          >
            {mensaje}
          </p>
        )}

        <button type="submit" className="btn">
          Acceder
        </button>

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

        <div className="footer">
          <p>
            © {new Date().getFullYear()} Financiero. Todos los derechos
            reservados.
          </p>
        </div>
      </form>
    </div>
  );
}

export default Login;