import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Dayflow HRM API"
    ENVIRONMENT: str = "development"
    
    # Database
    # Fallback to sqlite locally if DATABASE_URL is not set in the environment
    DATABASE_URL: str = "sqlite:///./dayflow.db"
    
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
