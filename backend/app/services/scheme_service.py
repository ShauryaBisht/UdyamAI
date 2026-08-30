from sqlmodel import Session, select

from app.models.scheme import Scheme


class SchemeService:
    @staticmethod
    def get_schemes(db: Session) -> list[Scheme]:
        statement = select(Scheme).where(Scheme.active).order_by(Scheme.name)
        return db.exec(statement).all()
