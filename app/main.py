import logging

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from .llm_client import LLMUnavailableError, chat_completion

logger = logging.getLogger(__name__)

app = FastAPI(title='Chatbot ADSO', version='1.0.0')


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    reply: str


SYSTEM_PROMPT = (
    'Eres un asistente académico del programa ADSO. Responde en español, con lenguaje claro y preciso, '
    'y enfócate en apoyar el aprendizaje de tecnologías, programación y desarrollo de software.'
)


@app.get('/health')
async def healthcheck() -> dict[str, str]:
    return {'status': 'ok'}


@app.post('/chat', response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest) -> ChatResponse:
    try:
        reply = await chat_completion([
            {'role': 'system', 'content': SYSTEM_PROMPT},
            {'role': 'user', 'content': payload.message},
        ])
        return ChatResponse(reply=reply)
    except LLMUnavailableError as exc:
        logger.warning('LLM no disponible: %s', exc)
        raise HTTPException(status_code=503, detail='El servicio de IA no está disponible temporalmente.') from exc
    except Exception as exc:
        logger.exception('Error inesperado al atender /chat')
        raise HTTPException(status_code=500, detail='No se pudo procesar la solicitud.') from exc
