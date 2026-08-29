-- Enable Row Level Security (RLS) on User-Owned Tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE repayment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheme_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE feasibility_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Enable RLS on Reference Data for controlled access
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE talukas ENABLE ROW LEVEL SECURITY;
ALTER TABLE gram_panchayats ENABLE ROW LEVEL SECURITY;
ALTER TABLE villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE population ENABLE ROW LEVEL SECURITY;
ALTER TABLE agriculture ENABLE ROW LEVEL SECURITY;
ALTER TABLE livestock ENABLE ROW LEVEL SECURITY;
ALTER TABLE economic_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE infrastructure ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheme_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheme_eligibility_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for User-Owned Tables
-- Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = auth_user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = auth_user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = auth_user_id) WITH CHECK (auth.uid() = auth_user_id);

-- Analysis Runs
CREATE POLICY "Users can view own analysis runs" ON analysis_runs 
    FOR SELECT TO authenticated USING (auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = user_id));
CREATE POLICY "Users can insert own analysis runs" ON analysis_runs 
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = user_id));
CREATE POLICY "Users can update own analysis runs" ON analysis_runs 
    FOR UPDATE TO authenticated USING (auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = user_id))
    WITH CHECK (auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = user_id));
CREATE POLICY "Users can delete own analysis runs" ON analysis_runs 
    FOR DELETE TO authenticated USING (auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = user_id));

-- Financial Analyses
CREATE POLICY "Users can view own financial analyses" ON financial_analyses 
    FOR SELECT TO authenticated USING (auth.uid() = (SELECT p.auth_user_id FROM profiles p JOIN analysis_runs a ON p.id = a.user_id WHERE a.id = analysis_run_id));
CREATE POLICY "Users can insert own financial analyses" ON financial_analyses 
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = (SELECT p.auth_user_id FROM profiles p JOIN analysis_runs a ON p.id = a.user_id WHERE a.id = analysis_run_id));
CREATE POLICY "Users can update own financial analyses" ON financial_analyses 
    FOR UPDATE TO authenticated USING (auth.uid() = (SELECT p.auth_user_id FROM profiles p JOIN analysis_runs a ON p.id = a.user_id WHERE a.id = analysis_run_id))
    WITH CHECK (auth.uid() = (SELECT p.auth_user_id FROM profiles p JOIN analysis_runs a ON p.id = a.user_id WHERE a.id = analysis_run_id));

-- Repayment Schedules
CREATE POLICY "Users can view own repayment schedules" ON repayment_schedules 
    FOR SELECT TO authenticated USING (auth.uid() = (SELECT p.auth_user_id FROM profiles p JOIN analysis_runs a ON p.id = a.user_id JOIN financial_analyses f ON a.id = f.analysis_run_id WHERE f.id = financial_analysis_id));
CREATE POLICY "Users can insert own repayment schedules" ON repayment_schedules 
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = (SELECT p.auth_user_id FROM profiles p JOIN analysis_runs a ON p.id = a.user_id JOIN financial_analyses f ON a.id = f.analysis_run_id WHERE f.id = financial_analysis_id));

-- Financial Scenarios
CREATE POLICY "Users can view own financial scenarios" ON financial_scenarios 
    FOR SELECT TO authenticated USING (auth.uid() = (SELECT p.auth_user_id FROM profiles p JOIN analysis_runs a ON p.id = a.user_id JOIN financial_analyses f ON a.id = f.analysis_run_id WHERE f.id = financial_analysis_id));
CREATE POLICY "Users can insert own financial scenarios" ON financial_scenarios 
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = (SELECT p.auth_user_id FROM profiles p JOIN analysis_runs a ON p.id = a.user_id JOIN financial_analyses f ON a.id = f.analysis_run_id WHERE f.id = financial_analysis_id));

-- Market Analyses
CREATE POLICY "Users can view own market analyses" ON market_analyses 
    FOR SELECT TO authenticated USING (auth.uid() = (SELECT p.auth_user_id FROM profiles p JOIN analysis_runs a ON p.id = a.user_id WHERE a.id = analysis_run_id));
CREATE POLICY "Users can insert own market analyses" ON market_analyses 
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = (SELECT p.auth_user_id FROM profiles p JOIN analysis_runs a ON p.id = a.user_id WHERE a.id = analysis_run_id));

