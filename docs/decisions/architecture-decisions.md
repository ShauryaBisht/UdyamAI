# ⚖️ Architecture Decision Records (ADRs) — UdyamAI Platform

**Status:** Approved / Active Baseline  
**Governing Documents:** `docs/architecture/*`, `docs/api-contracts.md`, `docs/ai-contract.md`

---

## ADR-001: Supabase as the Unified Database, Spatial, Vector, and Auth Platform

### Status
Accepted

### Context
UdyamAI requires:
1. ACID relational storage for transactional enterprise records, financial entries, and user profiles.
2. Spatial query capabilities for calculating hyper-local market reach, distance to APMC mandis, and competitor density within a 10 km radius.
3. Vector similarity search for Retrieval-Augmented Generation (RAG) over official government scheme guideline documents.
4. User authentication with tenant isolation via Row-Level Security (RLS).
5. Initial iterations relied on phone OTP flows requiring paid third-party SMS providers (e.g. Twilio), creating operational complexity and ongoing costs for dev/staging environments.

### Decision
Adopt **Supabase** (managed PostgreSQL 15) as the primary unified persistence and authentication engine, utilizing:
- **PostGIS:** For spatial geometries, point locations, and buffer queries (`ST_DWithin`).
- **`pgvector`:** For storing and querying 1536-dimensional document embeddings.
- **Supabase Auth:** Email/password authentication, removing the paid SMS dependency. Supports HS256 project secrets and modern ES256 key verification via `/.well-known/jwks.json`.
- **Database Triggers:** Automatically syncs `auth.users` additions to the application `public.profiles` table (`handle_new_user` trigger).

### Consequences
- **Positive:** Single database connection, simplified backups, transactional consistency across relational data and vector embeddings, zero paid SMS provider dependencies for onboarding.
- **Negative / Trade-off:** Local development requires Docker or Supabase CLI for PostGIS and pgvector parity.

---

## ADR-002: Grounded RAG with Provenance for Government Schemes

### Status
Accepted

### Context
Government subsidy and credit schemes (such as PMEGP, PMFME, Mudra, CMEGP) are governed by specific operational guidelines that change periodically (e.g., subsidy percentage changes, special category qualifications, capital expenditure ceilings). General-purpose LLMs routinely hallucinate eligibility thresholds, fabricate outdated subsidy rates, or invent terms.

### Decision
Implement a **hybrid RAG architecture with strict citation contracts**:
1. Official government scheme guidelines (PDFs) are chunked, embedded via `text-embedding-3-small`, and stored in `document_chunks` tagged with `scheme_id`, official document version, page number, and section title.
2. RAG queries enforce similarity thresholds (default $\ge 0.70$).
3. Explicit retrieval statuses are returned:
   - `success`: Relevant passages found and passed to the advisor.
   - `no_relevant_evidence`: No chunks met the threshold. The advisor is instructed to state that the criteria could not be verified from official documents.
   - `conflicting_sources`: Contradictory rules detected across guideline versions; flags a warning for official departmental verification.
4. The AI Advisor must strictly quote or cite retrieved passages and is forbidden from inventing scheme parameters.

### Consequences
- **Positive:** Verifiable, audit-ready advice for rural entrepreneurs. High trust with partnering financial institutions and District Industries Centres (DIC).
- **Negative / Trade-off:** Requires maintaining an ingestion pipeline for guideline PDF revisions.

---

## ADR-003: Maharashtra-First Geographic and Administrative Scope

### Status
Accepted

### Context
India comprises over 600,000 villages across 28 states. Attempting to ingest and normalize nationwide demographic, agricultural, and competitor data from Day 1 would dilute data quality, introduce vast data gaps, and slow down iteration.

### Decision
Scope the initial deployment and vertical slice to **Maharashtra**:
1. Model all 36 districts, 350+ talukas, and 40,000+ villages using the standard Local Government Directory (LGD) coding hierarchy.
2. Ingest high-resolution agricultural APMC mandi arrival prices and MSME enterprise records for Maharashtra.
3. Model both Central schemes (PMEGP, PMFME, Mudra) and the premier state scheme: Maharashtra's Chief Minister Employment Generation Programme (CMEGP).
4. Build and validate trilingual support: Marathi (`mr`), Hindi (`hi`), and English (`en`).

