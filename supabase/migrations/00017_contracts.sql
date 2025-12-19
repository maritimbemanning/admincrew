-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00017_contracts.sql
-- Kontrakter med e-signering
-- ══════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT UNIQUE NOT NULL,  -- 'CON-2025-0001'

  -- Relasjoner
  assignment_id UUID REFERENCES assignments(id),
  organization_id UUID REFERENCES crm_organizations(id),
  candidate_id UUID REFERENCES candidates(id),

  -- Type og innhold
  type contract_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_html TEXT,

  -- Template
  template_id TEXT,
  template_version INTEGER,
  variables JSONB DEFAULT '{}',

  -- Filer
  draft_pdf_path TEXT,
  signed_pdf_path TEXT,

  -- E-signering
  esign_provider TEXT,  -- 'signicat', 'bankid'
  esign_request_id TEXT,
  esign_status TEXT DEFAULT 'not_started',
  esign_url TEXT,
  esign_expires_at TIMESTAMPTZ,

  -- Status
  status contract_status DEFAULT 'draft',

  -- Datoer
  valid_from DATE,
  valid_until DATE,
  signed_at TIMESTAMPTZ,

  -- Notater
  internal_notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES user_profiles(id),
  archived_at TIMESTAMPTZ
);

-- Indekser
CREATE INDEX idx_contracts_number ON contracts(contract_number);
CREATE INDEX idx_contracts_assignment ON contracts(assignment_id);
CREATE INDEX idx_contracts_org ON contracts(organization_id);
CREATE INDEX idx_contracts_candidate ON contracts(candidate_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_type ON contracts(type);

-- Trigger
CREATE TRIGGER contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-generate contract number
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contract_number IS NULL THEN
    NEW.contract_number := 'CON-' || to_char(NOW(), 'YYYY') || '-' ||
      LPAD((SELECT COALESCE(MAX(
        CAST(SUBSTRING(contract_number FROM 'CON-\d{4}-(\d+)') AS INTEGER)
      ), 0) + 1
      FROM contracts
      WHERE contract_number LIKE 'CON-' || to_char(NOW(), 'YYYY') || '-%')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contracts_auto_number
  BEFORE INSERT ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION generate_contract_number();