-- Competitor Analyses
CREATE POLICY "Users can view own competitor analyses" ON competitor_analyses 
    FOR SELECT TO authenticated USING (auth.uid() = (SELECT p.auth_user_id FROM profiles p JOIN analysis_runs a ON p.id = a.user_id WHERE a.id = analysis_run_id));
CREATE POLICY "Users can insert own competitor analyses" ON competitor_analyses 
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = (SELECT p.auth_user_id FROM profiles p JOIN analysis_runs a ON p.id = a.user_id WHERE a.id = analysis_run_id));

-- Scheme Matches
CREATE POLICY "Users can view own scheme matches" ON scheme_matches 
    FOR SELECT TO authenticated USING (auth.uid() = (SELECT p.auth_user_id FROM profiles p JOIN analysis_runs a ON p.id = a.user_id WHERE a.id = analysis_run_id));
CREATE POLICY "Users can insert own scheme matches" ON scheme_matches 
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = (SELECT p.auth_user_id FROM profiles p JOIN analysis_runs a ON p.id = a.user_id WHERE a.id = analysis_run_id));

-- Feasibility Analyses
CREATE POLICY "Users can view own feasibility analyses" ON feasibility_analyses 
    FOR SELECT TO authenticated USING (auth.uid() = (SELECT p.auth_user_id FROM profiles p JOIN analysis_runs a ON p.id = a.user_id WHERE a.id = analysis_run_id));
CREATE POLICY "Users can insert own feasibility analyses" ON feasibility_analyses 
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = (SELECT p.auth_user_id FROM profiles p JOIN analysis_runs a ON p.id = a.user_id WHERE a.id = analysis_run_id));

-- AI Analyses
CREATE POLICY "Users can view own AI analyses" ON ai_analyses 
    FOR SELECT TO authenticated USING (auth.uid() = (SELECT p.auth_user_id FROM profiles p JOIN analysis_runs a ON p.id = a.user_id WHERE a.id = analysis_run_id));
CREATE POLICY "Users can insert own AI analyses" ON ai_analyses 
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = (SELECT p.auth_user_id FROM profiles p JOIN analysis_runs a ON p.id = a.user_id WHERE a.id = analysis_run_id));

-- Conversations
CREATE POLICY "Users can view own conversations" ON conversations 
    FOR SELECT TO authenticated USING (auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = user_id));
CREATE POLICY "Users can insert own conversations" ON conversations 
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = user_id));

-- Messages
CREATE POLICY "Users can view own messages" ON messages 
    FOR SELECT TO authenticated USING (auth.uid() = (SELECT p.auth_user_id FROM profiles p JOIN conversations c ON p.id = c.user_id WHERE c.id = conversation_id));
CREATE POLICY "Users can insert own messages" ON messages 
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = (SELECT p.auth_user_id FROM profiles p JOIN conversations c ON p.id = c.user_id WHERE c.id = conversation_id));

-- Reports
CREATE POLICY "Users can view own reports" ON reports 
    FOR SELECT TO authenticated USING (auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = user_id));
CREATE POLICY "Users can insert own reports" ON reports 
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = user_id));

-- RLS Policies for Reference Data (Read-only access for authenticated users)
CREATE POLICY "Read access to authenticated users on districts" ON districts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read access to authenticated users on talukas" ON talukas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read access to authenticated users on gram_panchayats" ON gram_panchayats FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read access to authenticated users on villages" ON villages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read access to authenticated users on population" ON population FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read access to authenticated users on agriculture" ON agriculture FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read access to authenticated users on livestock" ON livestock FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read access to authenticated users on economic_indicators" ON economic_indicators FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read access to authenticated users on infrastructure" ON infrastructure FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read access to authenticated users on weather" ON weather FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read access to authenticated users on markets" ON markets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read access to authenticated users on market_prices" ON market_prices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read access to authenticated users on businesses" ON businesses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read access to authenticated users on business_categories" ON business_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read access to authenticated users on business_models" ON business_models FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read access to authenticated users on schemes" ON schemes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read access to authenticated users on scheme_rules" ON scheme_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read access to authenticated users on scheme_eligibility_rules" ON scheme_eligibility_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read access to authenticated users on data_sources" ON data_sources FOR SELECT TO authenticated USING (true);

-- NOTE: RAG documents and document_chunks are NOT given public-read policies. Access is handled server-side (FastAPI).

