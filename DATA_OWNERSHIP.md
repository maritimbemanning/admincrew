# DATA OWNERSHIP & SOURCE OF TRUTH

**Version:** 1.0
**Last Updated:** 2026-01-19
**Status:** Active Contract

---

## 📋 OVERVIEW

This document defines the **data ownership contract** between **bluecrew.no** (external portal) and **admincrew.no** (internal admin system).

### Single Source of Truth (SoT)
```
public.bluecrew_profiles = CANONICAL profile data (READ-ONLY for AdminCrew)
public.candidates        = Workflow ID container + AdminCrew-owned metadata
```

### Data Flow
```
bluecrew.no Portal (Vipps login)
         ↓ [User creates/updates profile]
public.bluecrew_profiles (SoT)
         ↓ [Link via email OR phone]
public.candidates (workflow_id)
         ↓ [Foreign keys]
workflow tables (certifications, pools, assignments, documents)
```

---

## 🔐 IDENTITY MODEL

### Two-ID System

| ID Type | Table | Purpose | Example |
|---|---|---|---|
| **profile_id** | `bluecrew_profiles.id` | User's canonical profile identifier | `550e8400-e29b-41d4-a716-446655440000` |
| **workflow_id** | `candidates.id` | Internal workflow/relation identifier | `7c9e6679-7425-40de-944b-e07fc1f90ae7` |

### Linking Rule: "Email OR Phone"

**Critical Constraint:**
A `bluecrew_profiles` record links to a `candidates` record via:
- **Primary**: `bluecrew_profiles.email` = `candidates.email`
- **Fallback**: `bluecrew_profiles.phone` = `candidates.phone` (if email missing/changed)

**Linking Logic (pseudo-code):**
```sql
SELECT c.id AS workflow_id
FROM candidates c
WHERE c.email = :profile_email
   OR (c.phone IS NOT NULL AND c.phone = :profile_phone)
LIMIT 1;
```

**Behavior:**
- Vipps-verified email/phone in `bluecrew_profiles` are **immutable canonical identifiers**
- `candidates` table may have legacy emails/phones that need reconciliation
- AdminCrew MUST NOT modify `candidates.email` or `candidates.phone` if linked to a bluecrew profile

---

## 📊 DATA OWNERSHIP MODEL

### Bluecrew-Owned Fields (READ-ONLY for AdminCrew)

These fields are **exclusively owned by bluecrew.no** and synced TO admincrew.no:

| Field | Table | Description | Source |
|---|---|---|---|
| `first_name` | `bluecrew_profiles` / `candidates` | First name (Vipps-verified) | Vipps login |
| `last_name` | `bluecrew_profiles` / `candidates` | Last name (Vipps-verified) | Vipps login |
| `email` | `bluecrew_profiles` / `candidates` | Email address (Vipps-verified) | Vipps login |
| `phone` | `bluecrew_profiles` / `candidates` | Phone number (Vipps-verified) | Vipps login |
| `date_of_birth` | `bluecrew_profiles` / `candidates` | Date of birth | Vipps login / User input |
| `primary_role` | `bluecrew_profiles` / `candidates` | Main maritime role (e.g., "Kaptein") | User profile form |
| `secondary_roles` | `bluecrew_profiles` / `candidates` | Additional roles array | User profile form |
| `experience_years` | `bluecrew_profiles` / `candidates` | Years of experience | User profile form |
| `availability_status` | `bluecrew_profiles` / `candidates` | Current availability (available/on_assignment/etc) | User profile form |
| `availability_date` | `bluecrew_profiles` / `candidates` | When available | User profile form |
| `sectors` | `bluecrew_profiles` / `candidates` | Industry sectors (aquaculture, offshore, etc) | User profile form |
| `address_city` | `bluecrew_profiles` / `candidates` | City/municipality | User profile form |
| `address_country` | `bluecrew_profiles` / `candidates` | Country | User profile form |
| `fylke` | `bluecrew_profiles` / `candidates` | Norwegian county | User profile form |
| `kommune` | `bluecrew_profiles` / `candidates` | Norwegian municipality | User profile form |
| `rotation_preferred` | `bluecrew_profiles` / `candidates` | Preferred rotation patterns | User profile form |
| `languages` | `bluecrew_profiles` / `candidates` | Languages spoken (JSONB) | User profile form |
| `cv_file_path` | `bluecrew_profiles` / `candidates` | Path to uploaded CV (Supabase Storage) | User CV upload |
| `avatar_url` | `bluecrew_profiles` / `candidates` | Profile picture URL | User avatar upload |
| `salary_min_monthly_nok` | `bluecrew_profiles` / `candidates` | Minimum salary expectation | User profile form |
| `salary_preferred_monthly_nok` | `bluecrew_profiles` / `candidates` | Preferred salary | User profile form |

