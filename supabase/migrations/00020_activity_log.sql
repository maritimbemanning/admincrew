-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00020_activity_log.sql
-- Global aktivitetslogg for audit trail
-- ══════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Hvem
  user_id UUID REFERENCES user_profiles(id),
  user_email TEXT,
  user_name TEXT,

  -- Hva
  action TEXT NOT NULL,  -- 'create', 'update', 'delete', 'view', 'export', 'login', etc.
  entity_type TEXT NOT NULL,  -- 'candidate', 'organization', 'request', 'assignment', etc.
  entity_id UUID,
  entity_name TEXT,

  -- Detaljer
  description TEXT,
  changes JSONB,  -- {"field": {"old": "value", "new": "value"}}
  metadata JSONB,

  -- Kontekst
  ip_address TEXT,
  user_agent TEXT,
  request_id TEXT,

  -- Tid
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indekser for rask søk
CREATE INDEX idx_activity_user ON activity_log(user_id);
CREATE INDEX idx_activity_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_action ON activity_log(action);
CREATE INDEX idx_activity_created ON activity_log(created_at DESC);

-- Partisjonering (valgfritt, for store datamengder)
-- CREATE INDEX idx_activity_created_month ON activity_log(date_trunc('month', created_at));

-- RLS
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity log" ON activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- Helper function for logging
CREATE OR REPLACE FUNCTION log_activity(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_entity_name TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user RECORD;
  v_log_id UUID;
BEGIN
  SELECT id, email, full_name INTO v_user
  FROM user_profiles
  WHERE id = auth.uid();

  INSERT INTO activity_log (
    user_id, user_email, user_name,
    action, entity_type, entity_id, entity_name,
    description, changes, metadata
  ) VALUES (
    v_user.id, v_user.email, v_user.full_name,
    p_action, p_entity_type, p_entity_id, p_entity_name,
    p_description, p_changes, p_metadata
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
