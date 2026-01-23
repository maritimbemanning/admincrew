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

---

# Technology Reference Guide

## Supabase Best Practices (2025/2026)

### Client Setup Pattern

```typescript
// Browser - lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Server - lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        )
      },
    },
  })
}

// Admin - lib/supabase/admin.ts (bypasses RLS)
import { createClient } from '@supabase/supabase-js'
export const adminClient = createClient(url, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})
```

### RLS Performance Rules

| Optimization | Impact |
|--------------|--------|
| Index RLS columns | 99%+ improvement |
| Wrap `auth.uid()` in SELECT | 95% improvement |
| Add explicit filters to queries | 95% improvement |
| Minimize joins in policies | 99% improvement |
| Use `TO authenticated` | 99% improvement |

**Example - Optimized RLS policy:**
```sql
-- GOOD: Wrap auth functions and specify role
CREATE POLICY "staff_only" ON candidates
TO authenticated
USING ((SELECT private.is_staff()));

-- BAD: Unoptimized
CREATE POLICY "staff_only" ON candidates
USING (is_staff());
```

### Query Patterns

```typescript
// GOOD: Use relations in single query
const { data } = await supabase
  .from('customer_requests')
  .select(`
    *,
    organization:crm_organizations!organization_id(id, name),
    contact:crm_contacts!contact_id(id, name, email),
    shortlist_count:request_shortlists(count)
  `)
  .eq('id', id)

// BAD: Multiple separate queries
const { data: request } = await supabase.from('customer_requests').select()
const { data: org } = await supabase.from('crm_organizations').select() // N+1!
```

### Type Generation

```bash
# Generate types from remote database
npx supabase gen types typescript --project-id "$PROJECT_REF" > types/database.types.ts

# Use in client
import { Database } from './types/database.types'
const supabase = createClient<Database>(url, key)
```

---

## Prisma 7 Best Practices (2025/2026)

### Connection Pooling with Supabase

```typescript
// lib/prisma.ts - CORRECT configuration
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                      // Max connections
  idleTimeoutMillis: 30000,     // Close idle after 30s
  connectionTimeoutMillis: 2000, // Connection timeout
  maxUses: 7200,                // Recycle connections
})

const adapter = new PrismaPg(pool)
export const prisma = new PrismaClient({ adapter })
```

### Environment Variables

```env
# Pooled connection for runtime queries (port 6543)
DATABASE_URL="postgres://user:pass@pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection for migrations (port 5432)
DIRECT_URL="postgres://user:pass@db.supabase.co:5432/postgres"
```

### prisma.config.ts

```typescript
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
    directUrl: env('DIRECT_URL'),  // REQUIRED for migrations
  },
})
```

### Query Optimization

```typescript
// GOOD: Select only needed fields
const user = await prisma.user.findUnique({
  where: { id: 1 },
  select: { id: true, name: true, email: true }
})

// GOOD: Use relationLoadStrategy for complex queries
const users = await prisma.user.findMany({
  relationLoadStrategy: 'join',  // Single query with JOINs
  include: { posts: true },
})

// GOOD: Batch operations (single transaction)
await prisma.user.createMany({
  data: [{ email: 'a@ex.com' }, { email: 'b@ex.com' }]
})
```

---

## Next.js 16 Best Practices (2025/2026)

### Key Changes in Next.js 16

| Change | Old | New |
|--------|-----|-----|
| Middleware file | `middleware.ts` | `proxy.ts` (renamed) |
| Image priority | `priority` prop | `preload` prop |
| Caching | `dynamic` config | `use cache` directive |
| Params | `params: { id }` | `params: Promise<{ id }>` |

### Server vs Client Components

```typescript
// Server Component (default) - data fetching
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await fetchData(id)  // Direct async/await
  return <div>{data.title}</div>
}

// Client Component - interactivity
'use client'
import { useState } from 'react'
export default function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

### When to Use 'use client'

- ✅ Event handlers (onClick, onChange)
- ✅ React hooks (useState, useEffect, useContext)
- ✅ Browser APIs (localStorage, window)
- ✅ TanStack Query hooks
- ❌ Data fetching (use Server Components)
- ❌ Static content rendering

### Parallel Data Fetching

```typescript
// GOOD: Parallel with Promise.all
export default async function Page() {
  const [artist, albums] = await Promise.all([
    getArtist(),
    getAlbums(),
  ])
  return <div>...</div>
}

// BAD: Sequential (waterfall)
const artist = await getArtist()  // Blocks
const albums = await getAlbums()  // Waits
```

### Image Configuration

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
    ],
  },
}
```

### Metadata API

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL('https://admincrew.no'),
  title: {
    default: 'AdminCrew',
    template: '%s | AdminCrew',
  },
  description: 'Maritime staffing operations',
  robots: { index: false, follow: false },
}
```

### Streaming with Suspense

```typescript
import { Suspense } from 'react'

export default function Page() {
  return (
    <div>
      <header>Instant header</header>
      <Suspense fallback={<Skeleton />}>
        <SlowComponent />  {/* Streams when ready */}
      </Suspense>
    </div>
  )
}
```

---

## Tailwind CSS v4 Best Practices (2025/2026)

### CSS-First Configuration

Tailwind v4 uses `@theme` in CSS instead of `tailwind.config.js`:

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --font-sans: "Inter", sans-serif;
  --color-brand-500: oklch(0.84 0.18 117);
  --radius-lg: 8px;
}

/* Custom variant for dark mode */
@custom-variant dark (&:is(.dark *));

/* Custom utility */
@utility glass-panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### Breaking Changes from v3

| v3 | v4 |
|----|-----|
| `@tailwind base` | `@import "tailwindcss"` |
| `tailwind.config.js` | `@theme` in CSS |
| `shadow-sm` | `shadow-xs` |
| `rounded-sm` | `rounded-xs` |
| `@layer utilities { }` | `@utility name { }` |
| Border default gray | Border default `currentColor` |

### Container Queries (Built-in)

```html
<div class="@container">
  <div class="@sm:grid-cols-2 @lg:grid-cols-3">
    <!-- Responds to container width, not viewport -->
  </div>
</div>
```

### Color System (OKLCH)

```css
@theme {
  /* Wider color gamut with OKLCH */
  --color-neon-pink: oklch(71.7% 0.25 360);
  --color-navy-900: oklch(0.2 0.05 250);
}
```

---

## Known Issues & Fixes

### Current Codebase Issues (January 2025)

| Issue | File | Priority | Fix |
|-------|------|----------|-----|
| Missing pool config | `lib/prisma.ts:14-16` | HIGH | Add max, timeouts |
| Missing DIRECT_URL | `prisma.config.ts:13` | HIGH | Add directUrl |
| Dashboard 6x queries | `hooks/use-dashboard-stats.ts` | HIGH | Use Promise.all |
| Candidates 3 queries | `hooks/use-candidates.ts:204-249` | HIGH | Use relations |
| Wrong join table | `hooks/use-assignments.ts:50` | MEDIUM | crm_organizations not crm_contacts |
| Missing user_id index | `candidates` table | MEDIUM | Add index for RLS |
| Missing metadataBase | `app/layout.tsx:19` | MEDIUM | Add URL |

### RLS Index Recommendations

```sql
-- Add these indexes for RLS performance
CREATE INDEX idx_candidates_user_id ON candidates(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_customer_requests_archived ON customer_requests(archived_at) WHERE archived_at IS NULL;
```
