-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00032_rls_performance_indexes.sql
-- RLS Performance Optimization Indexes
-- Created: 2025-01-23
--
-- These indexes dramatically improve RLS policy performance by allowing the database
-- to quickly locate rows that match the current user's auth.uid().
-- Without these indexes, RLS policies can cause full table scans.
-- ══════════════════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════════════════
-- CANDIDATES TABLE - user_id for RLS
-- ══════════════════════════════════════════════════════════════════════════════════════

-- Index for RLS policies filtering by user_id
CREATE INDEX IF NOT EXISTS idx_candidates_user_id
ON candidates(user_id)
WHERE user_id IS NOT NULL;

-- Composite index for common RLS + active filter
CREATE INDEX IF NOT EXISTS idx_candidates_user_active
ON candidates(user_id, archived_at)
WHERE user_id IS NOT NULL;

-- ══════════════════════════════════════════════════════════════════════════════════════
-- CUSTOMER REQUESTS TABLE - owner_id for RLS
-- ══════════════════════════════════════════════════════════════════════════════════════

-- Index for RLS policies filtering by owner_id
CREATE INDEX IF NOT EXISTS idx_customer_requests_owner_id
ON customer_requests(owner_id)
WHERE owner_id IS NOT NULL;

-- Index for archived filtering (often used with RLS)
CREATE INDEX IF NOT EXISTS idx_customer_requests_archived
ON customer_requests(archived_at)
WHERE archived_at IS NULL;

-- ══════════════════════════════════════════════════════════════════════════════════════
-- ASSIGNMENTS TABLE - owner_id for RLS
-- ══════════════════════════════════════════════════════════════════════════════════════

-- Index for RLS policies filtering by owner_id
CREATE INDEX IF NOT EXISTS idx_assignments_owner_id
ON assignments(owner_id)
WHERE owner_id IS NOT NULL;

-- ══════════════════════════════════════════════════════════════════════════════════════
-- BLUECREW PROFILES - user_id for RLS
-- ══════════════════════════════════════════════════════════════════════════════════════

-- Index for RLS policies on bluecrew_profiles
CREATE INDEX IF NOT EXISTS idx_bluecrew_profiles_user_id
ON bluecrew_profiles(user_id)
WHERE user_id IS NOT NULL;

-- Index for candidate_id foreign key joins
CREATE INDEX IF NOT EXISTS idx_bluecrew_profiles_candidate_id
ON bluecrew_profiles(candidate_id)
WHERE candidate_id IS NOT NULL;

-- ══════════════════════════════════════════════════════════════════════════════════════
-- CRM TABLES - owner_id for RLS
-- ══════════════════════════════════════════════════════════════════════════════════════

-- Organizations owner index
CREATE INDEX IF NOT EXISTS idx_crm_organizations_owner_id
ON crm_organizations(owner_id)
WHERE owner_id IS NOT NULL;

-- Contacts owner index
CREATE INDEX IF NOT EXISTS idx_crm_contacts_owner_id
ON crm_contacts(owner_id)
WHERE owner_id IS NOT NULL;

-- Deals owner index
CREATE INDEX IF NOT EXISTS idx_crm_deals_owner_id
ON crm_deals(owner_id)
WHERE owner_id IS NOT NULL;

-- ══════════════════════════════════════════════════════════════════════════════════════
-- DOCUMENTATION
-- ══════════════════════════════════════════════════════════════════════════════════════

/*
RLS PERFORMANCE BEST PRACTICES:

1. Always index columns used in RLS WHERE clauses
2. Use partial indexes (WHERE column IS NOT NULL) for nullable columns
3. Wrap auth.uid() in a subquery: (SELECT auth.uid()) - forces evaluation once
4. Consider composite indexes for common RLS + filter combinations

IMPACT:
- Without these indexes: Full table scan on every query
- With these indexes: Index scan, typically 99%+ improvement

MONITORING:
- Use EXPLAIN ANALYZE to verify index usage
- Check pg_stat_user_indexes for index hit rates
*/

-- ══════════════════════════════════════════════════════════════════════════════════════
-- ANALYZE TABLES
-- ══════════════════════════════════════════════════════════════════════════════════════

-- Update statistics after creating indexes
ANALYZE candidates;
ANALYZE customer_requests;
ANALYZE assignments;
ANALYZE crm_organizations;
ANALYZE crm_contacts;
ANALYZE crm_deals;
