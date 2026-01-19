-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00031_bluecrew_profiles.sql
-- BLUECREW_PROFILES - Single Source of Truth for candidate profiles
--
-- This is the canonical table for all candidate data coming from bluecrew.no
-- Data flows: bluecrew.no form → bluecrew_profiles → candidates (via candidate_id FK)
-- ══════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.bluecrew_profiles (
  -- ═══════════════════════════════════════════════════════
  -- PRIMARY IDENTITY
  -- ═══════════════════════════════════════════════════════
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  short_id TEXT NULL,

  -- ═══════════════════════════════════════════════════════
  -- WORKFLOW LINK
  -- ═══════════════════════════════════════════════════════
  candidate_id UUID NULL,  -- FK to candidates.id for workflow tables (pools, certs, assignments)

  -- ═══════════════════════════════════════════════════════
  -- VIPPS/AUTH
  -- ═══════════════════════════════════════════════════════
  user_id UUID NULL,  -- FK to auth.users if authenticated
  vipps_sub TEXT NULL,
  vipps_verified BOOLEAN NULL,
  vipps_verified_at TIMESTAMPTZ NULL,

  -- ═══════════════════════════════════════════════════════
  -- CORE PROFILE (from bluecrew.no form)
  -- ═══════════════════════════════════════════════════════
  national_id_number TEXT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  name TEXT NULL,  -- Generated: first_name + last_name
  display_name TEXT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth DATE NULL,
  avatar_url TEXT NULL,

  -- ═══════════════════════════════════════════════════════
  -- PROFESSIONAL INFO (from bluecrew.no form)
  -- ═══════════════════════════════════════════════════════
  primary_role TEXT NOT NULL,
  secondary_roles TEXT[] NULL DEFAULT '{}'::TEXT[],
  experience_years INTEGER NULL DEFAULT 0,
  experience_details JSONB NULL,
  languages JSONB NULL,
  sectors TEXT[] NULL,

  -- ═══════════════════════════════════════════════════════
  -- CV & DOCUMENTS (from bluecrew.no upload)
  -- ═══════════════════════════════════════════════════════
  cv_key TEXT NOT NULL,
  cv_file_path TEXT NULL,
  cv_uploaded_at TIMESTAMPTZ NULL,
  cv_summary TEXT NULL,

  -- ═══════════════════════════════════════════════════════
  -- AVAILABILITY (from bluecrew.no form)
  -- ═══════════════════════════════════════════════════════
  availability_status availability_status NULL,
  availability_date DATE NULL,
  availability_notes TEXT NULL,
  availability_updated_at TIMESTAMPTZ NULL,
  wants_temporary BOOLEAN NULL,

  -- ═══════════════════════════════════════════════════════
  -- ROTATION PREFERENCES (from bluecrew.no form)
  -- ═══════════════════════════════════════════════════════
  rotation_preferred TEXT[] NULL,
  rotation_max_weeks_on INTEGER NULL,
  rotation_min_weeks_off INTEGER NULL,
  rotation_flexible BOOLEAN NULL,

  -- ═══════════════════════════════════════════════════════
  -- SALARY EXPECTATIONS (from bluecrew.no form)
  -- ═══════════════════════════════════════════════════════
  salary_min_monthly_nok INTEGER NULL,
  salary_preferred_monthly_nok INTEGER NULL,
  salary_negotiable BOOLEAN NULL,

  -- ═══════════════════════════════════════════════════════
  -- LOCATION PREFERENCES (from bluecrew.no form)
  -- ═══════════════════════════════════════════════════════
  address_city TEXT NULL,
  location_preferred_regions TEXT[] NULL,
  location_willing_to_relocate BOOLEAN NULL,

  -- ═══════════════════════════════════════════════════════
  -- GDPR & CONSENT (from bluecrew.no form)
  -- ═══════════════════════════════════════════════════════
  gdpr_consent BOOLEAN NOT NULL DEFAULT FALSE,
  gdpr_consent_date TIMESTAMPTZ NULL,
  stcw_consent BOOLEAN NULL DEFAULT FALSE,
  stcw_consent_date TIMESTAMPTZ NULL,

  -- ═══════════════════════════════════════════════════════
  -- ADMINCREW-MANAGED FIELDS (NOT from bluecrew.no)
  -- ═══════════════════════════════════════════════════════
  -- These fields are managed by AdminCrew staff, not users
  compliance_status compliance_status NULL,
  compliance_checked_at TIMESTAMPTZ NULL,
  compliance_checked_by UUID NULL,
  compliance_notes TEXT NULL,
  compliance_expires_at DATE NULL,

  profile_completeness INTEGER NULL,
  internal_rating INTEGER NULL,
  internal_notes TEXT NULL,
  tags TEXT[] NULL,

  pipeline_stage TEXT NULL,
  status TEXT NULL DEFAULT 'active'::TEXT,

  source TEXT NULL,
  source_details JSONB NULL,
  referred_by UUID NULL,

  -- ═══════════════════════════════════════════════════════
  -- LEGACY MIGRATION TRACKING
  -- ═══════════════════════════════════════════════════════
  legacy_id UUID NULL,
  legacy_source TEXT NULL,

  -- ═══════════════════════════════════════════════════════
  -- AUDIT TIMESTAMPS
  -- ═══════════════════════════════════════════════════════
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NULL DEFAULT NOW(),
  created_by UUID NULL,
  updated_by UUID NULL,
  archived_at TIMESTAMPTZ NULL,
  archived_by UUID NULL,
  archived_reason TEXT NULL,

  -- ═══════════════════════════════════════════════════════
  -- CONSTRAINTS
  -- ═══════════════════════════════════════════════════════
  CONSTRAINT bluecrew_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT bluecrew_profiles_short_id_key UNIQUE (short_id),
  CONSTRAINT bluecrew_profiles_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES candidates(id)
) TABLESPACE pg_default;