### Consequences
- **Positive:** Deep, reliable data quality for validation; realistic testing ground for multi-tier (state + central) scheme matching; clear regional language product-market fit.
- **Negative / Trade-off:** Entrepreneurs outside Maharashtra cannot yet receive hyper-local spatial market analyses until subsequent state datasets are ingested.

---

## ADR-004: Strict Deterministic Calculation Engines (The Zero-Invention Rule)

### Status
Accepted

### Context
LLMs are probabilistic token predictors and cannot perform reliable, multi-period financial arithmetic (e.g., reducing-balance EMI amortization schedules, moratorium interest capitalization, DSCR stress testing, or subsidy margin bounds).

### Decision
Enforce a non-negotiable **Zero-Invention Rule**:
- All financial calculations (`app/finance/`), spatial aggregations (`app/market/`), and feasibility scoring (`app/feasibility/`) are executed purely in deterministic Python code.
- The AI Advisor receives an immutable, strongly typed `AnalysisContext` and acts purely as a synthesizer, strategic interpreter, and translator.
- If revenue data is absent, the engine explicitly outputs `sufficient_assumptions_exist = False` and refuses to invent speculative turnover figures.

### Consequences
- **Positive:** Mathematical accuracy is guaranteed; results match commercial bank calculations and official scheme matrices.
- **Negative / Trade-off:** Requires complete upfront implementation of financial and mathematical formulas in application code.

---

## ADR-005: 12-Step Transactional Analysis Orchestration

### Status
Accepted

### Context
A feasibility study requires sequential inputs: location $\rightarrow$ business model $\rightarrow$ scheme eligibility $\rightarrow$ financial sizing $\rightarrow$ market reach $\rightarrow$ competition density $\rightarrow$ feasibility scoring $\rightarrow$ AI narrative $\rightarrow$ persistence. Distributed async microservice choreography for this workflow would introduce complex distributed state machines and latency for interactive users.

### Decision
Implement a synchronous, structured **12-Step Pipeline** in `AnalysisOrchestrator` (`app/services/analysis_orchestrator.py`):
1. Create `AnalysisRun` immediately with `status="running"`.
2. Steps 3 through 9 execute deterministically within transaction guards.
3. Step 10 compiles the immutable `AnalysisContext`.
4. Step 11 dispatches to the AI Advisor with automatic fallback to `_backend_grounded_advice` if external LLM APIs fail.
5. Step 12 commits results and transitions status to `"completed"` (or `"failed"` on unhandled exceptions).

### Consequences
- **Positive:** Clear execution state, resilient error handling, complete audit trail for each run.
- **Negative / Trade-off:** Request duration is bounded by LLM inference latency (~2–4 seconds), handled gracefully via frontend loading states.

---

## ADR-006: Route Organization under `app/api/routes/*.py` and Dead Stub Deprecation

### Status
Accepted

### Context
Earlier project scaffolding placed placeholder files directly in `app/api/*.py` (`finance.py`, `schemes.py`, `users.py`, `businesses.py`, `market.py`, `reports.py`, `feasibility.py`). The actual production implementations evolved under `app/api/routes/*.py` and are registered in `main.py`. The top-level files remained as unreferenced 1-line stubs.

### Decision
1. Standardize all API route handlers exclusively under `backend/app/api/routes/*.py`.
2. Remove the superseded dead stub files in `app/api/*.py`.
3. Preserve active core utilities (`app/api/deps.py` and `app/api/__init__.py`).
4. Implement the full `/users/me` contract directly in `app/api/routes/users.py`, matching the fields required by the frontend `profile/page.tsx` and `settings/page.tsx`.

### Consequences
- **Positive:** Eliminates developer confusion, guarantees code hygiene, and aligns router registrations with actual source files.
