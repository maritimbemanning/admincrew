-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00003_candidates.sql
-- Hovedtabell for kandidater (700+ maritime fagfolk)
-- ══════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Auth kobling (nullable - ikke alle kandidater har bruker)
  user_id UUID REFERENCES auth.users(id),

  -- Legacy tracking for migrering fra bluecrew.no
  legacy_id UUID UNIQUE,
  legacy_source TEXT DEFAULT 'bluecrew_v3',

  -- ═══════════════════════════════════════════════════════
  -- PERSONALIA
  -- ═══════════════════════════════════════════════════════
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  phone_secondary TEXT,

  date_of_birth DATE,
  nationality TEXT DEFAULT 'NO',
  national_id_number TEXT,

  -- Adresse
  address_street TEXT,
  address_postal_code TEXT,
  address_city TEXT,
  address_country TEXT DEFAULT 'NO',

  -- Norsk fylke/kommune
  fylke TEXT,
  kommune TEXT,

  avatar_url TEXT,

  -- ═══════════════════════════════════════════════════════
  -- PROFESJONELL INFO
  -- ═══════════════════════════════════════════════════════
  primary_role TEXT NOT NULL,
  secondary_roles TEXT[] DEFAULT '{}',

  experience_years INTEGER DEFAULT 0,
  experience_details JSONB DEFAULT '[]',

  languages JSONB DEFAULT '[{"code": "no", "level": "native"}]',

  -- Turnus
  rotation_preferred TEXT[] DEFAULT '{}',
  rotation_max_weeks_on INTEGER,
  rotation_min_weeks_off INTEGER,
  rotation_flexible BOOLEAN DEFAULT TRUE,

  -- Lønn
  salary_min_monthly_nok INTEGER,
  salary_preferred_monthly_nok INTEGER,
  salary_negotiable BOOLEAN DEFAULT TRUE,

  -- Preferanser
  location_preferred_regions TEXT[] DEFAULT '{}',
  location_willing_to_relocate BOOLEAN DEFAULT FALSE,

  -- Sektorer
  sectors TEXT[] DEFAULT '{}',

  -- ═══════════════════════════════════════════════════════
  -- TILGJENGELIGHET
  -- ═══════════════════════════════════════════════════════
  availability_status availability_status DEFAULT 'available',
  availability_date DATE,
  availability_notes TEXT,
  availability_updated_at TIMESTAMPTZ,

  -- ═══════════════════════════════════════════════════════
  -- COMPLIANCE
  -- ═══════════════════════════════════════════════════════
  compliance_status compliance_status DEFAULT 'not_started',
  compliance_checked_at TIMESTAMPTZ,
  compliance_checked_by UUID REFERENCES user_profiles(id),
  compliance_notes TEXT,
  compliance_expires_at DATE,

  -- ═══════════════════════════════════════════════════════
  -- PROFIL-KVALITET
  -- ═══════════════════════════════════════════════════════
  profile_completeness INTEGER DEFAULT 0 CHECK (profile_completeness BETWEEN 0 AND 100),
  cv_summary TEXT,
  cv_file_path TEXT,

  -- ═══════════════════════════════════════════════════════
  -- INTERN VURDERING
  -- ═══════════════════════════════════════════════════════
  internal_rating INTEGER CHECK (internal_rating IS NULL OR internal_rating BETWEEN 1 AND 5),
  internal_notes TEXT,
  tags TEXT[] DEFAULT '{}',

  -- ═══════════════════════════════════════════════════════
  -- KILDE
  -- ═══════════════════════════════════════════════════════
  source TEXT DEFAULT 'website',
  source_details JSONB,
  referred_by UUID REFERENCES candidates(id),

  -- ═══════════════════════════════════════════════════════
  -- AUDIT
  -- ═══════════════════════════════════════════════════════
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES user_profiles(id),
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES user_profiles(id),
  archived_reason TEXT
);

-- ═══════════════════════════════════════════════════════
-- INDEKSER (Kritisk for ytelse)
-- ═══════════════════════════════════════════════════════

CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_phone ON candidates(phone);
CREATE INDEX idx_candidates_primary_role ON candidates(primary_role);
CREATE INDEX idx_candidates_secondary_roles ON candidates USING gin(secondary_roles);
CREATE INDEX idx_candidates_availability ON candidates(availability_status, availability_date);
CREATE INDEX idx_candidates_compliance ON candidates(compliance_status);
CREATE INDEX idx_candidates_fylke ON candidates(fylke);
CREATE INDEX idx_candidates_sectors ON candidates USING gin(sectors);
CREATE INDEX idx_candidates_tags ON candidates USING gin(tags);
CREATE INDEX idx_candidates_legacy ON candidates(legacy_id) WHERE legacy_id IS NOT NULL;
CREATE INDEX idx_candidates_active ON candidates(id) WHERE archived_at IS NULL;
CREATE INDEX idx_candidates_experience ON candidates(experience_years);
CREATE INDEX idx_candidates_rating ON candidates(internal_rating) WHERE internal_rating IS NOT NULL;

-- Immutable wrapper for full-text search (required for index expressions)
CREATE OR REPLACE FUNCTION candidates_searchable_text(
  p_first_name TEXT,
  p_last_name TEXT,
  p_primary_role TEXT,
  p_cv_summary TEXT,
  p_internal_notes TEXT,
  p_tags TEXT[]
) RETURNS tsvector AS $$
  SELECT to_tsvector('simple'::regconfig,
    coalesce(p_first_name, '') || ' ' ||
    coalesce(p_last_name, '') || ' ' ||
    coalesce(p_primary_role, '') || ' ' ||
    coalesce(p_cv_summary, '') || ' ' ||
    coalesce(p_internal_notes, '') || ' ' ||
    coalesce(array_to_string(p_tags, ' '), '')
  );
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE;

-- Full-text search index (Norwegian)
CREATE INDEX idx_candidates_fts ON candidates USING gin(
  candidates_searchable_text(first_name, last_name, primary_role, cv_summary, internal_notes, tags)
);

-- Trigger for updated_at
CREATE TRIGGER candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS Policies
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Helper function for checking staff role (in public schema, not auth)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'recruiter', 'coordinator')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Staff can view all candidates
CREATE POLICY "Staff can view all candidates" ON candidates
  FOR SELECT USING (public.is_staff());

-- Staff can manage candidates
CREATE POLICY "Staff can insert candidates" ON candidates
  FOR INSERT WITH CHECK (public.is_staff());

CREATE POLICY "Staff can update candidates" ON candidates
  FOR UPDATE USING (public.is_staff());

-- Employees can view own candidate profile
CREATE POLICY "Employees can view own" ON candidates
  FOR SELECT USING (user_id = auth.uid());