-- ═══════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_profiles_short_id ON public.bluecrew_profiles USING btree (short_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_profiles_candidate_id ON public.bluecrew_profiles USING btree (candidate_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.bluecrew_profiles USING btree (email) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS bluecrew_profiles_email_idx ON public.bluecrew_profiles USING btree (email) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.bluecrew_profiles USING btree (phone) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.bluecrew_profiles USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_profiles_pipeline_stage ON public.bluecrew_profiles USING btree (pipeline_stage) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.bluecrew_profiles USING btree (created_at DESC) TABLESPACE pg_default;

-- ═══════════════════════════════════════════════════════
-- TRIGGER FUNCTIONS
-- ═══════════════════════════════════════════════════════

-- Generate short_id (e.g., 'BC-A1B2C3')
CREATE OR REPLACE FUNCTION generate_profile_short_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.short_id IS NULL THEN
    NEW.short_id := 'BC-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sync name field from first_name + last_name
CREATE OR REPLACE FUNCTION sync_profile_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL THEN
    NEW.name := NEW.first_name || ' ' || NEW.last_name;
    NEW.display_name := NEW.first_name || ' ' || NEW.last_name;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════

CREATE TRIGGER set_profile_short_id
  BEFORE INSERT ON bluecrew_profiles
  FOR EACH ROW
  WHEN (NEW.short_id IS NULL)
  EXECUTE FUNCTION generate_profile_short_id();

CREATE TRIGGER set_profile_updated_at
  BEFORE UPDATE ON bluecrew_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_updated_at();

CREATE TRIGGER set_profile_name
  BEFORE INSERT OR UPDATE ON bluecrew_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_name();

-- ═══════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════

ALTER TABLE bluecrew_profiles ENABLE ROW LEVEL SECURITY;

-- Authenticated users (AdminCrew staff) can view all profiles
CREATE POLICY "Staff can view all profiles" ON bluecrew_profiles
  FOR SELECT USING (public.is_staff());

-- Authenticated users (AdminCrew staff) can manage all profiles
CREATE POLICY "Staff can manage all profiles" ON bluecrew_profiles
  FOR ALL USING (public.is_staff());

-- Users can view their own profile (if user_id matches)
CREATE POLICY "Users can view own profile" ON bluecrew_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own profile (if user_id matches)
CREATE POLICY "Users can update own profile" ON bluecrew_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════
-- COMMENTS
-- ═══════════════════════════════════════════════════════

COMMENT ON TABLE bluecrew_profiles IS 'Single Source of Truth for candidate profiles from bluecrew.no. All profile data flows here first, then links to candidates table via candidate_id for workflow operations (pools, certs, assignments).';
COMMENT ON COLUMN bluecrew_profiles.id IS 'Primary profile ID - use this for display/routing';
COMMENT ON COLUMN bluecrew_profiles.short_id IS 'Human-readable ID (BC-A1B2C3) for easy reference';
COMMENT ON COLUMN bluecrew_profiles.candidate_id IS 'FK to candidates.id - links to workflow tables (pools, certifications, assignments, documents)';
COMMENT ON COLUMN bluecrew_profiles.cv_key IS 'Supabase Storage key for uploaded CV (required field from bluecrew.no form)';
COMMENT ON COLUMN bluecrew_profiles.vipps_sub IS 'Vipps subject ID for verified users';
COMMENT ON COLUMN bluecrew_profiles.internal_rating IS 'AdminCrew internal rating (1-5 stars) - NOT visible on bluecrew.no';
COMMENT ON COLUMN bluecrew_profiles.pipeline_stage IS 'AdminCrew workflow stage (ny, vurdert, etc) - NOT visible on bluecrew.no';
