from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.schemas import (
    AnalysisRunCreate,
    BeneficiaryCategory,
    FinanceCalculateRequest,
    LocationQuery,
    ReportCreateRequest,
    SchemeMatchRequest,
    SupportedLanguage,
)


def test_analysis_run_create_valid():
    """Verify valid AnalysisRunCreate payload with village_id, business_category_id, capital."""
    data = {
        "village_id": "LGD_556123",
        "business_category_id": "dairy",
        "available_capital": 100000,
        "language": "hi",
    }
    schema = AnalysisRunCreate(**data)
    assert schema.village_id == "LGD_556123"
    assert schema.business_category_id == "dairy"
    assert schema.available_capital == 100000.0
    assert schema.language == SupportedLanguage.HI


def test_analysis_run_create_negative_capital_fails():
    """Verify available_capital cannot be negative."""
    with pytest.raises(ValidationError) as exc:
        AnalysisRunCreate(available_capital=-500)
    assert "available_capital" in str(exc.value)


def test_analysis_run_create_exceeds_max_limit_fails():
    """Verify available_capital exceeds max sensible limit (10 Cr)."""
    with pytest.raises(ValidationError) as exc:
        AnalysisRunCreate(available_capital=200_000_000.0)
    assert "available_capital" in str(exc.value)


def test_finance_calculate_request_validation():
    """Verify required fields and range validations for finance calculation request."""
    # Valid payload
    valid_data = {
        "desired_project_cost": 200000.0,
        "available_capital": 50000.0,
        "loan_percent": 75.0,
        "interest_rate": 8.5,
        "tenure_months": 60,
        "moratorium_months": 6,
    }
    req = FinanceCalculateRequest(**valid_data)
    assert req.desired_project_cost == 200000.0
    assert req.tenure_months == 60

    # Negative project cost should fail (gt=0 requirement)
    with pytest.raises(ValidationError):
        FinanceCalculateRequest(**{**valid_data, "desired_project_cost": 0})

    # Negative interest rate should fail
    with pytest.raises(ValidationError):
        FinanceCalculateRequest(**{**valid_data, "interest_rate": -1.0})

    # Tenure exceeding 360 months should fail
    with pytest.raises(ValidationError):
        FinanceCalculateRequest(**{**valid_data, "tenure_months": 400})


def test_scheme_match_request_category_and_age_validation():
    """Verify beneficiary category enum and age limits."""
    req = SchemeMatchRequest(
        applicant_age=25,
        category=BeneficiaryCategory.OBC,
        annual_income=150000.0,
    )
    assert req.category == BeneficiaryCategory.OBC
    assert req.applicant_age == 25

    # Invalid age under 18
    with pytest.raises(ValidationError):
        SchemeMatchRequest(applicant_age=15)

    # Invalid category string
    with pytest.raises(ValidationError):
        SchemeMatchRequest(category="INVALID_CATEGORY")


def test_supported_languages_validation():
    """Verify supported language enum values ('en', 'hi', 'mr')."""
    req_en = ReportCreateRequest(
        analysis_run_id=uuid4(),
        user_id=uuid4(),
        language=SupportedLanguage.EN,
    )
    assert req_en.language == "en"

    req_mr = ReportCreateRequest(
        analysis_run_id=uuid4(),
        user_id=uuid4(),
        language="mr",  # String coercion to enum
    )
    assert req_mr.language == SupportedLanguage.MR

    # Unsupported language code raises ValidationError
    with pytest.raises(ValidationError):
        ReportCreateRequest(
            analysis_run_id=uuid4(),
            user_id=uuid4(),
            language="fr",
        )


def test_location_query_bounds():
    """Verify pagination limit and search string constraints."""
    query = LocationQuery(search="Pune", limit=100, offset=0)
    assert query.limit == 100

    # Limit > 500 fails
    with pytest.raises(ValidationError):
        LocationQuery(limit=1000)

    # Negative offset fails
    with pytest.raises(ValidationError):
        LocationQuery(offset=-10)
