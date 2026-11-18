export const crearMensajeAdmin = ({ texto, imagen }) => {
  const textoFinal = texto || "Imagen adjunta";
  const ahora = new Date();

  return {
    id: Date.now(),
    id_notificacion: Date.now(),
    nombre_asesor:
      localStorage.getItem("nombre_asesor") ||
      localStorage.getItem("nombre_usuario") ||
      "Sin nombre",
    texto: textoFinal,
    mensaje: textoFinal,
    descripcion: textoFinal,
    titulo: "Mensaje para el administrador",
    tipo: "mensaje",
    imagen: imagen || null,
    imagen_data_url: imagen || null,
    fecha: ahora.toLocaleString("es-CO"),
    fecha_creacion: ahora.toISOString(),
    leida: false,
  };
};
