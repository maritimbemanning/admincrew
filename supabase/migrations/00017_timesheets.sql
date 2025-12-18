-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00017_timesheets.sql
-- Timeregistrering
-- ══════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE assignment_timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,

  -- Periode
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Entries (JSONB array)
  entries JSONB DEFAULT '[]',
  /*
    [
      {
        "date": "2025-01-15",
        "hours_normal": 7.5,
        "hours_overtime_50": 2,
        "hours_overtime_100": 0,
        "hours_offshore": 0,
        "allowances": [],
        "notes": ""
      }
    ]
  */

  -- Totaler
  total_hours DECIMAL(6,2) DEFAULT 0,
  total_hours_overtime DECIMAL(6,2) DEFAULT 0,
  total_days DECIMAL(4,1) DEFAULT 0,

  -- Beregninger
  calculated_employee_cost_nok DECIMAL(12,2),
  calculated_billing_nok DECIMAL(12,2),
  calculated_margin_nok DECIMAL(12,2),

  -- Status
  status timesheet_status DEFAULT 'draft',

  -- Submit
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES user_profiles(id),

  -- Approval
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES user_profiles(id),
  approval_notes TEXT,

  -- Rejection
  rejected_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES user_profiles(id),
  rejection_reason TEXT,

  -- Invoice kobling
  invoice_id UUID,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(assignment_id, period_start, period_end)
);

-- Indekser
CREATE INDEX idx_timesheets_assignment ON assignment_timesheets(assignment_id);
CREATE INDEX idx_timesheets_period ON assignment_timesheets(period_start, period_end);
CREATE INDEX idx_timesheets_status ON assignment_timesheets(status);
CREATE INDEX idx_timesheets_invoice ON assignment_timesheets(invoice_id);

-- Trigger
CREATE TRIGGER timesheets_updated_at
  BEFORE UPDATE ON assignment_timesheets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE assignment_timesheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view timesheets" ON assignment_timesheets
  FOR SELECT USING (public.is_staff());

CREATE POLICY "Staff can manage timesheets" ON assignment_timesheets
  FOR ALL USING (public.is_staff());

CREATE POLICY "Employees can view own timesheets" ON assignment_timesheets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assignments
      JOIN candidates ON candidates.id = assignments.candidate_id
      WHERE assignments.id = assignment_timesheets.assignment_id
      AND candidates.user_id = auth.uid()
    )
  );

CREATE POLICY "Employees can update draft timesheets" ON assignment_timesheets
  FOR UPDATE USING (
    status = 'draft' AND
    EXISTS (
      SELECT 1 FROM assignments
      JOIN candidates ON candidates.id = assignments.candidate_id
      WHERE assignments.id = assignment_timesheets.assignment_id
      AND candidates.user_id = auth.uid()
    )
  );
