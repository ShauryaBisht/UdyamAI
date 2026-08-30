from sqlmodel import Session, select

from app.models.business import BusinessCategory


class BusinessService:
    @staticmethod
    def get_business_categories(db: Session) -> list[BusinessCategory]:
        statement = (
            select(BusinessCategory).where(BusinessCategory.active).order_by(BusinessCategory.name)
        )
        return db.exec(statement).all()
