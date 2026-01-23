-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00023_activity_log.sql
-- Aktivitetslogging for audit trail
-- ══════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Hvem
  user_id UUID REFERENCES user_profiles(id),
  user_email TEXT,
  user_name TEXT,
  
  -- Hva
  action TEXT NOT NULL,  -- 'create', 'update', 'delete', 'view', 'export', 'login', 'logout'
  entity_type TEXT NOT NULL,  -- 'candidate', 'assignment', 'contract', etc.
  entity_id UUID,
  entity_name TEXT,
  
  -- Detaljer
  changes JSONB,  -- { field: { old: x, new: y } }
  metadata JSONB,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  -- Når
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indekser
CREATE INDEX idx_activity_user ON activity_log(user_id);
CREATE INDEX idx_activity_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_action ON activity_log(action);
CREATE INDEX idx_activity_created ON activity_log(created_at DESC);
CREATE INDEX idx_activity_entity_type ON activity_log(entity_type);

-- Partisjonering kan legges til for store volumer
-- ALTER TABLE activity_log PARTITION BY RANGE (created_at);

-- Helper function for logging
CREATE OR REPLACE FUNCTION log_activity(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_entity_name TEXT DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_user_name TEXT;
  v_log_id UUID;
BEGIN
  -- Get current user info
  SELECT id, email, COALESCE(first_name || ' ' || last_name, email)
  INTO v_user_id, v_user_email, v_user_name
  FROM user_profiles
  WHERE id = auth.uid();
  
  INSERT INTO activity_log (
    user_id, user_email, user_name,
    action, entity_type, entity_id, entity_name,
    changes, metadata
  )
  VALUES (
    v_user_id, v_user_email, v_user_name,
    p_action, p_entity_type, p_entity_id, p_entity_name,
    p_changes, p_metadata
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view activity log" ON activity_log
  FOR SELECT USING (public.is_staff());

CREATE POLICY "System can insert activity" ON activity_log
  FOR INSERT WITH CHECK (TRUE);
