-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00011_crm_activities.sql
-- Aktiviteter (samtaler, møter, e-poster, notater)
-- ══════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  organization_id UUID REFERENCES crm_organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL,
  request_id UUID,  -- FK legges til senere
  assignment_id UUID,  -- FK legges til senere

  type activity_type NOT NULL,
  subject TEXT,
  description TEXT,

  duration_minutes INTEGER,
  outcome TEXT,
  participants TEXT[],
  email_message_id TEXT,

  performed_by UUID REFERENCES user_profiles(id),
  performed_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT at_least_one_relation CHECK (
    organization_id IS NOT NULL OR
    contact_id IS NOT NULL OR
    deal_id IS NOT NULL
  )
);

-- Indekser
CREATE INDEX idx_activities_org ON crm_activities(organization_id);
CREATE INDEX idx_activities_contact ON crm_activities(contact_id);
CREATE INDEX idx_activities_deal ON crm_activities(deal_id);
CREATE INDEX idx_activities_type ON crm_activities(type);
CREATE INDEX idx_activities_performed_at ON crm_activities(performed_at DESC);
CREATE INDEX idx_activities_performed_by ON crm_activities(performed_by);

-- RLS
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view activities" ON crm_activities
  FOR SELECT USING (public.is_staff());

CREATE POLICY "Staff can manage activities" ON crm_activities
  FOR ALL USING (public.is_staff());
