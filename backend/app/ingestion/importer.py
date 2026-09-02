"""Domain importers — read → validate → normalize → insert with provenance.

Each domain has a :class:`DomainSpec` in :data:`DOMAIN_SPECS` pairing its
row validator with a mapper that builds the SQLModel instance.  The
orchestrator :func:`run_import` rejects bad rows (logged, never inserted),
resolves locations canonically, stamps provenance on every row, and records
the import in ``data_sources``.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ValidationError
from sqlalchemy.exc import IntegrityError, OperationalError
from sqlmodel import Session, select

from app.ingestion.csv_reader import read_csv_rows
from app.ingestion.normalization import resolve_village
from app.ingestion.report import ImportReport, RowError
from app.ingestion.validation import (
    AgricultureRow,
    BusinessRow,
    LivestockRow,
    LocationRow,
    MarketPriceRow,
    MarketRow,
    PopulationRow,
    WeatherRow,
)
from app.models.agriculture import Agriculture
from app.models.business import Business, BusinessCategory
from app.models.livestock import Livestock
from app.models.location import Population, Village
from app.models.market import Market, MarketPrice
from app.models.provenance import DataSource
from app.models.weather import Weather


@dataclass(frozen=True)
class Provenance:
    """Source metadata stamped onto every imported row."""

    source: str | None = None
    source_url: str | None = None
    data_year: int | None = None


@dataclass
class DomainSpec:
    """One importable domain: validator + mapper + default source label."""

    name: str
    row_model: type[BaseModel]
    import_row: Callable[..., Any | None]
    default_source: str


def _point_wkt(latitude: float | None, longitude: float | None) -> str | None:
    """WKT point for Geography columns; None unless both coords present."""
    if latitude is None or longitude is None:
        return None
    return f"POINT({longitude} {latitude})"


def _require_village(db: Session, row: Any, report: ImportReport) -> UUID:
    village_id = resolve_village(db, row, report, allow_create=not report.dry_run)
    if village_id is None:
        raise ValueError("village_name is required for this domain")
    return village_id


def _optional_village(db: Session, row: Any, report: ImportReport) -> UUID | None:
    return resolve_village(db, row, report, allow_create=not report.dry_run)


# ---------------------------------------------------------------------------
# Per-domain mappers — return a model instance, or None when nothing needs
# bulk-inserting (e.g. the locations domain writes via resolve_location).
# ---------------------------------------------------------------------------


def _import_agriculture(
    db: Session, row: AgricultureRow, prov: Provenance, report: ImportReport
) -> Agriculture:
    return Agriculture(
        location_id=_require_village(db, row, report),
        crop_name=row.crop_name,
        crop_category=row.crop_category,
        cultivated_area=row.cultivated_area,
        production=row.production,
        production_unit=row.production_unit,
        irrigated_area=row.irrigated_area,
        year=row.year,
        season=row.season,
        source=prov.source,
        source_url=prov.source_url,
        data_year=prov.data_year or row.year,
    )


def _import_livestock(
    db: Session, row: LivestockRow, prov: Provenance, report: ImportReport
) -> Livestock:
    return Livestock(
        location_id=_require_village(db, row, report),
        animal_type=row.animal_type,
        animal_count=row.animal_count,
        milk_production=row.milk_production,
        milk_production_unit=row.milk_production_unit,
        year=row.year,
        source=prov.source,
        source_url=prov.source_url,
        data_year=prov.data_year or row.year,
    )


def _import_population(
    db: Session, row: PopulationRow, prov: Provenance, report: ImportReport
) -> Population:
    return Population(
        location_id=_require_village(db, row, report),
        year=row.year,
        population_total=row.population_total,
        male_population=row.male_population,
        female_population=row.female_population,
        households=row.households,
        working_population=row.working_population,
        literacy_rate=row.literacy_rate,
        source=prov.source,
        source_url=prov.source_url,
        data_year=prov.data_year or row.year,
    )


def _import_weather(
    db: Session, row: WeatherRow, prov: Provenance, report: ImportReport
) -> Weather:
    return Weather(
        location_id=_optional_village(db, row, report),
        date=row.date,
        rainfall_mm=row.rainfall_mm,
        temperature_min=row.temperature_min,
        temperature_max=row.temperature_max,
        drought_indicator=row.drought_indicator or False,
        source=prov.source,
        source_url=prov.source_url,
        data_year=prov.data_year or (row.date.year if row.date else None),
    )


def _import_market(db: Session, row: MarketRow, prov: Provenance, report: ImportReport) -> Market:
    return Market(
        name=row.market_name,
        market_type=row.market_type,
        location_id=_optional_village(db, row, report),
        latitude=row.latitude,
        longitude=row.longitude,
        geog=_point_wkt(row.latitude, row.longitude),
        source=prov.source,
        source_url=prov.source_url,
    )


def _resolve_market(
    db: Session, row: MarketPriceRow, prov: Provenance, report: ImportReport
) -> Market | None:
    """Find a market by name; create it (unless dry-run) when absent."""
    if not row.market_name:
        return None
    market = db.exec(select(Market).where(Market.name.ilike(row.market_name))).first()
    if market:
        return market
    if report.dry_run:
        raise ValueError(f"market {row.market_name!r} not found (dry-run: creation disabled)")
    village_id = _optional_village(db, row, report)
    market = Market(
        name=row.market_name,
        market_type=row.market_type,
        location_id=village_id,
        latitude=row.latitude,
        longitude=row.longitude,
        geog=_point_wkt(row.latitude, row.longitude),
        source=prov.source,
        source_url=prov.source_url,
    )
    db.add(market)
    db.flush()  # populate ID without committing — final commit in run_import()
    db.refresh(market)
    report.warnings.append(f"created market: {row.market_name}")
    return market


def _import_market_price(
    db: Session, row: MarketPriceRow, prov: Provenance, report: ImportReport
) -> MarketPrice:
    market = _resolve_market(db, row, prov, report)
    location_id = market.location_id if market else None
    if row.village_name and (market is None or market.location_id is None):
        location_id = _optional_village(db, row, report)
    return MarketPrice(
        market_id=market.id if market else None,
        location_id=location_id,
        market_name=row.market_name,
        commodity=row.commodity,
        commodity_variety=row.commodity_variety,
        unit=row.unit,
        min_price=row.min_price,
        max_price=row.max_price,
        modal_price=row.modal_price,
        arrival_quantity=row.arrival_quantity,
        arrival_unit=row.arrival_unit,
        recorded_date=row.recorded_date,
        source=prov.source,
        source_url=prov.source_url,
    )


def _resolve_category(
    db: Session, row: BusinessRow, prov: Provenance, report: ImportReport
) -> BusinessCategory | None:
    if not row.category_name:
        return None
    category = db.exec(
        select(BusinessCategory).where(BusinessCategory.name.ilike(row.category_name))
    ).first()
    if category:
        return category
    if report.dry_run:
        raise ValueError(
            f"business category {row.category_name!r} not found (dry-run: creation disabled)"
        )
    category = BusinessCategory(name=row.category_name)
    db.add(category)
    db.flush()  # populate ID without committing — final commit in run_import()
    db.refresh(category)
    report.warnings.append(f"created business category: {row.category_name}")
    return category


def _import_business(
    db: Session, row: BusinessRow, prov: Provenance, report: ImportReport
) -> Business:
    category = _resolve_category(db, row, prov, report)
    village_id = _optional_village(db, row, report)
    return Business(
        name=row.business_name,
        business_category_id=category.id if category else None,
        location_id=village_id,
        district=row.district_name,
        taluka=row.taluka_name,
        village=row.village_name,
        address=row.address,
        latitude=row.latitude,
        longitude=row.longitude,
        geom=_point_wkt(row.latitude, row.longitude),
        source=prov.source,
        source_url=prov.source_url,
    )


def _import_location(db: Session, row: LocationRow, prov: Provenance, report: ImportReport) -> None:
    """Location hierarchy — resolve_location creates records (committed).

    Enriches the village with pin code / coordinates after resolution.
    Returns None: nothing left for the bulk insert.
    """
    village_id = _require_village(db, row, report)
    if report.dry_run:
        return None
    updates = {}
    if row.pin_code:
        updates["pin_code"] = row.pin_code
    if row.latitude is not None:
        updates["latitude"] = row.latitude
    if row.longitude is not None:
        updates["longitude"] = row.longitude
    if updates:
        village = db.get(Village, village_id)
        if village is None:
            raise ValueError(f"village {village_id} not found — cannot apply updates")
        for key, value in updates.items():
            setattr(village, key, value)
        db.add(village)
    return None


DOMAIN_SPECS: dict[str, DomainSpec] = {
    "agriculture": DomainSpec(
        "agriculture", AgricultureRow, _import_agriculture, "Government Data"
    ),
    "livestock": DomainSpec("livestock", LivestockRow, _import_livestock, "Government Data"),
    "population": DomainSpec("population", PopulationRow, _import_population, "Census of India"),
    "weather": DomainSpec("weather", WeatherRow, _import_weather, "IMD"),
    "markets": DomainSpec("markets", MarketRow, _import_market, "Government Registries"),
    "market_prices": DomainSpec("market_prices", MarketPriceRow, _import_market_price, "Agmarknet"),
    "businesses": DomainSpec("businesses", BusinessRow, _import_business, "MSME Registry"),
    "locations": DomainSpec("locations", LocationRow, _import_location, "LGD"),
}


def _record_data_source(db: Session, spec: DomainSpec, prov: Provenance) -> None:
    """Upsert one ``data_sources`` row per (source, dataset) import."""
    existing = db.exec(
        select(DataSource).where(
            DataSource.name == prov.source, DataSource.dataset_name == spec.name
        )
    ).first()
    now = datetime.now(UTC)
    if existing:
        existing.last_updated_at = now
        if prov.source_url:
            existing.url = prov.source_url
        db.add(existing)
    else:
        db.add(
            DataSource(
                name=prov.source,
                dataset_name=spec.name,
                url=prov.source_url,
                last_updated_at=now,
            )
        )
    db.commit()


def run_import(
    db: Session,
    domain: str,
    file_path: str | Path,
    source: str | None = None,
    source_url: str | None = None,
    data_year: int | None = None,
    dry_run: bool = False,
) -> ImportReport:
    """Import a CSV file into the domain's table.

    Bad rows are rejected and logged — good rows still import.  With
    ``dry_run=True`` nothing is written: locations, markets and categories
    are only resolved (creation is disabled and reported as row errors).
    """
    spec = DOMAIN_SPECS.get(domain)
    if spec is None:
        raise ValueError(f"unknown domain {domain!r} — valid: {', '.join(sorted(DOMAIN_SPECS))}")

    prov = Provenance(
        source=source or spec.default_source,
        source_url=source_url,
        data_year=data_year,
    )
    report = ImportReport(domain=spec.name, file_path=str(file_path), dry_run=dry_run)

    instances: list[Any] = []
    for raw in read_csv_rows(file_path):
        report.total_rows += 1
        try:
            row = spec.row_model.model_validate(raw.data)
        except ValidationError as exc:
            for err in exc.errors():
                field = ".".join(str(loc) for loc in err["loc"]) or None
                report.errors.append(RowError(raw.line_number, err["msg"], field))
            report.rejected += 1
            continue
        try:
            instance = spec.import_row(db, row, prov, report)
            if instance is not None:
                instances.append(instance)
            report.imported += 1
        except OperationalError:
            # DB unreachable — a per-row rejection would be misleading; abort.
            db.rollback()
            raise
        except (ValueError, TypeError, AttributeError, IntegrityError) as exc:
            report.rejected += 1
            report.errors.append(RowError(raw.line_number, str(exc)))
            db.rollback()

    if not dry_run:
        if instances:
            db.add_all(instances)
            db.commit()
        _record_data_source(db, spec, prov)

    return report
