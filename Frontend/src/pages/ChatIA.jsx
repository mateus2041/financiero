import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import Historial from "./historial";
import RegistrarLlaveBreB from "./transferenciascr";
import "../styles/chatIA.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
const ULTIMO_MENSAJE_CHAT_KEY = "ultimo_mensaje_asistente";
const MENSAJE_SEGUIMIENTO = "¿Qué más necesitas de mi asistencia virtual de Financiero?";

const obtenerUltimoMensajeChat = () => {
  try {
    const texto = sessionStorage.getItem(ULTIMO_MENSAJE_CHAT_KEY);
    return texto?.trim() ? { tipo: "ia", texto } : null;
  } catch (error) {
    console.error("No fue posible recuperar el último mensaje del asistente:", error);
    return null;
  }
};

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
  { etiqueta: "¿Cómo uso la aplicación?", pregunta: "Necesito ayuda para usar la aplicación." },
];

const OPCIONES_USO_APLICACION = [
  { etiqueta: "Transferencias", tipo: "transferencias" },
  { etiqueta: "Historial", pregunta: "Quiero saber cómo consultar mi historial de transacciones." },
  { etiqueta: "Llaves Bre-B", pregunta: "Quiero información sobre las llaves Bre-B." },
  { etiqueta: "Certificados", pregunta: "Quiero saber cómo obtener un certificado bancario." },
];

