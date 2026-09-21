# 🏛️ System Architecture — UdyamAI Platform

**Version:** 1.0.0  
**Status:** Active / Production Baseline  
**Primary Implementations:** `backend/app/main.py`, `backend/app/services/`, `backend/app/api/routes/`

---

## 📌 1. Executive Overview

**UdyamAI** is an AI-powered micro-enterprise feasibility and financial advisory platform designed specifically for rural and semi-urban entrepreneurs across India. The platform bridges the information gap between grassroots entrepreneurs, verified government subsidy programs (such as PMEGP, PMFME, Mudra, CMEGP), commercial credit institutions, and hyper-local market dynamics.

### Core Architectural Axiom
> [!IMPORTANT]
> **Deterministic Foundation, Grounded Advisory (Zero Invention Rule)**
> All financial arithmetic, eligibility scoring, competitor spatial counting, and feasibility indices are computed exclusively by deterministic Python engines. Large Language Models (LLMs) are **strictly forbidden** from inventing or altering calculations. The AI layer acts as a synthesized advisory and translation interface, grounded by Retrieval-Augmented Generation (RAG) with verifiable citations back to official scheme documentation.

---

## 🗺️ 2. High-Level System Topology

```mermaid
graph TB
    subgraph Client Layer
        Web[Next.js 14 App Router<br/>React + TailwindCSS + Lucide]
        WA[WhatsApp / Twilio Channel<br/>Regional Conversational Ingress]
    end

    subgraph Edge & Ingress
        Nginx[Reverse Proxy / SSL / CORS]
        RL[Rate Limiter<br/>SlowAPI / In-memory & IP Window]
    end

    subgraph Application Server (FastAPI)
        Router[API Gateway & Router Registration<br/>Dual Mount: / and /api/v1/]
        AuthDep[Supabase Auth Guard<br/>JWT Verification: HS256 & ES256 via JWKS]
        
        Orch[Analysis Orchestrator<br/>12-Step Transactional Workflow]
        
        subgraph Domain Services
            GeoServ[Location Service<br/>Village/Taluka/District Hierarchy]
            MktServ[Market & Competition Engine<br/>PostGIS 10km Spatial Buffers]
            FinServ[Finance Engine<br/>Deterministic Cost, EMI, Scenarios]
            SchServ[Scheme Matcher<br/>Rule-based Eligibility Matrix]
            FeasServ[Feasibility Engine<br/>Weighted Index & SWOT Synthesis]
        end

        subgraph AI & Evidence Layer
            RAG[RAG Retriever<br/>pgvector Cosine Similarity]
            Advisor[AI Advisor Pipeline<br/>Context Builder -> LLM -> Guardrails]
            Fallback[Grounded Deterministic Fallback<br/>Rule-based Fail-Safe Engine]
        end
    end

    subgraph Data & Storage Layer (Supabase Managed PostgreSQL)
        Postgres[(PostgreSQL 15 Engine)]
        PostGIS[(PostGIS Spatial Extension<br/>Geographies, Buffers, Points)]
        PgVector[(pgvector Extension<br/>1536-dim Embedding Chunks)]
        RLS[(Row-Level Security<br/>Tenant Data Isolation)]
        Triggers[(Auth Triggers<br/>auth.users -> public.profiles)]
    end

    Web -->|HTTPS + Supabase Session Token| Router
    WA -->|Inbound Webhook POST| Router
    Router --> RL --> AuthDep
    AuthDep --> Orch

    Orch --> GeoServ
    Orch --> MktServ
    Orch --> FinServ
    Orch --> SchServ
    Orch --> FeasServ
    Orch --> Advisor

    GeoServ --> PostGIS
    MktServ --> PostGIS
    FinServ --> Postgres
    SchServ --> Postgres
    FeasServ --> Postgres
    RAG --> PgVector

    Advisor -->|Retrieve Evidence| RAG
    Advisor -.->|If LLM Fails| Fallback
    Advisor -->|Persist Reports| Postgres
```

---

## 🎯 3. Core Architectural Decisions

### A. Why Supabase is Used
1. **Unified Storage Engine (Relational + Spatial + Vector):**
   Instead of orchestrating separate databases (e.g., PostgreSQL for relational data, Pinecone/Qdrant for vectors, and a dedicated spatial database), Supabase provides standard PostgreSQL with first-class extensions:
   - **PostGIS:** Required for spatial queries (finding villages within radius, calculating competitor density per km², buffering market catchment areas).
   - **`pgvector`:** Stores 1536-dimensional embeddings of government scheme guidelines and operational manuals directly alongside scheme metadata, enabling transactional consistency and single-database backups.
2. **Built-in Supabase Auth:**
   Replaces previous phone OTP and email OTP architectures (which depended on paid third-party SMS providers like Twilio for basic sign-in). Provides production-grade email/password authentication, JWT signing with support for both legacy HS256 project secrets and modern ES256 key rotation via `/.well-known/jwks.json`, and automatic profile synchronization via database triggers (`on_auth_user_created`).
3. **Row-Level Security (RLS):**
   Ensures data ownership at the database tier. Tenant-owned records (`expenses`, `cash_flow`, `budgets`, `analysis_runs`) are guarded such that compromised application queries cannot leak data across entrepreneurs.

