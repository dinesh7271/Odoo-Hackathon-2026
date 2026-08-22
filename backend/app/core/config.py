import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Dayflow HRM API"
    ENVIRONMENT: str = "development"
    
    # Database
    # Fallback to postgresql on localhost if environment variable is not defined
    DATABASE_URL: str = "postgresql://postgres:postgrespassword@localhost:5432/dayflow"
    
    # JWT Settings (Placeholder for future authentication steps)
    SECRET_KEY: str = "secret-key-to-be-replaced-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
