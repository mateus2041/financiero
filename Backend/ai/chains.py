from Backend.ai.llm import consultar_modelo


def generar_respuesta(mensaje, historial=None):
    """Genera una respuesta bancaria validando la entrada y el historial."""

    if not isinstance(mensaje, str):
        raise ValueError("El mensaje debe ser una cadena de texto.")

    mensaje_limpio = mensaje.strip()
    if not mensaje_limpio:
        raise ValueError("El mensaje no puede estar vacío.")
    if len(mensaje_limpio) > 4000:
        raise ValueError("El mensaje excede el máximo permitido de 4000 caracteres.")

    mensajes = []
    historial_normalizado = historial if isinstance(historial, list) else []
    ultimo_mensaje = mensaje_limpio

    for item in historial_normalizado[-6:]:
        if not isinstance(item, dict):
            continue

        rol = item.get("role")
        contenido = item.get("content")

        if rol not in ("user", "assistant"):
            continue
        if not isinstance(contenido, str):
            continue

        texto = contenido.strip()
        if not texto:
            continue
        if texto == ultimo_mensaje:
            continue

        mensajes.append({"role": rol, "content": texto[:4000]})

    mensajes.append({"role": "user", "content": ultimo_mensaje[:4000]})
    return consultar_modelo(mensajes)
