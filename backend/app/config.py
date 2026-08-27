from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    VERSION: str = "1.0.0"
    PROJECT_NAME: str = "UdyamAI"
    DATABASE_URL: str = "postgresql://udyam_user:udyam_password@localhost:5432/udyam_db"
    SECRET_KEY: str = "supersecretjwtkey"
    
    class Config:
        env_file = ".env"

settings = Settings()
