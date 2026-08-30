-- Create data_sources table
CREATE TABLE data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    organization TEXT,
    url TEXT,
    dataset_name TEXT,
    geographic_level TEXT,
    license TEXT,
    last_updated_at TIMESTAMPTZ,
    last_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create population table
CREATE TABLE population (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES villages(id) ON DELETE CASCADE,
    year INTEGER,
    population_total INTEGER,
    male_population INTEGER,
    female_population INTEGER,
    households INTEGER,
    working_population INTEGER,
    literacy_rate NUMERIC,
    source TEXT,
    source_url TEXT,
    data_year INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create agriculture table
CREATE TABLE agriculture (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES villages(id) ON DELETE CASCADE,
    crop_name TEXT,
    crop_category TEXT,
    cultivated_area NUMERIC,
    production NUMERIC,
    production_unit TEXT,
    irrigated_area NUMERIC,
    year INTEGER,
    season TEXT,
    source TEXT,
    source_url TEXT,
    data_year INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create livestock table
CREATE TABLE livestock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES villages(id) ON DELETE CASCADE,
    animal_type TEXT,
    animal_count INTEGER,
    milk_production NUMERIC,
    milk_production_unit TEXT,
    year INTEGER,
    source TEXT,
    source_url TEXT,
    data_year INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create economic_indicators table
CREATE TABLE economic_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES villages(id) ON DELETE CASCADE,
    indicator_name TEXT,
    indicator_value NUMERIC,
    unit TEXT,
    year INTEGER,
    source TEXT,
    source_url TEXT,
    data_year INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create infrastructure table
CREATE TABLE infrastructure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES villages(id) ON DELETE SET NULL,
    facility_type TEXT,
    name TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    geog GEOGRAPHY(Point, 4326),
    distance_from_village NUMERIC,
    capacity NUMERIC,
    source TEXT,
    source_url TEXT,
    data_year INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create weather table
CREATE TABLE weather (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES villages(id) ON DELETE CASCADE,
    date DATE,
    rainfall_mm NUMERIC,
    temperature_min NUMERIC,
    temperature_max NUMERIC,
    drought_indicator BOOLEAN DEFAULT FALSE,
    source TEXT,
    source_url TEXT,
    data_year INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create markets table
CREATE TABLE markets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    market_type TEXT,
    location_id UUID REFERENCES villages(id) ON DELETE SET NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    geog GEOGRAPHY(Point, 4326),
    source TEXT,
    source_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create market_prices table
CREATE TABLE market_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
    location_id UUID REFERENCES villages(id) ON DELETE SET NULL,
    market_name TEXT,
    commodity TEXT,
    commodity_variety TEXT,
    unit TEXT,
    min_price NUMERIC,
    max_price NUMERIC,
    modal_price NUMERIC,
    arrival_quantity NUMERIC,
    arrival_unit TEXT,
    recorded_date DATE,
    source TEXT,
    source_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
