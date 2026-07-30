import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

function Login() {
  const navigate = useNavigate();

  const [documento, setDocumento] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPass, setMostrarPass] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [intentos, setIntentos] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);

  const irRegistro = () => {
    navigate("/registro");
  };

  const irRecuperar = () => {
    navigate("/recuperar");
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();

    if (bloqueado) {
      setMensaje("Has superado los 3 intentos. Espera 30 segundos.");
      return;
    }

    if (!documento || !password) {
      setMensaje("Completa todos los campos");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documento,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const nuevosIntentos = intentos + 1;
        setIntentos(nuevosIntentos);

        if (nuevosIntentos >= 3) {
          setBloqueado(true);
          setMensaje(
            "❌ Has agotado los 3 intentos. Intenta nuevamente en 30 segundos."
          );

          setTimeout(() => {
            setBloqueado(false);
            setIntentos(0);
            setMensaje("");
          }, 30000);
        } else {
          setMensaje(
            `❌ ${data.detail} (Intento ${nuevosIntentos} de 3)`
          );
        }

        return;
      }

      // Login exitoso
      setIntentos(0);
      setMensaje("✅ Login exitoso");

      localStorage.setItem("token", data.token);
      localStorage.setItem("documento", documento);
      localStorage.setItem("usuario_id", data.id);

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
        <h1>Inicio de Sesión</h1>

        <label>Documento</label>
        <div className="input-icon">
          <input
            type="text"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            disabled={bloqueado}
          />
        </div>

        <label>Contraseña</label>
        <div className="input-icon">
          <input
            type={mostrarPass ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={bloqueado}
          />

          <button
            type="button"
            className="eye-btn"
            onClick={() => setMostrarPass(!mostrarPass)}
            disabled={bloqueado}
          >
            {mostrarPass ? "🙈" : "👁️"}
          </button>
        </div>

        {mensaje && (
          <p
            style={{
              color: mensaje.includes("Login exitoso")
                ? "green"
                : "#ff4c4c",
              fontWeight: "bold",
              marginTop: "10px",
            }}
          >
            {mensaje}
          </p>
        )}

        <button
          type="submit"
          className="btn"
          disabled={bloqueado}
        >
          {bloqueado ? "Bloqueado" : "Acceder"}
        </button>

        <p className="login">
          ¿No tienes cuenta?{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              irRegistro();
            }}
          >
            Regístrate aquí
          </a>
        </p>

        <p className="login">
          ¿Olvidaste tu contraseña?{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              irRecuperar();
            }}
          >
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