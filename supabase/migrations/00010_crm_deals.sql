-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00010_crm_deals.sql
-- Salgsmuligheter (deals)
-- ══════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE crm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES crm_organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id),

  title TEXT NOT NULL,
  description TEXT,

  value_nok DECIMAL(12,2),
  currency TEXT DEFAULT 'NOK',

  stage deal_stage DEFAULT 'qualification',
  probability INTEGER DEFAULT 10 CHECK (probability BETWEEN 0 AND 100),

  expected_close_date DATE,
  actual_close_date DATE,

  won_at TIMESTAMPTZ,
  lost_at TIMESTAMPTZ,
  lost_reason TEXT,

  owner_id UUID REFERENCES user_profiles(id),
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES user_profiles(id),
  archived_at TIMESTAMPTZ
);

-- Indekser
CREATE INDEX idx_deals_org ON crm_deals(organization_id);
CREATE INDEX idx_deals_contact ON crm_deals(contact_id);
CREATE INDEX idx_deals_stage ON crm_deals(stage);
CREATE INDEX idx_deals_owner ON crm_deals(owner_id);
CREATE INDEX idx_deals_expected_close ON crm_deals(expected_close_date);
CREATE INDEX idx_deals_open ON crm_deals(id) WHERE won_at IS NULL AND lost_at IS NULL;

-- Trigger
CREATE TRIGGER deals_updated_at
  BEFORE UPDATE ON crm_deals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view deals" ON crm_deals
  FOR SELECT USING (public.is_staff());

CREATE POLICY "Staff can manage deals" ON crm_deals
  FOR ALL USING (public.is_staff());
