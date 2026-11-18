import axios from "axios";

export const ULTIMO_MENSAJE_CHAT_KEY = "ultimo_mensaje_asistente";
export const MENSAJE_SEGUIMIENTO =
  "¿Qué más necesitas de mi asistencia virtual de Financiero?";
export const MENSAJE_SALUDO =
  "Buenas tardes, bienvenido a financiero. ¿En qué puedo ayudarle hoy con nuestros productos o servicios?";

export const OPCIONES_CHAT = [
  { etiqueta: "Cuentas", pregunta: "Quiero información sobre cuentas de ahorro y corrientes." },
  { etiqueta: "Transferencias", tipo: "transferencias" },
  { etiqueta: "Historial", pregunta: "Quiero saber cómo consultar mi historial de transacciones." },
  { etiqueta: "Llaves Bre-B", pregunta: "Quiero información sobre las llaves Bre-B." },
  { etiqueta: "Certificados", pregunta: "Quiero saber cómo obtener un certificado bancario." },
  { etiqueta: "Porcentaje de dinero", tipo: "resumenDinero" },
  { etiqueta: "¿Cómo uso la aplicación?", pregunta: "Necesito ayuda para usar la aplicación." },
];

export const OPCIONES_USO_APLICACION = [
  { etiqueta: "Transferencias", tipo: "transferencias" },
  { etiqueta: "Historial", pregunta: "Quiero saber cómo consultar mi historial de transacciones." },
  { etiqueta: "Llaves Bre-B", pregunta: "Quiero información sobre las llaves Bre-B." },
  { etiqueta: "Certificados", pregunta: "Quiero saber cómo obtener un certificado bancario." },
];

export const PASOS_NAVEGACION = {
  Transferencias:
    "1. Abre el menú lateral y entra en «Otros».\n2. Elige «Enviar dinero» para transferir entre tus cuentas, o «Transferir» para iniciar otro tipo de transferencia.",
  Historial:
    "1. Abre el menú lateral.\n2. Selecciona «Historial Monetario» para consultar tus movimientos.",
  "Llaves Bre-B":
    "1. Abre el menú lateral y entra en «Otros».\n2. Selecciona «Registrar Llave Bre-B» para gestionar tus llaves.",
  Certificados:
    "1. Abre el menú lateral.\n2. Selecciona «Certificado Bancario» para consultar o descargar tu certificado.",
};

export const OPCIONES_TRANSFERENCIA = [
  {
    etiqueta: "Entre mis cuentas",
    tipo: "transferenciaEntreCuentas",
    pregunta: "Necesito ayuda para transferir dinero entre mis propias cuentas.",
  },
  {
    etiqueta: "A otra persona con Bre-B",
    tipo: "transferenciaBreB",
    pregunta: "Necesito información para enviar dinero a otra persona usando una llave Bre-B.",
  },
  {
    etiqueta: "Otro tipo de transferencia",
    pregunta: "Necesito ayuda con otro tipo de transferencia.",
  },
];

export const OPCIONES_CUENTA_ORIGEN = [
  { etiqueta: "Cuenta corriente", tipo: "cuentaOrigen", cuenta: "corriente" },
  { etiqueta: "Cuenta de ahorros", tipo: "cuentaOrigen", cuenta: "ahorro" },
];

export const OPCIONES_ASISTENTE = [
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
  {
    titulo: "Porcentaje de dinero",
    descripcion: "Consulta cuánto dinero ha ingresado y cuánto has gastado.",
    tipo: "resumenDinero",
  },
];

export const OPCIONES_ASISTENTE_REGISTRADO = OPCIONES_ASISTENTE.map((opcion) =>
  opcion.titulo === "Movimientos"
    ? {
        ...opcion,
        descripcion: "Entiende y revisa el historial de tus transacciones recientes.",
      }
    : opcion
);

export const obtenerUltimoMensajeChat = () => {
  try {
    const texto = sessionStorage.getItem(ULTIMO_MENSAJE_CHAT_KEY);
    return texto?.trim() ? { tipo: "ia", texto } : null;
  } catch (error) {
    console.error("No fue posible recuperar el último mensaje del asistente:", error);
    return null;
  }
};

export const crearMensajeBienvenida = () => ({
  tipo: "ia",
  texto: MENSAJE_SALUDO,
});

export const normalizarTextoAsistente = (texto) =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[¿?¡!.,]/g, "")
    .trim();

export const crearHistorialChat = (mensajes) =>
  mensajes
    .filter(
      (mensaje) =>
        mensaje &&
        !mensaje.esSeguimiento &&
        typeof mensaje.texto === "string" &&
        mensaje.texto.trim()
    )
    .map((mensaje) => ({
      role: mensaje.tipo === "usuario" ? "user" : "assistant",
      content: mensaje.texto.trim(),
    }));

export const fetchMoneySummary = async (apiBaseUrl, token) => {
  const respuesta = await axios.get(`${apiBaseUrl}/transacciones`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const datos = respuesta.data;
  const transacciones = Array.isArray(datos)
    ? datos
    : datos?.transacciones || datos?.data;

  if (!Array.isArray(transacciones)) {
    throw new Error("El servidor devolvió un historial de transacciones inválido.");
  }

  const totales = transacciones.reduce(
    (acumulado, transaccion) => {
      const tipo = String(transaccion.tipo || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      const monto = Number(transaccion.monto ?? transaccion.valor ?? 0);

      if (!Number.isFinite(monto)) {
        throw new Error("No fue posible calcular el resumen: hay un monto inválido.");
      }

      if (tipo.includes("ingreso") || tipo.includes("recib")) {
        acumulado.ingresos += monto;
      } else if (tipo.includes("gasto") || tipo.includes("transfer")) {
        acumulado.gastos += monto;
      }

      return acumulado;
    },
    { ingresos: 0, gastos: 0 }
  );
  const formatoDinero = (monto) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 2,
    }).format(monto);
  const porcentajeGastado =
    totales.ingresos > 0
      ? `${((totales.gastos / totales.ingresos) * 100).toFixed(2)}%`
      : "No disponible (no hay ingresos registrados)";

  return [
    "Resumen de todos tus movimientos registrados:",
    `Ingresos: ${formatoDinero(totales.ingresos)}`,
    `Gastos y transferencias enviadas: ${formatoDinero(totales.gastos)}`,
    `Gastado respecto a tus ingresos: ${porcentajeGastado}`,
    `Diferencia entre ingresos y gastos: ${formatoDinero(totales.ingresos - totales.gastos)}`,
  ].join("\n");
};

export const fetchAssistantResponse = async (
  apiBaseUrl,
  texto,
  historial,
  token
) => {
  const respuesta = await axios.post(
    `${apiBaseUrl}/ia/chat`,
    { mensaje: texto, historial },
    {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  return respuesta.data?.respuesta || "No pude generar una respuesta.";
};

export const getAssistantErrorMessage = (error) => {
  if (error.response?.data?.detail) {
    return typeof error.response.data.detail === "string"
      ? error.response.data.detail
      : "El asistente bancario no está disponible en este momento.";
  }
  if (error.request) return "No hay respuesta del servidor.";
  return error.message || "Error al conectar con la IA.";
};
