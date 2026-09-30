from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    PORT: int = 8000
    HOST: str = "0.0.0.0"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    # LLM Settings
    LLM_PROVIDER: str = "mock"  # "mock", "openai", "anthropic", "gemini"
    LLM_MODEL: str = "gpt-4o-mini"
    LLM_API_KEY: str = ""

    # Priority Scoring Weights
    SEVERITY_WEIGHT: float = 0.40
    URGENCY_WEIGHT: float = 0.30
    PEOPLE_AT_RISK_WEIGHT: float = 0.30

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
