"""Core PostGIS radius query engine for UdyamAI.

Provides a generic `find_within_radius` function that works with any model
having a PostGIS Geography POINT column (Village, Business, Market, Infrastructure).
"""

from __future__ import annotations

from typing import Any

from geoalchemy2 import Geography
from sqlalchemy import literal_column
from sqlalchemy import func
from sqlalchemy.sql.elements import ClauseElement
from sqlmodel import Session, select

from app.geo.coordinates import km_to_meters

# ---------------------------------------------------------------------------
# Geo-column discovery
# ---------------------------------------------------------------------------

# Manual mapping kept as a fast-path / documentation of expected columns.
_GEO_COLUMN_MAP: dict[str, str] = {
    "Village": "geom",
    "Business": "geom",
    "Market": "geog",
    "Infrastructure": "geog",
}


def _introspect_geo_column(model: type) -> str | None:
    """Try to find a Geography column on *model* by inspecting its SA columns."""
    for attr_name in dir(model):
        try:
            attr = getattr(model, attr_name)
        except Exception:  # noqa: BLE001
            continue
        sa_col = getattr(attr, "property", None)
        if sa_col is None:
            continue
        col_type = getattr(sa_col.columns[0].type if hasattr(sa_col, "columns") else sa_col, "type", None)
        if isinstance(col_type, Geography):
            return attr_name
    return None


def _get_geo_column(model: type, *, explicit: str | None = None) -> str:
    """Get the PostGIS geography column name for a model.

    Resolution order:
    1. Explicit override passed by the caller.
    2. Hard-coded ``_GEO_COLUMN_MAP``.
    3. Introspection of the model's SA columns.
    """
    if explicit:
        return explicit

    model_name = model.__name__
    if model_name in _GEO_COLUMN_MAP:
        return _GEO_COLUMN_MAP[model_name]

    introspected = _introspect_geo_column(model)
    if introspected:
        return introspected

    raise ValueError(
        f"Model '{model_name}' has no known PostGIS geography column. "
        f"Known models: {list(_GEO_COLUMN_MAP.keys())}. "
        f"Pass an explicit geo_column or add an entry to _GEO_COLUMN_MAP."
    )


# ---------------------------------------------------------------------------
# Radius query
# ---------------------------------------------------------------------------


def find_within_radius(
    db: Session,
    model: type,
    lat: float,
    lng: float,
    radius_km: float,
    limit: int = 50,
    *,
    filters: list[ClauseElement] | None = None,
    geo_column: str | None = None,
) -> list[dict[str, Any]]:
    """Find all records of *model* within *radius_km* of (lat, lng).

    Uses PostGIS ``ST_DWithin`` for efficient spatial queries on geography
    columns and returns results sorted nearest-first.

    Args:
        db: Database session.
        model: SQLModel table class with a PostGIS geography column.
        lat: Center latitude.
        lng: Center longitude.
        radius_km: Search radius in kilometers.
        limit: Maximum number of results (default 50, max 200).
        filters: Optional list of additional SQLAlchemy WHERE predicates
            applied **in the database query** (not in Python).  For example::

                [Business.business_category_id == cat_id]

        geo_column: Optional override for the geography column name.
            When *None*, the column is resolved automatically.

    Returns:
        List of dicts, each containing model fields + ``distance_meters``.
    """
    limit = min(limit, 200)
    radius_meters = km_to_meters(radius_km)
    geo_col = _get_geo_column(model, explicit=geo_column)

    # Build the spatial filter
    geom = getattr(model, geo_col)
    point = func.ST_SetSRID(func.ST_MakePoint(lng, lat), 4326)

    stmt = (
        select(
            model,
            func.ST_Distance(geom, point).label("distance_meters"),
        )
        .where(func.ST_DWithin(geom, point, radius_meters))
    )

    # Apply additional non-spatial filters in the DB
    if filters:
        for f in filters:
            stmt = stmt.where(f)

    # Use literal_column for explicit, robust ordering on the computed label
    stmt = stmt.order_by(literal_column("distance_meters")).limit(limit)

    rows = db.exec(stmt).all()

    results: list[dict[str, Any]] = []
    for row in rows:
        record = row[0]  # The model instance
        distance = row[1]  # distance_meters
        record_dict = {
            **{k: v for k, v in record.__dict__.items() if not k.startswith("_")},
            "distance_meters": round(float(distance), 2),
        }
        results.append(record_dict)

    return results
