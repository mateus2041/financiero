import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/recuperar.css";

import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";

function RecuperarPassword() {
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setMensaje("❌ Por favor ingresa tu correo electrónico.");
      setSubmitted(false);
      return;
    }

    try {
      // ✅ Enviar correo real
      await sendPasswordResetEmail(auth, email);

      setMensaje("");
      setSubmitted(true);

      console.log("Correo enviado a:", email);

    } catch (error) {
      console.error(error);

      switch (error.code) {
        case "auth/user-not-found":
          setMensaje("❌ No existe una cuenta con ese correo.");
          break;

        case "auth/invalid-email":
          setMensaje("❌ Correo electrónico inválido.");
          break;

        default:
          setMensaje("❌ Error al enviar el correo.");
      }

      setSubmitted(false);
    }
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
              setMensaje("");
            }}
            required
          />
        </div>

        {mensaje && (
          <p className="mensaje-error">{mensaje}</p>
        )}

        {submitted && (
          <p className="mensaje-exito">
            ✔️ Correo de recuperación enviado correctamente
          </p>
        )}

        <button type="submit" className="btn">
          {submitted ? "Enviado" : "Enviar correo"}
        </button>

        <p className="texto-sec">
          ¿Ya recuperaste tu contraseña?{" "}
          <Link to="/login">
            Inicia sesión aquí
          </Link>
        </p>
      </form>
    </div>
  );
}

export default RecuperarPassword;