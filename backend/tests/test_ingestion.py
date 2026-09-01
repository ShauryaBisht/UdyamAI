"""Unit tests for the data ingestion pipeline (validation, normalization, importer)."""

import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.ingestion import run_import
from app.ingestion.csv_reader import read_csv_rows
from app.ingestion.normalization import (
    clean_str,
    parse_date,
    resolve_village,
    to_bool,
    to_float,
    to_int,
)
from app.ingestion.validation import (
    AgricultureRow,
    MarketPriceRow,
    PopulationRow,
    WeatherRow,
)

# Repo-root sample data — exercises the real CSVs end-to-end with a mocked DB.
SAMPLES = Path(__file__).resolve().parents[2] / "data" / "raw"


def write_csv(content: str) -> Path:
    """Write CSV text to a temp file and return its path."""
    f = tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False)
    f.write(content)
    f.close()
    return Path(f.name)


# ------------------------------------------------------------------ #
# csv_reader
# ------------------------------------------------------------------ #


class TestCSVReader:
    def test_reads_rows_with_line_numbers(self):
        path = write_csv("a,b\n1,2\n3,4\n")
        rows = read_csv_rows(path)
        assert len(rows) == 2
        assert rows[0].line_number == 2
        assert rows[0].data == {"a": "1", "b": "2"}
        assert rows[1].line_number == 3

    def test_strips_bom_and_whitespace(self):
        path = write_csv("﻿ name ,  value \n  x , y \n")
        rows = read_csv_rows(path)
        assert rows[0].data == {"name": "x", "value": "y"}

    def test_skips_blank_lines(self):
        path = write_csv("a,b\n1,2\n,,\n3,4\n")
        rows = read_csv_rows(path)
        assert [r.data for r in rows] == [{"a": "1", "b": "2"}, {"a": "3", "b": "4"}]

    def test_empty_file_returns_no_rows(self):
        path = write_csv("")
        assert read_csv_rows(path) == []


# ------------------------------------------------------------------ #
# Normalization helpers
# ------------------------------------------------------------------ #


class TestNormalizationHelpers:
    def test_clean_str_missing_markers(self):
        assert clean_str("  ") is None
        assert clean_str("NA") is None
        assert clean_str("N/A") is None
        assert clean_str("-") is None
        assert clean_str(" null ") is None

    def test_clean_str_keeps_values(self):
        assert clean_str("  Pune  ") == "Pune"

    def test_to_int_handles_commas_and_missing(self):
        assert to_int("1,234") == 1234
        assert to_int("") is None
        assert to_int(None) is None

    def test_to_int_rejects_garbage(self):
        with pytest.raises(ValueError):
            to_int("abc")

    def test_to_float(self):
        assert to_float(" 87.5 ") == 87.5
        assert to_float("1,234.5") == 1234.5
        assert to_float("") is None
        with pytest.raises(ValueError):
            to_float("not_a_number")

    def test_parse_date_formats(self):
        assert parse_date("2024-06-15").isoformat() == "2024-06-15"
        assert parse_date("15/06/2024").isoformat() == "2024-06-15"
        assert parse_date("15-06-2024").isoformat() == "2024-06-15"
        assert parse_date("") is None

    def test_parse_date_rejects_garbage(self):
        with pytest.raises(ValueError):
            parse_date("not-a-date")

    def test_to_bool(self):
        assert to_bool("yes") is True
        assert to_bool("0") is False
        assert to_bool("") is None
        with pytest.raises(ValueError):
            to_bool("maybe")


# ------------------------------------------------------------------ #
# Row validation
# ------------------------------------------------------------------ #


