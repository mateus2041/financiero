import logging
import os
<<<<<<< HEAD
from pathlib import Path

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI


# =========================
# CARGAR VARIABLES .ENV
# =========================

BACKEND_ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(BACKEND_ENV_PATH, override=False)
=======
from typing import Any

import httpx
from groq import Groq

from Backend.ai.prompt import PROMPT_BANCARIO
from .config import settings

logger = logging.getLogger(__name__)


class LLMUnavailableError(RuntimeError):
    """Error cuando ningún proveedor de IA puede responder."""
>>>>>>> origin/feat/administrator-management-and-code-corrections


def _extract_reply(data: Any) -> str:
    """Extrae y valida el texto de la respuesta del proveedor."""
    if not isinstance(data, dict):
        raise ValueError("La respuesta del proveedor no es un JSON válido.")

<<<<<<< HEAD
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY") or os.getenv("LLM_API_KEY")
=======
    choices = data.get("choices")
    if not isinstance(choices, list) or not choices or not isinstance(choices[0], dict):
        raise ValueError("La respuesta no contiene choices válidas.")

    message = choices[0].get("message")
    if not isinstance(message, dict):
        raise ValueError("La respuesta no contiene un mensaje válido.")

    content = message.get("content")
    if isinstance(content, str) and content.strip():
        return content.strip()

    if isinstance(content, list):
        text_parts = [
            item["text"]
            for item in content
            if isinstance(item, dict) and isinstance(item.get("text"), str)
        ]
        reply = "".join(text_parts).strip()
        if reply:
            return reply

    raise ValueError("El proveedor no devolvió texto.")
>>>>>>> origin/feat/administrator-management-and-code-corrections


def _get_groq_api_key() -> str | None:
    env_key = os.getenv("GROQ_API_KEY") or os.getenv("LLM_API_KEY")
    if env_key and env_key.strip():
        return env_key.strip()

<<<<<<< HEAD
if OPENAI_API_KEY:
    llm = ChatOpenAI(
        model=os.getenv("LLM_MODEL") or "gpt-4.1-mini",
        temperature=0.3,
        api_key=OPENAI_API_KEY,
        base_url=os.getenv("LLM_BASE_URL") or None,
    )
else:
    llm = None
=======
    settings_key = getattr(settings, "primary_api_key", None)
    if settings_key and settings_key.strip():
        return settings_key.strip()

    fallback = getattr(settings, "fallback_api_key", None)
    if fallback and fallback.strip():
        return fallback.strip()

    return None


def consultar_modelo(mensajes):
    """Consulta Groq con el prompt bancario y valida entradas y errores."""
    if not isinstance(mensajes, list) or not mensajes:
        raise ValueError("Se requiere al menos un mensaje válido.")

    api_key = _get_groq_api_key()
    if not api_key:
        raise RuntimeError("No se ha configurado GROQ_API_KEY.")

    mensajes_validos = []
    for item in mensajes:
        if not isinstance(item, dict):
            continue

        role = item.get("role")
        content = item.get("content")
        if role not in ("user", "assistant", "system"):
            continue
        if not isinstance(content, str):
            continue

        texto = content.strip()
        if texto:
            mensajes_validos.append({"role": role, "content": texto[:4000]})

    if not mensajes_validos:
        raise ValueError("No hay mensajes válidos para consultar el modelo.")

    payload = {
        "model": "openai/gpt-oss-120b",
        "messages": [{"role": "system", "content": PROMPT_BANCARIO}, *mensajes_validos],
        "temperature": 0.3,
        "max_completion_tokens": 1024,
        "stream": False,
        "reasoning_effort": "medium",
    }

    try:
        completion = Groq(api_key=api_key).chat.completions.create(**payload)
    except TypeError:
        payload.pop("reasoning_effort", None)
        completion = Groq(api_key=api_key).chat.completions.create(**payload)
    except Exception as exc:
        logger.warning("Groq falló al responder: %s", exc)
        raise RuntimeError(
            "No fue posible obtener una respuesta del asistente bancario."
        ) from exc

    try:
        return completion.choices[0].message.content or "No pude generar una respuesta."
    except Exception:
        return "No pude generar una respuesta."


async def _request_provider(
    base_url: str,
    api_key: str,
    model: str,
    messages: list[dict[str, Any]],
) -> str:
    """Envía una solicitud compatible con OpenAI Chat Completions."""
    if not base_url or not base_url.strip():
        raise ValueError("La URL del proveedor no está configurada.")
    if not api_key or not api_key.strip():
        raise ValueError("La clave API no está configurada.")
    if not model or not model.strip():
        raise ValueError("El modelo no está configurado.")

    url = f"{base_url.strip().rstrip('/')}/chat/completions"
    async with httpx.AsyncClient(timeout=settings.LLM_TIMEOUT_SECONDS) as client:
        response = await client.post(
            url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model.strip(),
                "messages": messages,
                "temperature": 0.3,
            },
        )
        response.raise_for_status()
        return _extract_reply(response.json())


async def chat_completion(messages: list[dict[str, Any]]) -> str:
    """Consulta el proveedor principal y utiliza el respaldo si falla."""
    if not isinstance(messages, list) or not messages:
        raise ValueError("Debe enviarse al menos un mensaje.")

    providers: list[tuple[str, str, str, str]] = []
    primary_api_key = settings.primary_api_key
    if primary_api_key and settings.LLM_MODEL.strip():
        providers.append(("principal", settings.LLM_BASE_URL, primary_api_key, settings.LLM_MODEL.strip()))

    fallback_api_key = settings.fallback_api_key
    if fallback_api_key and settings.LLM_FALLBACK_MODEL and settings.LLM_FALLBACK_MODEL.strip():
        providers.append(("respaldo", settings.LLM_FALLBACK_BASE_URL, fallback_api_key, settings.LLM_FALLBACK_MODEL.strip()))

    if not providers:
        raise LLMUnavailableError(
            "No hay proveedores LLM configurados. Configura la clave y el modelo "
            "de al menos un proveedor en el archivo .env."
        )

    last_error: Exception | None = None
    for provider_name, base_url, api_key, model in providers:
        try:
            return await _request_provider(
                base_url=base_url,
                api_key=api_key,
                model=model,
                messages=messages,
            )
        except httpx.HTTPStatusError as exc:
            logger.warning("El proveedor LLM %s respondió con HTTP %s.", provider_name, exc.response.status_code)
            last_error = exc
        except httpx.TimeoutException as exc:
            logger.warning("Tiempo de espera agotado con el proveedor LLM %s.", provider_name)
            last_error = exc
        except httpx.RequestError as exc:
            logger.warning("Error de conexión con el proveedor LLM %s.", provider_name)
            last_error = exc
        except (ValueError, TypeError) as exc:
            logger.warning("Respuesta o configuración inválida del proveedor LLM %s.", provider_name)
            last_error = exc

    raise LLMUnavailableError(
        "Ningún proveedor LLM pudo completar la solicitud. Verifica la configuración y la disponibilidad del servicio."
    ) from last_error
>>>>>>> origin/feat/administrator-management-and-code-corrections
