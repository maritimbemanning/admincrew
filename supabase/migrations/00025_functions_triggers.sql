-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00025_functions_triggers.sql
-- Sentraliserte database functions og triggers
-- ══════════════════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════════════════
-- UTILITY FUNCTIONS
-- ══════════════════════════════════════════════════════════════════════════════════════

-- Generic updated_at trigger (already created in earlier migration, redefined for completeness)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generate reference numbers with prefix
CREATE OR REPLACE FUNCTION generate_reference_number(
  p_prefix TEXT,
  p_table TEXT,
  p_column TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_year TEXT := to_char(NOW(), 'YYYY');
  v_pattern TEXT := p_prefix || '-' || v_year || '-';
  v_next_num INTEGER;
  v_result TEXT;
BEGIN
  EXECUTE format(
    'SELECT COALESCE(MAX(CAST(SUBSTRING(%I FROM %L) AS INTEGER)), 0) + 1 FROM %I WHERE %I LIKE %L',
    p_column,
    p_prefix || '-\d{4}-(\d+)',
    p_table,
    p_column,
    v_pattern || '%'
  ) INTO v_next_num;
  
  v_result := p_prefix || '-' || v_year || '-' || LPAD(v_next_num::TEXT, 4, '0');
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ══════════════════════════════════════════════════════════════════════════════════════
-- SEARCH INDEX FUNCTIONS
-- ══════════════════════════════════════════════════════════════════════════════════════

-- Rebuild candidate search index
CREATE OR REPLACE FUNCTION rebuild_candidate_search_index()
RETURNS VOID AS $$
BEGIN
  UPDATE candidates SET
    search_index = to_tsvector('norwegian',
      COALESCE(first_name, '') || ' ' ||
      COALESCE(last_name, '') || ' ' ||
      COALESCE(email, '') || ' ' ||
      COALESCE(phone, '') || ' ' ||
      COALESCE(current_title, '') || ' ' ||
      COALESCE(city, '') || ' ' ||
      COALESCE(array_to_string(skills, ' '), '') || ' ' ||
      COALESCE(array_to_string(languages, ' '), '') || ' ' ||
      COALESCE(notes, '')
    );
END;
$$ LANGUAGE plpgsql;

-- Trigger to update candidate search index
CREATE OR REPLACE FUNCTION update_candidate_search_index()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_index := to_tsvector('norwegian',
    COALESCE(NEW.first_name, '') || ' ' ||
    COALESCE(NEW.last_name, '') || ' ' ||
    COALESCE(NEW.email, '') || ' ' ||
    COALESCE(NEW.phone, '') || ' ' ||
    COALESCE(NEW.current_title, '') || ' ' ||
    COALESCE(NEW.city, '') || ' ' ||
    COALESCE(array_to_string(NEW.skills, ' '), '') || ' ' ||
    COALESCE(array_to_string(NEW.languages, ' '), '') || ' ' ||
    COALESCE(NEW.notes, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if it doesn't exist (check for idempotency)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'candidates_search_index'
  ) THEN
    CREATE TRIGGER candidates_search_index
      BEFORE INSERT OR UPDATE ON candidates
      FOR EACH ROW
      EXECUTE FUNCTION update_candidate_search_index();
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════════════════════════════
-- TIMESHEET CALCULATION FUNCTIONS
-- ══════════════════════════════════════════════════════════════════════════════════════

-- Calculate timesheet totals from entries
CREATE OR REPLACE FUNCTION calculate_timesheet_totals(p_timesheet_id UUID)
RETURNS VOID AS $$
DECLARE
  v_entries JSONB;
  v_entry JSONB;
  v_total_hours DECIMAL := 0;
  v_total_overtime DECIMAL := 0;
  v_total_days DECIMAL := 0;
BEGIN
  SELECT entries INTO v_entries FROM assignment_timesheets WHERE id = p_timesheet_id;
  
  IF v_entries IS NOT NULL AND jsonb_array_length(v_entries) > 0 THEN
    FOR v_entry IN SELECT * FROM jsonb_array_elements(v_entries) LOOP
      v_total_hours := v_total_hours + COALESCE((v_entry->>'hours_normal')::DECIMAL, 0);
      v_total_overtime := v_total_overtime + 
        COALESCE((v_entry->>'hours_overtime_50')::DECIMAL, 0) +
        COALESCE((v_entry->>'hours_overtime_100')::DECIMAL, 0);
      v_total_days := v_total_days + 1;
    END LOOP;
  END IF;
  
  UPDATE assignment_timesheets SET
    total_hours = v_total_hours,
    total_hours_overtime = v_total_overtime,
    total_days = v_total_days
  WHERE id = p_timesheet_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic timesheet calculation
CREATE OR REPLACE FUNCTION trigger_calculate_timesheet()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.entries IS DISTINCT FROM OLD.entries THEN
    PERFORM calculate_timesheet_totals(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ══════════════════════════════════════════════════════════════════════════════════════
-- ASSIGNMENT MATCHING FUNCTIONS
-- ══════════════════════════════════════════════════════════════════════════════════════

-- Calculate match score between candidate and request
CREATE OR REPLACE FUNCTION calculate_match_score(
  p_candidate_id UUID,
  p_request_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
  v_candidate RECORD;
  v_request RECORD;
  v_skill TEXT;
  v_cert TEXT;
BEGIN
  SELECT * INTO v_candidate FROM candidates WHERE id = p_candidate_id;
  SELECT * INTO v_request FROM personnel_requests WHERE id = p_request_id;
  
  IF v_candidate IS NULL OR v_request IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Skills match (up to 40 points)
  IF v_request.required_skills IS NOT NULL AND v_candidate.skills IS NOT NULL THEN
    FOREACH v_skill IN ARRAY v_request.required_skills LOOP
      IF v_skill = ANY(v_candidate.skills) THEN
        v_score := v_score + 10;
      END IF;
    END LOOP;
    v_score := LEAST(v_score, 40);
  END IF;
  
  -- Certifications match (up to 30 points)
  IF v_request.required_certifications IS NOT NULL THEN
    SELECT COUNT(*) * 10 INTO v_score
    FROM candidate_certifications cc
    WHERE cc.candidate_id = p_candidate_id
    AND cc.certification_type = ANY(v_request.required_certifications)
    AND (cc.expiry_date IS NULL OR cc.expiry_date > CURRENT_DATE);
    v_score := LEAST(v_score, 30);
  END IF;
  
  -- Location match (10 points)
  IF v_request.work_location IS NOT NULL AND v_candidate.city IS NOT NULL THEN
    IF LOWER(v_candidate.city) LIKE '%' || LOWER(v_request.work_location) || '%' THEN
      v_score := v_score + 10;
    END IF;
  END IF;
  
  -- Availability match (20 points)
  IF v_candidate.availability_status = 'available' THEN
    v_score := v_score + 20;
  ELSIF v_candidate.availability_status = 'available_soon' THEN
    v_score := v_score + 10;
  END IF;
  
  RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql;

-- ══════════════════════════════════════════════════════════════════════════════════════
-- NOTIFICATION FUNCTIONS
-- ══════════════════════════════════════════════════════════════════════════════════════

-- Create notification (placeholder for edge function integration)
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- This is a placeholder that could:
  -- 1. Insert into a notifications table
  -- 2. Call a Supabase Edge Function
  -- 3. Send via Supabase Realtime
  
  -- For now, we log the notification
  PERFORM log_activity(
    'notification',
    'notification',
    NULL,
    p_title,
    NULL,
    jsonb_build_object(
      'recipient_id', p_user_id,
      'type', p_type,
      'message', p_message,
      'link', p_link,
      'metadata', p_metadata
    )
  );
  
  RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

-- ══════════════════════════════════════════════════════════════════════════════════════
-- CLEANUP AND MAINTENANCE FUNCTIONS
-- ══════════════════════════════════════════════════════════════════════════════════════

-- Archive old activity logs (keep last 90 days)
CREATE OR REPLACE FUNCTION archive_old_activity_logs()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM activity_log
    WHERE created_at < NOW() - INTERVAL '90 days'
    RETURNING *
  )
  SELECT COUNT(*) INTO v_count FROM deleted;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Update overdue invoice statuses
CREATE OR REPLACE FUNCTION update_overdue_invoices()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE invoices SET
    status = 'overdue',
    updated_at = NOW()
  WHERE status = 'sent'
  AND due_date < CURRENT_DATE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Check for expiring certifications (returns candidates with certs expiring in 30 days)
CREATE OR REPLACE FUNCTION get_expiring_certifications(p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  candidate_id UUID,
  candidate_name TEXT,
  certification_type TEXT,
  expiry_date DATE,
  days_until_expiry INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.first_name || ' ' || c.last_name,
    cc.certification_type,
    cc.expiry_date,
    (cc.expiry_date - CURRENT_DATE)::INTEGER
  FROM candidates c
  JOIN candidate_certifications cc ON cc.candidate_id = c.id
  WHERE cc.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + p_days
  ORDER BY cc.expiry_date;
END;
$$ LANGUAGE plpgsql;
