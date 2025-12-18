-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00006_candidate_pools.sql
-- Pools for gruppering av kandidater (statiske og smarte)
-- ══════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE candidate_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'users',

  pool_type TEXT NOT NULL DEFAULT 'static',  -- 'static', 'smart'

  -- For smart pools (dynamiske filter-kriterier)
  filter_criteria JSONB DEFAULT NULL,

  candidate_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMPTZ,

  is_system BOOLEAN DEFAULT FALSE,
  is_visible BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,

  created_by UUID REFERENCES user_profiles(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

-- Indekser
CREATE INDEX idx_pools_slug ON candidate_pools(slug);
CREATE INDEX idx_pools_type ON candidate_pools(pool_type);
CREATE INDEX idx_pools_visible ON candidate_pools(is_visible, sort_order);

-- Trigger
CREATE TRIGGER pools_updated_at
  BEFORE UPDATE ON candidate_pools
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- System pools (forhåndsdefinerte)
INSERT INTO candidate_pools (name, slug, pool_type, is_system, icon, color, sort_order, filter_criteria) VALUES
  ('Alle kandidater', 'alle', 'smart', TRUE, 'users', '#6B7280', 0, '{}'),
  ('Tilgjengelige', 'tilgjengelige', 'smart', TRUE, 'check-circle', '#10B981', 1, '{"availability": ["available", "available_soon"]}'),
  ('På oppdrag', 'pa-oppdrag', 'smart', TRUE, 'briefcase', '#3B82F6', 2, '{"availability": ["on_assignment"]}'),
  ('Compliance pending', 'compliance-pending', 'smart', TRUE, 'clock', '#F59E0B', 3, '{"compliance": ["documents_pending", "review_pending"]}'),
  ('Favoritter', 'favoritter', 'static', TRUE, 'star', '#EAB308', 4, NULL),
  ('Blacklist', 'blacklist', 'static', TRUE, 'x-circle', '#EF4444', 5, NULL);

-- Pool memberships (for statiske pools)
CREATE TABLE candidate_pool_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES candidate_pools(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,

  added_by UUID REFERENCES user_profiles(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,

  UNIQUE(pool_id, candidate_id)
);

-- Indekser
CREATE INDEX idx_pool_members_pool ON candidate_pool_memberships(pool_id);
CREATE INDEX idx_pool_members_candidate ON candidate_pool_memberships(candidate_id);

-- RLS for pools
ALTER TABLE candidate_pools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view pools" ON candidate_pools
  FOR SELECT USING (public.is_staff());

CREATE POLICY "Staff can manage pools" ON candidate_pools
  FOR ALL USING (public.is_staff());

-- RLS for memberships
ALTER TABLE candidate_pool_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view memberships" ON candidate_pool_memberships
  FOR SELECT USING (public.is_staff());

CREATE POLICY "Staff can manage memberships" ON candidate_pool_memberships
  FOR ALL USING (public.is_staff());
