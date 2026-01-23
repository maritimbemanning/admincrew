-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00004_candidate_certifications.sql
-- Sertifikater for kandidater (D5, STCW, DP-ADV, etc.)
-- ══════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE candidate_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,

  category certification_category NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,

  issuer TEXT,
  issuer_country TEXT DEFAULT 'NO',
  certificate_number TEXT,

  issue_date DATE,
  expiry_date DATE,
  is_permanent BOOLEAN DEFAULT FALSE,

  document_path TEXT,
  document_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES user_profiles(id),
  verified_at TIMESTAMPTZ,

  status TEXT DEFAULT 'active',
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(candidate_id, code, issuer_country)
);

-- Indekser
CREATE INDEX idx_certs_candidate ON candidate_certifications(candidate_id);
CREATE INDEX idx_certs_code ON candidate_certifications(code);
CREATE INDEX idx_certs_category ON candidate_certifications(category);
CREATE INDEX idx_certs_expiry ON candidate_certifications(expiry_date)
  WHERE status = 'active' AND NOT is_permanent;
CREATE INDEX idx_certs_status ON candidate_certifications(status);

-- Trigger
CREATE TRIGGER certifications_updated_at
  BEFORE UPDATE ON candidate_certifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE candidate_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view all certifications" ON candidate_certifications
  FOR SELECT USING (public.is_staff());

CREATE POLICY "Staff can manage certifications" ON candidate_certifications
  FOR ALL USING (public.is_staff());

CREATE POLICY "Candidates can view own certifications" ON candidate_certifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM candidates
      WHERE candidates.id = candidate_certifications.candidate_id
      AND candidates.user_id = auth.uid()
    )
  );
