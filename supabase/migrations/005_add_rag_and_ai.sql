-- Create document_chunks table
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    scheme_id UUID REFERENCES schemes(id) ON DELETE SET NULL,
    chunk_index INTEGER,
    content TEXT NOT NULL,
    page_number INTEGER,
    section_title TEXT,
    embedding VECTOR,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create market_analyses table
CREATE TABLE market_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_run_id UUID NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
    radius_km NUMERIC(5,2),
    population_estimate INTEGER,
    household_estimate INTEGER,
    market_reach_estimate INTEGER,
    competitor_count INTEGER,
    demand_indicators JSONB,
    distribution_channels JSONB,
    pricing_indicators JSONB,
    market_gaps JSONB,
    data_confidence TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create competitor_analyses table
CREATE TABLE competitor_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_run_id UUID NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
    radius_km NUMERIC(5,2),
    competitor_count INTEGER,
    competition_density NUMERIC,
    competitor_distribution JSONB,
    identified_gaps JSONB,
    data_confidence TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create feasibility_analyses table
CREATE TABLE feasibility_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_run_id UUID NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
    market_score NUMERIC(5,2),
    financial_score NUMERIC(5,2),
    competition_score NUMERIC(5,2),
    infrastructure_score NUMERIC(5,2),
    risk_score NUMERIC(5,2),
    overall_score NUMERIC(5,2),
    recommendation TEXT,
    strengths JSONB,
    weaknesses JSONB,
    opportunities JSONB,
    threats JSONB,
    risks JSONB,
    warnings JSONB,
    confidence TEXT,
    scoring_version TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create ai_analyses table
CREATE TABLE ai_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_run_id UUID NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
    summary TEXT,
    recommendation TEXT,
    swot JSONB,
    opportunities JSONB,
    threats JSONB,
    risks JSONB,
    pricing_strategy JSONB,
    business_plan JSONB,
    model_name TEXT,
    prompt_version TEXT,
    confidence TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    analysis_run_id UUID REFERENCES analysis_runs(id) ON DELETE SET NULL,
    language TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_run_id UUID NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT,
    language TEXT,
    report_data JSONB,
    report_file_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
