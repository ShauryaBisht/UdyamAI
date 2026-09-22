# 🔄 Data Flow Architecture — UdyamAI Platform

**Version:** 1.0.0  
**Status:** Active / Production Baseline  
**Primary Modules:** `backend/app/services/analysis_orchestrator.py`, `backend/app/api/deps.py`, `backend/app/finance/`

---

## 📌 1. Primary Analysis Workflow (12-Step Pipeline)

The central operational sequence of UdyamAI transforms a simple feasibility inquiry into a comprehensive enterprise assessment through a strict, transactional 12-step pipeline.

```mermaid
sequenceDiagram
    autonumber
    actor User as Entrepreneur (Web/WA)
    participant API as FastAPI Router (/analysis)
    participant Auth as Auth & Profile Deps
    participant Orch as AnalysisOrchestrator
    participant Geo as LocationService
    participant Biz as BusinessService
    participant Sch as SchemeService
    participant Fin as FinanceEngine
    participant Mkt as MarketService
    participant Feas as FeasibilityService
    participant AI as AI Advisor (LLM + RAG)
    participant DB as Supabase PostgreSQL

    User->>API: POST /api/v1/analysis (payload: village_id, business_category_id, capital)
    API->>Auth: Validate Supabase JWT Bearer Token
    Auth->>DB: Resolve Profile row (or create lazily)
    Auth-->>API: Return AuthUser & Profile
    API->>Orch: run_analysis_pipeline(db, run_data)

    Note over Orch: Step 1: Validate input payload & verify IDs
    Note over Orch: Step 2: Create AnalysisRun (status='running')
    Orch->>DB: INSERT INTO analysis_runs
    DB-->>Orch: Return db_run (with run ID)

    Orch->>Geo: Step 3: Fetch Location Hierarchy
    Geo->>DB: Query Village -> Taluka -> District
    DB-->>Geo: Return administrative records
    Geo-->>Orch: village, taluka, district

    Orch->>Biz: Step 4: Fetch Business Category & Model
    Biz->>DB: Query business_categories table
    DB-->>Biz: Return category & operational benchmarks
    Biz-->>Orch: BusinessCategory

    Orch->>Sch: Step 8 (Early): Match Government Schemes
    Sch->>DB: Query schemes & scheme_rules against profile/location
    DB-->>Sch: Matched eligible schemes
    Sch-->>Orch: db_scheme_matches (sorted by eligibility)

    Orch->>Fin: Step 5: Run Deterministic Finance Engine
    Fin->>Fin: Calculate feasible cost, margin shortfall, loan caps, EMI, DSCR
    Fin-->>Orch: FinancialCalculationResponse

    Orch->>Mkt: Step 6 & 7: Spatial Market & Competitor Analysis
    Mkt->>DB: PostGIS ST_DWithin 10km buffer for population & businesses
    DB-->>Mkt: Population sum, competitor counts
    Mkt-->>Orch: MarketAnalysisResult & CompetitorAnalysisResult

    Orch->>Feas: Step 9: Calculate Feasibility Sub-Scores & SWOT
    Feas->>Feas: Score market, financial, competition, infra, risk (0-100)
    Feas-->>Orch: FeasibilityScoreResult (overall score + empirical SWOT)

    Note over Orch: Step 10: Assemble immutable AnalysisContext
    Orch->>AI: Step 11: Hand context to AI Advisor
    AI->>DB: Vector search against document_chunks (RAG)
    DB-->>AI: Matched evidence passages & citations
    AI->>AI: Call LLM with guardrails (or deterministic fallback)
    AI-->>Orch: AIAdvice

    Note over Orch: Step 12: Save final results & update status='completed'
    Orch->>DB: INSERT feasibility_analyses, ai_analyses, reports
    Orch->>DB: UPDATE analysis_runs SET status='completed'
    DB-->>Orch: Transaction committed
    Orch-->>API: Consolidated AnalysisRun entity
    API-->>User: 200 OK with feasibility summary & run ID
```

---

## 📍 2. Spatial Geo-Data Flow (PostGIS 10km Buffer)

UdyamAI calculates hyper-local market metrics without relying on proprietary maps APIs:

