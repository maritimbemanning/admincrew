# AdminCrew Production Readiness Report

**Date:** 2026-01-18
**Purpose:** Comprehensive analysis of candidate onboarding flow and matching system for semi-automatic production use in a recruiting/employment agency
**Status:** NOT PRODUCTION READY - Critical issues identified

---

## Executive Summary

AdminCrew is a maritime recruitment CRM with sophisticated candidate matching capabilities. The core architecture is solid, but **several critical gaps prevent production deployment**:

| Category | Status | Blockers |
|----------|--------|----------|
| Candidate Onboarding | Partial | Certification CRUD not functional |
| Matching Engine | Complete | Working as designed |
| Compliance Workflow | Incomplete | No approval UI, no BankID |
| Employee Portal | UI Only | No database integration |
| Security | **CRITICAL ISSUES** | RLS policies broken |
| Notifications | Not Started | No email/SMS system |
| Testing | Not Started | 0% test coverage |

---

## PART 1: CANDIDATE ONBOARDING FLOW

### 1.1 Entry Points (How Candidates Enter)

| Entry Point | Status | Implementation |
|-------------|--------|----------------|
| Bluecrew.no Webhook | **Complete** | `app/api/webhooks/bluecrew/route.ts` - HMAC verified, idempotent |
| Manual Creation | Complete | `app/(dashboard)/candidates/new/page.tsx` |
| Excel Import | Complete | `scripts/import-excel-candidates.py` |

**Webhook Security:** Excellent
- HMAC-SHA256 signature verification
- 5-minute replay attack window
- Timing-safe comparison
- Duplicate protection via `legacy_id`

### 1.2 Candidate Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CANDIDATE LIFECYCLE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  ENTRY       │    │  COMPLIANCE  │    │  AVAILABLE   │                  │
│  │  (webhook/   │───▶│  REVIEW      │───▶│  FOR         │                  │
│  │   manual)    │    │              │    │  MATCHING    │                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
│         │                   │                   │                           │
│         ▼                   ▼                   ▼                           │
│  pipeline_stage:     compliance_status:  availability_status:              │
│  - ny (new)          - not_started       - available                       │
│  - vurdert (reviewed)- documents_pending - available_soon                  │
│  - godkjent (approved)- review_pending   - on_assignment                   │
│  - avslått (rejected) - approved         - unavailable                     │
│                       - expired          - inactive                        │
│                       - rejected                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Onboarding Steps - What's Working

| Step | Status | Notes |
|------|--------|-------|
| Basic Info Collection | Complete | Form validation with Zod |
| CV Upload | Complete | Supabase Storage, PDF/Word |
| Document Upload | Complete | Multiple types, expiry tracking |
| Certification Entry | **BROKEN** | UI works, hooks don't save to DB |
| Profile Completeness | Complete | Auto-calculated 0-100% |
| Pool Assignment | Complete | Static and smart pools |
| Search Index | Complete | Auto-rebuilds on changes |

### 1.4 CRITICAL: Certification Management Bug

**Location:** `hooks/use-candidate.ts` lines 520-590

```typescript
// useAddCertification - DOES NOT SAVE
mutationFn: async (cert: CertificationInput) => {
  console.warn('candidate_certifications table may not exist...')
  return cert  // Returns input, never inserts to DB!
}
```

**Impact:** Certifications entered through the UI are NOT persisted. This breaks:
- Compliance verification
- Matching engine (certifications are 40% of score)
- Contract requirements validation

**Fix Required:** Replace placeholder with actual Supabase insert:
```typescript
const { data, error } = await supabase
  .from('candidate_certifications')
  .insert(cert)
  .select()
  .single()
```

### 1.5 Compliance Workflow

| Component | Status | Issue |
|-----------|--------|-------|
| Status Display | Complete | `ComplianceBadge` component |
| Status Transitions | Schema Ready | DB fields exist |
| Approval Queue UI | **NOT BUILT** | Shows "Under utvikling" |
| Document Verification | Schema Ready | `verified_by`, `verified_at` fields |
| BankID Identity | **NOT IMPLEMENTED** | Placeholder only |
| Expiry Alerts | **NOT IMPLEMENTED** | No notification system |

**Current State:** Staff can manually set `compliance_status` in forms, but there is no dedicated approval workflow UI.

---

## PART 2: MATCHING SYSTEM