-- Spatial Indexes (GiST)
CREATE INDEX IF NOT EXISTS idx_businesses_geom ON businesses USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_markets_geog ON markets USING GIST (geog);
CREATE INDEX IF NOT EXISTS idx_infrastructure_geog ON infrastructure USING GIST (geog);
CREATE INDEX IF NOT EXISTS idx_villages_geom ON villages USING GIST (geom);

-- B-tree Indexes for foreign keys and common query filters
CREATE INDEX IF NOT EXISTS idx_profiles_location_id ON profiles(location_id);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON profiles(auth_user_id);

CREATE INDEX IF NOT EXISTS idx_talukas_district_id ON talukas(district_id);
CREATE INDEX IF NOT EXISTS idx_gram_panchayats_taluka_id ON gram_panchayats(taluka_id);
CREATE INDEX IF NOT EXISTS idx_gram_panchayats_district_id ON gram_panchayats(district_id);
CREATE INDEX IF NOT EXISTS idx_villages_district_id ON villages(district_id);
CREATE INDEX IF NOT EXISTS idx_villages_taluka_id ON villages(taluka_id);
CREATE INDEX IF NOT EXISTS idx_villages_gram_panchayat_id ON villages(gram_panchayat_id);

CREATE INDEX IF NOT EXISTS idx_analysis_runs_user_id ON analysis_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_runs_location_id ON analysis_runs(location_id);
CREATE INDEX IF NOT EXISTS idx_analysis_runs_business_category_id ON analysis_runs(business_category_id);

CREATE INDEX IF NOT EXISTS idx_businesses_business_category_id ON businesses(business_category_id);
CREATE INDEX IF NOT EXISTS idx_businesses_location_id ON businesses(location_id);

CREATE INDEX IF NOT EXISTS idx_population_location_id ON population(location_id);
CREATE INDEX IF NOT EXISTS idx_population_year ON population(year);

CREATE INDEX IF NOT EXISTS idx_agriculture_location_id ON agriculture(location_id);
CREATE INDEX IF NOT EXISTS idx_livestock_location_id ON livestock(location_id);
CREATE INDEX IF NOT EXISTS idx_economic_indicators_location_id ON economic_indicators(location_id);
CREATE INDEX IF NOT EXISTS idx_infrastructure_location_id ON infrastructure(location_id);
CREATE INDEX IF NOT EXISTS idx_weather_location_id ON weather(location_id);
CREATE INDEX IF NOT EXISTS idx_weather_date ON weather(date);

CREATE INDEX IF NOT EXISTS idx_markets_location_id ON markets(location_id);
CREATE INDEX IF NOT EXISTS idx_market_prices_market_id ON market_prices(market_id);
CREATE INDEX IF NOT EXISTS idx_market_prices_location_id ON market_prices(location_id);
CREATE INDEX IF NOT EXISTS idx_market_prices_recorded_date ON market_prices(recorded_date);

CREATE INDEX IF NOT EXISTS idx_scheme_rules_scheme_id ON scheme_rules(scheme_id);
CREATE INDEX IF NOT EXISTS idx_scheme_eligibility_rules_scheme_id ON scheme_eligibility_rules(scheme_id);
CREATE INDEX IF NOT EXISTS idx_scheme_matches_analysis_run_id ON scheme_matches(analysis_run_id);
CREATE INDEX IF NOT EXISTS idx_scheme_matches_scheme_id ON scheme_matches(scheme_id);

CREATE INDEX IF NOT EXISTS idx_financial_analyses_analysis_run_id ON financial_analyses(analysis_run_id);
CREATE INDEX IF NOT EXISTS idx_financial_analyses_scheme_id ON financial_analyses(scheme_id);
CREATE INDEX IF NOT EXISTS idx_repayment_schedules_financial_analysis_id ON repayment_schedules(financial_analysis_id);
CREATE INDEX IF NOT EXISTS idx_financial_scenarios_financial_analysis_id ON financial_scenarios(financial_analysis_id);

CREATE INDEX IF NOT EXISTS idx_market_analyses_analysis_run_id ON market_analyses(analysis_run_id);
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_analysis_run_id ON competitor_analyses(analysis_run_id);
CREATE INDEX IF NOT EXISTS idx_feasibility_analyses_analysis_run_id ON feasibility_analyses(analysis_run_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_analysis_run_id ON ai_analyses(analysis_run_id);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_analysis_run_id ON conversations(analysis_run_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_reports_analysis_run_id ON reports(analysis_run_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);

CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_scheme_id ON document_chunks(scheme_id);
