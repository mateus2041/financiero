from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file='.env',
        env_file_encoding='utf-8',
        extra='ignore',
        case_sensitive=True,
    )

    LLM_BASE_URL: str = 'https://api.groq.com/openai/v1'
    LLM_API_KEY: SecretStr | None = None
    LLM_MODEL: str = 'llama-3.3-70b-versatile'
    LLM_FALLBACK_BASE_URL: str = 'https://api.cerebras.ai/v1'
    LLM_FALLBACK_API_KEY: SecretStr | None = None
    LLM_FALLBACK_MODEL: str = 'llama3.1-8b'
    LLM_TIMEOUT_SECONDS: int = 30

    @field_validator('LLM_BASE_URL', 'LLM_FALLBACK_BASE_URL')
    @classmethod
    def validate_base_url(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError('La URL base del proveedor no puede estar vacía.')
        return value.rstrip('/')

    @property
    def primary_api_key(self) -> str | None:
        if self.LLM_API_KEY is None:
            return None
        value = self.LLM_API_KEY.get_secret_value().strip()
        return value or None

    @property
    def fallback_api_key(self) -> str | None:
        if self.LLM_FALLBACK_API_KEY is None:
            return None
        value = self.LLM_FALLBACK_API_KEY.get_secret_value().strip()
        return value or None

    @property
    def has_primary_key(self) -> bool:
        return bool(self.primary_api_key)

    @property
    def has_fallback_key(self) -> bool:
        return bool(self.fallback_api_key)


settings = Settings()
