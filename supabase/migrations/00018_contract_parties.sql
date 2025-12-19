-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00018_contract_parties.sql
-- Contract signatories / parties
-- ══════════════════════════════════════════════════════════════════════════════════════

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
CREATE INDEX idx_parties_email ON contract_parties(email);

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

CREATE POLICY "Employees can view own contract parties" ON contract_parties
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contracts
      JOIN candidates ON candidates.id = contracts.candidate_id
      WHERE contracts.id = contract_parties.contract_id
      AND candidates.user_id = auth.uid()
    )
  );
