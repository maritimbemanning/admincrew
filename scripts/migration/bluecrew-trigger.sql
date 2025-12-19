-- ═══════════════════════════════════════════════════════════════════════════════════════
-- BLUECREW.NO → ADMINCREW.NO SYNC TRIGGER
-- ═══════════════════════════════════════════════════════════════════════════════════════
-- 
-- KJØR DETTE I BLUECREW.NO SUPABASE (uqwfesvsfiqjcpzwetkz)
-- 
-- Dette setter opp automatisk synkronisering når kandidater opprettes eller oppdateres
--
-- ═══════════════════════════════════════════════════════════════════════════════════════

-- 1. Aktiver pg_net extension (for HTTP-kall)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Sett opp secrets (gjøres i Supabase Dashboard → Settings → Vault)
-- Du må legge til disse secrets:
--   - admincrew_webhook_url: https://admincrew.no/api/webhooks/bluecrew
--   - admincrew_webhook_secret: <generer en sikker hemmelighet>

-- 3. Lag sync-funksjonen
CREATE OR REPLACE FUNCTION sync_candidate_to_admincrew()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
  webhook_secret TEXT;
  payload JSONB;
  event_type TEXT;
  timestamp_str TEXT;
  signature TEXT;
BEGIN
  -- Hent webhook URL fra env/vault
  -- OBS: Du må sette denne som database secret eller hardkode URL midlertidig
  webhook_url := 'https://admincrew.vercel.app/api/webhooks/bluecrew';
  
  -- Generer timestamp
  timestamp_str := EXTRACT(EPOCH FROM NOW())::TEXT;
  
  -- Bestem event-type
  IF TG_OP = 'INSERT' THEN
    event_type := 'candidate.created';
  ELSIF TG_OP = 'UPDATE' THEN
    event_type := 'candidate.updated';
  ELSIF TG_OP = 'DELETE' THEN
    event_type := 'candidate.deleted';
  END IF;
  
  -- Bygg payload med mapping til admincrew-format
  IF TG_OP = 'DELETE' THEN
    payload := jsonb_build_object(
      'event', event_type,
      'data', jsonb_build_object('bluecrew_id', OLD.id)
    );
  ELSE
    payload := jsonb_build_object(
      'event', event_type,
      'data', jsonb_build_object(
        'bluecrew_id', NEW.id,
        'first_name', COALESCE(NEW.first_name, split_part(NEW.name, ' ', 1)),
        'last_name', COALESCE(NEW.last_name, 
          CASE 
            WHEN position(' ' in NEW.name) > 0 
            THEN substring(NEW.name from position(' ' in NEW.name) + 1)
            ELSE ''
          END
        ),
        'email', NEW.email,
        'phone', NEW.phone,
        'date_of_birth', NEW.date_of_birth,
        'nationality', COALESCE(NEW.nationality, 'NO'),
        'address_city', NEW.municipality,
        'address_postal_code', NULL,
        'fylke', NEW.county,
        'kommune', NEW.municipality,
        'primary_role', map_role_to_english(NEW.primary_role),
        'experience_years', COALESCE(NEW.experience_years, 0),
        'availability_status', map_availability(NEW.available_from),
        'available_from', NEW.available_from,
        'cv_summary', NEW.skills,
        'bio', NEW.other_comp,
        'profile_image_url', NEW.profile_image_url,
        -- Legg til sertifikat-info som JSONB
        'certifications', jsonb_build_object(
          'stcw_has', NEW.stcw_has,
          'stcw_mod', NEW.stcw_mod,
          'deck_has', NEW.deck_has,
          'deck_class', NEW.deck_class,
          'machine_has', NEW.machine_has,
          'machine_class', NEW.machine_class,
          'radio_has', NEW.radio_has,
          'radio_type', NEW.radio_type
        ),
        'source', 'bluecrew_website',
        'source_details', jsonb_build_object(
          'wants_temporary', NEW.wants_temporary,
          'created_at', NEW.created_at
        )
      )
    );
  END IF;
  
  -- Send webhook (asynkront via pg_net)
  PERFORM net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Webhook-Timestamp', timestamp_str,
      'X-Webhook-Source', 'bluecrew'
      -- Signatur kan legges til senere for sikkerhet
    ),
    body := payload::TEXT
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Hjelpefunksjon: Map rolle til engelsk
CREATE OR REPLACE FUNCTION map_role_to_english(role TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE LOWER(COALESCE(role, ''))
    WHEN 'kaptein' THEN 'captain'
    WHEN 'skipsfører' THEN 'captain'
    WHEN 'styrmann' THEN 'mate'
    WHEN 'overstyrmann' THEN 'chief_mate'
    WHEN 'maskinist' THEN 'engineer'
    WHEN 'maskinsjef' THEN 'chief_engineer'
    WHEN 'dekksmann' THEN 'deckhand'
    WHEN 'matros' THEN 'able_seaman'
    WHEN 'lettmatros' THEN 'ordinary_seaman'
    WHEN 'kokk' THEN 'cook'
    WHEN 'steward' THEN 'steward'
    WHEN 'elektriker' THEN 'electrician'
    ELSE 'deckhand'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. Hjelpefunksjon: Map tilgjengelighet
CREATE OR REPLACE FUNCTION map_availability(available_from DATE)
RETURNS TEXT AS $$
BEGIN
  IF available_from IS NULL THEN
    RETURN 'inactive';
  ELSIF available_from <= CURRENT_DATE THEN
    RETURN 'available';
  ELSIF available_from <= CURRENT_DATE + INTERVAL '14 days' THEN
    RETURN 'available_soon';
  ELSE
    RETURN 'unavailable';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 6. Opprett trigger
DROP TRIGGER IF EXISTS sync_to_admincrew_trigger ON candidates;

CREATE TRIGGER sync_to_admincrew_trigger
  AFTER INSERT OR UPDATE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION sync_candidate_to_admincrew();

-- 7. Verifiser at alt er satt opp
SELECT 
  'Trigger opprettet!' AS status,
  tgname AS trigger_name,
  tgtype AS trigger_type
FROM pg_trigger 
WHERE tgname = 'sync_to_admincrew_trigger';

-- ═══════════════════════════════════════════════════════════════════════════════════════
-- FERDIG! 
-- Nå vil alle nye kandidater automatisk synkes til admincrew.no
-- ═══════════════════════════════════════════════════════════════════════════════════════
