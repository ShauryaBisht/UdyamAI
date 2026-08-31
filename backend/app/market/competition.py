"""Competitor Analysis and Market Gap Identification for UdyamAI."""

from typing import Any


def analyze_competition(
    businesses: list[dict[str, Any]],
    radius_km: float,
    target_category_id: str | None = None,
) -> dict[str, Any]:
    """Analyze competition density, distribution, and identify market gaps within a radius.

    Args:
        businesses: List of business dicts within radius.
        radius_km: Radius in kilometers.
        target_category_id: Optional string of target BusinessCategory UUID.

    Returns:
        Dict containing competitor count, competition density, category breakdown,
        identified market gaps, and provenance.
    """
    total_businesses = len(businesses)
    area_km2 = 3.14159 * radius_km * radius_km if radius_km > 0 else 1.0
    competition_density = round(total_businesses / area_km2, 2)

    category_counts: dict[str, int] = {}
    direct_competitors = 0

    sources: set[tuple[str | None, str | None, int | None]] = set()

    for b in businesses:
        cat_id = (
            str(b.get("business_category_id")) if b.get("business_category_id") else "uncategorized"
        )
        category_counts[cat_id] = category_counts.get(cat_id, 0) + 1

        if target_category_id and cat_id == str(target_category_id):
            direct_competitors += 1

        source = b.get("source")
        source_url = b.get("source_url")
        data_year = b.get("data_year")
        if source or source_url or data_year:
            sources.add((source, source_url, data_year))

    # Market gap identification
    market_gaps = []
    if competition_density < 0.5:
        market_gaps.append(
            "Low commercial saturation: Opportunity for new local retail/service ventures."
        )
    elif competition_density > 5.0:
        market_gaps.append(
            "High commercial density: Recommended focus on differentiation or specialized niche offerings."
        )

    if direct_competitors == 0 and target_category_id:
        market_gaps.append(
            "Zero direct competitors identified in radius: High first-mover advantage potential."
        )

    provenance_entries = []
    if sources:
        for s_name, s_url, s_yr in sources:
            provenance_entries.append(
                {
                    "dataset_name": "Commercial Registry / Businesses",
                    "source": s_name or "Business Directory",
                    "source_url": s_url,
                    "data_year": s_yr,
                    "record_count": total_businesses,
                    "confidence_score": "high",
                }
            )
    else:
        provenance_entries.append(
            {
                "dataset_name": "Commercial Registry / Businesses",
                "source": "Normalized Data Pipeline",
                "source_url": None,
                "data_year": None,
                "record_count": total_businesses,
                "confidence_score": "medium",
            }
        )

    return {
        "total_businesses_in_radius": total_businesses,
        "direct_competitor_count": direct_competitors if target_category_id else total_businesses,
        "competition_density_per_km2": competition_density,
        "category_distribution": category_counts,
        "identified_market_gaps": market_gaps,
        "provenance": provenance_entries,
    }