**Rule:** AdminCrew MUST treat these as **READ-ONLY**. Any edits must happen in bluecrew.no portal.

---

### AdminCrew-Owned Fields (WRITE access)

These fields are **exclusively managed by admincrew.no** and never synced TO bluecrew.no:

| Field | Table | Description | Use Case |
|---|---|---|---|
| `internal_rating` | `candidates` | 1-5 star admin rating | Quality assessment |
| `internal_notes` | `candidates` | Private admin notes | Internal comments, flags |
| `tags` | `candidates` | Internal categorization tags | Workflow organization |
| `compliance_status` | `candidates` | Compliance verification status | Document verification workflow |
| `compliance_checked_at` | `candidates` | When compliance was checked | Audit trail |
| `compliance_checked_by` | `candidates` | Admin who verified compliance | Audit trail |
| `compliance_notes` | `candidates` | Compliance-related notes | Verification details |
| `compliance_expires_at` | `candidates` | When compliance expires | Renewal tracking |
| `profile_completeness` | `candidates` | 0-100 score | Data quality metric |
| `source` | `candidates` | Acquisition channel | Marketing attribution |
| `source_details` | `candidates` | Source metadata (JSONB) | Campaign tracking |
| `archived_at` | `candidates` | Soft delete timestamp | Deactivation |
| `archived_by` | `candidates` | Admin who archived | Audit trail |
| `archived_reason` | `candidates` | Why archived | Record keeping |

**Rule:** bluecrew.no NEVER reads or modifies these fields.

---

### Shared Context Fields (informational sync)

These fields may exist in both systems but are **informational only** in AdminCrew:

| Field | Primary Owner | AdminCrew Behavior |
|---|---|---|
| `user_id` | bluecrew.no | Reference to auth.users (READ-ONLY) |
| `legacy_id` | Migration | UUID linking old bluecrew system (READ-ONLY) |
| `legacy_source` | Migration | 'bluecrew_v3' marker (READ-ONLY) |

---

## 🔗 WORKFLOW TABLES (candidate_id References)

These tables use `candidates.id` (workflow_id) as foreign keys for **AdminCrew-specific workflows**:

### 1. Certifications
```sql
candidate_certifications.candidate_id → candidates.id
```
**Purpose:** Maritime certifications (STCW, D5, DP-ADV, etc.)
**Ownership:** AdminCrew verifies/manages these separately from user-uploaded certs
**Why workflow_id:** Certs are workflow artifacts (document verification, expiry tracking)

