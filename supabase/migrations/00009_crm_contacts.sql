-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00009_crm_contacts.sql
-- Kontaktpersoner hos organisasjoner
-- ══════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES crm_organizations(id) ON DELETE CASCADE,

  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile TEXT,

  job_title TEXT,
  department TEXT,

  is_primary BOOLEAN DEFAULT FALSE,
  is_decision_maker BOOLEAN DEFAULT FALSE,
  is_billing_contact BOOLEAN DEFAULT FALSE,
  is_operational_contact BOOLEAN DEFAULT FALSE,

  preferred_contact_method TEXT DEFAULT 'email',
  language TEXT DEFAULT 'no',

  linkedin_url TEXT,
  avatar_url TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES user_profiles(id),
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES user_profiles(id)
);

-- Indekser
CREATE INDEX idx_contacts_org ON crm_contacts(organization_id);
CREATE INDEX idx_contacts_email ON crm_contacts(email);
CREATE INDEX idx_contacts_primary ON crm_contacts(organization_id) WHERE is_primary = TRUE;
CREATE INDEX idx_contacts_active ON crm_contacts(id) WHERE archived_at IS NULL;

-- Ensure only one primary per org
CREATE OR REPLACE FUNCTION ensure_single_primary_contact()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = TRUE THEN
    UPDATE crm_contacts
    SET is_primary = FALSE
    WHERE organization_id = NEW.organization_id
      AND id != NEW.id
      AND is_primary = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contacts_single_primary
  BEFORE INSERT OR UPDATE ON crm_contacts
  FOR EACH ROW
  WHEN (NEW.is_primary = TRUE)
  EXECUTE FUNCTION ensure_single_primary_contact();

-- Trigger
CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON crm_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view contacts" ON crm_contacts
  FOR SELECT USING (public.is_staff());

CREATE POLICY "Staff can manage contacts" ON crm_contacts
  FOR ALL USING (public.is_staff());
