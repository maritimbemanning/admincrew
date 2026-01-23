-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00015_assignments.sql
-- Oppdrag (assignments) - koblingen mellom kandidat og kunde
-- ══════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_number TEXT UNIQUE NOT NULL,  -- 'ASN-2025-0001'

  -- Relasjoner
  request_id UUID REFERENCES customer_requests(id),
  organization_id UUID NOT NULL REFERENCES crm_organizations(id),
  contact_id UUID REFERENCES crm_contacts(id),
  candidate_id UUID NOT NULL REFERENCES candidates(id),

  -- Detaljer
  title TEXT NOT NULL,
  description TEXT,
  role TEXT NOT NULL,

  -- Dato
  planned_start_date DATE NOT NULL,
  planned_end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,

  -- Lokasjon
  work_location TEXT,
  vessel_name TEXT,
  vessel_imo TEXT,

  -- Økonomi
  employee_rate_type TEXT DEFAULT 'daily',  -- 'hourly', 'daily', 'monthly'
  employee_rate_amount_nok DECIMAL(10,2),
  billing_rate_type TEXT DEFAULT 'daily',
  billing_rate_amount_nok DECIMAL(10,2),
  overtime_rate_multiplier DECIMAL(3,2) DEFAULT 1.5,

  -- Status
  status assignment_status DEFAULT 'draft',

  -- Release checklist
  release_checklist JSONB DEFAULT '{
    "contract_signed": false,
    "compliance_verified": false,
    "documents_received": false,
    "travel_arranged": false,
    "client_notified": false,
    "onboarding_completed": false
  }',

  -- Notater
  internal_notes TEXT,
  client_notes TEXT,

  -- Eierskap
  owner_id UUID REFERENCES user_profiles(id),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES user_profiles(id),
  archived_at TIMESTAMPTZ
);

-- Indekser
CREATE INDEX idx_assignments_number ON assignments(assignment_number);
CREATE INDEX idx_assignments_org ON assignments(organization_id);
CREATE INDEX idx_assignments_candidate ON assignments(candidate_id);
CREATE INDEX idx_assignments_request ON assignments(request_id);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_assignments_dates ON assignments(planned_start_date, planned_end_date);
CREATE INDEX idx_assignments_active ON assignments(id)
  WHERE status IN ('active', 'ready_for_start', 'contract_signed');

-- Trigger
CREATE TRIGGER assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-generate assignment number
CREATE OR REPLACE FUNCTION generate_assignment_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assignment_number IS NULL THEN
    NEW.assignment_number := 'ASN-' || to_char(NOW(), 'YYYY') || '-' ||
      LPAD((SELECT COALESCE(MAX(
        CAST(SUBSTRING(assignment_number FROM 'ASN-\d{4}-(\d+)') AS INTEGER)
      ), 0) + 1
      FROM assignments
      WHERE assignment_number LIKE 'ASN-' || to_char(NOW(), 'YYYY') || '-%')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assignments_auto_number
  BEFORE INSERT ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION generate_assignment_number();

-- Add FK to activities
ALTER TABLE crm_activities
  ADD CONSTRAINT fk_activities_assignment
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view assignments" ON assignments
  FOR SELECT USING (public.is_staff());

CREATE POLICY "Staff can manage assignments" ON assignments
  FOR ALL USING (public.is_staff());

-- Employees can view own assignments
CREATE POLICY "Employees can view own assignments" ON assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM candidates
      WHERE candidates.id = assignments.candidate_id
      AND candidates.user_id = auth.uid()
    )
  );
