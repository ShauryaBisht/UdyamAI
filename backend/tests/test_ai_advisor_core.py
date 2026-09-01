from app.ai import context_builder, guardrails, prompts, recommendation


def test_context_builder_builds_safe_prompt_payload():
    analysis_context = {
        "location": {"village": {"name": "Khed"}, "district": {"name": "Pune"}},
        "business": {"category": {"name": "Dairy Farming"}},
        "financial": {
            "available_capital": 50000,
            "required_contribution": 60000,
            "shortfall": 10000,
            "desired_project_cost": 200000,
            "potential_loan": 150000,
        },
        "market": {
            "overall_market_score": 82,
            "demand_level": "High",
            "estimated_target_customers": 500,
        },
        "competition": {
            "total_competitors_count": 6,
            "threat_level": "low",
        },
        "schemes": [
            {"scheme": {"name": "PM FME"}, "match_status": "potential_match", "match_score": 0.8}
        ],
        "feasibility": {
            "overall_score": 76,
            "market_score": 80,
            "financial_score": 74,
            "risk_score": 35,
            "recommendation": "Moderately feasible",
        },
        "risks": [{"title": "Feed cost risk"}],
        "language": "en",
    }

    payload = context_builder.build(analysis_context)

    assert payload["business"]["category_name"] == "Dairy Farming"
    assert payload["financial"]["shortfall"] == 10000
    assert payload["feasibility"]["overall_score"] == 76
    assert "verified" in payload["summary"]["source_note"].lower()


def test_advisor_prompt_mentions_verified_data_and_json_output():
    payload = {
        "business": {"category_name": "Dairy Farming"},
        "financial": {"shortfall": 0},
        "feasibility": {"overall_score": 82},
    }

    prompt = prompts.build_advisor_prompt(payload, language="en")

    assert "verified backend data" in prompt.lower()
    assert "json" in prompt.lower()
    assert "dairy farming" in prompt.lower()


def test_guardrails_validate_keeps_valid_output_and_rejects_invented_numbers():
    good_output = {
        "summary": "Based on verified backend data, the business is feasible.",
        "recommendation": "Proceed with the plan using current risk controls.",
        "reasoning": ["Scores and funding values are based on backend analysis."],
        "financial_advice": ["Use the verified contribution requirement."],
        "market_advice": ["Use the verified market conditions."],
        "competition_advice": ["Account for local competition."],
        "scheme_advice": ["Review the matched schemes."],
        "risks": ["Cost volatility remains a key risk."],
        "next_steps": ["Validate demand before launch."],
        "disclaimers": ["This advice is based on available backend data."],
        "sources": [],
        "confidence": "medium",
        "model_name": "demo-model",
        "prompt_version": "v1",
        "language": "en",
    }

    cleaned = guardrails.validate(good_output, {"financial": {"shortfall": 0}})
    assert cleaned["summary"] == good_output["summary"]

    bad_output = dict(good_output)
    bad_output["summary"] = "The subsidy will cover 90% of the project cost."

    try:
        guardrails.validate(bad_output, {"financial": {"shortfall": 0}})
        raise AssertionError("Expected guardrail validation to reject invented subsidy claims")
    except ValueError:
        pass


def test_recommendation_explain_uses_verified_feasibility_scores():
    feasibility = {
        "overall_score": 76,
        "market_score": 80,
        "financial_score": 74,
        "risk_score": 35,
        "recommendation": "Moderately feasible",
    }

    explanation = recommendation.explain(feasibility)

    assert "76" in explanation or "Moderately feasible" in explanation
    assert "market" in explanation.lower()
    assert "financial" in explanation.lower()
