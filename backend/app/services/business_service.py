from sqlmodel import Session, select
from typing import List
from app.models.business import BusinessCategory

class BusinessService:
    @staticmethod
    def get_business_categories(db: Session) -> List[BusinessCategory]:
        statement = select(BusinessCategory).where(BusinessCategory.active == True).order_by(BusinessCategory.name)
        return db.exec(statement).all()
