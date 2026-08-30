-- Create business_categories table
CREATE TABLE business_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sector TEXT,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create business_models table
CREATE TABLE business_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_category_id UUID NOT NULL REFERENCES business_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    startup_cost_min NUMERIC(14,2),
    startup_cost_max NUMERIC(14,2),
    working_capital NUMERIC(14,2),
    revenue_assumptions JSONB,
    operating_cost_assumptions JSONB,
    risk_assumptions JSONB,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create businesses table (existing/competitor businesses)
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    category TEXT,
    business_category_id UUID REFERENCES business_categories(id) ON DELETE SET NULL,
    location_id UUID REFERENCES villages(id) ON DELETE SET NULL,
    district TEXT,
    taluka TEXT,
    village TEXT,
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    geom GEOGRAPHY(Point, 4326),
    source TEXT,
    source_url TEXT,
    data_year INTEGER,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create analysis_runs table
CREATE TABLE analysis_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    location_id UUID REFERENCES villages(id) ON DELETE SET NULL,
    business_category_id UUID REFERENCES business_categories(id) ON DELETE SET NULL,
    available_capital NUMERIC(14,2),
    status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);
