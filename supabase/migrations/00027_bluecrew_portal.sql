-- ═══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00027_bluecrew_portal.sql
-- Legger til tabeller fra bluecrew.no som mangler i admincrew.no
-- Dette gjør at bluecrew.no kan bruke samme Supabase som admincrew.no
-- ═══════════════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════════════
-- JOB POSTINGS (Stillingsannonser)
-- ═══════════════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core info
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  
  -- Kategorisering
  job_type TEXT NOT NULL CHECK (job_type = ANY (ARRAY['Fast', 'Vikariat', 'Sesong', 'Prosjekt'])),
  category TEXT NOT NULL CHECK (category = ANY (ARRAY['Dekk', 'Maskin', 'Catering', 'Teknisk', 'Annet'])),
  
  -- Lokasjon
  location TEXT NOT NULL,
  fylke TEXT NOT NULL,
  kommune TEXT NOT NULL,
  region TEXT CHECK (region = ANY (ARRAY['Nord-Norge', 'Midt-Norge', 'Vestlandet', 'Østlandet', 'Sørlandet', 'Hele Norge', 'Svalbard'])),

  -- Selskap/Fartøy
  company_name TEXT,
  vessel_name TEXT,

  -- Lønn
  salary_text TEXT,
  salary_min INTEGER,
  salary_max INTEGER,

  -- Lister
  requirements TEXT[] DEFAULT '{}',
  responsibilities TEXT[] DEFAULT '{}',
  benefits TEXT[] DEFAULT '{}',

  -- Datoer
  start_date DATE,
  end_date DATE,
  duration_days INTEGER,
  application_deadline DATE,
  expires_at TIMESTAMPTZ,

  -- Kontakt
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status = ANY (ARRAY['draft', 'active', 'filled', 'expired', 'archived'])),
  published_at TIMESTAMPTZ,

  -- SEO
  slug TEXT UNIQUE NOT NULL,
  meta_title TEXT,
  meta_description TEXT,

  -- Statistikk
  view_count INTEGER DEFAULT 0,
  application_count INTEGER DEFAULT 0,

  -- Relasjoner
  organization_id UUID REFERENCES crm_organizations(id),
  created_by UUID REFERENCES user_profiles(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_category ON job_postings(category);
CREATE INDEX IF NOT EXISTS idx_job_postings_fylke ON job_postings(fylke);
CREATE INDEX IF NOT EXISTS idx_job_postings_slug ON job_postings(slug);
CREATE INDEX IF NOT EXISTS idx_job_postings_created_at ON job_postings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_postings_published_at ON job_postings(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_postings_active ON job_postings(id) WHERE status = 'active';


-- ═══════════════════════════════════════════════════════════════════════════════════════
-- JOB APPLICATIONS (Jobbsøknader)
-- ═══════════════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Kobling til stilling
  job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,

  -- Søker-info
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  cover_letter TEXT,

  -- Dokumenter (Supabase Storage)
  cv_key TEXT,
  certificates_key TEXT,

  -- Status
  status TEXT DEFAULT 'new' CHECK (status = ANY (ARRAY['new', 'reviewed', 'shortlisted', 'interview', 'offer', 'hired', 'rejected'])),

  -- Vipps verifisering
  vipps_verified BOOLEAN DEFAULT FALSE,
  vipps_verified_at TIMESTAMPTZ,
  vipps_sub TEXT,
  vipps_phone TEXT,
  vipps_name TEXT,

  -- BankID verifisering
  bankid_verified BOOLEAN DEFAULT FALSE,
  bankid_verified_at TIMESTAMPTZ,
  bankid_ssn TEXT,

  -- Admin
  candidate_id UUID REFERENCES candidates(id),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES user_profiles(id),
  admin_notes TEXT,
  rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),

  -- Tracking
  source TEXT,
  ip_address TEXT,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_job_applications_job_posting_id ON job_applications(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_email ON job_applications(email);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_candidate_id ON job_applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON job_applications(created_at DESC);

-- Unik constraint: én søknad per email per stilling
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_applications_unique_email_job
  ON job_applications(job_posting_id, email);


-- ═══════════════════════════════════════════════════════════════════════════════════════
-- CONTACTS (Kontaktskjema)
-- ═══════════════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS portal_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  navn TEXT NOT NULL,
  epost TEXT NOT NULL,
  telefon TEXT,
  melding TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status = ANY (ARRAY['new', 'processed', 'archived'])),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portal_contacts_created_at ON portal_contacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portal_contacts_status ON portal_contacts(status);


-- ═══════════════════════════════════════════════════════════════════════════════════════
-- INTEREST LEADS (Meld interesse)
-- ═══════════════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS interest_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  navn TEXT NOT NULL,
  epost TEXT NOT NULL,
  telefon TEXT,
  type TEXT NOT NULL CHECK (type = ANY (ARRAY['sjofolk', 'rederi'])),
  melding TEXT,
  status TEXT DEFAULT 'new',
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interest_leads_created_at ON interest_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interest_leads_type ON interest_leads(type);


-- ═══════════════════════════════════════════════════════════════════════════════════════
-- STAFFING NEEDS (Bemanningsbehov fra rederier)
-- ═══════════════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS staffing_needs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fartoytype TEXT NOT NULL,
  stillinger TEXT[] NOT NULL,
  antall INTEGER NOT NULL,
  oppstart DATE,
  rotasjon TEXT,
  kontakt_navn TEXT NOT NULL,
  kontakt_epost TEXT NOT NULL,
  kontakt_telefon TEXT,
  bedrift TEXT,
  merknad TEXT,
  status TEXT DEFAULT 'new',
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Koble til CRM hvis vi vil
  organization_id UUID REFERENCES crm_organizations(id),
  converted_to_request_id UUID REFERENCES customer_requests(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staffing_needs_created_at ON staffing_needs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_staffing_needs_status ON staffing_needs(status);


-- ═══════════════════════════════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════════════

ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE interest_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE staffing_needs ENABLE ROW LEVEL SECURITY;

-- Offentlig kan se aktive stillinger
CREATE POLICY "Public can view active jobs" ON job_postings
  FOR SELECT TO anon USING (status = 'active');

-- Offentlig kan søke på jobber
CREATE POLICY "Public can apply to jobs" ON job_applications
  FOR INSERT TO anon WITH CHECK (true);

-- Offentlig kan sende kontaktskjema
CREATE POLICY "Public can submit contact" ON portal_contacts
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Public can submit interest" ON interest_leads
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Public can submit staffing needs" ON staffing_needs
  FOR INSERT TO anon WITH CHECK (true);

-- Authenticated (admins) kan alt
CREATE POLICY "Admins can manage jobs" ON job_postings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins can manage applications" ON job_applications
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins can read contacts" ON portal_contacts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can read leads" ON interest_leads
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can read staffing" ON staffing_needs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ═══════════════════════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════════════

-- Auto-oppdater updated_at
CREATE TRIGGER job_postings_updated_at
  BEFORE UPDATE ON job_postings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER job_applications_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Telle søknader
CREATE OR REPLACE FUNCTION increment_application_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE job_postings
  SET application_count = COALESCE(application_count, 0) + 1
  WHERE id = NEW.job_posting_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_job_application_count
  AFTER INSERT ON job_applications
  FOR EACH ROW EXECUTE FUNCTION increment_application_count();


-- ═══════════════════════════════════════════════════════════════════════════════════════
-- VIEWS for kompatibilitet
-- ═══════════════════════════════════════════════════════════════════════════════════════

-- Alias for contacts (bluecrew bruker "contacts", vi bruker "portal_contacts")
CREATE OR REPLACE VIEW contacts AS SELECT * FROM portal_contacts;

