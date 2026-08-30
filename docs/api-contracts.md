# 📄 UdyamAI - Phase 2 API Contracts Specification

**Version:** 1.0.0  
**Base URL:** `/api/v1`  
**Status:** Frozen for Frontend Integration  

---

> [!IMPORTANT]
> **Contract Immutability Warning**  
> Do not change contracts casually after frontend integration begins. Any required changes to endpoints, request payloads, response schemas, or field names must undergo an architectural review and version bump.

---

## 📌 Overview

This document specifies the RESTful API contracts for Phase 2 of the UdyamAI platform. The backend is built with **FastAPI**, **SQLModel / Pydantic v2**, and **PostgreSQL / PostGIS**, serving a **Next.js 14** frontend.

### General Conventions

- **Content-Type**: `application/json` for all request bodies and JSON responses.
- **Date/Time Format**: ISO 8601 extended format (`YYYY-MM-DDTHH:MM:SSZ` or `YYYY-MM-DDTHH:MM:SS.uuuuuuZ`).
- **Identifier Format**: Standard UUIDv4 strings (e.g., `3fa85f64-5717-4562-b3fc-2c963f66afa6`).
- **Pagination**: Where applicable, pagination parameters are `limit` (integer, default `20` or `50`) and `offset` (integer, default `0`).

---

## ⚠️ Standard Error Response Schema

All non-`2xx` HTTP response bodies follow the standard error structure:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Detailed error message explanation",
    "details": [
      {
        "field": "available_capital",
        "issue": "Value must be greater than or equal to 0"
      }
    ]
  }
}
```

### Common HTTP Status Codes
- `200 OK`: Successful synchronous request execution.
- `201 Created`: Resource successfully created.
- `202 Accepted`: Asynchronous processing task successfully queued.
- `400 Bad Request`: Invalid request data or validation failure.
- `404 Not Found`: Requested resource does not exist.
- `422 Unprocessable Entity`: Request body fails JSON/Pydantic validation.
- `500 Internal Server Error`: Server-side processing failure.

---

## 🗺️ Summary of Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/analysis` | `POST` | Trigger a new multi-criteria feasibility analysis run |
| `/api/v1/analysis/{analysis_id}` | `GET` | Retrieve complete details and results of an analysis run |
| `/api/v1/analysis/{analysis_id}/status` | `GET` | Poll status and progress of an analysis run |
| `/api/v1/locations/districts` | `GET` | List administrative districts filtered by state/search |
| `/api/v1/locations/talukas` | `GET` | List administrative talukas filtered by district |
| `/api/v1/locations/villages` | `GET` | List administrative villages filtered by taluka/district |
| `/api/v1/business-categories` | `GET` | List available business categories and sectors |
| `/api/v1/finance/calculate` | `POST` | Calculate project funding, loan EMI, and repayment schedule |
| `/api/v1/schemes` | `GET` | List government schemes filtered by state/agency |
| `/api/v1/schemes/match` | `POST` | Evaluate beneficiary profile against eligible government schemes |
| `/api/v1/reports/{report_id}` | `GET` | Fetch details and PDF download link for a generated report |

---

## 🔍 API Endpoint Specifications

---

### 1. `POST /api/v1/analysis`

Initiate a new feasibility, financial, market, and scheme analysis task for a micro-entrepreneur.

