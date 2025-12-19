-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00016_release_checklists.sql
-- Release Checklists for Assignments
-- ══════════════════════════════════════════════════════════════════════════════════════

-- Release checklists are stored as JSONB within the assignments table.
-- This migration documents the release checklist structure and adds
-- helper functions for checklist management.

-- The release_checklist JSONB field is already defined in 00015_assignments.sql
-- with the following default structure:
-- {
--   "contract_signed": false,
--   "compliance_verified": false,
--   "documents_received": false,
--   "travel_arranged": false,
--   "client_notified": false,
--   "onboarding_completed": false
-- }

-- Extended checklist items for comprehensive release process
COMMENT ON COLUMN assignments.release_checklist IS 'Release checklist items:
- contract_signed: Employment/assignment contract signed by all parties
- compliance_verified: Candidate compliance status is approved
- documents_received: All required documents received and verified
- travel_arranged: Travel and accommodation arranged if needed
- client_notified: Customer has been notified of assignment start
- onboarding_completed: Candidate has completed onboarding
- equipment_issued: Required equipment/PPE issued
- safety_briefing: Safety briefing completed';

-- Function to check if assignment is ready for release
CREATE OR REPLACE FUNCTION is_assignment_ready_for_release(p_assignment_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_checklist JSONB;
  v_required_items TEXT[] := ARRAY['contract_signed', 'compliance_verified', 'documents_received'];
  v_item TEXT;
BEGIN
  SELECT release_checklist INTO v_checklist
  FROM assignments
  WHERE id = p_assignment_id;
  
  IF v_checklist IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check all required items are true
  FOREACH v_item IN ARRAY v_required_items LOOP
    IF NOT COALESCE((v_checklist->>v_item)::BOOLEAN, FALSE) THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to update a checklist item
CREATE OR REPLACE FUNCTION update_release_checklist_item(
  p_assignment_id UUID,
  p_item TEXT,
  p_value BOOLEAN
)
RETURNS JSONB AS $$
DECLARE
  v_new_checklist JSONB;
BEGIN
  UPDATE assignments
  SET release_checklist = jsonb_set(
    COALESCE(release_checklist, '{}'::JSONB),
    ARRAY[p_item],
    to_jsonb(p_value)
  ),
  updated_at = NOW()
  WHERE id = p_assignment_id
  RETURNING release_checklist INTO v_new_checklist;
  
  RETURN v_new_checklist;
END;
$$ LANGUAGE plpgsql;

-- Function to get checklist completion percentage
CREATE OR REPLACE FUNCTION get_checklist_completion(p_assignment_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_checklist JSONB;
  v_total INTEGER := 0;
  v_completed INTEGER := 0;
  v_key TEXT;
  v_value BOOLEAN;
BEGIN
  SELECT release_checklist INTO v_checklist
  FROM assignments
  WHERE id = p_assignment_id;
  
  IF v_checklist IS NULL THEN
    RETURN 0;
  END IF;
  
  FOR v_key IN SELECT jsonb_object_keys(v_checklist) LOOP
    v_total := v_total + 1;
    IF (v_checklist->>v_key)::BOOLEAN THEN
      v_completed := v_completed + 1;
    END IF;
  END LOOP;
  
  IF v_total = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN (v_completed * 100 / v_total);
END;
$$ LANGUAGE plpgsql;