### 2.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           10-SECOND MATCHING                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CustomerRequest        MatchingEngine           CandidateSearchIndex       │
│  ┌──────────────┐       ┌──────────────┐         ┌──────────────────────┐  │
│  │ role_needed  │──────▶│ Hard Filters │────────▶│ Denormalized View    │  │
│  │ start_date   │       │   - Role     │         │ - roles[]            │  │
│  │ certs_req[]  │       │   - Avail    │         │ - active_certs[]     │  │
│  │ certs_pref[] │       │   - Comply   │         │ - cert_expiry_map{}  │  │
│  │ exp_min      │       │   - Certs    │         │ - availability       │  │
│  │ exp_pref     │       │   - Exp      │         │ - experience         │  │
│  └──────────────┘       └──────────────┘         │ - rating             │  │
│                                │                  │ - pool_ids[]         │  │
│                                ▼                  └──────────────────────┘  │
│                         ┌──────────────┐                                    │
│                         │   Scoring    │         Auto-rebuild triggers:     │
│                         │ - Certs: 40% │         - candidates INSERT/UPDATE │
│                         │ - Exp:   30% │         - certifications changes   │
│                         │ - Avail: 20% │         - pool memberships         │
│                         │ - Rating:10% │                                    │
│                         └──────────────┘                                    │
│                                │                                            │
│                                ▼                                            │
│                         ┌──────────────┐                                    │
│                         │   Results    │                                    │
│                         │ - strong 85+ │                                    │
│                         │ - good 70-84 │                                    │
│                         │ - possible 50│                                    │
│                         │ - weak <50   │                                    │
│                         └──────────────┘                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Matching Engine Status: COMPLETE

**Files:**
- `lib/matching/engine.ts` - Core algorithm (261 lines)
- `lib/matching/scoring.ts` - Dimension scoring (341 lines)
- `lib/matching/filters.ts` - Hard filter functions (275 lines)
- `lib/matching/types.ts` - TypeScript definitions (105 lines)

**Features Working:**
- Role-based matching (primary + secondary roles)
- Required vs preferred certifications
- Minimum vs preferred experience years
- Availability date scoring (penalty for late availability)
- Internal rating integration
- Pool-based filtering
- Blocker detection (compliance, certs, availability)
- Score breakdown for transparency

### 2.3 Shortlisting & Assignment Flow: COMPLETE

```
Match Results → Add to Shortlist → Reorder/Rank → Convert to Assignment
     │               │                  │                  │
     ▼               ▼                  ▼                  ▼
MatchingPanel   request_shortlists  ShortlistManager   assignments
                    table           (drag-drop)         table
```

### 2.4 What's Missing in Matching

| Feature | Status | Priority |
|---------|--------|----------|
| Quick Match Page | Stub only | Medium |
| Location/Proximity Scoring | Schema ready, not scored | Low |
| Custom Weight Configuration | Not in UI | Low |
| Matching Analytics | Not implemented | Low |
| Performance Monitoring | Returns `execution_time_ms` but not tracked | Medium |

---

## PART 3: SECURITY ASSESSMENT

### 3.1 CRITICAL: Broken RLS Policies

**File:** `supabase/migrations/00029_candidates_rls_policies.sql`

```sql
-- THIS ALLOWS ANY AUTHENTICATED USER FULL ACCESS TO ALL CANDIDATES
CREATE POLICY "Authenticated users can view candidates"
  ON candidates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create candidates"
  ON candidates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update candidates"
  ON candidates FOR UPDATE TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete candidates"
  ON candidates FOR DELETE TO authenticated USING (true);
```

**Impact:**
- Any logged-in user (including employees) can read ALL candidate PII
- Any user can modify or delete any candidate record
- Completely bypasses role-based access control

**Fix Required:**
1. Drop policies from 00029
2. Re-enable original staff-only policies from 00003
3. Add employee-specific policy for own record only

### 3.2 API Authorization Missing

**Problem:** All API routes check authentication but NOT authorization.

```typescript
// Example: /api/candidates/route.ts
const { data: { user } } = await supabase.auth.getUser()
if (!user) return 401  // Auth check - good
// NO ROLE CHECK - anyone authenticated can proceed
```

