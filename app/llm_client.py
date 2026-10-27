import logging
from typing import Any

import httpx

from .config import settings

logger = logging.getLogger(__name__)


class LLMUnavailableError(RuntimeError):
    """Se lanza cuando ningún proveedor de LLM está disponible."""


def _normalize_content(content: Any) -> str:
    if isinstance(content, str):
        text = content.strip()
        if text:
            return text
        return ''

    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, dict):
                if 'text' in item and isinstance(item['text'], str):
                    parts.append(item['text'])
                elif 'content' in item and isinstance(item['content'], str):
                    parts.append(item['content'])
            elif isinstance(item, str):
                parts.append(item)
        combined = ''.join(parts).strip()
        if combined:
            return combined

    if isinstance(content, dict):
        text = content.get('text')
        if isinstance(text, str):
            return text.strip()

    raise ValueError('La respuesta del proveedor no contiene texto generado válido.')


def _provider_headers(api_key: str | None) -> dict[str, str]:
    headers = {'Content-Type': 'application/json'}
    if api_key:
        headers['Authorization'] = f'Bearer {api_key}'
    return headers


async def _request_provider(*, base_url: str, api_key: str | None, model: str, messages: list[dict[str, Any]], timeout_seconds: int) -> str:
    url = f"{base_url.rstrip('/')}/chat/completions"
    payload = {
        'model': model,
        'messages': messages,
        'temperature': 0.3,
    }

    try:
        async with httpx.AsyncClient(timeout=timeout_seconds) as client:
            response = await client.post(url, json=payload, headers=_provider_headers(api_key))

            if response.status_code in {400, 401, 403}:
                raise httpx.HTTPStatusError(f'Solicitud inválida para {base_url}.', request=response.request, response=response)

            response.raise_for_status()
            data = response.json()
            choices = data.get('choices')
            if not isinstance(choices, list) or not choices:
                raise ValueError('La respuesta no contiene una lista de choices válida.')

            first_choice = choices[0]
            if not isinstance(first_choice, dict):
                raise ValueError('La primera elección de la respuesta no es un objeto válido.')

            message = first_choice.get('message')
            if not isinstance(message, dict):
                raise ValueError('La respuesta no incluye un mensaje válido.')

            reply = _normalize_content(message.get('content'))
            if not reply:
                raise ValueError('El contenido generado está vacío.')
            return reply
    except httpx.TimeoutException as exc:
        logger.warning('Timeout en proveedor LLM (%s): %s', base_url, exc)
        raise
    except httpx.HTTPError as exc:
        logger.warning('Error HTTP en proveedor LLM (%s): %s', base_url, exc)
        raise
    except ValueError as exc:
        logger.warning('Respuesta JSON inválida del proveedor (%s): %s', base_url, exc)
        raise


async def chat_completion(messages: list[dict]) -> str:
    if not isinstance(messages, list) or not messages:
        raise ValueError('Debe enviarse al menos un mensaje.')

    providers: list[tuple[str, str | None, str]] = []
    if settings.has_primary_key:
        providers.append((settings.LLM_BASE_URL, settings.primary_api_key, settings.LLM_MODEL))
    if settings.has_fallback_key:
        providers.append((settings.LLM_FALLBACK_BASE_URL, settings.fallback_api_key, settings.LLM_FALLBACK_MODEL))

    if not providers:
        raise LLMUnavailableError('No hay claves API configuradas para los proveedores LLM.')

    last_error: Exception | None = None
    for base_url, api_key, model in providers:
        try:
            return await _request_provider(base_url=base_url, api_key=api_key, model=model, messages=messages, timeout_seconds=settings.LLM_TIMEOUT_SECONDS)
        except (httpx.HTTPStatusError, httpx.HTTPError, ValueError, TypeError) as exc:
            last_error = exc
            if isinstance(exc, httpx.HTTPStatusError):
                status = exc.response.status_code if exc.response is not None else None
                if status in {400, 401, 403}:
                    logger.warning('Proveedor rechazado por solicitud inválida (%s). Sin failover automático.', status)
                    break
                logger.warning('Error recuperable del proveedor: %s', exc)
            else:
                logger.warning('Falló el proveedor LLM %s: %s', base_url, exc)

    if last_error is not None:
        raise LLMUnavailableError('Todos los proveedores LLM fallaron o no están disponibles.') from last_error
    raise LLMUnavailableError('Todos los proveedores LLM fallaron o no están disponibles.')