```mermaid
flowchart TD
    In[Village Location ID + Coordinates<br/>e.g., Lat 18.5204, Lon 73.8567] --> PostGIS[PostGIS Geography Function<br/>ST_DWithin(geom, ST_SetSRID(ST_Point(lon, lat), 4326)::geography, 10000)]
    
    PostGIS --> Pop[Spatial Aggregation on Villages<br/>SUM(population), SUM(households)]
    PostGIS --> Comp[Spatial Filter on Businesses<br/>WHERE category_id = target_category<br/>AND ST_DWithin(geom, target, 10000)]
    
    Pop --> MktOut[Market Reach Context<br/>- Population Reach: 45,200<br/>- Household Reach: 9,800<br/>- Target Customers: 2,400]
    Comp --> CompOut[Competition Context<br/>- Direct Competitors within 5km: 2<br/>- Total Competitors within 10km: 5<br/>- Competitor Density: 0.016 per km²]
```

---

## 💰 3. Financial Engine Data Flow

The financial pipeline converts entrepreneur parameters and scheme constraints into deterministic balance sheets:

```mermaid
flowchart LR
    subgraph Inputs
        Cap[Available Capital: ₹50,000]
        Des[Desired Project Cost: ₹2,00,000]
        Rule[Scheme Rule: PMEGP General<br/>Margin: 10%, Loan: 90%, Subsidy: 15%]
    end

    subgraph StepA[Equity & Project Sizing]
        RawCost["Project Cost (Raw) = ₹50,000 / 0.10 = ₹5,00,000"]
        TargetCost["Target Cost = min(₹5,00,000, ₹2,00,000) = ₹2,00,000"]
        FeasCost["Feasible Cost = Bound(₹2,00,000, min, max) = ₹2,00,000"]
    end

    subgraph StepB[Debt & Margin Sizing]
        ReqMargin["Required Margin = ₹2,00,000 × 10% = ₹20,000"]
        Shortfall["Margin Shortfall = max(0, ₹20,000 - ₹50,000) = ₹0"]
        RawLoan["Potential Loan = ₹2,00,000 × 90% = ₹1,80,000"]
        Subsidy["Estimated Subsidy = ₹2,00,000 × 15% = ₹30,000"]
    end

    subgraph StepC[Debt Service & Amortization]
        Schedule["Amortization Schedule<br/>Tenure: 84 mos | Rate: 8.5%<br/>Monthly EMI: ₹2,852"]
        DSCR["DSCR Stress Scenarios<br/>Worst: 1.15 | Expected: 1.62 | Best: 2.10"]
    end

    Inputs --> StepA --> StepB --> StepC
```

---

## 🔐 4. User Authentication & Profile Synchronization Data Flow

User identity and profile management flows seamlessly between Next.js, Supabase Auth, and the FastAPI application layer:

```mermaid
sequenceDiagram
    autonumber
    actor Client as Next.js Web App / Client
    participant SupaAuth as Supabase Auth Service
    participant Trg as PostgreSQL Trigger (handle_new_user)
    participant ProfTab as public.profiles Table
    participant API as FastAPI Backend (/users/me)
    participant Deps as FastAPI Deps (get_current_profile)

    Client->>SupaAuth: Sign up (email + password)
    SupaAuth->>SupaAuth: Create user row in auth.users
    SupaAuth-->>Trg: Trigger AFTER INSERT on auth.users
    Trg->>ProfTab: INSERT INTO public.profiles (auth_user_id, email, phone, name)
    SupaAuth-->>Client: Issue JWT Access Token (HS256/ES256)

    Note over Client,API: Authenticated Session API Calls
    Client->>API: GET /api/v1/users/me (Header: Bearer JWT)
    API->>Deps: Verify token & resolve profile
    Deps->>Deps: Verify JWT signature (JWKS cache or secret)
    Deps->>ProfTab: SELECT * FROM profiles WHERE auth_user_id = sub
    ProfTab-->>Deps: Return Profile row
    Deps-->>API: Inject Profile dependency
    API-->>Client: 200 OK (User profile + initialized settings)

    Note over Client,API: Profile & Settings Update
    Client->>API: PATCH /api/v1/users/me (name, business_name, theme, language)
    API->>ProfTab: UPDATE profiles SET name, business_name, preferred_language
    API->>ProfTab: UPDATE user_settings SET theme, language
    API-->>Client: 200 OK (Updated UserResponse)
```
