"""Market Risks Assessment Engine for UdyamAI.

Evaluates deterministic risk indicators supported by empirical data thresholds.
"""

from typing import Any


def assess_market_risks(
    competition_density: float = 0.0,
    facility_counts: dict[str, int] | None = None,
    price_volatility: str = "low",
    population_reach: int = 0,
    nearby_markets_count: int = 0,
    nearest_market_distance_km: float | None = None,
    single_market_name: str | None = None,
    is_seasonal: bool = False,
    price_volatility_score: float | None = None,
    radius_km: float = 10.0,
) -> dict[str, Any]:
    """Assess market risks based on competition, infrastructure, volatility, access, and population reach.

    Deterministic Risk Triggers:
    1. high_competitor_density: competition_density > 5.0
    2. seasonal_market: is_seasonal is True or price_volatility in ('seasonal', 'high_seasonal') or price_volatility_score >= 0.25
    3. low_market_access: nearest_market_distance_km > 10.0 or nearby_markets_count == 0
    4. single_market_dependency: nearby_markets_count == 1
    5. limited_infrastructure: zero financial (bank/atm) or zero logistics (cold_storage/warehouse) facilities
    6. price_volatility: price_volatility in ('high', 'very_high') or price_volatility_score >= 0.20
    7. low_demographic_demand: 0 < population_reach < 1000

    Returns:
        Dict containing:
        - overall_market_risk_level ('low', 'medium', 'high')
        - risk_score (0.0 to 10.0)
        - risks: List of {risk_type, severity, evidence, source} dicts
        - identified_risk_flags: List of summary strings
        - provenance: List of data sources evaluated
    """
    if facility_counts is None:
        facility_counts = {}

    risks: list[dict[str, Any]] = []
    overall_risk_score = 0.0

    # 1. high_competitor_density
    if competition_density > 5.0:
        severity = "high" if competition_density >= 10.0 else "medium"
        score_add = 3.0 if severity == "high" else 2.0
        overall_risk_score += score_add
        risks.append(
            {
                "risk_type": "high_competitor_density",
                "severity": severity,
                "evidence": f"Competitor density of {competition_density:.2f} competitors/km² exceeds the threshold of 5.0/km².",
                "source": "Normalized Business Registry",
            }
        )

    # 2. seasonal_market
    norm_vol_str = (price_volatility or "").strip().lower()
    is_seasonal_trigger = (
        is_seasonal
        or norm_vol_str in ("seasonal", "high_seasonal")
        or (price_volatility_score is not None and price_volatility_score >= 0.25)
    )
    if is_seasonal_trigger:
        severity = "high" if (price_volatility_score or 0.0) >= 0.35 else "medium"
        overall_risk_score += 2.0
        if price_volatility_score is not None:
            ev_str = f"Market exhibits seasonal trade fluctuations with price variance coefficient of {price_volatility_score:.2f}."
        else:
            ev_str = "Market activity and commodity trade in the region are subject to seasonal peak and off-peak supply cycles."
        risks.append(
            {
                "risk_type": "seasonal_market",
                "severity": severity,
                "evidence": ev_str,
                "source": "Agmarknet & Crop Seasonality Data",
            }
        )

    # 3. low_market_access
    has_low_access = (
        nearest_market_distance_km is not None and nearest_market_distance_km > 10.0
    ) or (nearby_markets_count == 0)
    if has_low_access:
        if nearby_markets_count == 0:
            severity = "high"
            ev_str = f"Zero commercial markets or mandis identified within {radius_km:.1f}km primary radius."
        elif nearest_market_distance_km is not None and nearest_market_distance_km > 20.0:
            severity = "high"
            ev_str = f"Nearest commercial market/mandi is located {nearest_market_distance_km:.1f}km away (exceeds 20km distant access threshold)."
        else:
            severity = "medium"
            ev_str = f"Nearest commercial market/mandi is located {nearest_market_distance_km:.1f}km away (exceeds 10km access threshold)."

        overall_risk_score += 2.5 if severity == "high" else 1.5
        risks.append(
            {
                "risk_type": "low_market_access",
                "severity": severity,
                "evidence": ev_str,
                "source": "Market & Mandi Registry",
            }
        )

    # 4. single_market_dependency
    if nearby_markets_count == 1:
        overall_risk_score += 1.5
        m_name_str = f" ({single_market_name})" if single_market_name else ""
        risks.append(
            {
                "risk_type": "single_market_dependency",
                "severity": "medium",
                "evidence": f"Only 1 commercial market{m_name_str} identified within {radius_km:.1f}km radius, creating single-point market dependency.",
                "source": "Market & Mandi Registry",
            }
        )

    # 5. limited_infrastructure
    financial_count = facility_counts.get("bank", 0) + facility_counts.get("atm", 0)
    logistics_count = facility_counts.get("cold_storage", 0) + facility_counts.get("warehouse", 0)

    if financial_count == 0 or logistics_count == 0:
        if financial_count == 0 and logistics_count == 0:
            severity = "high"
            ev_str = "Zero financial infrastructure (banks/ATMs) and zero storage/cold chain facilities identified in primary radius."
            score_add = 3.0
        elif financial_count == 0:
            severity = "medium"
            ev_str = "Financial infrastructure gap: Zero formal banking or ATM facilities identified within primary radius."
            score_add = 1.5
        else:
            severity = "medium"
            ev_str = "Logistics infrastructure gap: Zero cold storage or warehouse facilities identified within primary radius."
            score_add = 1.5

        overall_risk_score += score_add
        risks.append(
            {
                "risk_type": "limited_infrastructure",
                "severity": severity,
                "evidence": ev_str,
                "source": "Facilities & Infrastructure Registry",
            }
        )

    # 6. price_volatility
    is_high_vol = norm_vol_str in ("high", "very_high") or (
        price_volatility_score is not None and price_volatility_score >= 0.20
    )
    if is_high_vol:
        severity = (
            "high"
            if (norm_vol_str == "very_high" or (price_volatility_score or 0.0) >= 0.35)
            else "medium"
        )
        overall_risk_score += 2.5 if severity == "high" else 1.5
        if price_volatility_score is not None:
            ev_str = f"Commodity prices exhibit high historical volatility ({price_volatility_score * 100:.1f}% variance coefficient)."
        else:
            ev_str = (
                "Commodity prices in surrounding markets exhibit high historical price volatility."
            )
        risks.append(
            {
                "risk_type": "price_volatility",
                "severity": severity,
                "evidence": ev_str,
                "source": "Agmarknet Price Records",
            }
        )

    # 7. low_demographic_demand
    if 0 < population_reach < 1000:
        overall_risk_score += 2.0
        risks.append(
            {
                "risk_type": "low_demographic_demand",
                "severity": "medium",
                "evidence": f"Total population reach within radius is {population_reach} (below 1,000 threshold for viable local demand).",
                "source": "Census Population Data",
            }
        )

    # Risk level classification
    risk_score_capped = round(min(overall_risk_score, 10.0), 1)
    if risk_score_capped >= 6.0:
        risk_level = "high"
    elif risk_score_capped >= 3.0:
        risk_level = "medium"
    else:
        risk_level = "low"

    # Human-readable summary flags
    identified_flags = [
        f"{r['risk_type'].replace('_', ' ').title()} ({r['severity'].upper()}): {r['evidence']}"
        for r in risks
    ]

    provenance = [
        {
            "dataset_name": "Market Risk Indicators Engine",
            "source": r["source"],
            "source_url": None,
            "data_year": 2026,
            "record_count": len(risks),
            "confidence_score": "high",
        }
        for r in risks
    ]

    return {
        "overall_market_risk_level": risk_level,
        "risk_score": risk_score_capped,
        "risks": risks,
        "identified_risk_flags": identified_flags,
        "provenance": provenance,
    }
