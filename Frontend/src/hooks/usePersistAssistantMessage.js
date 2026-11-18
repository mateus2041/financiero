import { useEffect } from "react";
import { ULTIMO_MENSAJE_CHAT_KEY } from "../utils/chatAssistant";

export default function usePersistAssistantMessage(mensajes) {
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
}
