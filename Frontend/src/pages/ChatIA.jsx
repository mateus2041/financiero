import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/chatIA.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
const CHAT_STORAGE_KEY = "conversacion_asistente";
const crearMensajeBienvenida = () => {
  const nombreUsuario = localStorage.getItem("nombre_usuario")?.trim();

  return {
    tipo: "ia",
    texto: `Hola${nombreUsuario ? ` ${nombreUsuario}` : ""}, soy el asistente virtual de Financiero. ¿En qué puedo ayudarte hoy?`,
  };
};

const OPCIONES_CHAT = [
  { etiqueta: "Cuentas", pregunta: "Quiero información sobre cuentas de ahorro y corrientes." },
  { etiqueta: "Transferencias", tipo: "transferencias" },
  { etiqueta: "Historial", pregunta: "Quiero saber cómo consultar mi historial de transacciones." },
  { etiqueta: "Llaves Bre-B", pregunta: "Quiero información sobre las llaves Bre-B." },
  { etiqueta: "Certificados", pregunta: "Quiero saber cómo obtener un certificado bancario." },
  { etiqueta: "Uso de la aplicación", pregunta: "Necesito ayuda para usar la aplicación." },
];

const OPCIONES_TRANSFERENCIA = [
  {
    etiqueta: "Entre mis cuentas",
    tipo: "transferenciaEntreCuentas",
    pregunta: "Necesito ayuda para transferir dinero entre mis propias cuentas.",
  },
  {
    etiqueta: "A otra persona con Bre-B",
    pregunta: "Necesito información para enviar dinero a otra persona usando una llave Bre-B.",
  },
  {
    etiqueta: "Otro tipo de transferencia",
    pregunta: "Necesito ayuda con otro tipo de transferencia.",
  },
];

const OPCIONES_CUENTA_ORIGEN = [
  { etiqueta: "Cuenta corriente", tipo: "cuentaOrigen", cuenta: "corriente" },
  { etiqueta: "Cuenta de ahorros", tipo: "cuentaOrigen", cuenta: "ahorro" },
];

