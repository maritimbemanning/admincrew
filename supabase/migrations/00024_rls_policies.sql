-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00024_rls_policies.sql
-- Sentraliserte RLS policies og security functions
-- ══════════════════════════════════════════════════════════════════════════════════════

-- This migration consolidates and documents all RLS policies.
-- Individual table policies are defined in their respective migration files,
-- but this file serves as documentation and can add cross-cutting policies.

-- ══════════════════════════════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS FOR RLS
-- ══════════════════════════════════════════════════════════════════════════════════════

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role = 'admin'
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is manager (admin or coordinator)
CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'coordinator')
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user owns a specific candidate record
CREATE OR REPLACE FUNCTION owns_candidate(p_candidate_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM candidates
    WHERE id = p_candidate_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is assigned to a specific assignment
CREATE OR REPLACE FUNCTION is_assigned_to(p_assignment_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM assignments a
    JOIN candidates c ON c.id = a.candidate_id
    WHERE a.id = p_assignment_id
    AND c.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════════════════════════════════
-- POLICY DOCUMENTATION
-- ══════════════════════════════════════════════════════════════════════════════════════

/*
SUMMARY OF RLS POLICIES BY TABLE:

┌─────────────────────────────┬──────────────────────────────────────────────────────┐
│ TABLE                       │ POLICY DESCRIPTION                                    │
├─────────────────────────────┼──────────────────────────────────────────────────────┤
│ user_profiles               │ Staff: full access. Users: own profile               │
│ candidates                  │ Staff: full access. Users: own candidate record      │
│ candidate_documents         │ Staff: full access. Users: own documents             │
│ candidate_certifications    │ Staff: full access. Users: own certifications        │
│ candidate_pools             │ Staff only                                           │
│ candidate_pool_members      │ Staff only                                           │
│ crm_organizations           │ Staff only                                           │
│ crm_contacts                │ Staff only                                           │
│ crm_deals                   │ Staff only                                           │
│ crm_activities              │ Staff only                                           │
│ crm_tasks                   │ Staff only                                           │
│ personnel_requests          │ Staff only                                           │
│ request_matches             │ Staff only                                           │
│ assignments                 │ Staff: full access. Employees: own assignments (read)│
│ contracts                   │ Staff: full access. Employees: own contracts (read)  │
│ contract_parties            │ Staff: full access. Employees: own contracts (read)  │
│ assignment_timesheets       │ Staff: full access. Employees: own (CRUD for draft)  │
│ invoices                    │ Staff only                                           │
│ invoice_lines               │ Staff only                                           │
│ qms_documents               │ Staff only                                           │
│ qms_document_versions       │ Staff only                                           │
│ qms_nonconformities         │ Staff only                                           │
│ qms_capa_actions            │ Staff only                                           │
│ qms_risks                   │ Staff only                                           │
│ activity_log                │ Staff: read. System: insert                          │
└─────────────────────────────┴──────────────────────────────────────────────────────┘

ROLE HIERARCHY:
1. admin       - Full system access, can manage users and settings
2. coordinator - Operational access, can manage requests and assignments
3. recruiter   - Recruitment access, can manage candidates and matching
4. consultant  - Read access to CRM and candidates
5. employee    - Access to own candidate record, assignments, timesheets, contracts

SECURITY NOTES:
- All tables have RLS enabled
- is_staff() function checks for admin, coordinator, recruiter, or consultant roles
- Employee self-service is limited to read-only except for timesheet drafts
- Sensitive data (national_id, bank accounts) should use additional column-level security
- Activity logging captures all significant changes for audit trail
*/

-- ══════════════════════════════════════════════════════════════════════════════════════
-- GRANTS AND PERMISSIONS
-- ══════════════════════════════════════════════════════════════════════════════════════

-- Grant execute on helper functions to authenticated users
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION owns_candidate(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_assigned_to(UUID) TO authenticated;
