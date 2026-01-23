# AdminCrew - Maritime Staffing Command Center

> Admin panel for Bluecrew.no - manages candidates, CRM, operations, contracts, and quality.

## Quick Start

```bash
npm run dev          # Dev server → localhost:3000
npm run build        # Production build
npm run db:studio    # Prisma Studio (DB browser)
npm run db:pull      # Pull schema from Supabase
npm run db:push      # Push schema changes
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) + TypeScript strict |
| Styling | Tailwind CSS v4 + shadcn/ui (New York) |
| State | Zustand (global) + TanStack Query v5 (server) |
| Forms | React Hook Form + Zod v4 |
| Tables | TanStack Table v8 |
| API | tRPC v11 |
| Database | Supabase (PostgreSQL) via Prisma 7 |
| Auth | Supabase Auth (email + Google OAuth) |

## Architecture

```
app/
├── (auth)/           # Login, OAuth callback
├── (dashboard)/      # Protected admin routes
│   ├── candidates/   # Candidate management
│   ├── crm/          # Organizations, contacts, deals, pipeline
│   ├── operations/   # Requests, assignments, matching
│   ├── contracts/    # Contract management
│   ├── timesheets/   # Time tracking
│   ├── finance/      # Invoicing
│   ├── qms/          # Quality management system
│   └── campaigns/    # Recruitment campaigns
├── (employee)/       # Employee self-service portal
└── api/              # API routes (tRPC + REST)

components/           # 116 React components
hooks/                # 32 data-fetching hooks
lib/
├── supabase/         # Database clients
├── trpc/             # API layer
├── api/              # API functions
├── matching/         # 10-second matching engine
└── validations/      # Zod schemas
stores/               # 4 Zustand stores
prisma/               # Schema (62 tables, 2030 lines)
```

## Supabase Clients

| File | Use Case |
|------|----------|
| `lib/supabase/client.ts` | Browser (React components) |
| `lib/supabase/server.ts` | Server components + API routes |
| `lib/supabase/admin.ts` | Service role (admin operations) |
| `lib/supabase/source.ts` | **READ-ONLY** bluecrew.no data |

## Key Database Tables

**Candidates:**
- `candidates` - Maritime professionals
- `candidate_pools` - Role groupings (24 pools)
- `candidate_search_index` - Optimized for matching
- `candidate_certifications`, `candidate_documents`

**CRM (B2B customers):**
- `crm_organizations`, `crm_contacts`, `crm_deals`
- `crm_tasks`, `crm_activities`

**Operations:**
- `customer_requests` - Staffing requests
- `request_shortlists` - Matched candidates
- `assignments` - Active placements

**Contracts & Finance:**
- `contracts`, `contract_parties`
- `invoices`, `invoice_lines`
- `assignment_timesheets`

**QMS:**
- `qms_documents`, `qms_nonconformities`
- `qms_risks`, `qms_capa_actions`

## Domain Rules

1. **CRM = B2B customers only** (companies buying staffing services)
2. **Candidates = "the product"** (maritime professionals for hire)
3. **Bluecrew.no is READ-ONLY** - portal data, never modify directly
4. **Critical operations require human approval** (system suggests, humans decide)

## 10-Second Matching Engine

Location: `lib/matching/engine.ts`

**Scoring weights:**
- Certifications: 35%
- Experience: 25%
- Availability: 20%
- Rating: 10%
- Location: 10%

Uses `candidate_search_index` for sub-10-second response.

## Norwegian Context

- UI and data in Norwegian
- Date format: `dd.MM.yyyy`
- Currency: NOK
- Org number validation: MOD11 algorithm
- Phone validation: Norwegian format
- Maritime roles follow Norwegian standards

## Auto-Numbering

| Entity | Format |
|--------|--------|
| Requests | REQ-2025-XXXX |
| Assignments | ASN-2025-XXXX |
| Contracts | CNT-2025-XXXX |
| Invoices | INV-2025-XXXX |

## Key Hooks

```typescript
// Candidates
useCandidates()      // List, search, filter
useCandidate(id)     // Single candidate
usePools()           // Candidate pools

// CRM
useOrganizations()   // Client companies
useContacts()        // People at companies
useDeals()           // Sales pipeline

// Operations
useRequests()        // Staffing requests
useAssignments()     // Active placements
useMatching()        // 10-second matching

// Portal (read-only)
useInbox()           // Bluecrew.no applications
useJobApplications() // Job applications
```

## Design Principles

- Max **3 clicks** for any action
- Max **10 seconds** for any search
- Max **1 second** page load
- Keyboard shortcuts for power users
- System suggests, humans decide

## Dashboard - Mission Operations Center

Location: `components/dashboard/DashboardClient.tsx`

**Layout sections:**
1. **Situation Overview** - Glass-panel hero with 5 key metrics and signal lights
2. **Operation Cards** - Quick actions with docking-stripes headers and keyboard shortcuts
3. **Comms Log** - Real-time activity feed with timestamps
4. **Radar Strip** - Horizontal pipeline mini-view with stage counts and values

**Keyboard shortcuts:**
| Shortcut | Action |
|----------|--------|
| `N C` | New Candidate |
| `N R` | New Request |
| `N D` | New Deal |
| `Q M` | Quick Match |
| `G C` | Go to Candidates |
| `G O` | Go to CRM |

**CSS classes used:**
- `glass-panel` - Frosted glass effect
- `signal-light-{green,yellow,red,blue}` - Status indicators with pulse animation
- `docking-stripes` - Diagonal striped pattern (gold)
- `text-tactical` - Monospace uppercase tracking
- `text-coordinates` - Small monospace timestamp style

## Important Notes

- **AdminCrew and BlueCrew are different repos but share the same database**
- When updating Prisma schema, run `scripts/sync-prisma-to-bluecrew.sh` to sync
- All RLS policies enforced at database level
- Generated types in `lib/generated/` - do not edit manually
