from pathlib import Path

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(BACKEND_ROOT / ".env", BACKEND_ROOT / "Backend" / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        env_ignore_empty=True,
        case_sensitive=True,
    )

    GROQ_API_KEY: SecretStr | None = None
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    LLM_BASE_URL: str = "https://api.groq.com/openai/v1"
    LLM_API_KEY: SecretStr | None = None
    LLM_MODEL: str = "openai/gpt-oss-120b"
    LLM_FALLBACK_BASE_URL: str = "https://api.cerebras.ai/v1"
    LLM_FALLBACK_API_KEY: SecretStr | None = None
    LLM_FALLBACK_MODEL: str = ""
    LLM_TIMEOUT_SECONDS: int = 30

    @field_validator("LLM_BASE_URL", "LLM_FALLBACK_BASE_URL")
    @classmethod
    def normalize_base_url(cls, value: str) -> str:
        value = value.strip().rstrip("/")
        if not value:
            raise ValueError("La URL base del proveedor no puede estar vacía.")
        return value

    @field_validator("LLM_TIMEOUT_SECONDS")
    @classmethod
    def validate_timeout(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("LLM_TIMEOUT_SECONDS debe ser mayor que cero.")
        return value

    @property
    def primary_api_key(self) -> str | None:
        if self.GROQ_API_KEY is not None:
            value = self.GROQ_API_KEY.get_secret_value().strip()
            return value or None
        if self.LLM_API_KEY is not None:
            value = self.LLM_API_KEY.get_secret_value().strip()
            return value or None
        return None

    @property
    def fallback_api_key(self) -> str | None:
        if self.LLM_FALLBACK_API_KEY is None:
            return None
        value = self.LLM_FALLBACK_API_KEY.get_secret_value().strip()
        return value or None


settings = Settings()
