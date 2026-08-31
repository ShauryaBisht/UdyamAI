from pydantic import model_validator
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
    RAG_EMBEDDING_MODEL: str = "text-embedding-3-small"
    RAG_EMBEDDING_BATCH_SIZE: int = 50
    RAG_EMBEDDING_MAX_TOKENS_PER_MINUTE: int = 150000
    RAG_EMBEDDING_MONTHLY_BUDGET_CENTS: int = 5000  # $50/month
    RAG_EMBEDDING_ALERT_THRESHOLD_PERCENT: int = 80

    # API Rate Limiting Configuration
    API_RATE_LIMIT_REQUESTS: int = 100
    API_RATE_LIMIT_WINDOW: int = 60

    # Security Configuration
    SECRET_KEY: str | None = None

    # Default Finance Fallback Settings
    DEFAULT_BENEFICIARY_CONTRIBUTION_PERCENT: float = 10.0
    DEFAULT_INTEREST_RATE: float = 8.5
    DEFAULT_TENURE_MONTHS: int = 84
    DEFAULT_PAYMENT_FREQUENCY: str = "monthly"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @model_validator(mode="after")
    def validate_secrets(self) -> "Settings":
        if self.ENV == "production" and not self.SECRET_KEY:
            raise ValueError("SECRET_KEY must be provided in production environment")
        if not self.SECRET_KEY:
            self.SECRET_KEY = "dev_secret_key_fallback"
        return self


settings = Settings()