const PASOS_NAVEGACION = {
  Transferencias:
    "1. Abre el menú lateral y entra en «Otros».\n2. Elige «Enviar dinero» para transferir entre tus cuentas, o «Transferir» para iniciar otro tipo de transferencia.",
  Historial:
    "1. Abre el menú lateral.\n2. Selecciona «Historial Monetario» para consultar tus movimientos.",
  "Llaves Bre-B":
    "1. Abre el menú lateral y entra en «Otros».\n2. Selecciona «Registrar Llave Bre-B» para gestionar tus llaves.",
  Certificados:
    "1. Abre el menú lateral.\n2. Selecciona «Certificado Bancario» para consultar o descargar tu certificado.",
};

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
  const [pregunta, setPregunta] = useState("");
  const [escrituraDesbloqueada, setEscrituraDesbloqueada] = useState(false);
  const preguntaInputRef = useRef(null);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [mostrarLlaveBreB, setMostrarLlaveBreB] = useState(false);
  const [mensajes, setMensajes] = useState(() => {
    const estaEnCuenta = location.pathname === "/cuenta";
    const estaEnTransferencias = location.pathname === "/transferencias";
    const mensajeGuardado = obtenerUltimoMensajeChat();
    const ultimoMensaje =
      estaEnCuenta || mensajeGuardado?.texto === MENSAJE_SEGUIMIENTO
        ? crearMensajeBienvenida()
        : mensajeGuardado || crearMensajeBienvenida();

    return estaEnTransferencias
      ? [
          ultimoMensaje,
          { tipo: "ia", texto: MENSAJE_SEGUIMIENTO, esSeguimiento: true },
        ]
      : [ultimoMensaje];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [tipoOpciones, setTipoOpciones] = useState("inicio");

  useEffect(() => {
    const ultimoMensaje = [...mensajes]
      .reverse()
      .find((mensaje) => mensaje.tipo === "ia" && !mensaje.esSeguimiento);

    if (!ultimoMensaje) return;

    try {
      sessionStorage.setItem(ULTIMO_MENSAJE_CHAT_KEY, ultimoMensaje.texto);
    } catch (error) {
      console.error("No fue posible guardar el último mensaje del asistente:", error);
    }
  }, [mensajes]);

  useEffect(() => {
    if (!mostrarHistorial && !mostrarLlaveBreB) return undefined;

    const cerrarConEscape = (event) => {
      if (event.key === "Escape") {
        setMostrarHistorial(false);
        setMostrarLlaveBreB(false);
      }
    };

    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [mostrarHistorial, mostrarLlaveBreB]);

  useEffect(() => {
    if (escrituraDesbloqueada) {
      preguntaInputRef.current?.focus();
    }
  }, [escrituraDesbloqueada]);

  const enviarPregunta = async (textoSeleccionado) => {
    const texto = (textoSeleccionado || pregunta).trim();
    if (!texto || isLoading) return;

    setEscrituraDesbloqueada(false);

    const textoNormalizado = texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[¿?¡!.,]/g, "")
      .trim();

    if (
      textoNormalizado === "necesito ayuda para usar la aplicacion" ||
      textoNormalizado === "como uso la aplicacion"
    ) {
      setMensajes((prev) => [
        ...prev,
        { tipo: "usuario", texto },
        { tipo: "ia", texto: "¿Qué necesitas saber?" },
      ]);
      setTipoOpciones("usoAplicacion");
      setPregunta("");
      return;
    }

    const token = localStorage.getItem("token");
    const historial = mensajes
      .filter(
        (msg) =>
          msg &&
          !msg.esSeguimiento &&
          typeof msg.texto === "string" &&
          msg.texto.trim()
      )
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
    if (opcion.etiqueta === "¿Cómo uso la aplicación?") {
      setMensajes((prev) => [
        ...prev,
        { tipo: "usuario", texto: opcion.etiqueta },
        { tipo: "ia", texto: "¿Qué necesitas saber?" },
      ]);
      setTipoOpciones("usoAplicacion");
      return;
    }

    if (tipoOpciones === "usoAplicacion") {
      const pasos = PASOS_NAVEGACION[opcion.etiqueta];
      if (!pasos) return;

      setMensajes((prev) => [
        ...prev,
        { tipo: "usuario", texto: opcion.etiqueta },
        { tipo: "ia", texto: `Para llegar a ${opcion.etiqueta}:\n${pasos}` },
      ]);
      return;
    }

    if (opcion.etiqueta === "Historial") {
      setMostrarHistorial(true);
      return;
    }

    if (opcion.etiqueta === "Cuentas") {
      const mensaje =
        location.pathname === "/cuenta"
          ? "Ya estás en la página de tus cuentas."
          : "Te llevo a la página de tus cuentas.";
      const mensajesActualizados = [
        ...mensajes,
        { tipo: "usuario", texto: opcion.etiqueta },
        { tipo: "ia", texto: mensaje },
      ];

      setMensajes(mensajesActualizados);
      setTipoOpciones("inicio");

      if (location.pathname !== "/cuenta") {
        onClose?.();
        navigate("/cuenta");
      }
      return;
    }

    if (opcion.etiqueta === "Certificados") {
      onClose?.();
      navigate("/certificado");
      return;
    }

    if (opcion.etiqueta === "Llaves Bre-B") {
      setMostrarLlaveBreB(true);
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
      onClose?.();
      navigate("/transferencias", {
        state: { desdeAsistente: true, origen: opcion.cuenta },
      });
      return;
    }

    enviarPregunta(opcion.pregunta);
  };

  return (
    <>
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
                : tipoOpciones === "usoAplicacion"
                  ? OPCIONES_USO_APLICACION
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
          placeholder={
            escrituraDesbloqueada
              ? "Escribe una pregunta..."
              : "Pulsa «Desbloquear escritura» para escribir..."
          }
          value={pregunta}
          disabled={!escrituraDesbloqueada || isLoading}
          ref={preguntaInputRef}
          onChange={(event) => setPregunta(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && escrituraDesbloqueada) {
              enviarPregunta();
            }
          }}
          aria-label={
            escrituraDesbloqueada
              ? "Escribe una pregunta para el asistente"
              : "Escritura bloqueada; pulsa Desbloquear escritura para activarla"
          }
        />
        <button
          type="button"
          className="chat-unlock-button"
          onClick={() => setEscrituraDesbloqueada(true)}
          disabled={isLoading}
          aria-pressed={escrituraDesbloqueada}
        >
          {escrituraDesbloqueada ? "Escritura habilitada" : "Desbloquear escritura"}
        </button>
        <button
          type="button"
          onClick={() => enviarPregunta()}
          disabled={!escrituraDesbloqueada || isLoading}
        >
          Enviar
        </button>
      </div>
    </div>
    {mostrarHistorial && (
      <div
        className="historial-asistente-overlay"
        onClick={() => setMostrarHistorial(false)}
      >
        <div
          className="historial-asistente-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="historial-asistente-titulo"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="historial-asistente-header">
            <h2 id="historial-asistente-titulo">Historial de transacciones</h2>
            <button
              type="button"
              onClick={() => setMostrarHistorial(false)}
              aria-label="Cerrar historial"
            >
              ×
            </button>
          </div>
          <div className="historial-asistente-body">
            <Historial isModal />
          </div>
        </div>
      </div>
    )}
    {mostrarLlaveBreB && (
      <div
        className="historial-asistente-overlay"
        onClick={() => setMostrarLlaveBreB(false)}
      >
        <section
          className="llave-breb-asistente-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="llave-breb-asistente-titulo"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="historial-asistente-header">
            <h2 id="llave-breb-asistente-titulo">Registrar llave Bre-B</h2>
            <button
              type="button"
              onClick={() => setMostrarLlaveBreB(false)}
              aria-label="Cerrar registro de llave Bre-B"
            >
              ×
            </button>
          </div>
          <div className="llave-breb-asistente-body">
            <RegistrarLlaveBreB isModal />
          </div>
        </section>
      </div>
    )}
    </>
  );
}

export default ChatIA;
