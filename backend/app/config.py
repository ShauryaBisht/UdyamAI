from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional

class Settings(BaseSettings):
    VERSION: str = "1.0.0"
    PROJECT_NAME: str = "UdyamAI"
    ENV: str = "development"
    
    # Supabase Configuration
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    
    # Database Configuration (Direct PostgreSQL Connection)
    DATABASE_URL: str = "postgresql://udyam_user:udyam_password@localhost:5432/udyam_db"
    
    # AI / LLM Configuration Placeholders
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = ["*"]
    
    # Security Configuration
    SECRET_KEY: str = "supersecretjwtkey"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

