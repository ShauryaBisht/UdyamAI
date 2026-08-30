# AI Contract — UdyamAI AI Advisor Layer

**Status:** Draft — owned by AI Engineer 1. Several fields below are drafted directly from
SQLModel tables (`backend/app/models/`) because the corresponding Pydantic response schemas
in `backend/app/schemas/` don't exist yet (`market.py` is an empty stub; `feasibility.py` only
covers `AnalysisRun`, not scores/SWOT). Anything marked **PENDING** needs reconciling once
those schemas land — don't treat this as final until then.

---

## 1. AI Input — `AnalysisContext`

Composed entirely from backend-verified data. The AI never populates any of this itself.

```json
{
  "location": {
    "village": { "id": "", "name": "", "lgd_code": "", "pin_code": "",
                 "latitude": 0.0, "longitude": 0.0,
                 "taluka_id": "", "district_id": "", "gram_panchayat_id": "" },
    "district": { "id": "", "name": "", "state": "", "lgd_code": "" },
    "taluka": { "id": "", "name": "", "lgd_code": "" }
  },
  "business": {
    "category": { "id": "", "name": "", "sector": "", "description": "" },
    "model": { "id": "", "name": "", "startup_cost_min": 0.0,
               "startup_cost_max": 0.0, "working_capital": 0.0 }
  },
  "financial": {
    "desired_project_cost": 0.0, "available_capital": 0.0,
    "required_contribution": 0.0, "margin_gap": 0.0,
    "calculated_loan": 0.0, "monthly_emi": 0.0,
    "total_interest": 0.0, "total_repayment": 0.0,
    "repayment_schedule": [
      { "period_number": 0, "principal_amount": 0.0, "interest_amount": 0.0,
        "payment_amount": 0.0, "remaining_principal": 0.0, "is_moratorium": false }
    ]
  },
  "market": {
    "_pending": "schemas/market.py is an empty stub — shape below drafted from models/market.py MarketAnalysis",
    "radius_km": 0.0, "population_estimate": 0, "household_estimate": 0,
    "market_reach_estimate": 0, "competitor_count": 0,
    "demand_indicators": {}, "distribution_channels": {},
    "pricing_indicators": {}, "market_gaps": {}, "data_confidence": ""
  },
  "competition": {
    "radius_km": 0.0, "competitor_count": 0, "competition_density": 0.0,
    "competitor_distribution": {}, "identified_gaps": {}, "data_confidence": ""
  },
  "schemes": [
    {
      "scheme": { "id": "", "name": "", "agency_name": "", "state": "", "official_url": "" },
      "rule": { "min_project_cost": 0.0, "max_project_cost": 0.0,
                "beneficiary_contribution_percent": 0.0, "loan_percent": 0.0,
                "max_loan_amount": 0.0, "interest_rate": 0.0,
                "tenure_months": 0, "moratorium_months": 0 },
      "match_status": "potential_match | not_matched | insufficient_information",
      "match_score": 0.0,
      "matched_conditions": {}, "failed_conditions": {}, "missing_information": {},
      "estimated_loan_amount": 0.0, "estimated_project_cost": 0.0,
      "verification_required": true
    }
  ],
  "feasibility": {
    "_pending": "no schemas/feasibility.py response type for scores/SWOT yet — drafted from models/analysis.py FeasibilityAnalysis",
    "market_score": 0.0, "financial_score": 0.0, "competition_score": 0.0,
    "infrastructure_score": 0.0, "risk_score": 0.0, "overall_score": 0.0,
    "recommendation": "", "strengths": {}, "weaknesses": {}, "opportunities": {},
    "threats": {}, "risks": {}, "warnings": {},
    "confidence": "", "scoring_version": ""
  },
  "language": "en"
}
```

Note: there is no separate top-level `"risks"` key — risk data already lives nested inside
`feasibility.risks` / `feasibility.warnings`. The original task-doc sketch listed `risks` as a
sibling key; don't duplicate it as a second field.

---

## 2. AI Output — `AIAdvice`

The persisted target is `models/analysis.py::AIAnalysis`, which currently has:

```
summary, recommendation, swot, opportunities, threats, risks,
pricing_strategy, business_plan, model_name, prompt_version, confidence
```

The task-doc's fuller output shape (`reasoning[]`, `financial_advice[]`, `market_advice[]`,
`competition_advice[]`, `scheme_advice[]`, `next_steps[]`, `disclaimers[]`) has **no matching
columns yet**. Two ways to close this gap — pick one with the team, don't decide unilaterally
since it touches Supabase migrations (not your file to change):

