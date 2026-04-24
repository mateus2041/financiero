import React, { useState } from "react";
import { Link } from "react-router-dom"; // ✅ FALTABA
import "../styles/recuperar.css";

function RecuperarPassword() {
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setMensaje("❌ Por favor ingresa tu correo electrónico.");
      setSubmitted(false);
      return;
    }

    // Simulación de envío de correo
    setMensaje("");
    setSubmitted(true);

    console.log("Se envió correo de recuperación a:", email);
  };

  return (
    <div className="recuperar-container">
      <h2 className="titulo">Recuperar Contraseña</h2>
      <p className="subtitulo">
        Ingresa tu correo electrónico para restablecer tu contraseña.
      </p>

      <form className="formulario" onSubmit={handleSubmit}>
        <label htmlFor="email">Correo electrónico</label>

        <div className="input-box">
          <span className="icon">📧</span>
          <input
            type="email"
            id="email"
            placeholder="tu-correo@ejemplo.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setMensaje(""); // ✅ limpia error al escribir
            }}
            required
          />
        </div>

        {mensaje && <p className="mensaje-error">{mensaje}</p>}

        {submitted && (
          <p className="mensaje-exito">
            ✔️ Correo de recuperación enviado
          </p>
        )}

        <button type="submit" className="btn">
          {submitted ? "Enviado" : "Enviar correo"}
        </button>

        <p className="texto-sec">
          ¿Ya recuperaste tu contraseña?{" "}
          <Link to="/login">Inicia sesión aquí</Link>
        </p>
      </form>
    </div>
  );
}

export default RecuperarPassword;