from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    VERSION: str = "1.0.0"
    PROJECT_NAME: str = "UdyamAI"
    ENV: str = "development"

    # Supabase Configuration
    SUPABASE_URL: str | None = None
    SUPABASE_ANON_KEY: str | None = None
    SUPABASE_SERVICE_ROLE_KEY: str | None = None

    # Database Configuration (Direct PostgreSQL Connection)
    DATABASE_URL: str = "postgresql://udyam_user:udyam_password@localhost:5432/udyam_db"

    # AI / LLM Configuration Placeholders
    OPENAI_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None

    # CORS Configuration
    CORS_ORIGINS: list[str] = ["*"]

    # RAG Configuration
    RAG_CHUNK_SIZE: int = 800
    RAG_CHUNK_OVERLAP: int = 150

    # Security Configuration
    SECRET_KEY: str = "supersecretjwtkey"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
