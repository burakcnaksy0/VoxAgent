-- VoxAgent Database Schema
-- Run this in Supabase SQL Editor

-- Enable pgvector for knowledge base
CREATE EXTENSION IF NOT EXISTS vector;

-- ===========================
-- AGENCIES TABLE
-- ===========================
CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  brand_color TEXT DEFAULT '#6366f1',
  custom_domain TEXT UNIQUE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  plan TEXT DEFAULT 'trial' CHECK (plan IN ('trial', 'starter', 'growth', 'pro', 'enterprise')),
  plan_status TEXT DEFAULT 'active' CHECK (plan_status IN ('active', 'cancelled', 'past_due', 'trialing')),
  trial_ends_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '14 days',
  vapi_api_key_encrypted TEXT,
  additional_minutes DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- USERS TABLE
-- ===========================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'operator', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- SUB-CLIENTS TABLE
-- ===========================
CREATE TABLE sub_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  business_name TEXT,
  phone TEXT,
  email TEXT,
  sector TEXT,
  fallback_channel TEXT DEFAULT 'none' CHECK (fallback_channel IN ('none', 'sms', 'whatsapp')),
  notes TEXT,
  crm_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- KNOWLEDGE BASES TABLE
-- ===========================
CREATE TABLE knowledge_bases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_base_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(384),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops);

-- ===========================
-- AI ASSISTANTS TABLE
-- ===========================
CREATE TABLE assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  knowledge_base_id UUID REFERENCES knowledge_bases(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  vapi_assistant_id TEXT UNIQUE,
  phone_number TEXT,
  voice_id TEXT DEFAULT 'nova',
  language TEXT DEFAULT 'en',
  system_prompt TEXT,
  first_message TEXT,
  end_call_message TEXT,
  is_active BOOLEAN DEFAULT true,
  sector TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- CALLS TABLE
-- ===========================
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  assistant_id UUID REFERENCES assistants(id) ON DELETE SET NULL,
  sub_client_id UUID REFERENCES sub_clients(id) ON DELETE SET NULL,
  vapi_call_id TEXT UNIQUE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated', 'ringing', 'in-progress', 'completed', 'failed', 'no-answer', 'busy', 'human-takeover')),
  caller_number TEXT,
  callee_number TEXT,
  duration_seconds INTEGER DEFAULT 0,
  transcript TEXT,
  summary TEXT,
  recording_url TEXT,
  cost DECIMAL(10, 4),
  fallback_sent BOOLEAN DEFAULT false,
  fallback_status TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- CALL EVENTS TABLE
-- ===========================
CREATE TABLE call_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- CAMPAIGNS TABLE
-- ===========================
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  assistant_id UUID REFERENCES assistants(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled')),
  total_leads INTEGER DEFAULT 0,
  called INTEGER DEFAULT 0,
  answered INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campaign_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT,
  custom_data JSONB DEFAULT '{}',
  call_status TEXT DEFAULT 'pending' CHECK (call_status IN ('pending', 'calling', 'in-progress', 'completed', 'failed', 'no-answer', 'fallback-sent')),
  call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
  attempted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- BILLING USAGE TABLE
-- ===========================
CREATE TABLE billing_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  period TEXT NOT NULL, -- YYYY-MM format
  minutes_used DECIMAL(10, 2) DEFAULT 0,
  minutes_limit INTEGER DEFAULT 500,
  overage_minutes DECIMAL(10, 2) DEFAULT 0,
  overage_charged BOOLEAN DEFAULT false,
  stripe_invoice_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, period)
);

-- ===========================
-- ROW LEVEL SECURITY
-- ===========================

-- Enable RLS on all tables
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_usage ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's agency_id
CREATE OR REPLACE FUNCTION get_agency_id()
RETURNS UUID AS $$
  SELECT agency_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Agencies: user can only see/edit their own agency
CREATE POLICY "Users can view own agency" ON agencies
  FOR SELECT USING (id = get_agency_id());

CREATE POLICY "Users can update own agency" ON agencies
  FOR UPDATE USING (id = get_agency_id());

-- Users: can see users in same agency
CREATE POLICY "Users can view own agency users" ON users
  FOR ALL USING (agency_id = get_agency_id());

-- Sub-clients: agency isolation
CREATE POLICY "Agency isolation" ON sub_clients
  FOR ALL USING (agency_id = get_agency_id());

