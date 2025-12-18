-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00019_qms.sql
-- Kvalitetssystem (QMS) - Dokumenter, Avvik, CAPA, Risiko
-- ══════════════════════════════════════════════════════════════════════════════════════

-- QMS Dokumenter
CREATE TABLE qms_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_number TEXT UNIQUE NOT NULL,  -- 'PRO-001'
  type qms_document_type NOT NULL,

  title TEXT NOT NULL,
  description TEXT,
  current_version INTEGER DEFAULT 1,

  -- Innhold
  content_html TEXT,
  file_path TEXT,

  -- Status
  status qms_document_status DEFAULT 'draft',

  -- Review
  next_review_date DATE,
  last_reviewed_at TIMESTAMPTZ,
  last_reviewed_by UUID REFERENCES user_profiles(id),

  -- Eierskap
  owner_id UUID REFERENCES user_profiles(id),
  approved_by UUID REFERENCES user_profiles(id),
  approved_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

-- Document versions
CREATE TABLE qms_document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES qms_documents(id) ON DELETE CASCADE,

  version INTEGER NOT NULL,
  content_html TEXT,
  file_path TEXT,

  change_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),

  UNIQUE(document_id, version)
);

-- Avvik (Non-conformities)
CREATE TABLE qms_nonconformities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nc_number TEXT UNIQUE NOT NULL,  -- 'NC-2025-0001'

  title TEXT NOT NULL,
  description TEXT NOT NULL,
  source TEXT NOT NULL,  -- 'audit', 'customer', 'internal', 'supplier'
  severity nc_severity DEFAULT 'minor',

  -- Relatert til
  related_assignment_id UUID REFERENCES assignments(id),
  related_organization_id UUID REFERENCES crm_organizations(id),
  related_candidate_id UUID REFERENCES candidates(id),

  -- Status
  status nc_status DEFAULT 'open',
  due_date DATE,

  -- Analyse
  root_cause TEXT,
  immediate_action TEXT,
  immediate_action_at TIMESTAMPTZ,

  -- Ansvarlig
  responsible_id UUID REFERENCES user_profiles(id),

  -- Lukking
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES user_profiles(id),
  closure_notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate NC number
CREATE OR REPLACE FUNCTION generate_nc_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.nc_number IS NULL THEN
    NEW.nc_number := 'NC-' || to_char(NOW(), 'YYYY') || '-' ||
      LPAD((SELECT COALESCE(MAX(
        CAST(SUBSTRING(nc_number FROM 'NC-\d{4}-(\d+)') AS INTEGER)
      ), 0) + 1
      FROM qms_nonconformities
      WHERE nc_number LIKE 'NC-' || to_char(NOW(), 'YYYY') || '-%')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER nc_auto_number
  BEFORE INSERT ON qms_nonconformities
  FOR EACH ROW
  EXECUTE FUNCTION generate_nc_number();

-- CAPA Actions
CREATE TABLE qms_capa_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nonconformity_id UUID NOT NULL REFERENCES qms_nonconformities(id) ON DELETE CASCADE,

  type capa_type NOT NULL,
  description TEXT NOT NULL,
  due_date DATE,

  status capa_status DEFAULT 'planned',

  -- Gjennomføring
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES user_profiles(id),
  completion_notes TEXT,

  -- Verifisering
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES user_profiles(id),
  verification_notes TEXT,
  verification_effective BOOLEAN,

  -- Ansvarlig
  responsible_id UUID REFERENCES user_profiles(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risiko
CREATE TABLE qms_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_number TEXT UNIQUE NOT NULL,  -- 'RISK-001'

  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category risk_category NOT NULL,

  -- Vurdering
  likelihood INTEGER CHECK (likelihood BETWEEN 1 AND 5),
  impact INTEGER CHECK (impact BETWEEN 1 AND 5),
  risk_score INTEGER GENERATED ALWAYS AS (likelihood * impact) STORED,

  -- Tiltak
  mitigation_strategy TEXT,
  residual_likelihood INTEGER CHECK (residual_likelihood IS NULL OR residual_likelihood BETWEEN 1 AND 5),
  residual_impact INTEGER CHECK (residual_impact IS NULL OR residual_impact BETWEEN 1 AND 5),
  residual_risk_score INTEGER GENERATED ALWAYS AS (
    COALESCE(residual_likelihood, likelihood) * COALESCE(residual_impact, impact)
  ) STORED,

  -- Status
  status risk_status DEFAULT 'identified',
  next_review_date DATE,

  -- Eierskap
  owner_id UUID REFERENCES user_profiles(id),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indekser
CREATE INDEX idx_qms_docs_number ON qms_documents(document_number);
CREATE INDEX idx_qms_docs_type ON qms_documents(type);
CREATE INDEX idx_qms_docs_status ON qms_documents(status);
CREATE INDEX idx_qms_nc_number ON qms_nonconformities(nc_number);
CREATE INDEX idx_qms_nc_status ON qms_nonconformities(status);
CREATE INDEX idx_qms_nc_severity ON qms_nonconformities(severity);
CREATE INDEX idx_qms_capa_nc ON qms_capa_actions(nonconformity_id);
CREATE INDEX idx_qms_capa_status ON qms_capa_actions(status);
CREATE INDEX idx_qms_risks_score ON qms_risks(risk_score DESC);
CREATE INDEX idx_qms_risks_status ON qms_risks(status);

-- Triggers
CREATE TRIGGER qms_docs_updated_at
  BEFORE UPDATE ON qms_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER qms_nc_updated_at
  BEFORE UPDATE ON qms_nonconformities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER qms_capa_updated_at
  BEFORE UPDATE ON qms_capa_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER qms_risks_updated_at
  BEFORE UPDATE ON qms_risks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE qms_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE qms_document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qms_nonconformities ENABLE ROW LEVEL SECURITY;
ALTER TABLE qms_capa_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qms_risks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view qms_documents" ON qms_documents
  FOR SELECT USING (public.is_staff());
CREATE POLICY "Staff can manage qms_documents" ON qms_documents
  FOR ALL USING (public.is_staff());

CREATE POLICY "Staff can view qms_document_versions" ON qms_document_versions
  FOR SELECT USING (public.is_staff());
CREATE POLICY "Staff can manage qms_document_versions" ON qms_document_versions
  FOR ALL USING (public.is_staff());

CREATE POLICY "Staff can view qms_nonconformities" ON qms_nonconformities
  FOR SELECT USING (public.is_staff());
CREATE POLICY "Staff can manage qms_nonconformities" ON qms_nonconformities
  FOR ALL USING (public.is_staff());

CREATE POLICY "Staff can view qms_capa_actions" ON qms_capa_actions
  FOR SELECT USING (public.is_staff());
CREATE POLICY "Staff can manage qms_capa_actions" ON qms_capa_actions
  FOR ALL USING (public.is_staff());

CREATE POLICY "Staff can view qms_risks" ON qms_risks
  FOR SELECT USING (public.is_staff());
CREATE POLICY "Staff can manage qms_risks" ON qms_risks
  FOR ALL USING (public.is_staff());
