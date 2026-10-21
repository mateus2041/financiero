import React, { useState } from "react";
import axios from "axios";
import "../styles/chatIA.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

function ChatIA() {
  const [pregunta, setPregunta] = useState("");
  const [mensajes, setMensajes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const enviarPregunta = async () => {
    const texto = pregunta.trim();
    if (!texto || isLoading) return;

    const token = localStorage.getItem("token");
    const historial = mensajes
      .filter((msg) => msg && typeof msg.texto === "string" && msg.texto.trim())
      .map((msg) => ({
        role: msg.tipo === "usuario" ? "user" : "assistant",
        content: msg.texto.trim(),
      }));

    setMensajes((prev) => [...prev, { tipo: "usuario", texto }]);
    setPregunta("");
    setIsLoading(true);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/ia/chat`,
        { mensaje: texto, historial },
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      setMensajes((prev) => [
        ...prev,
        {
          tipo: "ia",
          texto: res.data?.respuesta || "No pude generar una respuesta.",
        },
      ]);
    } catch (error) {
      let mensaje = "Error al conectar con la IA.";

      if (error.response?.data?.detail) {
        mensaje =
          typeof error.response.data.detail === "string"
            ? error.response.data.detail
            : "El asistente bancario no está disponible en este momento.";
      } else if (error.request) {
        mensaje = "No hay respuesta del servidor.";
      } else if (error.message) {
        mensaje = error.message;
      }

      setMensajes((prev) => [...prev, { tipo: "ia", texto: mensaje }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">Asistente IA 🤖</div>

      <div className="chat-body">
        {mensajes.map((msg, index) => (
          <div
            key={index}
            className={msg.tipo === "usuario" ? "usuario" : "ia"}
          >
            {msg.texto}
          </div>
        ))}

        {isLoading && <div className="ia">Escribiendo...</div>}
      </div>

      <div className="chat-footer">
        <input
          type="text"
          placeholder="Escribe una pregunta..."
          value={pregunta}
          onChange={(e) => setPregunta(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              enviarPregunta();
            }
          }}
        />
        <button onClick={enviarPregunta} disabled={isLoading}>
          {isLoading ? "Enviando..." : "Enviar"}
        </button>
      </div>
    </div>
  );
}

export default ChatIA;