-- Knowledge bases: agency isolation
CREATE POLICY "Agency isolation" ON knowledge_bases
  FOR ALL USING (agency_id = get_agency_id());

CREATE POLICY "Agency isolation chunks" ON knowledge_chunks
  FOR ALL USING (
    knowledge_base_id IN (
      SELECT id FROM knowledge_bases WHERE agency_id = get_agency_id()
    )
  );

-- Assistants: agency isolation
CREATE POLICY "Agency isolation" ON assistants
  FOR ALL USING (agency_id = get_agency_id());

-- Calls: agency isolation
CREATE POLICY "Agency isolation" ON calls
  FOR ALL USING (agency_id = get_agency_id());

-- Call events: agency isolation
CREATE POLICY "Agency isolation" ON call_events
  FOR ALL USING (agency_id = get_agency_id());

-- Campaigns: agency isolation
CREATE POLICY "Agency isolation" ON campaigns
  FOR ALL USING (agency_id = get_agency_id());

CREATE POLICY "Agency isolation leads" ON campaign_leads
  FOR ALL USING (agency_id = get_agency_id());

-- Billing: agency isolation
CREATE POLICY "Agency isolation" ON billing_usage
  FOR ALL USING (agency_id = get_agency_id());

-- ===========================
-- FUNCTIONS & TRIGGERS
-- ===========================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agencies_updated_at BEFORE UPDATE ON agencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER assistants_updated_at BEFORE UPDATE ON assistants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER sub_clients_updated_at BEFORE UPDATE ON sub_clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Handle new user registration (create agency + user record)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_agency_id UUID;
  agency_slug TEXT;
BEGIN
  -- Generate a unique slug from email
  agency_slug := LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-z0-9]', '', 'g'));
  
  -- Ensure slug is unique
  WHILE EXISTS (SELECT 1 FROM agencies WHERE slug = agency_slug) LOOP
    agency_slug := agency_slug || FLOOR(RANDOM() * 100)::TEXT;
  END LOOP;

  -- Create agency
  INSERT INTO agencies (name, slug)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    agency_slug
  )
  RETURNING id INTO new_agency_id;

  -- Create user record
  INSERT INTO users (id, agency_id, email, full_name)
  VALUES (
    NEW.id,
    new_agency_id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ==========================================
-- ATOMIC BILLING AND BALANCE FUNCTIONS
-- ==========================================

-- Atomically increment agency additional top-up minutes
CREATE OR REPLACE FUNCTION increment_agency_additional_minutes(
  target_agency_id UUID,
  minutes_to_add NUMERIC
) RETURNS VOID AS $$
BEGIN
  UPDATE agencies
  SET additional_minutes = COALESCE(additional_minutes, 0.00) + minutes_to_add
  WHERE id = target_agency_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomically deduct call minutes from allowance and top-up balance
CREATE OR REPLACE FUNCTION deduct_agency_minutes(
  target_agency_id UUID,
  minutes_to_add NUMERIC,
  current_period TEXT,
  default_limit NUMERIC
) RETURNS VOID AS $$
DECLARE
  current_used NUMERIC;
  current_limit NUMERIC;
  target_used NUMERIC;
  prev_max NUMERIC;
  overage_to_deduct NUMERIC;
BEGIN
  -- Ensure billing_usage row exists for the period
  INSERT INTO billing_usage (agency_id, period, minutes_used, minutes_limit)
  VALUES (target_agency_id, current_period, 0, default_limit)
  ON CONFLICT (agency_id, period) DO NOTHING;

  -- Lock row for update to ensure concurrency safety
  SELECT minutes_used, minutes_limit
  INTO current_used, current_limit
  FROM billing_usage
  WHERE agency_id = target_agency_id AND period = current_period
  FOR UPDATE;

  target_used := COALESCE(current_used, 0.00) + minutes_to_add;

  -- Update monthly usage record
  UPDATE billing_usage
  SET minutes_used = target_used
  WHERE agency_id = target_agency_id AND period = current_period;

  -- Calculate overage to deduct from additional top-up balance
  prev_max := GREATEST(COALESCE(current_used, 0.00), COALESCE(current_limit, default_limit));
  overage_to_deduct := target_used - prev_max;

  IF overage_to_deduct > 0 THEN
    UPDATE agencies
    SET additional_minutes = GREATEST(0.00, COALESCE(additional_minutes, 0.00) - overage_to_deduct)
    WHERE id = target_agency_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

