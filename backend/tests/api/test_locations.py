from unittest.mock import patch
from uuid import uuid4
from app.models.location import District, Taluka, Village

dummy_district = District(id=uuid4(), name="Pune", state="Maharashtra", lgd_code="123")
dummy_taluka = Taluka(id=uuid4(), name="Haveli", district_id=dummy_district.id, lgd_code="456")
dummy_village = Village(
    id=uuid4(),
    name="Aundh",
    district_id=dummy_district.id,
    taluka_id=dummy_taluka.id,
    gram_panchayat_id=uuid4(),
    lgd_code="789",
    pin_code="411007",
    latitude=18.5,
    longitude=73.8
)

def test_get_districts(client):
    with patch("app.api.routes.locations.LocationService.get_districts", return_value=[dummy_district]):
        response = client.get("/locations/districts")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Pune"
        assert data[0]["state"] == "Maharashtra"

def test_get_talukas(client):
    with patch("app.api.routes.locations.LocationService.get_talukas", return_value=[dummy_taluka]) as mock_get:
        response = client.get(f"/locations/talukas?district_id={dummy_district.id}")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Haveli"
        mock_get.assert_called_once()

def test_get_villages(client):
    with patch("app.api.routes.locations.LocationService.get_villages", return_value=[dummy_village]) as mock_get:
        response = client.get(f"/locations/villages?taluka_id={dummy_taluka.id}")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Aundh"
        assert data[0]["pin_code"] == "411007"
        mock_get.assert_called_once()