### 2. Documents
```sql
candidate_documents.candidate_id → candidates.id
```
**Purpose:** Admin-required documents (passport, seaman's book, diplomas)
**Ownership:** AdminCrew tracks compliance documents
**Why workflow_id:** Document verification is an internal compliance process

### 3. Pool Memberships
```sql
candidate_pool_memberships.candidate_id → candidates.id
```
**Purpose:** Static grouping (Favorites, Blacklist, custom pools)
**Ownership:** AdminCrew organizes candidates into pools
**Why workflow_id:** Pools are internal organization/filtering, not user-facing

### 4. Assignments
```sql
assignments.candidate_id → candidates.id
```
**Purpose:** Active work placements (assignments to customers)
**Ownership:** AdminCrew manages assignments lifecycle
**Why workflow_id:** Assignments are B2B workflow, not visible to bluecrew users

**Critical Note:**
If a candidate does NOT exist in `candidates` table yet:
- AdminCrew MUST create a `candidates` record first (via email/phone link)
- Then populate `candidate_id` in workflow tables
- This ensures workflow integrity without polluting bluecrew_profiles

---

## 🚫 READ-ONLY CONTRACT

### AdminCrew MUST NOT:

❌ **Modify profile fields** in `bluecrew_profiles` table directly
❌ **Modify bluecrew-owned fields** in `candidates` if synced from bluecrew
❌ **Change email/phone** in `candidates` if linked to bluecrew profile
❌ **Delete records** from `bluecrew_profiles` (use `archived_at` in `candidates` instead)
❌ **Create new bluecrew_profiles** records (only bluecrew.no portal creates these)

### AdminCrew CAN:

✅ **Read all fields** from `bluecrew_profiles` for display/search
✅ **Modify AdminCrew-owned fields** in `candidates`
✅ **Create/update workflow records** (certs, pools, assignments, documents)
✅ **Archive candidates** via `candidates.archived_at` (soft delete)
✅ **Add internal metadata** (tags, notes, ratings, compliance status)

---

## 🔄 SYNC EXPECTATIONS

### Bluecrew → AdminCrew (One-Way Sync)

**Frequency:** Real-time via webhook OR periodic batch
**Mechanism:** TBD (webhook from bluecrew.no or scheduled job)
**Fields synced:** All bluecrew-owned fields listed above
**Conflict resolution:** Bluecrew wins (AdminCrew discards local changes to synced fields)

### AdminCrew → Bluecrew (No Sync)

**Rule:** AdminCrew-owned fields (ratings, tags, compliance) are NEVER synced back to bluecrew.no.
**Reason:** These are internal business logic, not user-facing profile data.

---

## 🧪 DATA INTEGRITY RULES

### 1. Email/Phone Uniqueness
- `bluecrew_profiles.email` MUST be unique (Vipps ensures this)
- `candidates.email` MAY have duplicates (legacy data), but active records should be unique
- When linking, use the most recent `candidates` record matching email OR phone

### 2. Orphan Prevention
- A `candidates` record MAY exist without a `bluecrew_profiles` link (manual entry)
- A `bluecrew_profiles` record SHOULD have a corresponding `candidates` record (auto-created on sync)
- Orphaned `candidates` (no bluecrew link) can be archived if inactive

### 3. Cascade Behavior
- If `candidates` record is soft-deleted (`archived_at`), workflow tables remain intact
- If hard-deleted (rare), cascade deletes workflow records (certs, docs, pools, assignments)
- `bluecrew_profiles` deletion = out of scope (handled by bluecrew.no GDPR processes)

---

## 📝 EXAMPLE SCENARIOS

### Scenario 1: New Bluecrew User Registers
```
1. User logs in via Vipps on bluecrew.no
2. bluecrew.no creates `bluecrew_profiles` record (profile_id)
3. Sync mechanism triggers
4. AdminCrew searches candidates by email OR phone
   - NOT FOUND → Create new candidates record (workflow_id)
   - FOUND → Update candidates fields from bluecrew_profiles
5. Link established: bluecrew_profiles ↔ candidates
6. AdminCrew can now add to pools, assign certifications, etc.
```

### Scenario 2: User Updates Profile on Bluecrew
```
1. User changes primary_role from "Matros" to "Styrmann"
2. bluecrew_profiles.primary_role updated
3. Sync triggers
4. AdminCrew finds linked candidates record by email
5. AdminCrew OVERWRITES candidates.primary_role = "Styrmann"
6. AdminCrew UI reflects new role (READ-ONLY field)
```

### Scenario 3: Admin Wants to Edit User's Role
```
1. Admin sees "Matros" in candidate card
2. Admin clicks "Edit" → System shows warning:
   "This field is managed by Bluecrew. Ask candidate to update on bluecrew.no."
3. Admin CANNOT edit (field locked in UI)
4. Alternative: Admin adds internal_notes: "Should be promoted to Styrmann"
```

### Scenario 4: Admin Adds Candidate to Pool
```
1. Admin selects candidate (profile_id from bluecrew_profiles)
2. Admin clicks "Add to Favorites"
3. System finds workflow_id (candidates.id) via email link
4. System inserts into candidate_pool_memberships:
   pool_id = 'favorites-pool-uuid'
   candidate_id = workflow_id
5. Pool membership is AdminCrew-internal, not visible on bluecrew.no
```

### Scenario 5: Legacy Candidate (No Bluecrew Profile)
```
1. AdminCrew has old candidates record from 2023 (manual entry)
2. candidates.email = "old@example.com"
3. User registers on bluecrew.no with SAME email (2026)
4. bluecrew_profiles created with email = "old@example.com"
5. Sync finds existing candidates by email
6. Link established retroactively
7. Future edits to profile come from bluecrew (SoT)
8. AdminCrew's internal_rating/tags/notes preserved
```

---

## 🛠️ IMPLEMENTATION CHECKLIST

### For Developers

- [ ] UI fields from bluecrew_profiles marked as READ-ONLY (disabled inputs)
- [ ] Edit buttons hidden/disabled for bluecrew-owned fields
- [ ] Tooltips on locked fields: "Managed by Bluecrew portal"
- [ ] Link resolution logic: email OR phone matching
- [ ] workflow_id (candidates.id) used for all FK relationships
- [ ] profile_id (bluecrew_profiles.id) used for display/routing
- [ ] Sync mechanism respects conflict resolution (Bluecrew wins)
- [ ] `candidates` record auto-created when bluecrew profile syncs first time

### For Admins/Users

- [ ] Understand that profile data comes from bluecrew.no (external source)
- [ ] Do NOT attempt to edit name, email, phone, role, etc. in AdminCrew
- [ ] Use internal_notes/tags for admin-specific information
- [ ] Pools/certifications/assignments are AdminCrew-specific workflows

---

## 📞 CONTACT & UPDATES

**Owner:** Engineering Team
**Questions:** Refer to CLAUDE.md or project documentation
**Changes:** Any modification to this contract requires approval from both bluecrew.no and admincrew.no teams

---

**END OF DATA OWNERSHIP CONTRACT**
