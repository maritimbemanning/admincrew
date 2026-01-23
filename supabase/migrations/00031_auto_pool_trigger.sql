-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00031_auto_pool_trigger.sql
-- Auto-assign candidates to pools based on primary_role
-- ══════════════════════════════════════════════════════════════════════════════════════

-- 1. Create standard category pools if they don't exist
INSERT INTO candidate_pools (name, slug, pool_type, is_system, icon, color, description)
VALUES 
  ('Dekk', 'dekk', 'static', TRUE, 'anchor', '#3B82F6', 'Matros, Båtsmann, Lettmatros'),
  ('Maskin', 'maskin', 'static', TRUE, 'settings', '#EF4444', 'Maskinsjef, Maskinist, Motormann'),
  ('Offiserer', 'offiserer', 'static', TRUE, 'star', '#EAB308', 'Kaptein, Styrmann, Overstyrmann'),
  ('Catering & Forpleining', 'catering', 'static', TRUE, 'coffee', '#10B981', 'Kokk, Forpleining, Steward'),
  ('Akvakultur', 'akva', 'static', TRUE, 'fish', '#06B6D4', 'Røkter, Driftstekniker, Akvatekniker'),
  ('Elektro & Automasjon', 'elektro', 'static', TRUE, 'zap', '#F59E0B', 'ETO, Elektriker, Automatiker'),
  ('Offshore & Subsea', 'offshore', 'static', TRUE, 'activity', '#6366F1', 'ROV, Kranfører, Rigger')
ON CONFLICT (slug) DO NOTHING;

-- 2. Function to auto-assign pools based on role text
CREATE OR REPLACE FUNCTION auto_assign_pools()
RETURNS TRIGGER AS $$
DECLARE
  role_text TEXT;
  pool_slug TEXT;
  pool_id UUID;
BEGIN
  -- Only proceed if primary_role is set/changed
  IF NEW.primary_role IS NULL THEN
    RETURN NEW;
  END IF;

  role_text := lower(NEW.primary_role);
  
  -- Logic mapping (Keyword matching)
  IF role_text LIKE '%kaptein%' OR role_text LIKE '%styrmann%' OR role_text LIKE '%skipsfører%' THEN
    pool_slug := 'offiserer';
  ELSIF role_text LIKE '%maskin%' OR role_text LIKE '%motormann%' THEN
    pool_slug := 'maskin';
  ELSIF role_text LIKE '%matros%' OR role_text LIKE '%båtsmann%' OR role_text LIKE '%lettmatros%' THEN
    pool_slug := 'dekk';
  ELSIF role_text LIKE '%kokk%' OR role_text LIKE '%forpleining%' OR role_text LIKE '%steward%' THEN
    pool_slug := 'catering';
  ELSIF role_text LIKE '%røkter%' OR role_text LIKE '%akva%' OR role_text LIKE '%oppdrett%' THEN
    pool_slug := 'akva';
  ELSIF role_text LIKE '%elektriker%' OR role_text LIKE '%eto%' OR role_text LIKE '%automatiker%' THEN
    pool_slug := 'elektro';
  ELSIF role_text LIKE '%rov%' OR role_text LIKE '%kran%' OR role_text LIKE '%rigger%' OR role_text LIKE '%offshore%' THEN
    pool_slug := 'offshore';
  END IF;

  -- If we found a matching pool
  IF pool_slug IS NOT NULL THEN
    -- Get pool ID
    SELECT id INTO pool_id FROM candidate_pools WHERE slug = pool_slug;
    
    IF pool_id IS NOT NULL THEN
      -- Insert membership if not exists
      INSERT INTO candidate_pool_memberships (pool_id, candidate_id, notes)
      VALUES (pool_id, NEW.id, 'Auto-assigned by system based on role: ' || NEW.primary_role)
      ON CONFLICT (pool_id, candidate_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach trigger to candidates table
DROP TRIGGER IF EXISTS trigger_auto_assign_pools ON candidates;

CREATE TRIGGER trigger_auto_assign_pools
  AFTER INSERT OR UPDATE OF primary_role
  ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_pools();
