-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00014_request_shortlists.sql
-- Shortlist for kandidater per request
-- ══════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE request_shortlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES customer_requests(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,

  -- Matching
  match_score INTEGER CHECK (match_score IS NULL OR match_score BETWEEN 0 AND 100),
  match_details JSONB,  -- Breakdown av score
  rank_position INTEGER,

  -- Status
  status TEXT DEFAULT 'proposed',  -- 'proposed', 'sent', 'accepted', 'rejected', 'withdrawn'

  -- Tilbud
  offer_sent_at TIMESTAMPTZ,
  offer_sent_by UUID REFERENCES user_profiles(id),
  offer_daily_rate_nok DECIMAL(10,2),
  offer_notes TEXT,

  -- Respons
  customer_response TEXT,  -- 'accepted', 'rejected', 'pending'
  customer_response_at TIMESTAMPTZ,
  customer_response_notes TEXT,

  -- Kandidat respons
  candidate_response TEXT,
  candidate_response_at TIMESTAMPTZ,

  -- Audit
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES user_profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(request_id, candidate_id)
);

-- Indekser
CREATE INDEX idx_shortlist_request ON request_shortlists(request_id);
CREATE INDEX idx_shortlist_candidate ON request_shortlists(candidate_id);
CREATE INDEX idx_shortlist_status ON request_shortlists(status);
CREATE INDEX idx_shortlist_score ON request_shortlists(match_score DESC);

-- Trigger
CREATE TRIGGER shortlists_updated_at
  BEFORE UPDATE ON request_shortlists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE request_shortlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view shortlists" ON request_shortlists
  FOR SELECT USING (public.is_staff());

CREATE POLICY "Staff can manage shortlists" ON request_shortlists
  FOR ALL USING (public.is_staff());
