"""Web API 配置."""

from __future__ import annotations

from pathlib import Path
from typing import List

from pydantic import Field, validator
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """FastAPI 服务的运行参数."""

    model_config = SettingsConfigDict(
        env_prefix="ECOMATS_WEBAPI_",
        env_file=PROJECT_ROOT / "webapi" / ".env.webapi",
        env_file_encoding="utf-8",
        extra="forbid",
    )

    api_prefix: str = "/api"
    cors_origins: List[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000"]
    )
    environment: str = "development"
    workflow_storage: Path = Field(default=PROJECT_ROOT / "outputs")

    @validator("workflow_storage", pre=True)
    def _ensure_path(cls, value):  # noqa: D401
        """将字符串转换为绝对路径，相对于项目根目录."""
        p = Path(value)
        if not p.is_absolute():
            p = PROJECT_ROOT / p
        return p.resolve()


settings = Settings()