**Fix Required:** Add role middleware:
```typescript
const profile = await supabase.from('user_profiles').select('role').single()
if (!['admin', 'recruiter', 'coordinator'].includes(profile.data?.role)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### 3.3 Security Summary

| Issue | Severity | Status |
|-------|----------|--------|
| RLS policies on candidates | **CRITICAL** | Broken |
| API role authorization | **CRITICAL** | Missing |
| Rate limiting | HIGH | Not implemented |
| PII encryption | HIGH | Not implemented |
| 2FA/MFA | MEDIUM | Not implemented |
| Session timeout | MEDIUM | Not configured |
| Open redirect in auth | MEDIUM | `?next` not validated |

### 3.4 Security Strengths

- Webhook signature verification (excellent)
- HTTP-only session cookies
- Service role key isolated server-side
- Input validation with Zod schemas
- Norwegian validators (MOD11 checksums)
- Audit logging table exists

---

## PART 4: MISSING FEATURES FOR PRODUCTION

### 4.1 Notifications (Priority: HIGH)

**Current State:** No notification system exists.

**Required:**
| Type | Use Case | Status |
|------|----------|--------|
| Email | Contract signing requests | Not built |
| Email | Document expiry warnings | Not built |
| Email | Assignment confirmations | Not built |
| Email | Timesheet approvals | Not built |
| SMS | Urgent assignment offers | Not built |
| In-App | System notifications | Toast only |

**Recommendation:** Implement with Resend (email) + Twilio (SMS)

### 4.2 Employee Portal (Priority: HIGH)

**Current State:** Complete UI with mock data, zero database integration.

| Feature | UI | Backend |
|---------|----|---------|
| Dashboard | Complete | Mock |
| View Assignments | Complete | Mock |
| View Contracts | Complete | Mock |
| Sign Contracts | Complete | Mock (no BankID) |
| Timesheets | Complete | Mock |
| Documents | Complete | Mock |

**Fix Required:** Connect all pages to actual TanStack Query hooks

### 4.3 Compliance Approval (Priority: HIGH)

**Current State:** Only shows "Under utvikling" message.

**Required:**
1. Queue of candidates with `compliance_status = 'review_pending'`
2. Document viewer with verification toggles
3. Approve/Reject actions with notes
4. BankID identity verification integration
5. Expiry tracking and renewal workflow

### 4.4 BankID Integration (Priority: HIGH)

**Current State:** Placeholder framework only.

**Required for:**
1. Identity verification of candidates
2. Contract e-signature
3. Strong authentication for sensitive operations

**Recommended Provider:** Signicat (Norwegian BankID specialist)

### 4.5 Testing (Priority: HIGH)

**Current State:** Zero test coverage.

**Critical Paths to Test:**
1. Webhook handler (security + data integrity)
2. Matching engine (scoring correctness)
3. RLS policies (access control)
4. API endpoints (authorization)

**Recommended Setup:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

---

## PART 5: DATABASE COMPLETENESS

### 5.1 Tables Implemented

| Domain | Tables | Status |
|--------|--------|--------|
| Candidates | candidates, certifications, documents, pools, search_index | Complete |
| CRM | organizations, contacts, deals, activities | Complete |
| Operations | requests, shortlists, assignments | Complete |
| Contracts | contracts, parties | Complete |
| Timesheets | timesheets, entries | Complete |
| QMS | documents, nonconformities, CAPAs, risks | Complete |
| Audit | activity_log | Complete |

### 5.2 Schema Gaps

| Gap | Impact | Priority |
|-----|--------|----------|
| No notification_queue table | Can't track sent notifications | High |
| No email_templates table | Can't manage email content | Medium |
| No user_preferences for notifications | Can't customize alerts | Low |

---

## PART 6: PRODUCTION CHECKLIST

### Must Fix Before Production

- [ ] **Fix RLS policies** - Remove 00029, restore staff-only access
- [ ] **Add API authorization** - Role checks on all endpoints
- [ ] **Fix certification hooks** - Actually save to database
- [ ] **Implement rate limiting** - Prevent API abuse
- [ ] **Encrypt PII** - national_id, SSN fields

### Should Fix Before Production

- [ ] **Build compliance approval UI** - Complete the workflow
- [ ] **Connect employee portal** - Replace mock data
- [ ] **Implement email notifications** - Critical business events
- [ ] **Add test coverage** - At least critical paths
- [ ] **Configure session timeout** - Security best practice

### Nice to Have

- [ ] BankID integration for identity/signing
- [ ] SMS notifications for urgent alerts
- [ ] Matching analytics dashboard
- [ ] Location-based scoring
- [ ] Custom matching weights UI

---

## PART 7: EFFORT ESTIMATES

| Task | Complexity | Estimated Effort |
|------|------------|------------------|
| Fix RLS policies | Low | 2-4 hours |
| Add API authorization middleware | Medium | 1-2 days |
| Fix certification hooks | Low | 2-4 hours |
| Implement rate limiting | Low | 4-8 hours |
| Build compliance approval UI | High | 3-5 days |
| Connect employee portal | High | 3-5 days |
| Email notification system | High | 3-5 days |
| BankID integration | High | 5-10 days |
| Test coverage (critical paths) | Medium | 3-5 days |

**Total Minimum Viable Production:** 3-4 weeks of focused development

---

## PART 8: ARCHITECTURE STRENGTHS

Despite the gaps, the codebase has strong foundations:

1. **Clean Architecture**
   - Separation: lib/matching/, hooks/, components/, app/
   - TypeScript strict mode throughout
   - Zod validation schemas

2. **Performance Optimized**
   - Denormalized search index with auto-rebuild triggers
   - GIN indexes on arrays for fast containment queries
   - Composite indexes for common query patterns

3. **Modern Stack**
   - Next.js 16 App Router
   - TanStack Query v5 for server state
   - Zustand for client state
   - Tailwind + shadcn/ui components

4. **Norwegian Context**
   - MOD11 validators for org/phone numbers
   - Norwegian maritime certifications supported
   - Norwegian locale for dates/currency

5. **Audit Ready**
   - created_at/by, updated_at/by on all tables
   - activity_log for system-wide tracking
   - Soft deletes with archived_at

---

## Conclusion

AdminCrew has a **solid architectural foundation** and a **complete matching engine**, but requires **security fixes** and **workflow completion** before production deployment.

**Critical Blockers:**
1. RLS security vulnerability (any user can access all data)
2. Certification management doesn't save to database
3. No compliance approval workflow

**Recommended Approach:**
1. Week 1: Fix security issues (RLS, API auth, rate limiting)
2. Week 2: Fix certification hooks, build compliance UI
3. Week 3: Connect employee portal, add email notifications
4. Week 4: Testing, BankID integration planning

With these fixes, the system would be ready for pilot production use with supervised operation.

---

*Report generated by Claude Code analysis on 2026-01-18*
