-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00013_customer_requests.sql
-- Kundebehov for mannskap
-- ══════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE customer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT UNIQUE NOT NULL,  -- 'REQ-2025-0001'
  organization_id UUID NOT NULL REFERENCES crm_organizations(id),
  contact_id UUID REFERENCES crm_contacts(id),

  title TEXT NOT NULL,
  description TEXT,

  -- Behov
  role_needed TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE,
  duration_type TEXT DEFAULT 'temporary',  -- 'temporary', 'permanent', 'project'

  -- Krav
  requirements JSONB DEFAULT '{
    "certifications_required": [],
    "certifications_preferred": [],
    "experience_min_years": null,
    "experience_preferred_years": null,
    "languages_required": [],
    "languages_preferred": [],
    "other": null
  }',

  -- Lokasjon
  work_location TEXT,
  vessel_name TEXT,
  vessel_type TEXT,

  -- Økonomi
  budget_max_daily_nok DECIMAL(10,2),
  budget_max_monthly_nok DECIMAL(12,2),
  estimated_value_nok DECIMAL(12,2),

  -- Status
  status request_status DEFAULT 'draft',
  priority priority_level DEFAULT 'medium',

  -- Matching
  matched_at TIMESTAMPTZ,
  matched_by UUID REFERENCES user_profiles(id),
  match_count INTEGER DEFAULT 0,

  -- Eierskap
  owner_id UUID REFERENCES user_profiles(id),
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES user_profiles(id),
  archived_at TIMESTAMPTZ
);

-- Indekser
CREATE INDEX idx_requests_number ON customer_requests(request_number);
CREATE INDEX idx_requests_org ON customer_requests(organization_id);
CREATE INDEX idx_requests_status ON customer_requests(status);
CREATE INDEX idx_requests_role ON customer_requests(role_needed);
CREATE INDEX idx_requests_start ON customer_requests(start_date);
CREATE INDEX idx_requests_owner ON customer_requests(owner_id);
CREATE INDEX idx_requests_active ON customer_requests(id) WHERE archived_at IS NULL;

-- Trigger
CREATE TRIGGER requests_updated_at
  BEFORE UPDATE ON customer_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-generate request number
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.request_number IS NULL THEN
    NEW.request_number := 'REQ-' || to_char(NOW(), 'YYYY') || '-' ||
      LPAD((SELECT COALESCE(MAX(
        CAST(SUBSTRING(request_number FROM 'REQ-\d{4}-(\d+)') AS INTEGER)
      ), 0) + 1
      FROM customer_requests
      WHERE request_number LIKE 'REQ-' || to_char(NOW(), 'YYYY') || '-%')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER requests_auto_number
  BEFORE INSERT ON customer_requests
  FOR EACH ROW
  EXECUTE FUNCTION generate_request_number();

-- Add FK to activities
ALTER TABLE crm_activities
  ADD CONSTRAINT fk_activities_request
  FOREIGN KEY (request_id) REFERENCES customer_requests(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE customer_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view requests" ON customer_requests
  FOR SELECT USING (public.is_staff());

CREATE POLICY "Staff can manage requests" ON customer_requests
  FOR ALL USING (public.is_staff());
