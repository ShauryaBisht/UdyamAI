"""
Profitability & Scenario Analysis module for UdyamAI Finance Engine.
Computes worst-case, expected-case, and best-case financial scenarios and Debt Service Coverage Ratios (DSCR).
"""
from app.schemas.finance import FinancialScenarioResponse


def generate_financial_scenarios(
    monthly_revenue: float | None,
    monthly_operating_cost: float | None,
    monthly_emi: float,
) -> list[FinancialScenarioResponse]:
    """
    Generates 3 financial scenarios (worst_case, expected_case, best_case) with DSCR repayment coverage.
    """
    if monthly_revenue is None or monthly_operating_cost is None:
        return []

    scenarios_config = [
        ("worst_case", 0.80, 1.10),
        ("expected_case", 1.00, 1.00),
        ("best_case", 1.20, 0.90),
    ]

    scenario_responses: list[FinancialScenarioResponse] = []

    for name, rev_mult, exp_mult in scenarios_config:
        scen_rev = round(monthly_revenue * rev_mult, 2)
        scen_exp = round(monthly_operating_cost * exp_mult, 2)
        scen_prof = round(scen_rev - scen_exp, 2)

        coverage = None
        if monthly_emi > 0:
            coverage = round(scen_prof / monthly_emi, 2)

        scenario_responses.append(
            FinancialScenarioResponse(
                scenario_type=name,
                monthly_revenue=scen_rev,
                monthly_expenses=scen_exp,
                monthly_profit=scen_prof,
                repayment_coverage=coverage,
                cash_flow={"net_cash_flow": scen_prof},
            )
        )

    return scenario_responses