- **HTTP Method**: `POST`
- **Path**: `/api/v1/analysis`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <jwt_token>` *(optional depending on auth configuration)*

#### Request Body
```json
{
  "user_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "location_id": "c7a85f64-5717-4562-b3fc-2c963f66afa6",
  "business_category_id": "e2a85f64-5717-4562-b3fc-2c963f66afa7",
  "available_capital": 50000.00
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `user_id` | `UUID` | Yes | Unique ID of the entrepreneur profile |
| `location_id` | `UUID` | No | ID of the target village (`villages.id`) |
| `business_category_id` | `UUID` | No | ID of the chosen business category (`business_categories.id`) |
| `available_capital` | `float` | No | Available capital / equity investment (`>= 0`) |

#### Responses

- **`202 Accepted`** - Analysis task queued successfully.
```json
{
  "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "user_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "location_id": "c7a85f64-5717-4562-b3fc-2c963f66afa6",
  "business_category_id": "e2a85f64-5717-4562-b3fc-2c963f66afa7",
  "available_capital": 50000.00,
  "status": "pending",
  "created_at": "2026-08-30T17:15:00Z",
  "completed_at": null
}
```

- **`422 Unprocessable Entity`** - Validation error in request body.

---

### 2. `GET /api/v1/analysis/{analysis_id}`

Retrieve full results for a completed analysis run, including feasibility breakdown, financial calculations, scheme matches, and report references.

- **HTTP Method**: `GET`
- **Path**: `/api/v1/analysis/{analysis_id}`
- **Path Parameters**:
  - `analysis_id` (`UUID`, required): Unique identifier of the analysis run.

#### Responses

- **`200 OK`** - Analysis details retrieved successfully.
```json
{
  "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "user_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "location_id": "c7a85f64-5717-4562-b3fc-2c963f66afa6",
  "business_category_id": "e2a85f64-5717-4562-b3fc-2c963f66afa7",
  "available_capital": 50000.00,
  "status": "completed",
  "created_at": "2026-08-30T17:15:00Z",
  "completed_at": "2026-08-30T17:15:12Z",
  "feasibility_analysis": {
    "id": "f1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
    "market_score": 82.5,
    "financial_score": 75.0,
    "competition_score": 68.0,
    "infrastructure_score": 90.0,
    "risk_score": 25.0,
    "overall_score": 78.5,
    "recommendation": "Highly Viable - Recommend proceeding with PM-EGPE subsidy application.",
    "strengths": ["High local demand for dairy products", "Proximity to milk collection hub"],
    "weaknesses": ["Requires continuous cold storage power supply"],
    "opportunities": ["State cattle distribution scheme subsidy available"],
    "threats": ["Seasonal fluctuations in fodder pricing"],
    "risks": ["Power outage impact on refrigeration"],
    "warnings": ["Ensure back-up diesel generator arrangement"],
    "confidence": "high"
  },
  "financial_summary": {
    "estimated_project_cost": 200000.00,
    "recommended_loan": 140000.00,
    "estimated_subsidy": 50000.00,
    "estimated_monthly_emi": 1750.50
  },
  "matched_schemes": [
    {
      "scheme_id": "s1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
      "scheme_name": "PMEGP (Prime Minister's Employment Generation Programme)",
      "match_status": "potential_match",
      "match_score": 0.92,
      "estimated_subsidy_amount": 50000.00
    }
  ],
  "reports": [
    {
      "id": "r1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
      "title": "Dairy Enterprise Feasibility Study - Pune",
      "report_file_path": "/api/v1/reports/r1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c"
    }
  ]
}
```

- **`404 Not Found`** - Analysis ID not found.

---

### 3. `GET /api/v1/analysis/{analysis_id}/status`

Check the processing status and execution state of an ongoing or completed analysis run.

- **HTTP Method**: `GET`
- **Path**: `/api/v1/analysis/{analysis_id}/status`
- **Path Parameters**:
  - `analysis_id` (`UUID`, required): Unique identifier of the analysis run.

#### Responses

- **`200 OK`** - Status retrieved successfully.
```json
{
  "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "status": "running",
  "progress_percentage": 65,
  "current_step": "evaluating_scheme_rules",
  "created_at": "2026-08-30T17:15:00Z",
  "completed_at": null,
  "error_message": null
}
```

*Status Enum Values:* `pending`, `running`, `completed`, `failed`

- **`404 Not Found`** - Analysis ID not found.

---

### 4. `GET /api/v1/locations/districts`

Fetch a list of administrative districts, filtered optional by state name or search query.

- **HTTP Method**: `GET`
- **Path**: `/api/v1/locations/districts`
- **Query Parameters**:
  - `state` (`string`, optional): State filter (e.g., `Maharashtra`).
  - `search` (`string`, optional): Text query to search district name.

#### Responses

- **`200 OK`** - List of districts returned.
```json
[
  {
    "id": "d1a85f64-5717-4562-b3fc-2c963f66afa1",
    "name": "Pune",
    "state": "Maharashtra",
    "lgd_code": "521"
  },
  {
    "id": "d2a85f64-5717-4562-b3fc-2c963f66afa2",
    "name": "Nashik",
    "state": "Maharashtra",
    "lgd_code": "522"
  }
]
```

---

### 5. `GET /api/v1/locations/talukas`

Fetch administrative talukas/sub-districts filtered by district ID.

- **HTTP Method**: `GET`
- **Path**: `/api/v1/locations/talukas`
- **Query Parameters**:
  - `district_id` (`UUID`, optional): District identifier.
  - `search` (`string`, optional): Text search for taluka name.

#### Responses

- **`200 OK`** - List of talukas returned.
```json
[
  {
    "id": "t1a85f64-5717-4562-b3fc-2c963f66afa1",
    "name": "Haveli",
    "district_id": "d1a85f64-5717-4562-b3fc-2c963f66afa1",
    "lgd_code": "4185"
  },
  {
    "id": "t2a85f64-5717-4562-b3fc-2c963f66afa2",
    "name": "Baramati",
    "district_id": "d1a85f64-5717-4562-b3fc-2c963f66afa1",
    "lgd_code": "4186"
  }
]
```

---

### 6. `GET /api/v1/locations/villages`

Fetch administrative villages filtered by taluka/district with geo-coordinates and pin codes.

- **HTTP Method**: `GET`
- **Path**: `/api/v1/locations/villages`
- **Query Parameters**:
  - `taluka_id` (`UUID`, optional): Taluka identifier.
  - `district_id` (`UUID`, optional): District identifier.
  - `search` (`string`, optional): Search village name or pin code.
  - `limit` (`int`, optional, default `50`): Maximum records to return.
  - `offset` (`int`, optional, default `0`): Pagination offset.

#### Responses

- **`200 OK`** - List of villages returned.
```json
[
  {
    "id": "c7a85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Khed Shivapur",
    "district_id": "d1a85f64-5717-4562-b3fc-2c963f66afa1",
    "taluka_id": "t1a85f64-5717-4562-b3fc-2c963f66afa1",
    "gram_panchayat_id": "g1a85f64-5717-4562-b3fc-2c963f66afa1",
    "lgd_code": "556123",
    "pin_code": "412205",
    "latitude": 18.3492,
    "longitude": 73.8504
  }
]
```

---

### 7. `GET /api/v1/business-categories`

List predefined business categories (e.g., Agriculture, Manufacturing, Services, Animal Husbandry).

- **HTTP Method**: `GET`
- **Path**: `/api/v1/business-categories`
- **Query Parameters**:
  - `sector` (`string`, optional): Sector filter (e.g. `Agriculture`, `Services`).
  - `active_only` (`boolean`, optional, default `true`): Filter active categories only.

#### Responses

- **`200 OK`** - List of business categories returned.
```json
[
  {
    "id": "e2a85f64-5717-4562-b3fc-2c963f66afa7",
    "name": "Dairy Farming & Milk Processing",
    "sector": "Agriculture & Livestock",
    "description": "Small-scale cattle rearing, milk collection, and dairy product processing.",
    "active": true,
    "created_at": "2026-01-15T10:00:00Z"
  },
  {
    "id": "e3a85f64-5717-4562-b3fc-2c963f66afa8",
    "name": "Poultry Rearing",
    "sector": "Livestock",
    "description": "Broiler and layer poultry farming operations.",
    "active": true,
    "created_at": "2026-01-15T10:00:00Z"
  }
]
```

---

### 8. `POST /api/v1/finance/calculate`

Perform interactive loan EMI, capital requirement, moratorium, and repayment schedule calculations.

- **HTTP Method**: `POST`
- **Path**: `/api/v1/finance/calculate`
- **Headers**:
  - `Content-Type: application/json`

#### Request Body
```json
{
  "desired_project_cost": 200000.00,
  "available_capital": 50000.00,
  "loan_percent": 75.0,
  "interest_rate": 8.5,
  "tenure_months": 60,
  "moratorium_months": 6
}
```

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `desired_project_cost` | `float` | Yes | `gt: 0` | Total estimated startup/project cost |
| `available_capital` | `float` | Yes | `ge: 0` | Entrepreneur's equity capital |
| `loan_percent` | `float` | No | `ge: 0, le: 100` | Percentage of cost to fund via loan |
| `interest_rate` | `float` | Yes | `ge: 0, le: 100` | Annual interest rate percentage |
| `tenure_months` | `int` | Yes | `gt: 0` | Loan tenure in months |
| `moratorium_months` | `int` | No | `ge: 0` | Moratorium period in months (default `0`) |

#### Responses

- **`200 OK`** - Calculation successfully rendered.
```json
{
  "desired_project_cost": 200000.00,
  "available_capital": 50000.00,
  "required_contribution": 50000.00,
  "margin_gap": 0.00,
  "calculated_loan": 150000.00,
  "monthly_emi": 3077.20,
  "total_interest": 34632.00,
  "total_repayment": 184632.00,
  "repayment_schedule": [
    {
      "period_number": 1,
      "principal_amount": 0.00,
      "interest_amount": 1062.50,
      "payment_amount": 1062.50,
      "remaining_principal": 150000.00,
      "is_moratorium": true
    },
    {
      "period_number": 7,
      "principal_amount": 2014.70,
      "interest_amount": 1062.50,
      "payment_amount": 3077.20,
      "remaining_principal": 147985.30,
      "is_moratorium": false
    }
  ]
}
```

- **`422 Unprocessable Entity`** - Out-of-bounds inputs or missing parameters.

---

### 9. `GET /api/v1/schemes`

Query available government credit, subsidy, and micro-finance schemes.

- **HTTP Method**: `GET`
- **Path**: `/api/v1/schemes`
- **Query Parameters**:
  - `state` (`string`, optional): Target state (e.g. `Maharashtra`, `Central`).
  - `agency_name` (`string`, optional): Scheme sponsoring agency (e.g., `KVIC`, `NABARD`, `NSFDC`).
  - `active_only` (`boolean`, optional, default `true`): Return active schemes only.
  - `limit` (`int`, optional, default `20`): Pagination limit.
  - `offset` (`int`, optional, default `0`): Pagination offset.

#### Responses

- **`200 OK`** - List of matching schemes.
```json
[
  {
    "id": "s1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
    "name": "Prime Minister's Employment Generation Programme (PMEGP)",
    "description": "Credit-linked subsidy program for setup of micro-enterprises.",
    "agency_name": "KVIC / Ministry of MSME",
    "state": "Central",
    "active": true,
    "official_url": "https://www.kviconline.gov.in/pmegpeportal/",
    "source": "official_gazette",
    "created_at": "2026-01-10T12:00:00Z"
  }
]
```

---

### 10. `POST /api/v1/schemes/match`

Run eligibility engine rules against beneficiary profile metrics and return scored scheme matches.

- **HTTP Method**: `POST`
- **Path**: `/api/v1/schemes/match`
- **Headers**:
  - `Content-Type: application/json`

#### Request Body
```json
{
  "analysis_run_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "applicant_age": 28,
  "category": "OBC",
  "annual_income": 120000.00,
  "location_id": "c7a85f64-5717-4562-b3fc-2c963f66afa6",
  "business_category_id": "e2a85f64-5717-4562-b3fc-2c963f66afa7",
  "desired_project_cost": 200000.00,
  "available_capital": 50000.00
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `analysis_run_id` | `UUID` | No | Associated analysis run ID |
| `applicant_age` | `int` | No | Age of beneficiary in years |
| `category` | `string` | No | Social category (`SC`, `ST`, `OBC`, `General`, `Women`) |
| `annual_income` | `float` | No | Total annual household income |
| `location_id` | `UUID` | No | Village ID |
| `business_category_id` | `UUID` | No | Target business category ID |
| `desired_project_cost` | `float` | No | Estimated total project investment |
| `available_capital` | `float` | No | Equity capital available |

#### Responses

- **`200 OK`** - Array of scheme matches with rule breakdown.
```json
[
  {
    "scheme_id": "s1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
    "scheme_name": "PMEGP",
    "match_status": "potential_match",
    "match_score": 0.95,
    "matched_conditions": {
      "age_limit": "Eligible (28 in 18-45 range)",
      "category": "OBC Special Category Subsidy eligible (25% rural)",
      "project_cost": "Eligible (2.0L <= 25.0L max cost)"
    },
    "failed_conditions": {},
    "missing_information": {
      "educational_qualification": "Requires 8th pass certificate for project cost > 10L"
    },
    "estimated_subsidy_amount": 50000.00,
    "estimated_loan_amount": 140000.00,
    "estimated_project_cost": 200000.00,
    "verification_required": true
  }
]
```

*Match Status Enum Values:* `potential_match`, `not_matched`, `insufficient_information`

---

### 11. `GET /api/v1/reports/{report_id}`

Fetch metadata and PDF download link for a generated feasibility report.

- **HTTP Method**: `GET`
- **Path**: `/api/v1/reports/{report_id}`
- **Path Parameters**:
  - `report_id` (`UUID`, required): Unique report identifier.

#### Responses

- **`200 OK`** - Report record retrieved.
```json
{
  "id": "r1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
  "analysis_run_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "user_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "title": "Dairy Enterprise Feasibility & Scheme Report - Khed Shivapur",
  "language": "mr",
  "report_data": {
    "summary": "Feasibility score 78.5%. PMEGP subsidy recommended.",
    "generated_sections": ["Executive Summary", "Financial Viability", "Scheme Eligibility", "SWOT Analysis"]
  },
  "report_file_path": "/static/reports/report_r1a2b3c4.pdf",
  "created_at": "2026-08-30T17:15:15Z"
}
```

- **`404 Not Found`** - Report ID not found.

---

## 🔒 Contract Change Management & Freeze Policy

1. **Strict Versioning**: Any breaking change to response structure or removal of fields will require a endpoint prefix update (e.g. `/api/v2/...`).
2. **Backward Compatibility**: Non-breaking updates (such as adding new optional fields to response objects) are permitted subject to notice.
3. **Frontend Integration Freeze**: Once frontend components bind to these contracts, any modification requires consent from both backend and frontend module owners.
