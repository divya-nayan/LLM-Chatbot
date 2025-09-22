from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    APP_NAME: str = "MultiModal ChatBot"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    API_PREFIX: str = "/api/v1"

    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    DATABASE_URL: str = "sqlite+aiosqlite:///./data/chatbot.db"

    CHROMA_PERSIST_DIR: str = "./data/vectordb"

    # Groq LLM Configuration
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.1-8b-instant"  # Using Llama 3.1 (older models decommissioned)
    MAX_TOKENS: int = 4096
    TEMPERATURE: float = 0.7

    MAX_FILE_SIZE: int = 10485760
    ALLOWED_EXTENSIONS: List[str] = ["pdf", "docx", "txt", "md", "jpg", "jpeg", "png"]
    UPLOAD_DIR: str = "./data/uploads"
    PROCESSED_DIR: str = "./data/processed"

    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/app.log"

    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()