- **(a)** Request additive columns on `AIAnalysis` for the missing fields — cleanest, keeps the
  DB shape self-documenting.
- **(b)** Pack them into the existing `business_plan` JSON column under a documented sub-shape
  — no migration needed, but the DB stops being self-descriptive.

Proposed output schema (Pydantic, in `backend/app/schemas/ai.py`) pending that decision:

```json
{
  "summary": "",
  "recommendation": "",
  "reasoning": [""],
  "financial_advice": [""],
  "market_advice": [""],
  "competition_advice": [""],
  "scheme_advice": [""],
  "risks": [""],
  "next_steps": [""],
  "disclaimers": [""],
  "sources": [ { "claim": "", "source_type": "document | scheme_rule | data_source",
                 "reference_id": "" } ],
  "confidence": "high | medium | low | unverified",
  "model_name": "",
  "prompt_version": "",
  "language": "en"
}
```

---

## 3. Errors

Reuse the app-wide error envelope already defined in `backend/app/utils/errors.py`
(`detail`, `error_code`, `status_code`) rather than inventing a new shape:

```json
{ "detail": "", "error_code": "AI_PROVIDER_UNAVAILABLE", "status_code": 503 }
```

Proposed `error_code` values for the cases in the task doc's §20:

| Case | error_code |
|---|---|
| Provider unreachable | `AI_PROVIDER_UNAVAILABLE` |
| Timeout | `AI_TIMEOUT` |
| Rate limited | `AI_RATE_LIMITED` |
| Invalid/unparseable LLM output after retry | `AI_INVALID_OUTPUT` |
| Context exceeds provider limit | `AI_CONTEXT_TOO_LARGE` |
| Provider content filter triggered | `AI_CONTENT_FILTERED` |

**Open decision:** there's no `/ai` or `/chat` route wired into `main.py` yet, so it's undecided
whether AI advice is its own endpoint (these become real HTTP error responses) or gets embedded
inside the `/analysis` response (in which case AI failure should be an inline `"ai_status":
"unavailable"` field, not an HTTP error — per your task doc §21, the rest of the analysis must
stay usable if AI fails). This decides the whole error design; raise it with whoever owns the
API routes before finalizing this section.

---

## 4. Language

A plain language-code string, matching the convention already used elsewhere in the codebase
(`Document.language`, `Conversation.language`, `ReportResponse.language`): `"en" | "hi" | "mr"`.
Not full language names, not a nested object.

---

## 5. Source metadata

Two distinct provenance shapes already exist in the schema — use them, don't invent a third:

- **RAG-retrieved policy text** (scheme guideline PDFs etc.) → cite via `models/rag.py`
  `Document`/`DocumentChunk`: `document_id`, `title`, `source_name`, `source_url`,
  `page_number`, `section_title`.
- **Structured DB facts** (a scheme rule's interest rate, a market stat) → cite via the
  `Scheme`/`SchemeRule` record itself, or `models/provenance.py::DataSource` (`name`,
  `organization`, `url`, `dataset_name`, `geographic_level`, `license`, `last_updated_at`,
  `last_verified_at`) for market/geo/economic figures.

`backend/app/rag/citations.py` is AI Engineer 2's file and likely already assumes one of these
shapes for RAG citations specifically — confirm with them before finalizing rather than
guessing the citation object independently.

---

## 6. Confidence / verification status

Every existing table with a confidence-like field types it as a bare string
(`FeasibilityAnalysis.confidence`, `MarketAnalysis.data_confidence`,
`CompetitorAnalysis.data_confidence`, `AIAnalysis.confidence`) — none of them define an enum.
`SchemeMatch.verification_required` is a separate boolean, not folded into confidence.

Proposal: standardize on `"high" | "medium" | "low" | "unverified"` across the AI layer, and
keep `verification_required` as its own boolean field wherever a claim needs it — don't merge
the two concepts. This isn't enforced anywhere yet, so confirm the exact allowed values with
the team so everyone's `confidence` strings actually match.

---

## Open items to raise with the team before this is final

1. `schemas/market.py` and a feasibility-scores/SWOT response schema don't exist yet — this
   contract is drafted against DB models directly.
2. `AIAnalysis` needs either new columns or a documented sub-shape inside `business_plan` for
   the fields in §2 that don't have a column yet.
3. No confidence enum is defined anywhere in the codebase today — propose `"high"/"medium"/
   "low"/"unverified"` and get it confirmed.
4. Whether AI advice is a standalone `/ai` endpoint or embedded in `/analysis` — determines
   whether AI failure is an HTTP error or an inline degraded-state field.
5. Citation object shape for RAG-sourced claims — align with AI Engineer 2's `rag/citations.py`.