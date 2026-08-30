from sqlmodel import create_engine, SQLModel, Session
from sqlalchemy import text
from app.config import settings

engine = create_engine(settings.DATABASE_URL, echo=True)

def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

def verify_db_connection() -> bool:
    """Verify that backend can communicate with PostgreSQL/Supabase database."""
    try:
        with Session(engine) as session:
            session.execute(text("SELECT 1"))
            return True
    except Exception:
        return False

