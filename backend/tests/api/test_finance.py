def test_calculate_finance_valid(client):
    """Test finance calculation with valid parameters."""
    payload = {
        "desired_project_cost": 100000.0,
        "available_capital": 25000.0,
        "loan_percent": 75.0,
        "interest_rate": 12.0,
        "tenure_months": 12,
        "moratorium_months": 0
    }
    response = client.post("/finance/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["desired_project_cost"] == 100000.0
    assert data["available_capital"] == 25000.0
    assert data["calculated_loan"] == 75000.0
    assert data["monthly_emi"] > 0
    assert len(data["repayment_schedule"]) == 12

def test_calculate_finance_moratorium(client):
    """Test finance calculation with moratorium period."""
    payload = {
        "desired_project_cost": 100000.0,
        "available_capital": 25000.0,
        "loan_percent": 75.0,
        "interest_rate": 12.0,
        "tenure_months": 12,
        "moratorium_months": 3
    }
    response = client.post("/finance/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    schedule = data["repayment_schedule"]
    assert len(schedule) == 12
    # Verify first 3 months are marked as moratorium
    for item in schedule[:3]:
        assert item["is_moratorium"] is True
        assert item["principal_amount"] == 0
    # Verify subsequent months are not moratorium
    for item in schedule[3:]:
        assert item["is_moratorium"] is False

def test_calculate_finance_invalid_cost(client):
    """Test finance calculation with invalid project cost (negative)."""
    payload = {
        "desired_project_cost": -50.0,
        "available_capital": 25000.0,
        "interest_rate": 12.0,
        "tenure_months": 12
    }
    response = client.post("/finance/calculate", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert "errors" in data
    assert data["error_code"] == "VALIDATION_ERROR"
