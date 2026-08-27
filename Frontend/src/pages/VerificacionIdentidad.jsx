import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/VerificacionIdentidad.css";

function VerificacionIdentidad() {
  const navigate = useNavigate();

  const [documento, setDocumento] = useState(
    localStorage.getItem("documento") || ""
  );

  const [motivo, setMotivo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  const solicitarVerificacion = async (e) => {
    e.preventDefault();

    if (!documento || !motivo) {
      setMensaje("❌ Completa todos los campos.");
      return;
    }

    setEnviando(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        "http://127.0.0.1:8000/verificacion-identidad",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            documento,
            motivo,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setMensaje(
          `❌ ${data.detail || "No se pudo enviar la solicitud."}`
        );
        return;
      }

      setMensaje(
        "✅ Solicitud enviada correctamente. Tu identidad será revisada."
      );

      setTimeout(() => {
        navigate("/cuenta");
      }, 2000);

    } catch (error) {
      console.error(error);
      setMensaje("❌ Error conectando con el servidor.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="verificacion-container">
      <form
        className="verificacion-form"
        onSubmit={solicitarVerificacion}
      >
        <h1>🪪 Verificación de identidad</h1>

        <p>
          Solicita la verificación de identidad de tu cuenta.
        </p>

        <label>Documento</label>

        <input
          type="text"
          value={documento}
          onChange={(e) => setDocumento(e.target.value)}
          placeholder="Número de documento"
        />

        <label>Motivo de la solicitud</label>

        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Explica por qué deseas verificar tu identidad"
          rows="4"
        />

        {mensaje && (
          <p className="mensaje">
            {mensaje}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
        >
          {enviando
            ? "Enviando..."
            : "Solicitar verificación"}
        </button>

        <button
          type="button"
          className="volver"
          onClick={() => navigate("/cuenta")}
        >
          Volver a mi cuenta
        </button>
      </form>
    </div>
  );
}

export default VerificacionIdentidad;

