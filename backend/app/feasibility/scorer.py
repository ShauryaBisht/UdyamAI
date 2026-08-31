"""Feasibility Scoring Engine for UdyamAI.

Computes deterministic sub-scores and overall score (0 to 100 scale)
combining Market, Finance, Competition, Infrastructure, and Risk indicators.
Zero LLM calls are made during score calculations.
"""

import os

# ------------------------------------------------------------------ #
# Configurable Scoring Weights (Must sum to 1.0)
# ------------------------------------------------------------------ #

MARKET_WEIGHT = float(os.getenv("FEASIBILITY_MARKET_WEIGHT", "0.25"))
FINANCIAL_WEIGHT = float(os.getenv("FEASIBILITY_FINANCIAL_WEIGHT", "0.25"))
COMPETITION_WEIGHT = float(os.getenv("FEASIBILITY_COMPETITION_WEIGHT", "0.20"))
INFRASTRUCTURE_WEIGHT = float(os.getenv("FEASIBILITY_INFRASTRUCTURE_WEIGHT", "0.15"))
RISK_WEIGHT = float(os.getenv("FEASIBILITY_RISK_WEIGHT", "0.15"))


def calculate_market_score(
    population_reach: int = 0,
    household_reach: int = 0,
    nearest_market_distance_km: float | None = None,
    nearby_markets_count: int = 0,
) -> float:
    """Calculate deterministic market score (0.0 to 100.0)."""
    # Population reach component (max 40 pts, benchmark 20,000 population)
    pop_score = min(40.0, (population_reach / 20000.0) * 40.0)

    # Household reach component (max 30 pts, benchmark 4,000 households)
    hh_score = min(30.0, (household_reach / 4000.0) * 30.0)

    # Market access & proximity component (max 30 pts)
    if nearby_markets_count == 0:
        access_score = 5.0
    elif nearest_market_distance_km is not None:
        if nearest_market_distance_km <= 5.0:
            access_score = 30.0
        elif nearest_market_distance_km <= 15.0:
            access_score = 20.0
        elif nearest_market_distance_km <= 30.0:
            access_score = 10.0
        else:
            access_score = 5.0
    else:
        access_score = 15.0

    score = pop_score + hh_score + access_score
    return round(min(100.0, max(0.0, score)), 1)


def calculate_financial_score(
    available_capital: float = 0.0,
    desired_project_cost: float = 0.0,
    estimated_subsidy: float = 0.0,
) -> float:
    """Calculate deterministic financial score (0.0 to 100.0)."""
    if desired_project_cost <= 0:
        return 50.0

    equity_ratio = available_capital / desired_project_cost

    # Equity contribution component (max 60 pts)
    # 30%+ equity contribution = 60 pts; linear scaling down to 0
    equity_score = min(60.0, (equity_ratio / 0.30) * 60.0)

    # Subsidy support component (max 40 pts)
    subsidy_ratio = estimated_subsidy / desired_project_cost
    subsidy_score = min(40.0, (subsidy_ratio / 0.35) * 40.0)

    score = equity_score + subsidy_score
    return round(min(100.0, max(0.0, score)), 1)


def calculate_competition_score(competition_density: float = 0.0) -> float:
    """Calculate deterministic competition score (0.0 to 100.0).

    Inversely proportional to competitor density:
    - 0.0 competitors/km² -> 100.0
    - <= 2.0 competitors/km² -> 85.0
    - <= 5.0 competitors/km² -> 65.0
    - <= 10.0 competitors/km² -> 40.0
    - > 10.0 competitors/km² -> 15.0
    """
    if competition_density <= 0.0:
        return 100.0
    elif competition_density <= 2.0:
        score = 100.0 - (competition_density / 2.0) * 15.0
    elif competition_density <= 5.0:
        score = 85.0 - ((competition_density - 2.0) / 3.0) * 20.0
    elif competition_density <= 10.0:
        score = 65.0 - ((competition_density - 5.0) / 5.0) * 25.0
    else:
        score = max(10.0, 40.0 - ((competition_density - 10.0) / 10.0) * 25.0)

    return round(min(100.0, max(0.0, score)), 1)


def calculate_infrastructure_score(facility_counts: dict[str, int] | None = None) -> float:
    """Calculate deterministic infrastructure score (0.0 to 100.0)."""
    if facility_counts is None:
        facility_counts = {}

    financial_count = facility_counts.get("bank", 0) + facility_counts.get("atm", 0)
    logistics_count = facility_counts.get("cold_storage", 0) + facility_counts.get("warehouse", 0)
    other_infra = facility_counts.get("mandi", 0) + facility_counts.get("market", 0)

    # Financial infrastructure (max 50 pts)
    fin_score = min(50.0, financial_count * 25.0)

    # Logistics & Storage infrastructure (max 40 pts)
    log_score = min(40.0, logistics_count * 20.0)

    # General market facilities (max 10 pts)
    other_score = min(10.0, other_infra * 5.0)

    score = fin_score + log_score + other_score
    return round(min(100.0, max(0.0, score)), 1)


def calculate_risk_safety_score(engine_risk_score: float = 0.0) -> float:
    """Calculate deterministic risk safety score (0.0 to 100.0).

    Engine risk score is on 0.0 to 10.0 scale (higher = riskier).
    Risk safety score inverts this scale: 0.0 risk = 100.0 safety.
    """
    safety = 100.0 - (min(10.0, max(0.0, engine_risk_score)) * 10.0)
    return round(safety, 1)


def calculate_feasibility_scores(
    population_reach: int = 0,
    household_reach: int = 0,
    nearest_market_distance_km: float | None = None,
    nearby_markets_count: int = 0,
    available_capital: float = 0.0,
    desired_project_cost: float = 0.0,
    estimated_subsidy: float = 0.0,
    competition_density: float = 0.0,
    facility_counts: dict[str, int] | None = None,
    engine_risk_score: float = 0.0,
) -> dict[str, float]:
    """Calculate all sub-scores and deterministic overall feasibility score.

    Returns:
        Dict containing:
        - market_score (0.0 - 100.0)
        - financial_score (0.0 - 100.0)
        - competition_score (0.0 - 100.0)
        - infrastructure_score (0.0 - 100.0)
        - risk_score (0.0 - 100.0)
        - overall_score (0.0 - 100.0)
    """
    mkt_s = calculate_market_score(
        population_reach=population_reach,
        household_reach=household_reach,
        nearest_market_distance_km=nearest_market_distance_km,
        nearby_markets_count=nearby_markets_count,
    )
    fin_s = calculate_financial_score(
        available_capital=available_capital,
        desired_project_cost=desired_project_cost,
        estimated_subsidy=estimated_subsidy,
    )
    comp_s = calculate_competition_score(competition_density=competition_density)
    infra_s = calculate_infrastructure_score(facility_counts=facility_counts)
    risk_s = calculate_risk_safety_score(engine_risk_score=engine_risk_score)

    overall = round(
        (mkt_s * MARKET_WEIGHT)
        + (fin_s * FINANCIAL_WEIGHT)
        + (comp_s * COMPETITION_WEIGHT)
        + (infra_s * INFRASTRUCTURE_WEIGHT)
        + (risk_s * RISK_WEIGHT),
        1,
    )

    return {
        "market_score": mkt_s,
        "financial_score": fin_s,
        "competition_score": comp_s,
        "infrastructure_score": infra_s,
        "risk_score": risk_s,
        "overall_score": min(100.0, max(0.0, overall)),
    }
