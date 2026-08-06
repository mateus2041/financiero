import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/recuperacion.css";

function Recuperacion() {
  const [correo, setCorreo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const recuperar = async (e) => {
    e.preventDefault();

    setMensaje("");
    setError("");

    try {
      const respuesta = await fetch("http://127.0.0.1:8000/recuperar-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: correo,
        }),
      });

      const data = await respuesta.json();

      if (respuesta.ok) {
        setMensaje("Se envió un enlace de recuperación a tu correo electrónico.");
      } else {
        setError(data.detail || "No fue posible enviar el correo.");
      }
    } catch (err) {
      setError("Error de conexión con el servidor.");
    }
  };

  return (
    <div className="container">
      <div className="form-box">
        <h1>Recuperar contraseña</h1>

        <p>
          Ingresa el correo electrónico con el que registraste tu cuenta y te
          enviaremos un enlace para restablecer tu contraseña.
        </p>

        <form onSubmit={recuperar}>
          <label>Correo electrónico</label>

          <input
            type="email"
            placeholder="Ingresa tu correo"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />

          <button type="submit" className="btn">
            Enviar enlace
          </button>
        </form>

        {mensaje && <p className="message">{mensaje}</p>}

        {error && <p className="error">{error}</p>}

        <div className="back-login">
          <Link to="/login">← Volver al inicio de sesión</Link>
        </div>
      </div>
    </div>
  );
}

export default Recuperacion;