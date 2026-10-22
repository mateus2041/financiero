import React, { useState } from "react";
import axios from "axios";
import "../styles/chatIA.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

const MENSAJE_SALUDO =
  "¡Hola, Gabriel! Soy tu asistente financiero. ¿En qué puedo ayudarte hoy?";

const OPCIONES_ASISTENTE = [
  {
    titulo: "Mis cuentas y saldos",
    descripcion: "Consulta tus cuentas y aprende a organizar tu dinero.",
    pregunta: "¿Cómo puedo consultar y organizar los saldos de mis cuentas?",
  },
  {
    titulo: "Transferencias",
    descripcion: "Resuelve dudas sobre cómo enviar dinero.",
    pregunta: "¿Cómo puedo hacer una transferencia entre mis cuentas?",
  },
  {
    titulo: "Movimientos",
    descripcion: "Entiende y revisa el historial de tus transacciones.",
    pregunta: "¿Cómo reviso mis movimientos y transacciones recientes?",
  },
  {
    titulo: "Ahorro y presupuesto",
    descripcion: "Encuentra formas de ahorrar y planificar tus gastos.",
    pregunta: "¿Cómo puedo crear un presupuesto y ahorrar cada mes?",
  },
];

function ChatIA({ compacto = false }) {
  const [pregunta, setPregunta] = useState("");
  const [mensajes, setMensajes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const enviarPregunta = async () => {
    const texto = pregunta.trim();
    if (!texto || isLoading) return;

    const preguntaEnviada = texto;
    const esSaludo =
      preguntaEnviada
        .toLocaleLowerCase("es")
        .replace(/[!¡.,?¿\s]/g, "") === "hola";

    if (esSaludo) {
      setMensajes((prev) => [
        ...prev,
        { tipo: "usuario", texto: preguntaEnviada },
        { tipo: "ia", texto: MENSAJE_SALUDO },
      ]);
      setPregunta("");
      return;
    }

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

  const opcionesAsistente = (
    <div className="chat-sugerencias">
      {OPCIONES_ASISTENTE.map((opcion) => (
        <button
          key={opcion.titulo}
          type="button"
          className="chat-sugerencia"
          onClick={() => setPregunta(opcion.pregunta)}
        >
          <strong>{opcion.titulo}</strong>
          <span>{opcion.descripcion}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="chat-container">
      <div className="chat-header">Asistente IA 🤖</div>

      <div className="chat-body">
        {mensajes.map((msg, index) => {
          if (compacto && msg.tipo === "ia" && msg.texto === MENSAJE_SALUDO) {
            return (
              <div key={index} className="chat-respuesta-asistente">
                <span className="chat-avatar" aria-hidden="true">🤖</span>
                <div className="chat-respuesta-contenido">
                  <div className="chat-burbuja-asistente">{msg.texto}</div>
                  {opcionesAsistente}
                </div>
              </div>
            );
          }

          return (
            <div
              key={index}
              className={msg.tipo === "usuario" ? "usuario" : "ia"}
            >
              {msg.texto}
            </div>
          );
        })}

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
