"""Core PostGIS radius query engine for UdyamAI.

Provides a generic `find_within_radius` function that works with any model
having a PostGIS Geography POINT column (Village, Business, Market, Infrastructure).
"""

from sqlalchemy import func
from sqlmodel import Session, select

from app.geo.coordinates import km_to_meters

# Maps model class -> name of the PostGIS geography column
_GEO_COLUMN_MAP: dict[str, str] = {
    "Village": "geom",
    "Business": "geom",
    "Market": "geog",
    "Infrastructure": "geog",
}


def _get_geo_column(model) -> str:
    """Get the PostGIS geography column name for a model."""
    model_name = model.__name__
    if model_name not in _GEO_COLUMN_MAP:
        raise ValueError(
            f"Model '{model_name}' has no known PostGIS geography column. "
            f"Known models: {list(_GEO_COLUMN_MAP.keys())}"
        )
    return _GEO_COLUMN_MAP[model_name]


def find_within_radius(
    db: Session,
    model,
    lat: float,
    lng: float,
    radius_km: float,
    limit: int = 50,
) -> list[dict]:
    """Find all records of a given model within radius_km of (lat, lng).

    Uses PostGIS ST_DWithin for efficient spatial queries on geography columns.
    Returns list of dicts with model attributes plus distance_meters.

    Args:
        db: Database session.
        model: SQLModel table class with a PostGIS geography column.
        lat: Center latitude.
        lng: Center longitude.
        radius_km: Search radius in kilometers.
        limit: Maximum number of results (default 50, max 200).

    Returns:
        List of dicts, each containing model fields + distance_meters.
    """
    limit = min(limit, 200)
    radius_meters = km_to_meters(radius_km)
    geo_col = _get_geo_column(model)

    # Use ST_DWithin for the spatial filter and ST_Distance for sorting
    stmt = (
        select(
            model,
            func.ST_Distance(
                getattr(model, geo_col),
                func.ST_SetSRID(func.ST_MakePoint(lng, lat), 4326),
            ).label("distance_meters"),
        )
        .where(
            func.ST_DWithin(
                getattr(model, geo_col),
                func.ST_SetSRID(func.ST_MakePoint(lng, lat), 4326),
                radius_meters,
            )
        )
        .order_by("distance_meters")
        .limit(limit)
    )

    rows = db.exec(stmt).all()

    results = []
    for row in rows:
        record = row[0]  # The model instance
        distance = row[1]  # distance_meters
        record_dict = {
            **{k: v for k, v in record.__dict__.items() if not k.startswith("_")},
            "distance_meters": round(float(distance), 2),
        }
        results.append(record_dict)

    return results