function ChatIA({ onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [conversacionInicial] = useState(() => {
    try {
      const guardada = sessionStorage.getItem(CHAT_STORAGE_KEY);
      const conversacion = guardada ? JSON.parse(guardada) : null;

      if (
        Array.isArray(conversacion?.mensajes) &&
        conversacion.mensajes.every(
          (mensaje) =>
            mensaje &&
            ["ia", "usuario"].includes(mensaje.tipo) &&
            typeof mensaje.texto === "string"
        )
      ) {
        const saludoAnterior =
          "¡Hola! Soy el asistente virtual de Financiero. ¿En qué puedo ayudarte hoy?";

        if (conversacion.mensajes[0]?.texto === saludoAnterior) {
          conversacion.mensajes[0] = crearMensajeBienvenida();
        }

        return conversacion;
      }
    } catch (error) {
      console.error("No fue posible recuperar la conversación del asistente:", error);
    }

    return null;
  });
  const [pregunta, setPregunta] = useState("");
  const [mensajes, setMensajes] = useState(
    conversacionInicial?.mensajes || [crearMensajeBienvenida()]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [tipoOpciones, setTipoOpciones] = useState(
    conversacionInicial &&
      Object.prototype.hasOwnProperty.call(conversacionInicial, "tipoOpciones")
      ? conversacionInicial.tipoOpciones
      : "inicio"
  );
  useEffect(() => {
    try {
      sessionStorage.setItem(
        CHAT_STORAGE_KEY,
        JSON.stringify({ mensajes, tipoOpciones })
      );
    } catch (error) {
      console.error("No fue posible guardar la conversación del asistente:", error);
    }
  }, [mensajes, tipoOpciones]);

  const enviarPregunta = async (textoSeleccionado) => {
    const texto = (textoSeleccionado || pregunta).trim();
    if (!texto || isLoading) return;

    const token = localStorage.getItem("token");
    const historial = mensajes
      .filter((msg) => msg && typeof msg.texto === "string" && msg.texto.trim())
      .map((msg) => ({
        role: msg.tipo === "usuario" ? "user" : "assistant",
        content: msg.texto.trim(),
      }));

    setMensajes((prev) => [...prev, { tipo: "usuario", texto }]);
    setTipoOpciones(null);
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

  const seleccionarOpcion = (opcion) => {
    if (opcion.etiqueta === "Cuentas") {
      const mensaje =
        location.pathname === "/cuenta"
          ? "Ya estás en la página de tus cuentas."
          : "Te llevo a la página de tus cuentas.";
      const mensajesActualizados = [
        ...mensajes,
        { tipo: "usuario", texto: opcion.etiqueta },
        { tipo: "ia", texto: mensaje },
        {
          tipo: "ia",
          texto: "¿Qué más necesitas de mi asistencia virtual de Financiero?",
        },
      ];

      setMensajes(mensajesActualizados);
      setTipoOpciones("inicio");

      try {
        sessionStorage.setItem(
          CHAT_STORAGE_KEY,
          JSON.stringify({ mensajes: mensajesActualizados, tipoOpciones: "inicio" })
        );
      } catch (error) {
        console.error("No fue posible guardar la conversación del asistente:", error);
      }

      if (location.pathname !== "/cuenta") {
        onClose?.();
        navigate("/cuenta");
      }
      return;
    }

    if (opcion.tipo === "transferencias") {
      setMensajes((prev) => [
        ...prev,
        { tipo: "usuario", texto: "Transferencias" },
        {
          tipo: "ia",
          texto: "¿Qué tipo de transferencia necesitas?",
        },
      ]);
      setTipoOpciones("transferencias");
      return;
    }

    if (opcion.tipo === "transferenciaEntreCuentas") {
      setMensajes((prev) => [
        ...prev,
        { tipo: "usuario", texto: opcion.etiqueta },
        {
          tipo: "ia",
          texto: "¿De qué cuenta quieres transferir?",
        },
      ]);
      setTipoOpciones("cuentaOrigen");
      return;
    }

    if (opcion.tipo === "cuentaOrigen") {
      const nombreCuenta =
        opcion.cuenta === "corriente"
          ? "Cuenta corriente"
          : "Cuenta de ahorros";
      const mensajesActualizados = [
        ...mensajes,
        { tipo: "usuario", texto: nombreCuenta },
        {
          tipo: "ia",
          texto: `Seleccionaste ${nombreCuenta}. En transferencias podrás ingresar el monto y confirmar la operación.`,
        },
      ];
      setMensajes(mensajesActualizados);
      setTipoOpciones(null);
      try {
        sessionStorage.setItem(
          CHAT_STORAGE_KEY,
          JSON.stringify({ mensajes: mensajesActualizados, tipoOpciones: null })
        );
      } catch (error) {
        console.error("No fue posible guardar la conversación del asistente:", error);
      }
      onClose?.();
      navigate("/transferencias", {
        state: { desdeAsistente: true, origen: opcion.cuenta },
      });
      return;
    }

    enviarPregunta(opcion.pregunta);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <span id="asistente-titulo">Asistente IA 🤖</span>
        {onClose && (
          <button
            type="button"
            className="chat-close"
            onClick={onClose}
            aria-label="Cerrar asistente"
          >
            ×
          </button>
        )}
      </div>

      <div className="chat-body">
        {mensajes.map((msg, index) => (
          <div
            key={index}
            className={msg.tipo === "usuario" ? "usuario" : "ia"}
          >
            {msg.texto}
          </div>
        ))}

        {tipoOpciones && (
          <div className="chat-opciones" role="group" aria-label="Opciones de ayuda">
            {(tipoOpciones === "transferencias"
              ? OPCIONES_TRANSFERENCIA
              : tipoOpciones === "cuentaOrigen"
                ? OPCIONES_CUENTA_ORIGEN
                : OPCIONES_CHAT
            ).map((opcion) => (
              <button
                key={opcion.etiqueta}
                type="button"
                onClick={() => seleccionarOpcion(opcion)}
                disabled={isLoading}
              >
                {opcion.etiqueta}
              </button>
            ))}
          </div>
        )}

        {isLoading && <div className="ia">Escribiendo...</div>}
      </div>

      <div className="chat-footer">
        <input
          className="chat-input"
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
