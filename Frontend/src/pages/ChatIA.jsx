import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ChatAssistantDialogs from "../components/ChatAssistantDialogs";
import { ChatComposer, ChatTranscript } from "../components/ChatAssistantView";
import {
  crearMensajeBienvenida,
  crearHistorialChat,
  fetchAssistantResponse,
  fetchMoneySummary,
  getAssistantErrorMessage,
  MENSAJE_SALUDO,
  MENSAJE_SEGUIMIENTO,
  normalizarTextoAsistente,
  obtenerUltimoMensajeChat,
  OPCIONES_ASISTENTE_REGISTRADO,
  OPCIONES_CHAT,
  OPCIONES_CUENTA_ORIGEN,
  OPCIONES_TRANSFERENCIA,
  OPCIONES_USO_APLICACION,
  PASOS_NAVEGACION,
} from "../utils/chatAssistant";
import useModalDismissal from "../hooks/useModalDismissal";
import usePersistAssistantMessage from "../hooks/usePersistAssistantMessage";
import "../styles/chatIA.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

function ChatIA({ onClose, compacto = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [pregunta, setPregunta] = useState("");
  const [escrituraDesbloqueada, setEscrituraDesbloqueada] = useState(false);
  const [esperandoLlaveBreB, setEsperandoLlaveBreB] = useState(false);
  const [llaveBreBIngresada, setLlaveBreBIngresada] = useState("");
  const preguntaInputRef = useRef(null);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [mostrarLlaveBreB, setMostrarLlaveBreB] = useState(false);
  const [mensajes, setMensajes] = useState(() => {
    if (compacto) return [{ tipo: "ia", texto: MENSAJE_SALUDO }];

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

  usePersistAssistantMessage(mensajes);
  useModalDismissal(mostrarHistorial, setMostrarHistorial);
  useModalDismissal(mostrarLlaveBreB, setMostrarLlaveBreB);

  useEffect(() => {
    if (escrituraDesbloqueada) {
      preguntaInputRef.current?.focus();
    }
  }, [escrituraDesbloqueada]);

  const mostrarResumenDinero = async (textoOpcion) => {
    setTipoOpciones(null);
    setPregunta("");
    setIsLoading(true);
    setMensajes((prev) => [...prev, { tipo: "usuario", texto: textoOpcion }]);

    try {
      const token = localStorage.getItem("token");
      const resumen = await fetchMoneySummary(API_BASE_URL, token);
      setMensajes((prev) => [
        ...prev,
        { tipo: "ia", texto: resumen },
      ]);
    } catch (error) {
      const detalle =
        typeof error.response?.data?.detail === "string"
          ? error.response.data.detail
          : error.message || "No fue posible cargar tus movimientos.";
      setMensajes((prev) => [
        ...prev,
        { tipo: "ia", texto: `No pude calcular tu resumen: ${detalle}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const enviarPregunta = async (textoSeleccionado) => {
    const texto = (textoSeleccionado || pregunta).trim();
    if (!texto || isLoading) return;

    setEscrituraDesbloqueada(false);

    if (esperandoLlaveBreB) {
      setLlaveBreBIngresada(texto);
      setMensajes((prev) => [
        ...prev,
        { tipo: "usuario", texto },
        { tipo: "ia", texto: "¿Desde qué cuenta quieres enviar el dinero?" },
      ]);
      setTipoOpciones("cuentaOrigenBreB");
      setPregunta("");
      setEsperandoLlaveBreB(false);
      return;
    }

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

    const textoNormalizado = normalizarTextoAsistente(texto);

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
    const historial = crearHistorialChat(mensajes);

    setMensajes((prev) => [...prev, { tipo: "usuario", texto }]);
    setTipoOpciones(null);
    setPregunta("");
    setIsLoading(true);

    try {
      const respuesta = await fetchAssistantResponse(
        API_BASE_URL,
        texto,
        historial,
        token
      );
      setMensajes((prev) => [
        ...prev,
        { tipo: "ia", texto: respuesta },
      ]);
    } catch (error) {
      setMensajes((prev) => [
        ...prev,
        { tipo: "ia", texto: getAssistantErrorMessage(error) },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const seleccionarOpcion = (opcion) => {
    if (opcion.tipo === "resumenDinero") {
      void mostrarResumenDinero(opcion.etiqueta || opcion.titulo);
      return;
    }

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

    if (opcion.tipo === "transferenciaBreB") {
      setMensajes((prev) => [
        ...prev,
        { tipo: "usuario", texto: opcion.etiqueta },
        { tipo: "ia", texto: "¿Cuál es la llave Bre-B de la persona a quien quieres enviar dinero?" },
      ]);
      setTipoOpciones(null);
      setPregunta("");
      setEsperandoLlaveBreB(true);
      setEscrituraDesbloqueada(true);
      return;
    }

    if (opcion.tipo === "cuentaOrigen" && tipoOpciones === "cuentaOrigenBreB") {
      const nombreCuenta =
        opcion.cuenta === "corriente"
          ? "Cuenta corriente"
          : "Cuenta de ahorros";

      setMensajes((prev) => [
        ...prev,
        { tipo: "usuario", texto: nombreCuenta },
        {
          tipo: "ia",
          texto: `Seleccionaste ${nombreCuenta}. Te llevo a la transferencia.`,
        },
      ]);
      setTipoOpciones(null);
      onClose?.();
      navigate("/corriente", {
        state: {
          llaveInicial: llaveBreBIngresada,
          origen: opcion.cuenta,
        },
      });
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

    void enviarPregunta(opcion.pregunta);
  };
  const opcionesAsistente = (
    <div className="chat-sugerencias">
      {OPCIONES_ASISTENTE_REGISTRADO.map((opcion) => (
        <button
          key={opcion.titulo}
          type="button"
          className="chat-sugerencia"
          onClick={() =>
            opcion.tipo === "resumenDinero"
              ? seleccionarOpcion(opcion)
              : setPregunta(opcion.pregunta)
          }
        >
          <strong>{opcion.titulo}</strong>
          <span>{opcion.descripcion}</span>
        </button>
      ))}
    </div>
  );

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

      <ChatTranscript
        messages={mensajes}
        options={
          tipoOpciones === "transferencias"
            ? OPCIONES_TRANSFERENCIA
            : tipoOpciones === "cuentaOrigen" || tipoOpciones === "cuentaOrigenBreB"
              ? OPCIONES_CUENTA_ORIGEN
              : tipoOpciones === "usoAplicacion"
                ? OPCIONES_USO_APLICACION
                : tipoOpciones
                  ? OPCIONES_CHAT
                  : null
        }
        onSelectOption={seleccionarOpcion}
        isLoading={isLoading}
        renderMessage={(msg) => {
          if (compacto && msg.tipo === "ia" && msg.texto === MENSAJE_SALUDO) {
            return (
              <div className="chat-respuesta-asistente">
                <span className="chat-avatar" aria-hidden="true">🤖</span>
                <div className="chat-respuesta-contenido">
                  <div className="chat-burbuja-asistente">{msg.texto}</div>
                  {opcionesAsistente}
                </div>
              </div>
            );
          }

          return (
            <div className={msg.tipo === "usuario" ? "usuario" : "ia"}>
              {msg.texto}
            </div>
          );
        }}
      />
      <ChatComposer
        question={pregunta}
        setQuestion={setPregunta}
        inputRef={preguntaInputRef}
        sendQuestion={enviarPregunta}
        isLoading={isLoading}
        writeEnabled={escrituraDesbloqueada}
        waitingForKey={esperandoLlaveBreB}
        onUnlock={() => setEscrituraDesbloqueada(true)}
        lockedPlaceholder="Pulsa «Desbloquear escritura» para escribir..."
        lockedAriaLabel="Escritura bloqueada; pulsa Desbloquear escritura para activarla"
      />
    </div>
    <ChatAssistantDialogs
      mostrarHistorial={mostrarHistorial}
      onCloseHistorial={() => setMostrarHistorial(false)}
      mostrarLlaveBreB={mostrarLlaveBreB}
      onCloseLlaveBreB={() => setMostrarLlaveBreB(false)}
    />
    </>
  );
}

export default ChatIA;
