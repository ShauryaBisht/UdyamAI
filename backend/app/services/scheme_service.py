from sqlmodel import Session, select
from typing import List
from app.models.scheme import Scheme

class SchemeService:
    @staticmethod
    def get_schemes(db: Session) -> List[Scheme]:
        statement = select(Scheme).where(Scheme.active == True).order_by(Scheme.name)
        return db.exec(statement).all()
