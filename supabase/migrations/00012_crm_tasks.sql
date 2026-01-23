-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00012_crm_tasks.sql
-- Oppgaver og påminnelser
-- ══════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE crm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  organization_id UUID REFERENCES crm_organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL,

  title TEXT NOT NULL,
  description TEXT,

  due_date DATE,
  due_time TIME,
  reminder_at TIMESTAMPTZ,

  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',

  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES user_profiles(id),
  completion_notes TEXT,

  assigned_to UUID REFERENCES user_profiles(id),
  created_by UUID REFERENCES user_profiles(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indekser
CREATE INDEX idx_tasks_org ON crm_tasks(organization_id);
CREATE INDEX idx_tasks_assigned ON crm_tasks(assigned_to);
CREATE INDEX idx_tasks_due ON crm_tasks(due_date) WHERE status = 'pending';
CREATE INDEX idx_tasks_status ON crm_tasks(status);

-- Trigger
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON crm_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view tasks" ON crm_tasks
  FOR SELECT USING (public.is_staff());

CREATE POLICY "Staff can manage tasks" ON crm_tasks
  FOR ALL USING (public.is_staff());
