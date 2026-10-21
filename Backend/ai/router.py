import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, ValidationError

from Backend.ai.chains import generar_respuesta
from Backend.security import token_required

logger = logging.getLogger(__name__)

ia_router = APIRouter(
    prefix="/ia",
    tags=["Inteligencia Artificial"],
)
router = ia_router


class MensajeChat(BaseModel):
    mensaje: str = Field(..., min_length=1, max_length=4000)
    historial: list[dict[str, Any]] = Field(default_factory=list)


class RespuestaChat(BaseModel):
    respuesta: str


class Consulta(BaseModel):
    pregunta: str = Field(..., min_length=1, max_length=2000)


@ia_router.post("/chat", response_model=RespuestaChat)
async def chat_bancario(
    request: Request,
    current_user: int = Depends(token_required),
):
    del current_user
    try:
        payload = await request.json()
    except Exception as exc:  # pragma: no cover - validación de entrada
        raise HTTPException(
            status_code=400,
            detail="La solicitud no contiene un JSON válido.",
        ) from exc

    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=400,
            detail="El cuerpo de la petición debe ser un objeto JSON.",
        )

    mensaje = payload.get("mensaje")
    if mensaje is None:
        mensaje = payload.get("pregunta")

    historial = payload.get("historial", [])

    try:
        datos = MensajeChat(mensaje=str(mensaje or ""), historial=historial)
    except ValidationError as exc:
        raise HTTPException(
            status_code=422,
            detail=exc.errors(),
        ) from exc

    mensaje_limpio = datos.mensaje.strip()
    if not mensaje_limpio:
        raise HTTPException(
            status_code=400,
            detail="El mensaje no puede estar vacío.",
        )

    try:
        respuesta = generar_respuesta(mensaje_limpio, datos.historial)
        return {"respuesta": respuesta}
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc
    except RuntimeError as exc:
        logger.warning("El asistente bancario no pudo responder: %s", exc)
        raise HTTPException(
            status_code=502,
            detail="No fue posible obtener una respuesta del asistente bancario.",
        ) from exc
    except Exception:
        logger.exception("Error inesperado al atender /ia/chat.")
        raise HTTPException(
            status_code=502,
            detail="No fue posible obtener una respuesta del asistente bancario.",
        )


chat = chat_bancario
