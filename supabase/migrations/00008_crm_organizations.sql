-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00008_crm_organizations.sql
-- B2B-kunder (organisasjoner)
-- ══════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE crm_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identifikasjon
  name TEXT NOT NULL,
  org_number TEXT UNIQUE,  -- Norsk org.nr (9 siffer)

  -- Klassifisering
  industry TEXT,  -- 'aquaculture', 'offshore', 'shipping', 'fishing', 'maritime_services'
  company_size TEXT,  -- 'solo', 'small', 'medium', 'large', 'enterprise'
  customer_type TEXT DEFAULT 'prospect',  -- 'prospect', 'customer', 'partner', 'churned'

  -- Kontaktinfo
  website TEXT,
  email TEXT,
  phone TEXT,

  -- Adresse
  address_street TEXT,
  address_postal_code TEXT,
  address_city TEXT,
  address_country TEXT DEFAULT 'NO',

  -- Logo
  logo_url TEXT,

  -- Pipeline
  pipeline_stage pipeline_stage DEFAULT 'lead',
  pipeline_entered_at TIMESTAMPTZ DEFAULT NOW(),
  pipeline_won_at TIMESTAMPTZ,
  pipeline_lost_at TIMESTAMPTZ,
  pipeline_lost_reason TEXT,

  -- Eierskap
  owner_id UUID REFERENCES user_profiles(id),

  -- Økonomi (denormalisert for rask visning)
  estimated_annual_value_nok DECIMAL(12,2),
  lifetime_value_nok DECIMAL(12,2) DEFAULT 0,
  outstanding_amount_nok DECIMAL(12,2) DEFAULT 0,

  -- Stats (oppdateres av triggers)
  stats JSONB DEFAULT '{
    "total_requests": 0,
    "open_requests": 0,
    "total_assignments": 0,
    "active_assignments": 0,
    "total_contracts": 0,
    "total_invoices": 0,
    "total_revenue_nok": 0,
    "avg_time_to_fill_days": null,
    "last_activity_at": null,
    "last_assignment_at": null
  }',

  -- Preferanser
  preferences JSONB DEFAULT '{
    "preferred_roles": [],
    "preferred_certifications": [],
    "preferred_experience_min": null,
    "billing_terms_days": 30,
    "communication_preference": "email"
  }',

  -- Notater og tags
  notes TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES user_profiles(id),
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES user_profiles(id)
);

-- Indekser
CREATE INDEX idx_org_name ON crm_organizations(name);
CREATE INDEX idx_org_number ON crm_organizations(org_number);
CREATE INDEX idx_org_pipeline ON crm_organizations(pipeline_stage);
CREATE INDEX idx_org_customer_type ON crm_organizations(customer_type);
CREATE INDEX idx_org_industry ON crm_organizations(industry);
CREATE INDEX idx_org_owner ON crm_organizations(owner_id);
CREATE INDEX idx_org_tags ON crm_organizations USING gin(tags);
CREATE INDEX idx_org_active ON crm_organizations(id) WHERE archived_at IS NULL;

-- Immutable wrapper for full-text search (required for index expressions)
CREATE OR REPLACE FUNCTION org_searchable_text(p_name TEXT, p_notes TEXT)
RETURNS tsvector AS $$
  SELECT to_tsvector('simple'::regconfig, coalesce(p_name, '') || ' ' || coalesce(p_notes, ''));
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE;

-- Full-text search
CREATE INDEX idx_org_fts ON crm_organizations USING gin(
  org_searchable_text(name, notes)
);

-- Trigger
CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON crm_organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE crm_organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view organizations" ON crm_organizations
  FOR SELECT USING (public.is_staff());

CREATE POLICY "Staff can manage organizations" ON crm_organizations
  FOR ALL USING (public.is_staff());
