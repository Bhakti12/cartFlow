import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Get the base directory of the backend project (where the .env file is located)
BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    DATABASE_URL: str
    DB_RETRY_LIMIT: int = 5
    DB_RETRY_INTERVAL_SECONDS: int = 2
    JWT_SECRET_KEY: str = "supersecretkey_change_me_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    CORS_ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"

    model_config = SettingsConfigDict(
        env_file=os.path.join(BASE_DIR, ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Generate a unique random secret key on every server startup to invalidate previous sessions
import secrets
settings.JWT_SECRET_KEY = secrets.token_hex(32)
