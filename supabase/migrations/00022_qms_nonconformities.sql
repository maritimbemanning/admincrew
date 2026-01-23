-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00022_qms_nonconformities.sql
-- Kvalitetssystem - Avvik, CAPA og Risikovurderinger
-- ══════════════════════════════════════════════════════════════════════════════════════

-- Avvik (Non-Conformities)
CREATE TABLE qms_nonconformities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nc_number TEXT UNIQUE NOT NULL,  -- 'NC-2025-0001'

  -- Type og alvorlighet
  type TEXT NOT NULL,  -- 'internal', 'external', 'supplier', 'customer'
  severity nc_severity DEFAULT 'medium',

  -- Beskrivelse
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  root_cause TEXT,
  immediate_action TEXT,

  -- Relasjoner
  related_document_id UUID REFERENCES qms_documents(id),
  related_assignment_id UUID REFERENCES assignments(id),
  related_candidate_id UUID REFERENCES candidates(id),

  -- Status
  status nc_status DEFAULT 'open',

  -- Ansvar
  reported_by UUID REFERENCES user_profiles(id),
  assigned_to UUID REFERENCES user_profiles(id),

  -- Datoer
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  due_date DATE,
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES user_profiles(id),

  -- Verifisering
  verification_required BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES user_profiles(id),
  verification_notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CAPA - Corrective and Preventive Actions
CREATE TABLE qms_capa_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nc_id UUID NOT NULL REFERENCES qms_nonconformities(id) ON DELETE CASCADE,

  action_type TEXT NOT NULL,  -- 'corrective', 'preventive'
  description TEXT NOT NULL,

  status TEXT DEFAULT 'planned',  -- 'planned', 'in_progress', 'completed', 'verified'

  assigned_to UUID REFERENCES user_profiles(id),
  due_date DATE,

  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES user_profiles(id),
  completion_notes TEXT,

  -- Effectiveness review
  effectiveness_verified BOOLEAN,
  effectiveness_notes TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES user_profiles(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risikovurderinger
CREATE TABLE qms_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_number TEXT UNIQUE NOT NULL,  -- 'RISK-2025-0001'

  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Klassifisering
  category TEXT NOT NULL,  -- 'operational', 'financial', 'compliance', 'safety', 'reputation'

  -- Risikomatrise
  probability INTEGER CHECK (probability BETWEEN 1 AND 5),  -- 1=Very Low, 5=Very High
  impact INTEGER CHECK (impact BETWEEN 1 AND 5),
  risk_score INTEGER GENERATED ALWAYS AS (probability * impact) STORED,

  -- Residual risk (after controls)
  residual_probability INTEGER CHECK (residual_probability BETWEEN 1 AND 5),
  residual_impact INTEGER CHECK (residual_impact BETWEEN 1 AND 5),
  residual_risk_score INTEGER GENERATED ALWAYS AS (residual_probability * residual_impact) STORED,

  -- Tiltak
  existing_controls TEXT,
  planned_controls TEXT,

  -- Status
  status TEXT DEFAULT 'identified',  -- 'identified', 'assessed', 'treated', 'accepted', 'closed'

  -- Eierskap
  owner_id UUID REFERENCES user_profiles(id),
  reviewer_id UUID REFERENCES user_profiles(id),

  -- Review
  next_review_date DATE,
  last_reviewed_at TIMESTAMPTZ,
  last_reviewed_by UUID REFERENCES user_profiles(id),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indekser for NC
CREATE INDEX idx_nc_number ON qms_nonconformities(nc_number);
CREATE INDEX idx_nc_status ON qms_nonconformities(status);
CREATE INDEX idx_nc_severity ON qms_nonconformities(severity);
CREATE INDEX idx_nc_assigned ON qms_nonconformities(assigned_to)
  WHERE status NOT IN ('closed', 'cancelled');
CREATE INDEX idx_nc_due ON qms_nonconformities(due_date)
  WHERE status NOT IN ('closed', 'cancelled');

-- Indekser for CAPA
CREATE INDEX idx_capa_nc ON qms_capa_actions(nc_id);
CREATE INDEX idx_capa_status ON qms_capa_actions(status);
CREATE INDEX idx_capa_assigned ON qms_capa_actions(assigned_to)
  WHERE status NOT IN ('completed', 'verified');

-- Indekser for Risks
CREATE INDEX idx_risks_number ON qms_risks(risk_number);
CREATE INDEX idx_risks_status ON qms_risks(status);
CREATE INDEX idx_risks_score ON qms_risks(risk_score DESC)
  WHERE status NOT IN ('closed', 'accepted');
CREATE INDEX idx_risks_review ON qms_risks(next_review_date)
  WHERE status NOT IN ('closed');

-- Triggers
CREATE TRIGGER nc_updated_at
  BEFORE UPDATE ON qms_nonconformities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER capa_updated_at
  BEFORE UPDATE ON qms_capa_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER risks_updated_at
  BEFORE UPDATE ON qms_risks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

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

-- Auto-generate Risk number
CREATE OR REPLACE FUNCTION generate_risk_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.risk_number IS NULL THEN
    NEW.risk_number := 'RISK-' || to_char(NOW(), 'YYYY') || '-' ||
      LPAD((SELECT COALESCE(MAX(
        CAST(SUBSTRING(risk_number FROM 'RISK-\d{4}-(\d+)') AS INTEGER)
      ), 0) + 1
      FROM qms_risks
      WHERE risk_number LIKE 'RISK-' || to_char(NOW(), 'YYYY') || '-%')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER risks_auto_number
  BEFORE INSERT ON qms_risks
  FOR EACH ROW
  EXECUTE FUNCTION generate_risk_number();

-- RLS
ALTER TABLE qms_nonconformities ENABLE ROW LEVEL SECURITY;
ALTER TABLE qms_capa_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qms_risks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view nc" ON qms_nonconformities
  FOR SELECT USING (public.is_staff());

CREATE POLICY "Staff can manage nc" ON qms_nonconformities
  FOR ALL USING (public.is_staff());

CREATE POLICY "Staff can view capa" ON qms_capa_actions
  FOR SELECT USING (public.is_staff());

CREATE POLICY "Staff can manage capa" ON qms_capa_actions
  FOR ALL USING (public.is_staff());

CREATE POLICY "Staff can view risks" ON qms_risks
  FOR SELECT USING (public.is_staff());

CREATE POLICY "Staff can manage risks" ON qms_risks
  FOR ALL USING (public.is_staff());
