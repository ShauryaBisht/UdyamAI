# 📜 Scheme Engine Architecture — UdyamAI Platform

**Version:** 1.0.0  
**Status:** Active / Production Baseline  
**Primary Modules:** `backend/app/schemes/`, `backend/app/services/scheme_service.py`, `backend/app/models/scheme.py`

---

## 📌 1. Overview & Objective

The **UdyamAI Scheme Engine** is an intelligent, rule-based recommendation and validation engine that evaluates micro-enterprise business profiles against Indian central and state government credit-linked subsidy schemes.

By systematically modeling eligibility criteria, financial assistance formulas, margin requirements, and moratorium rules, the Scheme Engine eliminates the friction, confusion, and exploitative intermediaries that typically hinder rural entrepreneurs from accessing state support.

---

## 🏛️ 2. Core Government Schemes Modeled

The initial deployment prioritizes high-impact central and Maharashtra state schemes:

| Scheme Name | Level | Administering Agency | Target Beneficiary | Key Assistance Pattern |
|---|---|---|---|---|
| **PMEGP** (Prime Minister's Employment Generation Programme) | Central | KVIC / MSME | Non-farm micro-enterprises | 15%–35% margin money subsidy; 5%–10% beneficiary contribution |
| **PMFME** (PM Formalisation of Micro food processing Enterprises) | Central | MoFPI | Micro food processing units | 35% capital subsidy (capped at ₹10 Lakh); 10% beneficiary equity |
| **CMEGP** (Chief Minister Employment Generation Programme) | State (Maharashtra) | Directorate of Industries (GoM) | Youth & rural micro-enterprises in Maharashtra | 15%–35% capital subsidy; dedicated rural quotas |
| **Pradhan Mantri Mudra Yojana (PMMY)** | Central | Commercial / RRBs / MFI | Micro units (Shishu / Kishore / Tarun) | Collateral-free credit up to ₹10 Lakh; low interest rates |

---

## 🗄️ 3. Relational Data Architecture

```mermaid
erDiagram
    SCHEMES ||--o{ SCHEME_RULES : "governed by"
    SCHEMES ||--o{ SCHEME_MATCHES : "evaluated in"
    SCHEMES ||--o{ DOCUMENTS : "documented in"
    DOCUMENTS ||--o{ DOCUMENT_CHUNKS : "chunked into"
    ANALYSIS_RUNS ||--o{ SCHEME_MATCHES : "produces"

    SCHEMES {
        uuid id PK
        string name
        string code
        string level "central / state"
        string state "e.g. Maharashtra"
        string ministry
        string description
        string portal_url
        boolean active
    }

    SCHEME_RULES {
        uuid id PK
        uuid scheme_id FK
        string rule_name
        string beneficiary_category "general / sc / st / obc / women"
        string location_type "rural / urban"
        numeric min_project_cost
        numeric max_project_cost
        numeric beneficiary_contribution_percent
        numeric subsidy_percent
        numeric max_subsidy_amount
        numeric loan_percent
        numeric max_loan_amount
        numeric interest_rate
        int tenure_months
        int moratorium_months
        boolean active
    }

    SCHEME_MATCHES {
        uuid id PK
        uuid analysis_run_id FK
        uuid scheme_id FK
        string match_status "eligible / conditional / ineligible"
        numeric match_score "0.0 - 1.0"
        jsonb matched_conditions
        jsonb failed_conditions
        jsonb missing_information
        numeric estimated_loan_amount
        numeric estimated_project_cost
    }
```

---

## ⚙️ 4. Rule Matching Pipeline

When an analysis is requested, `match_schemes_for_analysis` executes in `backend/app/schemes/matcher.py`:

```mermaid
flowchart TD
    Profile[Entrepreneur Profile<br/>Category, Gender, Location, Available Capital] --> Fetch[Query Active Schemes & Latest Rules]
    Cost[Desired Project Cost] --> Fetch
    
    Fetch --> EvalLoc{Location Check<br/>State/District Match?}
    EvalLoc -->|No| RejectLoc[Status: Ineligible<br/>Reason: Geographic restriction]
    EvalLoc -->|Yes| EvalSector{Sector Check<br/>Eligible Business Activity?}
    
    EvalSector -->|No| RejectSec[Status: Ineligible<br/>Reason: Sector not covered]
    EvalSector -->|Yes| EvalCost{Cost Limits Check<br/>min <= Cost <= max?}
    
    EvalCost -->|Cost > Max| RejectCost[Status: Conditional / Ineligible<br/>Reason: Exceeds project cost cap]
    EvalCost -->|Cost within bounds| EvalMargin{Equity Margin Check<br/>Available Capital >= Required Margin?}
    
    EvalMargin -->|Shortfall > 0| CondMargin[Status: Partially Eligible / Conditional<br/>Flag: Margin shortfall detected]
    EvalMargin -->|Capital sufficient| FullEligible[Status: Fully Eligible<br/>Match Score: 0.90 - 1.0]

    CondMargin --> Rank[Rank Matches by Subsidy Benefit & Feasibility]
    FullEligible --> Rank
    Rank --> Out[Top Recommended Schemes Passed to Finance Engine]
```

---

## 🔍 5. RAG Verification & Traceability

1. **Document Grounding:**
   Each scheme is linked to its authoritative guideline PDF stored in the `documents` table.
2. **Chunk Level Linkage:**
   Chunks in `document_chunks` are tagged with `scheme_id`. When the Scheme Engine matches an enterprise to PMEGP, RAG retrieval automatically narrows vector searches to passages tagged with that specific `scheme_id`.
3. **Official Citation Guarantee:**
   The AI Advisor is prevented from citing rules from training memory. Citations must reference the exact document title, version, and page number retrieved from the vector store.
