-- Enable PostGIS and pgvector extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;

-- Create districts table
CREATE TABLE districts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'Maharashtra',
    lgd_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create talukas table
CREATE TABLE talukas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    lgd_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create gram_panchayats table
CREATE TABLE gram_panchayats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    taluka_id UUID NOT NULL REFERENCES talukas(id) ON DELETE CASCADE,
    district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    lgd_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create villages table
CREATE TABLE villages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    taluka_id UUID NOT NULL REFERENCES talukas(id) ON DELETE CASCADE,
    gram_panchayat_id UUID NOT NULL REFERENCES gram_panchayats(id) ON DELETE CASCADE,
    lgd_code TEXT,
    pin_code TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    geom GEOGRAPHY(Point, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE NOT NULL,
    name TEXT,
    preferred_language TEXT,
    location_id UUID REFERENCES villages(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
