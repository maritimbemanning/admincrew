# CLAUDE.md

## Commands
```bash
npm run dev      # Dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
```

## Tech Stack
- **Framework**: Next.js 16 (App Router) + TypeScript (strict)
- **Styling**: Tailwind CSS v4 + shadcn/ui (New York)
- **State**: Zustand (global) + TanStack Query v5 (server)
- **Forms**: React Hook Form + Zod v4
- **Tables**: TanStack Table v8
- **DnD**: @dnd-kit
- **Database**: Supabase (PostgreSQL)

## Architecture
```
app/
├── (auth)/           # Login, callback
├── (dashboard)/      # Admin dashboard
│   ├── candidates/   # Candidate management
│   ├── crm/          # Organizations, contacts, deals
│   ├── operations/   # Requests, assignments, matching
│   ├── contracts/    # Contract management
│   ├── timesheets/   # Time tracking
│   ├── inbox/        # Bluecrew.no processing
│   └── qms/          # Quality management
├── (employee)/       # Employee self-service
└── api/              # API routes
```

## Supabase Clients
- `lib/supabase/client.ts` - Browser (use client)
- `lib/supabase/server.ts` - Server components & API
- `lib/supabase/admin.ts` - Service role
- `lib/supabase/source.ts` - READ-ONLY bluecrew.no connection

## Key Hooks (hooks/)
- `use-candidates.ts`, `use-candidate.ts` - Candidate CRUD
- `use-organizations.ts`, `use-contacts.ts` - CRM
- `use-requests.ts`, `use-assignments.ts` - Operations
- `use-matching.ts` - 10-second matching engine

## Domain Rules
1. **CRM = B2B customers only** (orgs buying services)
2. **Candidates = "the product"** (maritime professionals)
3. **Bluecrew.no is READ-ONLY** - never modify
4. **Critical ops require manual approval**

## Core Feature: 10-Second Matching
Engine in `lib/matching/engine.ts`:
1. Query `candidate_search_index` with hard filters
2. Score: certs 35%, experience 25%, availability 20%, rating 10%, location 10%
3. Return ranked results with breakdowns

## Norwegian Context
- UI/data in Norwegian
- Validators: org numbers (MOD11), phone numbers
- Date: dd.MM.yyyy, Currency: NOK
- Maritime roles follow Norwegian standards

## Key Tables
- `candidates`, `candidate_search_index`, `candidate_pools`
- `crm_organizations`, `crm_contacts`, `crm_deals`
- `customer_requests`, `assignments`, `contracts`

## Design Rules
- Max 3 clicks for any action
- Max 10 seconds for any search
- Max 1 second page load
- Keyboard shortcuts for common actions
- System suggests, humans decide
