"""Market Service for UdyamAI.

Provides reusable data-access functions for Market, MarketPrice,
MarketAnalysis, and CompetitorAnalysis domain data.
"""

from datetime import date
from uuid import UUID

from sqlmodel import Session, col, select

from app.models.market import CompetitorAnalysis, Market, MarketAnalysis, MarketPrice


class MarketService:
    # ------------------------------------------------------------------ #
    # Markets
    # ------------------------------------------------------------------ #

    @staticmethod
    def get_markets(
        db: Session,
        market_type: str | None = None,
        location_id: UUID | None = None,
        limit: int = 50,
    ) -> list[Market]:
        """List markets with optional filters.

        Args:
            db: Database session.
            market_type: Filter by market type (e.g. "mandi", "retail").
            location_id: Filter by village location UUID.
            limit: Maximum results (default 50, max 200).
        """
        limit = min(limit, 200)
        statement = select(Market).order_by(Market.name)

        if market_type is not None:
            statement = statement.where(Market.market_type == market_type)
        if location_id is not None:
            statement = statement.where(Market.location_id == location_id)

        statement = statement.limit(limit)
        return db.exec(statement).all()

    @staticmethod
    def get_market_by_id(db: Session, market_id: UUID) -> Market | None:
        """Get a single market by ID."""
        return db.get(Market, market_id)

    # ------------------------------------------------------------------ #
    # Market Prices
    # ------------------------------------------------------------------ #

    @staticmethod
    def get_market_prices(
        db: Session,
        market_id: UUID | None = None,
        location_id: UUID | None = None,
        commodity: str | None = None,
        recorded_date: date | None = None,
        limit: int = 100,
    ) -> list[MarketPrice]:
        """List market prices with optional filters.

        Args:
            db: Database session.
            market_id: Filter by market UUID.
            location_id: Filter by village location UUID.
            commodity: Filter by commodity name (exact match).
            recorded_date: Filter by exact recorded date.
            limit: Maximum results (default 100, max 500).
        """
        limit = min(limit, 500)
        statement = select(MarketPrice).order_by(col(MarketPrice.recorded_date).desc())

        if market_id is not None:
            statement = statement.where(MarketPrice.market_id == market_id)
        if location_id is not None:
            statement = statement.where(MarketPrice.location_id == location_id)
        if commodity is not None:
            statement = statement.where(MarketPrice.commodity == commodity)
        if recorded_date is not None:
            statement = statement.where(MarketPrice.recorded_date == recorded_date)

        statement = statement.limit(limit)
        return db.exec(statement).all()

    @staticmethod
    def get_price_history(
        db: Session,
        commodity: str,
        market_id: UUID | None = None,
        location_id: UUID | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
        limit: int = 365,
    ) -> list[MarketPrice]:
        """Get price history for a commodity over time.

        Useful for trend analysis and price charts.

        Args:
            db: Database session.
            commodity: Commodity name to get history for (required).
            market_id: Optional filter by market.
            location_id: Optional filter by location.
            start_date: Optional start of date range.
            end_date: Optional end of date range.
            limit: Maximum results (default 365, max 1000).
        """
        limit = min(limit, 1000)
        statement = (
            select(MarketPrice)
            .where(MarketPrice.commodity == commodity)
            .order_by(col(MarketPrice.recorded_date).asc())
        )

        if market_id is not None:
            statement = statement.where(MarketPrice.market_id == market_id)
        if location_id is not None:
            statement = statement.where(MarketPrice.location_id == location_id)
        if start_date is not None:
            statement = statement.where(MarketPrice.recorded_date >= start_date)
        if end_date is not None:
            statement = statement.where(MarketPrice.recorded_date <= end_date)

        statement = statement.limit(limit)
        return db.exec(statement).all()

    @staticmethod
    def get_latest_prices(
        db: Session,
        market_id: UUID | None = None,
        location_id: UUID | None = None,
        limit: int = 50,
    ) -> list[MarketPrice]:
        """Get the most recent price entry for each commodity at a market/location.

        Returns one row per commodity, ordered by recorded_date descending.
        """
        limit = min(limit, 200)

        # Subquery: max recorded_date per commodity
        from sqlalchemy import func

        subq = select(
            MarketPrice.commodity,
            func.max(MarketPrice.recorded_date).label("latest_date"),
        ).group_by(MarketPrice.commodity)

        if market_id is not None:
            subq = subq.where(MarketPrice.market_id == market_id)
        if location_id is not None:
            subq = subq.where(MarketPrice.location_id == location_id)

        subq = subq.subquery()

        # Join back to get full rows
        statement = (
            select(MarketPrice)
            .join(
                subq,
                (MarketPrice.commodity == subq.c.commodity)
                & (MarketPrice.recorded_date == subq.c.latest_date),
            )
            .order_by(MarketPrice.commodity)
            .limit(limit)
        )

        return db.exec(statement).all()

    # ------------------------------------------------------------------ #
    # Market Analyses
    # ------------------------------------------------------------------ #

    @staticmethod
    def get_market_analyses(
        db: Session,
        analysis_run_id: UUID,
    ) -> list[MarketAnalysis]:
        """Get market analyses for a given analysis run."""
        statement = (
            select(MarketAnalysis)
            .where(MarketAnalysis.analysis_run_id == analysis_run_id)
            .order_by(MarketAnalysis.created_at)
        )
        return db.exec(statement).all()

    @staticmethod
    def get_competitor_analyses(
        db: Session,
        analysis_run_id: UUID,
    ) -> list[CompetitorAnalysis]:
        """Get competitor analyses for a given analysis run."""
        statement = (
            select(CompetitorAnalysis)
            .where(CompetitorAnalysis.analysis_run_id == analysis_run_id)
            .order_by(CompetitorAnalysis.created_at)
        )
        return db.exec(statement).all()

    # ------------------------------------------------------------------ #
    # Aggregation helpers
    # ------------------------------------------------------------------ #

    @staticmethod
    def get_commodities(
        db: Session,
        market_id: UUID | None = None,
        location_id: UUID | None = None,
    ) -> list[str]:
        """Get distinct commodity names available at a market or location."""
        from sqlalchemy import distinct

        statement = select(distinct(MarketPrice.commodity)).where(
            MarketPrice.commodity.is_not(None)
        )

        if market_id is not None:
            statement = statement.where(MarketPrice.market_id == market_id)
        if location_id is not None:
            statement = statement.where(MarketPrice.location_id == location_id)

        statement = statement.order_by(MarketPrice.commodity)
        return [row[0] for row in db.exec(statement).all()]

    @staticmethod
    def get_market_types(db: Session) -> list[str]:
        """Get distinct market types in the database."""
        from sqlalchemy import distinct

        statement = (
            select(distinct(Market.market_type))
            .where(Market.market_type.is_not(None))
            .order_by(Market.market_type)
        )
        return [row[0] for row in db.exec(statement).all()]
