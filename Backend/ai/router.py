import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from Backend.security import token_required
from .llm import LLMUnavailableError, chat_completion

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/ia",
    tags=["Inteligencia Artificial"],
)


class Consulta(BaseModel):
    pregunta: str = Field(min_length=1, max_length=2000)


@router.post("/chat")
async def chat(
    data: Consulta,
    current_user: int = Depends(token_required),
) -> dict[str, str]:
    del current_user
    pregunta = data.pregunta.strip()
    if not pregunta:
        raise HTTPException(
            status_code=422,
            detail="El mensaje no puede estar vacío.",
        )

    try:
        respuesta = await chat_completion(
            [
                {
                    "role": "system",
                    "content": (
                        "Eres un asistente académico del programa ADSO. "
                        "Responde en español de forma clara y precisa, "
                        "apoyando el aprendizaje de programación y desarrollo de software."
                    ),
                },
                {"role": "user", "content": pregunta},
            ]
        )
        return {"respuesta": respuesta, "reply": respuesta}
    except LLMUnavailableError as exc:
        logger.warning("El servicio LLM no está disponible para /ia/chat.")
        raise HTTPException(
            status_code=503,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.exception("Error inesperado al atender /ia/chat.")
        raise HTTPException(
            status_code=500,
            detail="No se pudo procesar la solicitud.",
        ) from exc