class TestRowValidation:
    def test_population_row_parses_and_ignores_extras(self):
        row = PopulationRow.model_validate(
            {
                "village_name": "Wadgaon",
                "district_name": "Pune",
                "taluka_name": "Haveli",
                "year": "2021",
                "population_total": "1,234",
                "junk_column": "ignored",
            }
        )
        assert row.year == 2021
        assert row.population_total == 1234
        assert row.literacy_rate is None

    def test_population_row_missing_year_rejected(self):
        with pytest.raises(ValidationError):
            PopulationRow.model_validate({"village_name": "x", "year": ""})

    def test_population_row_bad_year_rejected(self):
        with pytest.raises(ValidationError):
            PopulationRow.model_validate({"village_name": "x", "year": "not_a_number"})

    def test_agriculture_row_requires_crop(self):
        with pytest.raises(ValidationError):
            AgricultureRow.model_validate({"crop_name": "", "year": "2023"})

    def test_weather_row_parses_indian_date(self):
        row = WeatherRow.model_validate({"date": "15/06/2024", "drought_indicator": "yes"})
        assert row.date.isoformat() == "2024-06-15"
        assert row.drought_indicator is True

    def test_market_price_row_needs_market_or_village(self):
        with pytest.raises(ValidationError):
            MarketPriceRow.model_validate({"commodity": "Onion", "recorded_date": "2024-06-01"})

    def test_market_price_row_with_village_only_ok(self):
        row = MarketPriceRow.model_validate(
            {"commodity": "Onion", "recorded_date": "2024-06-01", "village_name": "Ozar"}
        )
        assert row.village_name == "Ozar"


# ------------------------------------------------------------------ #
# resolve_village
# ------------------------------------------------------------------ #


class TestResolveVillage:
    def _row(self, **overrides):
        data = {
            "village_name": "Wadgaon",
            "district_name": "Pune",
            "taluka_name": "Haveli",
            "year": "2021",
        }
        data.update(overrides)
        return PopulationRow.model_validate(data)

    def test_no_village_name_returns_none(self):
        report = MagicMock()
        row = self._row(village_name="")
        assert resolve_village(MagicMock(), row, report) is None

    def test_existing_hierarchy_resolved_without_creation(self):
        mock_db = MagicMock()
        with patch("app.ingestion.normalization.LocationService") as mock_ls:
            mock_ls.find_district.return_value = MagicMock(id=uuid4())
            mock_ls.find_taluka.return_value = MagicMock(id=uuid4())
            mock_ls.find_village.return_value = MagicMock(id=uuid4())
            report = MagicMock()
            report.created_locations = []
            village_id = resolve_village(mock_db, self._row(), report)
        assert village_id is not None
        mock_ls.resolve_location.assert_not_called()  # nothing was created
        assert report.created_locations == []

    def test_missing_hierarchy_creates_and_records(self):
        mock_db = MagicMock()
        report = MagicMock()
        report.created_locations = []
        ids = [uuid4(), uuid4(), uuid4()]
        with patch("app.ingestion.normalization.LocationService") as mock_ls:
            mock_ls.find_district.return_value = None
            mock_ls.find_taluka.return_value = None
            mock_ls.find_village.return_value = None
            mock_ls.resolve_location.side_effect = ids
            result = resolve_village(mock_db, self._row(), report)
        assert result == ids[2]
        assert mock_ls.resolve_location.call_count == 3

    def test_dry_run_refuses_creation(self):
        mock_db = MagicMock()
        report = MagicMock()
        report.created_locations = []
        with patch("app.ingestion.normalization.LocationService") as mock_ls:
            mock_ls.find_district.return_value = None
            with pytest.raises(ValueError, match="dry-run"):
                resolve_village(mock_db, self._row(), report, allow_create=False)

    def test_taluka_without_district_rejected(self):
        mock_db = MagicMock()
        row = self._row(district_name="")
        with pytest.raises(ValueError, match="district_name"):
            resolve_village(mock_db, row, MagicMock())

    def test_village_without_parents_rejected(self):
        mock_db = MagicMock()
        row = PopulationRow.model_validate(
            {"village_name": "X", "year": "2021", "district_name": "", "taluka_name": ""}
        )
        with pytest.raises(ValueError, match="without district_name"):
            resolve_village(mock_db, row, MagicMock())


# ------------------------------------------------------------------ #
# run_import
# ------------------------------------------------------------------ #


