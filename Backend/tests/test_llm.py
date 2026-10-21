import asyncio

import httpx
import pytest
from pydantic import SecretStr

from Backend.ai import llm


def _http_error(status_code: int) -> httpx.HTTPStatusError:
    request = httpx.Request("POST", "https://provider.example/chat/completions")
    response = httpx.Response(status_code, request=request)
    return httpx.HTTPStatusError(
        f"HTTP {status_code}",
        request=request,
        response=response,
    )


def _configure_provider(monkeypatch, prefix: str, api_key: str, model: str) -> None:
    monkeypatch.setattr(llm.settings, f"{prefix}API_KEY", SecretStr(api_key))
    monkeypatch.setattr(llm.settings, f"{prefix}MODEL", model)


def test_chat_completion_uses_fallback_after_primary_http_error(monkeypatch):
    _configure_provider(monkeypatch, "LLM_", "primary-key", "primary-model")
    _configure_provider(
        monkeypatch,
        "LLM_FALLBACK_",
        "fallback-key",
        "fallback-model",
    )
    calls = []

    async def request_provider(**kwargs):
        calls.append(kwargs["api_key"])
        if kwargs["api_key"] == "primary-key":
            raise _http_error(401)
        return "Respuesta del respaldo"

    monkeypatch.setattr(llm, "_request_provider", request_provider)

    response = asyncio.run(llm.chat_completion([{"role": "user", "content": "Hola"}]))

    assert response == "Respuesta del respaldo"
    assert calls == ["primary-key", "fallback-key"]


def test_chat_completion_uses_fallback_when_primary_is_not_configured(monkeypatch):
    _configure_provider(monkeypatch, "LLM_", "", "primary-model")
    _configure_provider(
        monkeypatch,
        "LLM_FALLBACK_",
        "fallback-key",
        "fallback-model",
    )
    calls = []

    async def request_provider(**kwargs):
        calls.append(kwargs["api_key"])
        return "Respuesta del respaldo"

    monkeypatch.setattr(llm, "_request_provider", request_provider)

    response = asyncio.run(llm.chat_completion([{"role": "user", "content": "Hola"}]))

    assert response == "Respuesta del respaldo"
    assert calls == ["fallback-key"]


def test_chat_completion_reports_when_no_provider_is_configured(monkeypatch):
    _configure_provider(monkeypatch, "LLM_", "", "primary-model")
    _configure_provider(monkeypatch, "LLM_FALLBACK_", "", "fallback-model")

    with pytest.raises(llm.LLMUnavailableError, match="No hay proveedores LLM"):
        asyncio.run(llm.chat_completion([{"role": "user", "content": "Hola"}]))
