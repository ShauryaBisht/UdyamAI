"""Test sample village demo endpoint."""


def test_get_sample_village_demo(client):
    response = client.get("/api/v1/demo/sample-village")
    assert response.status_code == 200
    data = response.json()
    assert data["is_demo"] is True
    assert "village" in data
    assert data["village"]["name"] == "Ralegan Siddhi"
    assert "entrepreneur" in data
    assert "financial_plan" in data
    assert len(data["schemes"]) >= 2
    assert len(data["cash_flow_projection"]) >= 3
    assert data["feasibility_scores"]["overall_feasibility_percent"] > 80
