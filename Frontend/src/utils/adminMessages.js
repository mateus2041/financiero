import {
  parsePositiveInteger,
  sanitizeLocalName,
  sanitizeLocalText,
} from "./helpers";

const sanitizeImageDataUrl = (value) =>
  typeof value === "string" &&
  value.length <= 7_000_000 &&
  /^data:image\/(?:png|jpeg|gif|webp);base64,[A-Za-z0-9+/]+={0,2}$/i.test(value)
    ? value
    : null;

const normalizarMensajeAdmin = (mensaje, index) => {
  if (!mensaje || typeof mensaje !== "object" || Array.isArray(mensaje)) {
    return null;
  }

  const texto = sanitizeLocalText(
    [mensaje.texto, mensaje.mensaje, mensaje.descripcion].find(
      (valor) => typeof valor === "string"
    ) || ""
  );
  const fechaCreacion = typeof mensaje.fecha_creacion === "string"
    ? sanitizeLocalText(mensaje.fecha_creacion, 64)
    : "";
  const fecha = typeof mensaje.fecha === "string"
    ? sanitizeLocalText(mensaje.fecha, 100)
    : "";
  const id = parsePositiveInteger(mensaje.id ?? mensaje.id_notificacion)
    ?? Date.now() + index;
  const imagen = sanitizeImageDataUrl(
    mensaje.imagen_data_url ?? mensaje.imagen
  );

  return {
    id,
    id_notificacion: id,
    nombre_asesor: sanitizeLocalName(
      mensaje.nombre_asesor ?? mensaje.nombre
    ),
    texto: texto || (imagen ? "Imagen adjunta" : ""),
    mensaje: texto || (imagen ? "Imagen adjunta" : ""),
    descripcion: texto || (imagen ? "Imagen adjunta" : ""),
    titulo: sanitizeLocalText(
      typeof mensaje.titulo === "string"
        ? mensaje.titulo
        : "Mensaje para el administrador",
      100
    ),
    tipo: sanitizeLocalText(
      typeof mensaje.tipo === "string" ? mensaje.tipo : "mensaje",
      50
    ),
    imagen,
    imagen_data_url: imagen,
    fecha: fecha || new Date().toLocaleString("es-CO"),
    fecha_creacion: fechaCreacion || new Date().toISOString(),
    leida: Boolean(mensaje.leida),
  };
};

export const normalizarMensajesAdmin = (mensajes) => {
  if (!Array.isArray(mensajes)) {
    throw new TypeError("El contenido almacenado no es una lista");
  }

  return mensajes
    .map(normalizarMensajeAdmin)
    .filter(Boolean);
};

export const leerMensajesAdmin = () => {
  const contenido = localStorage.getItem("mensajes_admin");
  return contenido ? normalizarMensajesAdmin(JSON.parse(contenido)) : [];
};

export const crearMensajeAdmin = ({ texto, imagen }) => {
  const imagenSegura = sanitizeImageDataUrl(imagen);
  const textoFinal =
    sanitizeLocalText(texto || "Imagen adjunta") ||
    (imagenSegura ? "Imagen adjunta" : "");
  const ahora = new Date();

  return {
    id: Date.now(),
    id_notificacion: Date.now(),
    nombre_asesor: sanitizeLocalName(
      localStorage.getItem("nombre_asesor") ||
      localStorage.getItem("nombre_usuario")
    ),
    texto: textoFinal,
    mensaje: textoFinal,
    descripcion: textoFinal,
    titulo: "Mensaje para el administrador",
    tipo: "mensaje",
    imagen: imagenSegura,
    imagen_data_url: imagenSegura,
    fecha: ahora.toLocaleString("es-CO"),
    fecha_creacion: ahora.toISOString(),
    leida: false,
  };
};