### B. Why RAG (Retrieval-Augmented Generation) is Used
1. **Elimination of Scheme Hallucinations:**
   Government subsidy programs (e.g., PMFME 35% capital subsidy capped at ₹10 Lakh; PMEGP 15–35% margin money based on social category and location) are governed by strict, legally binding operational guidelines. LLMs inherently hallucinate or blend outdated policy rules.
2. **Auditability and Strict Provenance:**
   Every recommendation provided to an entrepreneur must cite official sources (issuing ministry/department, guideline document version, exact page number, and section title).
3. **Explicit Conflict & Gap Detection:**
   If official documentation is missing or contradictory across guideline revisions, the RAG contract explicitly surfaces `no_relevant_evidence` or `conflicting_sources`, instructing the AI Advisor to inform the user transparently rather than inventing terms.

### C. Why Maharashtra-First Geographic Scope
1. **Administrative Data Density:**
   Maharashtra represents one of India's most economically diverse micro-enterprise landscapes, encompassing 36 districts, 350+ talukas, and 40,000+ inhabited villages. The Local Government Directory (LGD) coding hierarchy in Maharashtra is robustly standardized.
2. **Rich Economic & Market Ground Truth:**
   Comprehensive open datasets exist for Maharashtra agricultural market committees (APMC mandi arrival volumes and modal prices), MSME registrations, and village infrastructure access (electrification, road connectivity, water resources).
3. **Dual Scheme Ecosystem (Central + State):**
   Maharashtra operates progressive state-specific entrepreneurship initiatives (such as the Chief Minister Employment Generation Programme — CMEGP) alongside central schemes (PMEGP, Mudra, PMFME). This creates the ideal testbed for multi-tiered eligibility resolution.
4. **Multilingual Validation:**
   Serves as the primary validation ground for trilingual operations: Marathi (`mr`), Hindi (`hi`), and English (`en`).

---

## ⚙️ 4. Component Interactions & Service Matrix

The backend is partitioned into dedicated domain services orchestrated by `AnalysisOrchestrator`:

| Component | Responsibility | Inputs | Outputs | Primary Database Entities |
|---|---|---|---|---|
| **API Gateway** (`main.py`, `app/api/routes/`) | HTTP ingress, CORS, route rate limiting, Supabase session validation | HTTP Request, Bearer JWT | HTTP JSON Responses | N/A |
| **Auth Service** (`auth_service.py`, `deps.py`) | Verifies HS256/ES256 Supabase JWTs, resolves/creates app `Profile` | Authorization header | `AuthUser`, `Profile` | `auth.users`, `profiles` |
| **Analysis Orchestrator** (`analysis_orchestrator.py`) | Sequentially executes the 12-step feasibility pipeline across domain services | `AnalysisRunCreate`, DB session | `AnalysisRun`, `AIAnalysis`, `Report` | `analysis_runs`, `ai_analyses`, `reports` |
| **Location Service** (`location_service.py`) | Traverses spatial hierarchy: Village $\rightarrow$ Taluka $\rightarrow$ District | Village UUID / LGD Code | Administrative hierarchy models | `villages`, `talukas`, `districts` |
| **Market Service** (`market_service.py`) | PostGIS spatial queries; 10km buffer population reach, competitor counts | Village coordinates, business category | Market reach, competitor density | `businesses`, `villages`, PostGIS indexes |
| **Finance Engine** (`app/finance/`, `finance_service.py`) | Deterministic calculation of feasible project cost, loan sizing, EMI schedules, DSCR | Available capital, desired cost, scheme rule | `FinanceCalculateResponse` | `schemes`, `scheme_rules` |
| **Scheme Matcher** (`app/schemes/`, `scheme_service.py`) | Evaluates social category, gender, project cost, and location against scheme rules | Profile demographics, project cost | `list[SchemeMatchContext]` | `schemes`, `scheme_rules`, `scheme_matches` |
| **Feasibility Service** (`feasibility_service.py`) | Calculates multi-criteria weighted feasibility score (0–100) and empirical SWOT | Financial, market, competition, infra data | `FeasibilityAnalysisResponse` | `feasibility_analyses` |
| **RAG Retriever** (`app/rag/retriever.py`) | Vector search over chunk embeddings with scheme/language filters | Text query, scheme ID, similarity threshold | `RAGQueryResponse` (evidence chunks + citations) | `document_chunks`, `documents` |
| **AI Advisor** (`advisor.py`) | Assembles structured prompt, executes LLM call with guardrails, handles fallback | `AnalysisContext`, language | `AIAdvice` | `ai_analyses`, `reports` |

---

## 🔌 5. API Routing Architecture

FastAPI routers are defined in `app/api/routes/*.py` and registered centrally in `app/main.py`.

### Dual-Mount Strategy
Every domain router is mounted under both:
1. Standard clean path (e.g., `/analysis`, `/users`, `/finance`, `/schemes`, `/locations`)
2. Versioned contract path (e.g., `/api/v1/analysis`, `/api/v1/users`, `/api/v1/finance`) with `include_in_schema=False` to prevent OpenAPI spec duplication while guaranteeing client backward compatibility.

### Rate Limiting & Throttling
- **Default Ingress:** Configured via `SlowAPI` with `default_limiter` (100 requests per 60 seconds per client IP).
- **Inbound Webhooks (WhatsApp/Twilio):** Deliberately bypassed by IP-based rate limiting because Twilio egress IPs are shared across all tenants. Instead, `app/api/routes/whatsapp.py` implements a per-sender phone number throttle (20 requests per 60 seconds).
