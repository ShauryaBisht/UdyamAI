"""Market Risks Assessment for UdyamAI."""

from typing import Any


def assess_market_risks(
    competition_density: float,
    facility_counts: dict[str, int],
    price_volatility: str,
    population_reach: int,
) -> dict[str, Any]:
    """Assess market risks based on competition, infrastructure, volatility, and population reach.

    Args:
        competition_density: Competitor density per sq. km.
        facility_counts: Map of facility types to counts.
        price_volatility: Price volatility classification ('low', 'medium', 'high').
        population_reach: Total population reach.

    Returns:
        Dict containing overall risk level, risk flags, and mitigation recommendations.
    """
    risk_flags = []
    overall_risk_score = 0.0  # 0 to 10 scale

    if competition_density > 5.0:
        risk_flags.append("High competition density: Risk of price wars and margin compression.")
        overall_risk_score += 3.0

    if population_reach < 1000:
        risk_flags.append("Low demographic reach: Risk of insufficient local market demand.")
        overall_risk_score += 2.5

    if price_volatility == "high":
        risk_flags.append(
            "High commodity price volatility: Input cost and selling price instability risk."
        )
        overall_risk_score += 2.5

    if facility_counts.get("bank", 0) + facility_counts.get("atm", 0) == 0:
        risk_flags.append(
            "Financial infrastructure gap: Lack of formal banking/ATM access in immediate radius."
        )
        overall_risk_score += 1.5

    if facility_counts.get("cold_storage", 0) + facility_counts.get("warehouse", 0) == 0:
        risk_flags.append("Logistics infrastructure gap: Lack of storage/cold chain facilities.")
        overall_risk_score += 1.5

    risk_level = "low"
    if overall_risk_score >= 6.0:
        risk_level = "high"
    elif overall_risk_score >= 3.0:
        risk_level = "medium"

    return {
        "overall_market_risk_level": risk_level,
        "risk_score": round(overall_risk_score, 1),
        "identified_risk_flags": risk_flags,
    }
