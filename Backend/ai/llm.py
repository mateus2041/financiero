import logging
from typing import Any

import httpx

from .config import settings

logger = logging.getLogger(__name__)


class LLMUnavailableError(RuntimeError):
    """Error cuando ningún proveedor de IA puede responder."""


def _extract_reply(data: Any) -> str:
    """Extrae y valida el texto de la respuesta del proveedor."""

    if not isinstance(data, dict):
        raise ValueError("La respuesta del proveedor no es un JSON válido.")

    choices = data.get("choices")

    if (
        not isinstance(choices, list)
        or not choices
        or not isinstance(choices[0], dict)
    ):
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
            if isinstance(item, dict)
            and isinstance(item.get("text"), str)
        ]

        reply = "".join(text_parts).strip()

        if reply:
            return reply

    raise ValueError("El proveedor no devolvió texto.")


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

    async with httpx.AsyncClient(
        timeout=settings.LLM_TIMEOUT_SECONDS
    ) as client:
        response = await client.post(
            url,
            headers={
                "Authorization": f"Bearer {api_key.strip()}",
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


async def chat_completion(
    messages: list[dict[str, Any]],
) -> str:
    """Consulta el proveedor principal y utiliza el respaldo si falla."""

    if not isinstance(messages, list) or not messages:
        raise ValueError("Debe enviarse al menos un mensaje.")

    primary_api_key = settings.primary_api_key

    if not primary_api_key:
        raise LLMUnavailableError(
            "Falta configurar LLM_API_KEY para el proveedor principal."
        )

    providers: list[tuple[str, str, str, str]] = [
        (
            "principal",
            settings.LLM_BASE_URL,
            primary_api_key,
            settings.LLM_MODEL,
        )
    ]

    fallback_api_key = settings.fallback_api_key

    if (
        fallback_api_key
        and fallback_api_key.strip()
        and settings.LLM_FALLBACK_MODEL
        and settings.LLM_FALLBACK_MODEL.strip()
    ):
        providers.append(
            (
                "respaldo",
                settings.LLM_FALLBACK_BASE_URL,
                fallback_api_key,
                settings.LLM_FALLBACK_MODEL.strip(),
            )
        )

    if not providers:
        raise LLMUnavailableError(
            "No hay proveedores LLM configurados. "
            "Verifica las claves API y los modelos en el archivo .env."
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
            status = exc.response.status_code

            logger.warning(
                "El proveedor LLM %s respondió con HTTP %s.",
                provider_name,
                status,
            )
            last_error = exc
            if status != 429 and not 500 <= status <= 599:
                break

        except httpx.TimeoutException as exc:
            logger.warning(
                "Tiempo de espera agotado con el proveedor LLM %s.",
                provider_name,
            )
            last_error = exc

        except httpx.RequestError as exc:
            logger.warning(
                "Error de conexión con el proveedor LLM %s.",
                provider_name,
            )
            last_error = exc

        except (ValueError, TypeError) as exc:
            logger.warning(
                "Respuesta o configuración inválida del proveedor LLM %s.",
                provider_name,
            )
            last_error = exc

    raise LLMUnavailableError(
        "Ningún proveedor LLM pudo completar la solicitud. "
        "Verifica la configuración y la disponibilidad del servicio."
    ) from last_error
