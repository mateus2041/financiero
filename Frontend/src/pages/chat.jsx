import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ChatIARegistrado from "./ChatIA";
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
  OPCIONES_ASISTENTE,
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
const NUEVO_USUARIO_CHAT_KEY = "nuevo_usuario_chat_inicio";
const ESPERA_CAMBIO_CHAT_MS = 24 * 60 * 60 * 1000;
const PASOS_INICIAR_CUENTA =
  "Para iniciar sesión en tu cuenta:\n1. Abre la aplicación.\n2. Selecciona «Iniciar sesión».\n3. Escribe tu número de documento y contraseña.\n4. Pulsa «Ingresar» para entrar a tu cuenta.";

const OPCIONES_CONFIRMACION = [
  { etiqueta: "Sí", tipo: "confirmarSi" },
  { etiqueta: "No", tipo: "confirmarNo" },
];

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
  const [confirmacionPendiente, setConfirmacionPendiente] = useState(null);
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
  const [usarChatIARegistrado, setUsarChatIARegistrado] = useState(false);

  useEffect(() => {
    const esNuevoUsuario =
      !localStorage.getItem("token") && !localStorage.getItem("usuario_id");

    if (!esNuevoUsuario) {
      setUsarChatIARegistrado(false);
      return undefined;
    }

    let inicio = Number(localStorage.getItem(NUEVO_USUARIO_CHAT_KEY));

    if (!Number.isFinite(inicio) || inicio <= 0) {
      inicio = Date.now();
      localStorage.setItem(NUEVO_USUARIO_CHAT_KEY, String(inicio));
    }

    const comprobarCambio = () => {
      const transcurrido = Date.now() - inicio;
      if (transcurrido >= ESPERA_CAMBIO_CHAT_MS) {
        setUsarChatIARegistrado(true);
        return true;
      }
      return false;
    };

    if (comprobarCambio()) return undefined;

    const temporizador = window.setInterval(() => {
      if (comprobarCambio()) window.clearInterval(temporizador);
    }, 60 * 1000);

    return () => window.clearInterval(temporizador);
  }, []);

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
      const resumen = await fetchMoneySummary(API_BASE_URL);
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

    if (tipoOpciones === "confirmacionGeneral" && confirmacionPendiente) {
      if (confirmacionPendiente.tipo === "porcentajeDinero") {
        if (textoNormalizado === "si" || textoNormalizado === "s") {
          setConfirmacionPendiente(null);
          setTipoOpciones(null);
          void mostrarResumenDinero("Porcentaje de dinero");
          return;
        }

        if (textoNormalizado === "no" || textoNormalizado === "n") {
          setMensajes((prev) => [
            ...prev,
            { tipo: "usuario", texto },
            {
              tipo: "ia",
              texto:
                "Para consultar tu porcentaje de dinero necesitas tener una cuenta:\n1. Selecciona «Registro» en la parte superior de la aplicación.\n2. Completa tus datos personales y crea tu usuario.\n3. Espera la aprobación de tu solicitud.\n4. Inicia sesión y consulta tus ingresos y gastos desde «Porcentaje de dinero».",
            },
          ]);
          setConfirmacionPendiente(null);
          setTipoOpciones("inicio");
          setPregunta("");
          return;
        }
      }

      if (confirmacionPendiente.tipo === "cuenta" && (textoNormalizado === "si" || textoNormalizado === "s")) {
        setMensajes((prev) => [
          ...prev,
          { tipo: "usuario", texto },
          { tipo: "ia", texto: "¿Ya tienes una cuenta?" },
        ]);
        setConfirmacionPendiente({
          pasosSi: "Para iniciar tu cuenta:\n1. Ve a la opción de Registro o Inicio de sesión.\n2. Completa tus datos personales y crea tu usuario.\n3. Verifica la información solicitada.\n4. Inicia sesión con tu correo y contraseña y entra a tu cuenta.",
          pasosNo: "Para registrarte y tener una cuenta:\n1. Ve a la opción de Registro o Crear cuenta.\n2. Completa tus datos personales y de contacto.\n3. Confirma tu información y crea tu usuario.\n4. Inicia sesión con tu cuenta recién creada.",
          tipo: "cuentaYaRegistrado",
        });
        setTipoOpciones("confirmacionGeneral");
        setPregunta("");
        return;
      }

      if (textoNormalizado === "si" || textoNormalizado === "s") {
        if (confirmacionPendiente.tipo === "transferenciasCuenta") {
          setMensajes((prev) => [
            ...prev,
            { tipo: "usuario", texto },
            { tipo: "ia", texto: PASOS_INICIAR_CUENTA },
          ]);
          setConfirmacionPendiente(null);
          setTipoOpciones("inicio");
          setPregunta("");
          return;
        }

        const mensajeFinal =
          confirmacionPendiente.tipo === "cuentaYaRegistrado"
            ? "Para iniciar tu cuenta:\n1. Ve a la opción de Registro o Inicio de sesión.\n2. Completa tus datos personales y crea tu usuario.\n3. Verifica la información solicitada.\n4. Inicia sesión con tu correo y contraseña y entra a tu cuenta."
            : confirmacionPendiente.pasosSi;

        setMensajes((prev) => [
          ...prev,
          { tipo: "usuario", texto },
          { tipo: "ia", texto: mensajeFinal },
        ]);
        setConfirmacionPendiente(null);
        setTipoOpciones("inicio");
        setPregunta("");
        return;
      }

      if (textoNormalizado === "no" || textoNormalizado === "n") {
        const mensajeFinal =
          confirmacionPendiente.tipo === "cuentaYaRegistrado"
            ? "Para registrarte y tener una cuenta:\n1. Ve a la opción de Registro o Crear cuenta.\n2. Completa tus datos personales y de contacto.\n3. Confirma tu información y crea tu usuario.\n4. Inicia sesión con tu cuenta recién creada."
            : confirmacionPendiente.pasosNo;

        setMensajes((prev) => [
          ...prev,
          { tipo: "usuario", texto },
          { tipo: "ia", texto: mensajeFinal },
        ]);
        setConfirmacionPendiente(null);
        setTipoOpciones("inicio");
        setPregunta("");
        return;
      }
    }

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

    const historial = crearHistorialChat(mensajes);

    setMensajes((prev) => [...prev, { tipo: "usuario", texto }]);
    setTipoOpciones(null);
    setPregunta("");
    setIsLoading(true);

    try {
      const respuesta = await fetchAssistantResponse(
        API_BASE_URL,
        texto,
        historial
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
      setMensajes((prev) => [
        ...prev,
        { tipo: "usuario", texto: opcion.etiqueta || opcion.titulo || "Porcentaje de dinero" },
        { tipo: "ia", texto: "¿Ya tienes una cuenta?" },
      ]);
      setConfirmacionPendiente({
        pasosSi: "",
        pasosNo:
          "Para consultar tu porcentaje de dinero necesitas tener una cuenta:\n1. Selecciona «Registro» en la parte superior de la aplicación.\n2. Completa tus datos personales y crea tu usuario.\n3. Espera la aprobación de tu solicitud.\n4. Inicia sesión y consulta tus ingresos y gastos desde «Porcentaje de dinero».",
        tipo: "porcentajeDinero",
      });
      setTipoOpciones("confirmacionGeneral");
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

    if (opcion.etiqueta === "Historial") {
      setMensajes((prev) => [
        ...prev,
        { tipo: "usuario", texto: "Historial" },
        { tipo: "ia", texto: "¿Ya tienes una cuenta?" },
      ]);
      setConfirmacionPendiente({
        pasosSi: PASOS_INICIAR_CUENTA,
        pasosNo:
          "Para consultar tu historial, primero necesitas tener una cuenta:\n1. Ve a la opción «Registro» o «Crear cuenta».\n2. Completa tus datos personales y de contacto.\n3. Confirma tu información y crea tu usuario.\n4. Inicia sesión con tu cuenta recién creada.",
        tipo: "historial",
      });
      setTipoOpciones("confirmacionGeneral");
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

    const prepararConfirmacion = ({
      pregunta,
      pasosSi,
      pasosNo,
      tipo = "general",
      mensajeConfirmacion = `¿Quieres saber cómo llegar a la sección de ${pregunta}?`,
    }) => {
      setMensajes((prev) => [
        ...prev,
        { tipo: "usuario", texto: pregunta },
        { tipo: "ia", texto: mensajeConfirmacion },
      ]);
      setConfirmacionPendiente({ pasosSi, pasosNo, tipo });
      setTipoOpciones("confirmacionGeneral");
    };

    if (opcion.etiqueta === "Cuentas") {
      prepararConfirmacion({
        pregunta: "Cuentas",
        tipo: "cuenta",
        pasosSi:
          "Para llegar a Cuentas:\n1. Abre el menú lateral.\n2. Busca la opción «Cuenta» o «Cuentas».\n3. Haz clic ahí para ver tus saldos, movimientos y resumen financiero.",
        pasosNo:
          "¿Ya tienes una cuenta?",
      });
      return;
    }

    if (opcion.tipo === "confirmarSi") {
      if (!confirmacionPendiente) return;

      if (confirmacionPendiente.tipo === "porcentajeDinero") {
        setConfirmacionPendiente(null);
        setTipoOpciones(null);
        void mostrarResumenDinero("Porcentaje de dinero");
        return;
      }

      if (confirmacionPendiente.tipo === "transferenciasCuenta") {
        setMensajes((prev) => [
          ...prev,
          { tipo: "usuario", texto: "Sí" },
          { tipo: "ia", texto: PASOS_INICIAR_CUENTA },
        ]);
        setConfirmacionPendiente(null);
        setTipoOpciones("inicio");
        return;
      }

      if (confirmacionPendiente.tipo === "cuenta") {
        setMensajes((prev) => [
          ...prev,
          { tipo: "usuario", texto: "Sí" },
          { tipo: "ia", texto: "¿Ya tienes una cuenta?" },
        ]);
        setConfirmacionPendiente({
          pasosSi: "Para iniciar tu cuenta:\n1. Ve a la opción de Registro o Inicio de sesión.\n2. Completa tus datos personales y crea tu usuario.\n3. Verifica la información solicitada.\n4. Inicia sesión con tu correo y contraseña y entra a tu cuenta.",
          pasosNo: "Para registrarte y tener una cuenta:\n1. Ve a la opción de Registro o Crear cuenta.\n2. Completa tus datos personales y de contacto.\n3. Confirma tu información y crea tu usuario.\n4. Inicia sesión con tu cuenta recién creada.",
          tipo: "cuentaYaRegistrado",
        });
        setTipoOpciones("confirmacionGeneral");
        return;
      }

      if (confirmacionPendiente.tipo === "cuentaYaRegistrado") {
        setMensajes((prev) => [
          ...prev,
          { tipo: "usuario", texto: "Sí" },
          { tipo: "ia", texto: "Para iniciar tu cuenta:\n1. Ve a la opción de Registro o Inicio de sesión.\n2. Completa tus datos personales y crea tu usuario.\n3. Verifica la información solicitada.\n4. Inicia sesión con tu correo y contraseña y entra a tu cuenta." },
        ]);
        setConfirmacionPendiente(null);
        setTipoOpciones("inicio");
        return;
      }

      setMensajes((prev) => [
        ...prev,
        { tipo: "usuario", texto: "Sí" },
        { tipo: "ia", texto: confirmacionPendiente.pasosSi },
        ...(confirmacionPendiente.tipo === "llaveBreB"
          ? [{ tipo: "ia", texto: "¿En qué más te puedo ayudar?" }]
          : []),
      ]);
      setConfirmacionPendiente(null);
      setTipoOpciones("inicio");
      return;
    }

    if (opcion.tipo === "confirmarNo") {
      if (!confirmacionPendiente) return;

      if (confirmacionPendiente.tipo === "cuenta") {
        setMensajes((prev) => [
          ...prev,
          { tipo: "usuario", texto: "No" },
          { tipo: "ia", texto: "Para registrarte y tener una cuenta:\n1. Ve a la opción de Registro o Crear cuenta.\n2. Completa tus datos personales y de contacto.\n3. Confirma tu información y crea tu usuario.\n4. Inicia sesión con tu cuenta recién creada." },
        ]);
        setConfirmacionPendiente(null);
        setTipoOpciones("inicio");
        return;
      }

      if (confirmacionPendiente.tipo === "cuentaYaRegistrado") {
        setMensajes((prev) => [
          ...prev,
          { tipo: "usuario", texto: "No" },
          { tipo: "ia", texto: "Para registrarte y tener una cuenta:\n1. Ve a la opción de Registro o Crear cuenta.\n2. Completa tus datos personales y de contacto.\n3. Confirma tu información y crea tu usuario.\n4. Inicia sesión con tu cuenta recién creada." },
        ]);
        setConfirmacionPendiente(null);
        setTipoOpciones("inicio");
        return;
      }

      setMensajes((prev) => [
        ...prev,
        { tipo: "usuario", texto: "No" },
        { tipo: "ia", texto: confirmacionPendiente.pasosNo },
        ...(confirmacionPendiente.tipo === "llaveBreB"
          ? [{ tipo: "ia", texto: "¿En qué más te puedo ayudar?" }]
          : []),
      ]);
      setConfirmacionPendiente(null);
      setTipoOpciones("inicio");
      return;
    }

    if (opcion.etiqueta === "Transferencias") {
      setMensajes((prev) => [
        ...prev,
        { tipo: "usuario", texto: "Transferencias" },
        { tipo: "ia", texto: "¿Ya tienes una cuenta?" },
      ]);
      setConfirmacionPendiente({
        pasosSi: "¿Qué tipo de transferencia necesitas?",
        pasosNo:
          "Para registrarte:\n1. Selecciona «Registro» en la parte superior de la aplicación.\n2. Completa tu nombre, correo, tipo y número de documento, teléfono y contraseña.\n3. Pulsa «Siguiente».\n4. Ingresa tu ciudad, localidad, barrio, código postal y dirección.\n5. Pulsa «Registrar» y espera la aprobación de tu solicitud.",
        tipo: "transferenciasCuenta",
      });
      setTipoOpciones("confirmacionGeneral");
      return;
    }

    if (opcion.etiqueta === "Llaves Bre-B") {
      prepararConfirmacion({
        pregunta: "Llaves Bre-B",
        tipo: "llaveBreB",
        mensajeConfirmacion: "¿Ya tienes una cuenta?",
        pasosSi:
          "Para llegar a Llaves Bre-B:\n1. Ve a la parte superior y haz clic en «Iniciar sesión».\n2. Completa los campos para ingresar.\n3. Verifica la información que ingresaste.\n4. Pulsa «Ingresar» y espera el código de confirmación.\nDespués de iniciar sesión, podrás registrar tu llave Bre-B desde «Otros».",
        pasosNo:
          "Para crear una cuenta:\n1. Selecciona «Registro» y completa todos los campos marcados.\n2. Espera a que se procese tu solicitud.\n3. Cuando sea aprobada, podrás ingresar a tu cuenta.\n4. Espera el código de confirmación.\n5. Después, dirígete al menú del lado izquierdo y selecciona «Otros»; allí encontrarás la opción para registrar tu llave Bre-B.",
      });
      return;
    }

    if (opcion.etiqueta === "Certificados") {
      prepararConfirmacion({
        pregunta: "Certificados",
        pasosSi:
          "Para consultar tus certificados banacario:\n1. inicia sesión.\n2. Seleccione incresar.\n3. espara que te lleve un codigo de confirmación para incresar. \n4. incresa el codigo que te llego a tu correo electronico.\n5. dirijete al menu del lado izquierdo y selecciona «certificados»; allí encontrarás la opción para consultar tu certificado bancario y descargarlo.",
        pasosNo:
          "para consultar tus certificados: \n1. Selecciona «Registro» y completa todos los campos marcados.\n2. Espera a que se procese tu solicitud.\n3. Cuando sea aprobada, cuando alla cido aporvada de darle clip en iniciar sesión.\n4. Espera el código de confirmación.\n5. ingresa el codigo que te llego a tu correo electronico.",
      });
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

  if (usarChatIARegistrado) {
    return <ChatIARegistrado compacto={compacto} onClose={onClose} />;
  }

  return (
    <>
    <div className="chat-container">
      <div className="chat-header">
        <span id="asistente-titulo">Asistente de atención</span>
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
                : tipoOpciones === "confirmacionGeneral"
                  ? OPCIONES_CONFIRMACION
                  : tipoOpciones
                    ? OPCIONES_CHAT
                    : null
        }
        onSelectOption={seleccionarOpcion}
        isLoading={isLoading}
      />
      <ChatComposer
        question={pregunta}
        setQuestion={setPregunta}
        inputRef={preguntaInputRef}
        sendQuestion={enviarPregunta}
        isLoading={isLoading}
        writeEnabled={escrituraDesbloqueada}
        waitingForKey={esperandoLlaveBreB}
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