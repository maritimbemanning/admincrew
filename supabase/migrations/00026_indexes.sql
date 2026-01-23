-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00026_indexes.sql
-- Sentraliserte performance indexes
-- ══════════════════════════════════════════════════════════════════════════════════════

-- This migration documents and creates additional performance indexes.
-- Many indexes are already created in their respective table migrations,
-- but this file serves as a centralized reference and adds composite indexes.

-- ══════════════════════════════════════════════════════════════════════════════════════
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- ══════════════════════════════════════════════════════════════════════════════════════

-- Candidates: Active candidates by availability
CREATE INDEX IF NOT EXISTS idx_candidates_active_available 
ON candidates(availability_status, compliance_status)
WHERE archived_at IS NULL;

-- Candidates: Full-text search on search_index
CREATE INDEX IF NOT EXISTS idx_candidates_search_gin 
ON candidates USING GIN(search_index);

-- Assignments: Active assignments by date range
CREATE INDEX IF NOT EXISTS idx_assignments_active_dates 
ON assignments(start_date, end_date)
WHERE status IN ('released', 'active');

-- Assignments: By customer for reporting
CREATE INDEX IF NOT EXISTS idx_assignments_org_dates 
ON assignments(organization_id, start_date, end_date);

-- Timesheets: Pending approval queue
CREATE INDEX IF NOT EXISTS idx_timesheets_approval_queue 
ON assignment_timesheets(submitted_at)
WHERE status = 'submitted';

-- Invoices: Outstanding invoices for collection
CREATE INDEX IF NOT EXISTS idx_invoices_outstanding 
ON invoices(due_date, total_nok)
WHERE status IN ('sent', 'overdue');

-- Personnel Requests: Open requests by priority
CREATE INDEX IF NOT EXISTS idx_requests_open_priority 
ON personnel_requests(priority, created_at)
WHERE status IN ('draft', 'open', 'searching');

-- CRM Deals: Pipeline by stage
CREATE INDEX IF NOT EXISTS idx_deals_pipeline 
ON crm_deals(pipeline_id, stage, weighted_value_nok DESC)
WHERE status = 'open';

-- ══════════════════════════════════════════════════════════════════════════════════════
-- PARTIAL INDEXES FOR FILTERED QUERIES
-- ══════════════════════════════════════════════════════════════════════════════════════

-- Contracts: Pending signatures
CREATE INDEX IF NOT EXISTS idx_contracts_pending_sign 
ON contracts(esign_expires_at)
WHERE status IN ('pending_signature', 'signing');

-- QMS NCs: Open issues needing attention
CREATE INDEX IF NOT EXISTS idx_nc_open_critical 
ON qms_nonconformities(due_date)
WHERE status IN ('open', 'in_progress') AND severity IN ('critical', 'major');

-- QMS Documents: Needing review
CREATE INDEX IF NOT EXISTS idx_docs_review_due 
ON qms_documents(next_review_date)
WHERE status = 'approved' AND archived_at IS NULL;

-- ══════════════════════════════════════════════════════════════════════════════════════
-- BRIN INDEXES FOR TIME-SERIES DATA
-- ══════════════════════════════════════════════════════════════════════════════════════

-- Activity Log: BRIN index for time-range queries (more efficient for large tables)
CREATE INDEX IF NOT EXISTS idx_activity_log_brin 
ON activity_log USING BRIN(created_at);

-- ══════════════════════════════════════════════════════════════════════════════════════
-- INDEX DOCUMENTATION
-- ══════════════════════════════════════════════════════════════════════════════════════

/*
INDEX SUMMARY BY TABLE:

┌─────────────────────────────┬──────────────────────────────────────────────────────┐
│ TABLE                       │ INDEXES                                              │
├─────────────────────────────┼──────────────────────────────────────────────────────┤
│ user_profiles               │ email, auth_id, role, status                         │
│ candidates                  │ email, availability, compliance, search_index (GIN)  │
│ candidate_documents         │ candidate_id, type                                   │
│ candidate_certifications    │ candidate_id, type, expiry_date                      │
│ candidate_pools             │ type, status                                         │
│ candidate_pool_members      │ pool_id, candidate_id (composite)                    │
│ crm_organizations           │ org_number, name                                     │
│ crm_contacts                │ organization_id, email                               │
│ crm_deals                   │ pipeline_id, stage, organization_id                  │
│ crm_activities              │ entity_type+id, date, user_id                        │
│ crm_tasks                   │ assigned_to, due_date, status                        │
│ personnel_requests          │ request_number, organization_id, status              │
│ request_matches             │ request_id, candidate_id, score                      │
│ assignments                 │ assignment_number, candidate_id, organization_id     │
│ contracts                   │ contract_number, assignment_id, status               │
│ contract_parties            │ contract_id, status, email                           │
│ assignment_timesheets       │ assignment_id, period, status, invoice_id            │
│ invoices                    │ invoice_number, organization_id, status, due_date    │
│ invoice_lines               │ invoice_id, assignment_id                            │
│ qms_documents               │ document_number, type, status, review_date           │
│ qms_document_versions       │ document_id, version                                 │
│ qms_nonconformities         │ nc_number, status, severity, due_date                │
│ qms_capa_actions            │ nc_id, status, assigned_to                           │
│ qms_risks                   │ risk_number, status, risk_score                      │
│ activity_log                │ user_id, entity_type+id, action, created_at (BRIN)   │
└─────────────────────────────┴──────────────────────────────────────────────────────┘

MAINTENANCE RECOMMENDATIONS:
1. Run ANALYZE periodically to update statistics
2. Monitor index usage with pg_stat_user_indexes
3. Consider REINDEX for heavily modified tables
4. Watch for index bloat on frequently updated tables
5. Use EXPLAIN ANALYZE to verify index usage
*/

-- ══════════════════════════════════════════════════════════════════════════════════════
-- VACUUM AND ANALYZE
-- ══════════════════════════════════════════════════════════════════════════════════════

-- It's recommended to run these after bulk imports or major changes:
-- ANALYZE candidates;
-- ANALYZE assignments;
-- ANALYZE assignment_timesheets;
-- etc.
