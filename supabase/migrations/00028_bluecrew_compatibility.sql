-- Migration: Bluecrew Compatibility Layer
-- Adds 'name' and 'status' columns that bluecrew-v3 expects
-- Uses triggers to keep them in sync with first_name/last_name and compliance_status

-- Step 1: Add the columns bluecrew-v3 expects
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS name text;

ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS status text;

-- Step 2: Populate existing data
UPDATE public.candidates SET
  name = CASE 
    WHEN last_name IS NOT NULL AND last_name != '' THEN first_name || ' ' || last_name
    ELSE first_name
  END,
  status = CASE compliance_status
    WHEN 'approved' THEN 'godkjent'
    WHEN 'review_pending' THEN 'pending'
    WHEN 'rejected' THEN 'avslått'
    WHEN 'expired' THEN 'utløpt'
    WHEN 'not_started' THEN 'pending'
    ELSE 'pending'
  END
WHERE name IS NULL OR status IS NULL;

-- Step 3: Create trigger function to sync fields on INSERT/UPDATE
CREATE OR REPLACE FUNCTION sync_candidate_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- If name is provided but first_name is not, split name into first/last
  IF NEW.name IS NOT NULL AND (NEW.first_name IS NULL OR NEW.first_name = '' OR NEW.first_name = 'Ukjent') THEN
    NEW.first_name := split_part(NEW.name, ' ', 1);
    NEW.last_name := CASE 
      WHEN position(' ' in NEW.name) > 0 THEN substring(NEW.name from position(' ' in NEW.name) + 1)
      ELSE ''
    END;
  END IF;
  
  -- If first_name is provided, compute name
  IF NEW.first_name IS NOT NULL AND NEW.first_name != '' THEN
    NEW.name := CASE 
      WHEN NEW.last_name IS NOT NULL AND NEW.last_name != '' THEN NEW.first_name || ' ' || NEW.last_name
      ELSE NEW.first_name
    END;
  END IF;
  
  -- If status (Norwegian) is provided but compliance_status is not set properly, map it
  IF NEW.status IS NOT NULL AND (NEW.compliance_status IS NULL OR TG_OP = 'INSERT') THEN
    NEW.compliance_status := CASE NEW.status
      WHEN 'godkjent' THEN 'approved'::compliance_status
      WHEN 'pending' THEN 'review_pending'::compliance_status
      WHEN 'avslått' THEN 'rejected'::compliance_status
      WHEN 'utløpt' THEN 'expired'::compliance_status
      ELSE 'review_pending'::compliance_status
    END;
  END IF;
  
  -- If compliance_status is set, compute status (Norwegian)
  IF NEW.compliance_status IS NOT NULL THEN
    NEW.status := CASE NEW.compliance_status
      WHEN 'approved' THEN 'godkjent'
      WHEN 'review_pending' THEN 'pending'
      WHEN 'rejected' THEN 'avslått'
      WHEN 'expired' THEN 'utløpt'
      WHEN 'not_started' THEN 'pending'
      ELSE 'pending'
    END;
  END IF;
  
  -- Ensure required fields have defaults
  IF NEW.first_name IS NULL OR NEW.first_name = '' THEN
    NEW.first_name := 'Ukjent';
  END IF;
  
  IF NEW.primary_role IS NULL OR NEW.primary_role = '' THEN
    NEW.primary_role := 'deckhand';
  END IF;
  
  IF NEW.compliance_status IS NULL THEN
    NEW.compliance_status := 'review_pending';
  END IF;
  
  IF NEW.source IS NULL THEN
    NEW.source := 'bluecrew_website';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create the trigger
DROP TRIGGER IF EXISTS candidate_field_sync ON public.candidates;
CREATE TRIGGER candidate_field_sync
  BEFORE INSERT OR UPDATE ON public.candidates
  FOR EACH ROW
  EXECUTE FUNCTION sync_candidate_fields();

-- Step 5: Create index for email lookups (bluecrew uses email to find candidates)
CREATE INDEX IF NOT EXISTS idx_candidates_email ON public.candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_name ON public.candidates(name);

-- Comments
COMMENT ON COLUMN public.candidates.name IS 'Full name for bluecrew-v3 compatibility. Synced with first_name/last_name via trigger.';
COMMENT ON COLUMN public.candidates.status IS 'Norwegian status for bluecrew-v3. Synced with compliance_status via trigger.';
