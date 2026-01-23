-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00007_candidate_search_index.sql
-- Optimalisert søkeindeks for 10-sekunds matching
-- ══════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE candidate_search_index (
  candidate_id UUID PRIMARY KEY REFERENCES candidates(id) ON DELETE CASCADE,

  searchable_text TSVECTOR,

  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,

  roles TEXT[] NOT NULL DEFAULT '{}',

  active_certifications TEXT[] DEFAULT '{}',
  certification_codes TEXT[] DEFAULT '{}',
  certification_expiry_map JSONB DEFAULT '{}',
  next_cert_expiry DATE,

  languages TEXT[] DEFAULT '{}',
  sectors TEXT[] DEFAULT '{}',

  availability_status availability_status,
  availability_date DATE,
  compliance_status compliance_status,

  experience_years INTEGER DEFAULT 0,
  profile_completeness INTEGER DEFAULT 0,
  internal_rating INTEGER,

  fylke TEXT,
  kommune TEXT,

  tags TEXT[] DEFAULT '{}',
  pool_ids UUID[] DEFAULT '{}',

  indexed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- KRITISKE INDEKSER FOR 10-SEKUNDS MATCHING
-- ═══════════════════════════════════════════════════════

CREATE INDEX idx_search_text ON candidate_search_index USING gin(searchable_text);
CREATE INDEX idx_search_roles ON candidate_search_index USING gin(roles);
CREATE INDEX idx_search_certs ON candidate_search_index USING gin(active_certifications);
CREATE INDEX idx_search_cert_codes ON candidate_search_index USING gin(certification_codes);
CREATE INDEX idx_search_langs ON candidate_search_index USING gin(languages);
CREATE INDEX idx_search_sectors ON candidate_search_index USING gin(sectors);
CREATE INDEX idx_search_tags ON candidate_search_index USING gin(tags);
CREATE INDEX idx_search_pools ON candidate_search_index USING gin(pool_ids);
CREATE INDEX idx_search_availability ON candidate_search_index(availability_status, availability_date);
CREATE INDEX idx_search_compliance ON candidate_search_index(compliance_status);
CREATE INDEX idx_search_experience ON candidate_search_index(experience_years);
CREATE INDEX idx_search_rating ON candidate_search_index(internal_rating DESC NULLS LAST);
CREATE INDEX idx_search_fylke ON candidate_search_index(fylke);

-- Composite index for vanlige matching-queries
CREATE INDEX idx_search_available ON candidate_search_index(
  availability_status,
  compliance_status,
  experience_years
) WHERE availability_status IN ('available', 'available_soon');

-- ═══════════════════════════════════════════════════════
-- FUNCTION: Rebuild Search Index
-- ═══════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION rebuild_candidate_search_index(p_candidate_id UUID)
RETURNS VOID AS $$
DECLARE
  v_candidate RECORD;
  v_certs RECORD;
  v_pools UUID[];
BEGIN
  SELECT * INTO v_candidate FROM candidates WHERE id = p_candidate_id AND archived_at IS NULL;

  IF NOT FOUND THEN
    DELETE FROM candidate_search_index WHERE candidate_id = p_candidate_id;
    RETURN;
  END IF;

  -- Hent sertifikater
  SELECT
    array_agg(DISTINCT code) FILTER (WHERE status = 'active') as active_codes,
    array_agg(DISTINCT code) as all_codes,
    jsonb_object_agg(code, expiry_date) FILTER (WHERE expiry_date IS NOT NULL) as expiry_map,
    MIN(expiry_date) FILTER (WHERE expiry_date > NOW() AND status = 'active') as next_expiry
  INTO v_certs
  FROM candidate_certifications
  WHERE candidate_id = p_candidate_id;

  -- Hent pools
  SELECT array_agg(pool_id) INTO v_pools
  FROM candidate_pool_memberships
  WHERE candidate_id = p_candidate_id;

  -- Upsert
  INSERT INTO candidate_search_index (
    candidate_id, searchable_text, full_name, email, phone, roles,
    active_certifications, certification_codes, certification_expiry_map, next_cert_expiry,
    languages, sectors, availability_status, availability_date, compliance_status,
    experience_years, profile_completeness, internal_rating,
    fylke, kommune, tags, pool_ids, indexed_at
  ) VALUES (
    p_candidate_id,
    to_tsvector('simple',
      coalesce(v_candidate.first_name, '') || ' ' ||
      coalesce(v_candidate.last_name, '') || ' ' ||
      coalesce(v_candidate.primary_role, '') || ' ' ||
      coalesce(v_candidate.cv_summary, '') || ' ' ||
      coalesce(v_candidate.internal_notes, '') || ' ' ||
      coalesce(array_to_string(v_candidate.tags, ' '), '')
    ),
    v_candidate.first_name || ' ' || v_candidate.last_name,
    v_candidate.email,
    v_candidate.phone,
    array_cat(ARRAY[v_candidate.primary_role], coalesce(v_candidate.secondary_roles, '{}')),
    coalesce(v_certs.active_codes, '{}'),
    coalesce(v_certs.all_codes, '{}'),
    coalesce(v_certs.expiry_map, '{}'),
    v_certs.next_expiry,
    (SELECT array_agg(lang->>'code') FROM jsonb_array_elements(v_candidate.languages) AS lang),
    v_candidate.sectors,
    v_candidate.availability_status,
    v_candidate.availability_date,
    v_candidate.compliance_status,
    v_candidate.experience_years,
    v_candidate.profile_completeness,
    v_candidate.internal_rating,
    v_candidate.fylke,
    v_candidate.kommune,
    v_candidate.tags,
    coalesce(v_pools, '{}'),
    NOW()
  )
  ON CONFLICT (candidate_id) DO UPDATE SET
    searchable_text = EXCLUDED.searchable_text,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    roles = EXCLUDED.roles,
    active_certifications = EXCLUDED.active_certifications,
    certification_codes = EXCLUDED.certification_codes,
    certification_expiry_map = EXCLUDED.certification_expiry_map,
    next_cert_expiry = EXCLUDED.next_cert_expiry,
    languages = EXCLUDED.languages,
    sectors = EXCLUDED.sectors,
    availability_status = EXCLUDED.availability_status,
    availability_date = EXCLUDED.availability_date,
    compliance_status = EXCLUDED.compliance_status,
    experience_years = EXCLUDED.experience_years,
    profile_completeness = EXCLUDED.profile_completeness,
    internal_rating = EXCLUDED.internal_rating,
    fylke = EXCLUDED.fylke,
    kommune = EXCLUDED.kommune,
    tags = EXCLUDED.tags,
    pool_ids = EXCLUDED.pool_ids,
    indexed_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════
-- TRIGGERS FOR AUTO-REBUILD
-- ═══════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION trigger_rebuild_search_index()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM candidate_search_index WHERE candidate_id = OLD.id;
    RETURN OLD;
  ELSE
    PERFORM rebuild_candidate_search_index(NEW.id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER candidates_search_rebuild
  AFTER INSERT OR UPDATE OR DELETE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION trigger_rebuild_search_index();

CREATE OR REPLACE FUNCTION trigger_rebuild_from_cert()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM rebuild_candidate_search_index(OLD.candidate_id);
    RETURN OLD;
  ELSE
    PERFORM rebuild_candidate_search_index(NEW.candidate_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER certs_search_rebuild
  AFTER INSERT OR UPDATE OR DELETE ON candidate_certifications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_rebuild_from_cert();

CREATE OR REPLACE FUNCTION trigger_rebuild_from_pool_membership()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM rebuild_candidate_search_index(OLD.candidate_id);
    RETURN OLD;
  ELSE
    PERFORM rebuild_candidate_search_index(NEW.candidate_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pool_membership_search_rebuild
  AFTER INSERT OR UPDATE OR DELETE ON candidate_pool_memberships
  FOR EACH ROW
  EXECUTE FUNCTION trigger_rebuild_from_pool_membership();

-- RLS
ALTER TABLE candidate_search_index ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can search candidates" ON candidate_search_index
  FOR SELECT USING (public.is_staff());
