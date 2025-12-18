-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00016_contracts.sql
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

-- Contract parties (signatører)
CREATE TABLE contract_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,

  party_type TEXT NOT NULL,  -- 'employee', 'employer', 'customer'
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  national_id TEXT,
  organization_name TEXT,
  organization_number TEXT,

  signing_order INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending',  -- 'pending', 'sent', 'signed', 'rejected'
  signed_at TIMESTAMPTZ,
  signature_method TEXT,  -- 'bankid', 'esign', 'manual'
  signature_ip TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indekser
CREATE INDEX idx_parties_contract ON contract_parties(contract_id);
CREATE INDEX idx_parties_status ON contract_parties(status);

-- RLS for contracts
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view contracts" ON contracts
  FOR SELECT USING (public.is_staff());

CREATE POLICY "Staff can manage contracts" ON contracts
  FOR ALL USING (public.is_staff());

CREATE POLICY "Employees can view own contracts" ON contracts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM candidates
      WHERE candidates.id = contracts.candidate_id
      AND candidates.user_id = auth.uid()
    )
  );

-- RLS for parties
ALTER TABLE contract_parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view parties" ON contract_parties
  FOR SELECT USING (public.is_staff());

CREATE POLICY "Staff can manage parties" ON contract_parties
  FOR ALL USING (public.is_staff());