class TestRunImport:
    def test_unknown_domain_raises(self):
        with pytest.raises(ValueError, match="unknown domain"):
            run_import(MagicMock(), "nope", "x.csv")

    def test_population_sample_imports_with_one_rejection(self):
        mock_db = MagicMock()
        report = run_import(mock_db, "population", SAMPLES / "population" / "sample.csv")
        assert report.total_rows == 6
        assert report.imported == 5
        assert report.rejected == 1
        assert "not_a_number" in report.errors[0].message or report.errors[0].field == "year"
        assert mock_db.add_all.call_count == 1
        assert len(mock_db.add_all.call_args[0][0]) == 5
        assert mock_db.commit.call_count >= 1

    def test_provenance_stamped_on_rows(self):
        mock_db = MagicMock()
        report = run_import(
            mock_db,
            "population",
            SAMPLES / "population" / "sample.csv",
            source="Census 2021",
            source_url="https://censusindia.gov.in",
            data_year=2021,
        )
        rows = mock_db.add_all.call_args[0][0]
        for row in rows:
            assert row.source == "Census 2021"
            assert row.source_url == "https://censusindia.gov.in"
            assert row.data_year == 2021
        assert report.imported == 5

    def test_agriculture_sample(self):
        mock_db = MagicMock()
        report = run_import(mock_db, "agriculture", SAMPLES / "agriculture" / "sample.csv")
        assert report.imported == 5
        assert report.rejected == 1  # missing crop_name
        rows = mock_db.add_all.call_args[0][0]
        assert rows[0].crop_name == "Onion"
        assert rows[3].crop_name == "Bajra"  # messy whitespace stripped by pydantic? (kept)
        assert rows[0].location_id is not None

    def test_weather_sample(self):
        mock_db = MagicMock()
        report = run_import(mock_db, "weather", SAMPLES / "weather" / "sample.csv")
        assert report.imported == 5
        assert report.rejected == 1  # bad date
        rows = mock_db.add_all.call_args[0][0]
        assert rows[1].rainfall_mm is None  # missing value → NULL, not 0

    def test_market_prices_sample(self):
        mock_db = MagicMock()
        report = run_import(mock_db, "market_prices", SAMPLES / "market_prices" / "sample.csv")
        assert report.imported == 5
        assert report.rejected == 1  # no market_name or village_name
        rows = mock_db.add_all.call_args[0][0]
        assert rows[0].commodity == "Onion"

    def test_dry_run_writes_nothing(self):
        mock_db = MagicMock()
        with patch("app.ingestion.normalization.LocationService") as mock_ls:
            # existing hierarchy — resolution succeeds read-only in dry-run
            mock_ls.find_district.return_value = MagicMock(id=uuid4())
            mock_ls.find_taluka.return_value = MagicMock(id=uuid4())
            mock_ls.find_village.return_value = MagicMock(id=uuid4())
            report = run_import(
                mock_db, "population", SAMPLES / "population" / "sample.csv", dry_run=True
            )
        assert report.imported == 5
        assert report.dry_run is True
        mock_db.add_all.assert_not_called()
        mock_db.commit.assert_not_called()

    def test_bad_row_does_not_stop_good_rows(self):
        path = write_csv(
            "district_name,taluka_name,village_name,year,population_total\n"
            "Pune,Haveli,A,2021,100\n"
            "Pune,Haveli,B,xx,100\n"
            "Pune,Haveli,C,2021,300\n"
        )
        mock_db = MagicMock()
        report = run_import(mock_db, "population", path)
        assert report.imported == 2
        assert report.rejected == 1
        assert report.errors[0].line_number == 3

    def test_data_source_provenance_recorded(self):
        mock_db = MagicMock()
        run_import(mock_db, "population", SAMPLES / "population" / "sample.csv")
        # existing DataSource mock is returned by db.exec().first()
        added = mock_db.add.call_args_list
        assert len(added) >= 1  # updated existing or added new DataSource row

    def test_locations_sample_writes_hierarchy_directly(self):
        mock_db = MagicMock()
        report = run_import(mock_db, "locations", SAMPLES / "locations" / "sample.csv")
        assert report.imported == 5
        assert report.rejected == 1  # district_name missing
        # hierarchy writes happen via resolve_location, nothing bulk-inserted
        mock_db.add_all.assert_not_called()
