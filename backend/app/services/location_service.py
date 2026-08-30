from uuid import UUID

from sqlmodel import Session, select

from app.models.location import District, Taluka, Village


class LocationService:
    @staticmethod
    def get_districts(db: Session) -> list[District]:
        statement = select(District).order_by(District.name)
        return db.exec(statement).all()

    @staticmethod
    def get_talukas(db: Session, district_id: UUID | None = None) -> list[Taluka]:
        statement = select(Taluka)
        if district_id:
            statement = statement.where(Taluka.district_id == district_id)
        statement = statement.order_by(Taluka.name)
        return db.exec(statement).all()

    @staticmethod
    def get_villages(db: Session, taluka_id: UUID | None = None) -> list[Village]:
        statement = select(Village)
        if taluka_id:
            statement = statement.where(Village.taluka_id == taluka_id)
        statement = statement.order_by(Village.name)
        return db.exec(statement).all()
