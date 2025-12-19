-- Migration: Add bluecrew compatibility - computed columns
-- Adding 'name' and 'status' columns directly to candidates table
-- so bluecrew-v3 can work with the same table without code changes

-- Add 'name' as a generated column (computed from first_name + last_name)
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS name text 
GENERATED ALWAYS AS (
  CASE 
    WHEN last_name IS NOT NULL AND last_name != '' THEN first_name || ' ' || last_name
    ELSE first_name
  END
) STORED;

-- Add 'status' as a generated column (computed from compliance_status)
ALTER TABLE public.candidates
ADD COLUMN IF NOT EXISTS status text
GENERATED ALWAYS AS (
  CASE compliance_status
    WHEN 'approved' THEN 'godkjent'
    WHEN 'review_pending' THEN 'pending'
    WHEN 'rejected' THEN 'avslått'
    WHEN 'expired' THEN 'utløpt'
    WHEN 'not_started' THEN 'pending'
    ELSE 'pending'
  END
) STORED;

-- Create index on email for faster lookups (bluecrew uses email to find candidates)
CREATE INDEX IF NOT EXISTS idx_candidates_email ON public.candidates(email);

-- Add comment
COMMENT ON COLUMN public.candidates.name IS 'Generated column: first_name + last_name for bluecrew-v3 compatibility';
COMMENT ON COLUMN public.candidates.status IS 'Generated column: maps compliance_status to Norwegian values for bluecrew-v3';

-- Note: bluecrew-v3 INSERT/UPDATE must set first_name/last_name instead of name
-- and compliance_status instead of status. The route.ts in bluecrew-v3 needs updating.
