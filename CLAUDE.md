# CLAUDE.md — ADMINCREW MASTER ARCHITECTURE
# ══════════════════════════════════════════════════════════════════════════════════════
# VERSJON: 2.0 | LINJER: 25,000+ | FASER: 50+ | MODULER: 7
# ══════════════════════════════════════════════════════════════════════════════════════
#
# DETTE ER BIBELEN. FØLG DEN TIL PUNKT OG PRIKKE.
#
# ══════════════════════════════════════════════════════════════════════════════════════

---

# ╔════════════════════════════════════════════════════════════════════════════════════╗
# ║                                                                                    ║
# ║                              DEL 1: VISJON & FILOSOFI                              ║
# ║                                                                                    ║
# ╚════════════════════════════════════════════════════════════════════════════════════╝

## 1.1 KJERNEVISJON

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                      ║
║   "10 SEKUNDER FRA BEHOV TIL MATCH — UANSETT KILDE"                                 ║
║                                                                                      ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐   ║
║   │                                                                             │   ║
║   │   Kunde søker på nettside      ──────►   10 sek   ──────►   MATCH          │   ║
║   │   Kunde ringer Isak            ──────►   10 sek   ──────►   MATCH          │   ║
║   │   Isak får mail                ──────►   10 sek   ──────►   MATCH          │   ║
║   │   Kunde sender melding         ──────►   10 sek   ──────►   MATCH          │   ║
║   │                                                                             │   ║
║   └─────────────────────────────────────────────────────────────────────────────┘   ║
║                                                                                      ║
║   Systemet skal gjøre Isaks arbeidsdag til VERDENS ENKLESTE.                        ║
║   Alt annet er FEIL.                                                                 ║
║                                                                                      ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

## 1.2 ARKITEKTUR-PRINSIPPET

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                      ║
║   KOMPLEKSITETEN SKAL VÆRE USYNLIG FOR BRUKEREN                                     ║
║                                                                                      ║
║   • Avansert arkitektur UNDER panseret                                              ║
║   • Intelligent UX PÅ overflaten                                                    ║
║   • Resultat: "Det bare funker"                                                     ║
║                                                                                      ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

## 1.3 DESIGN-REGLER (ABSOLUTTE)

```
REGEL #1:  Ingen handling skal ta mer enn 3 KLIKK
REGEL #2:  Ingen søk skal ta mer enn 10 SEKUNDER  
REGEL #3:  Ingen side skal laste mer enn 1 SEKUND
REGEL #4:  Keyboard shortcuts for ALLE vanlige handlinger
REGEL #5:  Systemet FORESLÅR — mennesker BESTEMMER
REGEL #6:  Alt som kan automatiseres SKAL automatiseres (untatt godkjenninger)
REGEL #7:  Én kilde til sannhet (Single Source of Truth)
```

## 1.4 SYSTEMARKITEKTUR

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                       │
│                                BLUECREW ECOSYSTEM                                     │
│                                                                                       │
├───────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│   ┌─────────────────────────────┐              ┌─────────────────────────────────┐   │
│   │                             │              │                                 │   │
│   │      BLUECREW.NO            │              │         ADMINCREW.NO            │   │
│   │    (Kandidatportal)         │              │       (Operations Hub)          │   │
│   │                             │              │                                 │   │
│   │  ┌───────────────────────┐  │              │  ┌───────────────────────────┐ │   │
│   │  │ • Registrering        │  │    SYNC     │  │      ADMIN DASHBOARD      │ │   │
│   │  │ • Profil-oppdatering  │  │ ─────────►  │  ├───────────────────────────┤ │   │
│   │  │ • CV-opplasting       │  │             │  │ • Kandidater & Pools      │ │   │
│   │  │ • Tilgjengelighet     │  │             │  │ • CRM (Organisasjoner)    │ │   │
│   │  │ • Dokumenter          │  │             │  │ • Operations Center       │ │   │
│   │  └───────────────────────┘  │             │  │ • Kontrakter & Signering  │ │   │
│   │                             │             │  │ • Timeregistrering        │ │   │
│   │  Supabase:                  │             │  │ • Fakturering             │ │   │
│   │  uqwfesvsfiqjcpzwetkz       │             │  │ • QMS & Compliance        │ │   │
│   │  (SKAL IKKE RØRES!)         │             │  │ • Rapporter & Analytics   │ │   │
│   │                             │             │  └───────────────────────────┘ │   │
│   └─────────────────────────────┘              │                                 │   │
│                                                │  ┌───────────────────────────┐ │   │
│                                                │  │     EMPLOYEE PORTAL       │ │   │
│                                                │  ├───────────────────────────┤ │   │
│                                                │  │ • Mine oppdrag            │ │   │
│                                                │  │ • Timeregistrering        │ │   │
│                                                │  │ • Mine dokumenter         │ │   │
│                                                │  │ • Mine kontrakter         │ │   │
│                                                │  └───────────────────────────┘ │   │
│                                                │                                 │   │
│                                                │  Supabase: NY INSTANS          │   │
│                                                │  (Single Source of Truth)      │   │
│                                                │                                 │   │
│                                                └─────────────────────────────────┘   │
│                                                                                       │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

## 1.5 DOMENE-SANNHETER (IKKE-FORHANDLBARE)

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                      ║
║   SANNHET #1: CRM = KUN B2B-KUNDER                                                  ║
║   ──────────────────────────────────                                                ║
║   CRM = Organisasjoner + Kontakter + Deals + Tasks + Activities                     ║
║   Kandidater er IKKE CRM! De er "produktet" og lever i Candidates-modulen.          ║
║                                                                                      ║
║   SANNHET #2: KANDIDATER = PRODUKTET                                                ║
║   ──────────────────────────────────────                                            ║
║   • Migreres fra bluecrew.no (engangs + sync)                                       ║
║   • Kan også opprettes manuelt                                                      ║
║   • Krever MANUELL godkjenning og compliance-sjekk                                  ║
║   • Søkbare, matchbare, leverbare                                                   ║
║                                                                                      ║
║   SANNHET #3: OPERATIONS = LEVERINGSMASKINEN                                        ║
║   ─────────────────────────────────────────────                                     ║
║   Request → Matching → Shortlist → Assignment → Contract → Delivery → Invoice       ║
║   ALLE kritiske steg krever manuell godkjenning.                                    ║
║                                                                                      ║
║   SANNHET #4: BLUECREW.NO FORBLIR UBERØRT                                           ║
║   ─────────────────────────────────────────────                                     ║
║   • Vi endrer INGENTING på bluecrew-v3                                              ║
║   • Vi KUN LESER data derfra for migrering                                          ║
║   • Kandidater fortsetter å registrere seg der                                      ║
║                                                                                      ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

## 1.6 TECH STACK (LÅST)

```typescript
// ══════════════════════════════════════════════════════════════════════════════════════
// DETTE ER LÅST — IKKE ENDRE
// ══════════════════════════════════════════════════════════════════════════════════════

const TECH_STACK = {
  // ═══════════════════════════════════════════════════════
  // FRONTEND
  // ═══════════════════════════════════════════════════════
  framework: 'Next.js 15 (App Router)',
  language: 'TypeScript (strict: true)',
  styling: 'Tailwind CSS v4',
  components: 'shadcn/ui',
  icons: 'Lucide React',
  
  // State & Data
  globalState: 'Zustand',
  serverState: 'TanStack Query (React Query v5)',
  forms: 'React Hook Form + Zod',
  tables: 'TanStack Table v8',
  
  // UI/UX
  dnd: '@dnd-kit/core + @dnd-kit/sortable',
  charts: 'Recharts',
  dates: 'date-fns',
  toasts: 'Sonner',
  
  // ═══════════════════════════════════════════════════════
  // BACKEND
  // ═══════════════════════════════════════════════════════
  database: 'Supabase (PostgreSQL 15)',
  auth: 'Supabase Auth',
  storage: 'Supabase Storage',
  realtime: 'Supabase Realtime',
  functions: 'Supabase Edge Functions (Deno)',
  
  // ═══════════════════════════════════════════════════════
  // HOSTING
  // ═══════════════════════════════════════════════════════
  hosting: 'Vercel',
  domain: 'admincrew.no',
  
  // ═══════════════════════════════════════════════════════
  // INTEGRATIONS (Fase 2+)
  // ═══════════════════════════════════════════════════════
  esign: 'Signicat / BankID',
  email: 'Resend',
  sms: 'Twilio',
  accounting: 'Tripletex API',
  
} as const;
```

## 1.7 MAPPESTRUKTUR

```
ADMINCREW/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── callback/route.ts
│   │   └── layout.tsx
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx                        # Dashboard shell med sidebar
│   │   ├── page.tsx                          # Dashboard home
│   │   │
│   │   ├── candidates/                       # MODUL 1: KANDIDATER
│   │   │   ├── page.tsx                      # Liste med pools sidebar
│   │   │   ├── [id]/page.tsx                 # Kandidatkort (full profil)
│   │   │   ├── [id]/edit/page.tsx            # Rediger kandidat
│   │   │   ├── new/page.tsx                  # Ny kandidat
│   │   │   └── compliance/page.tsx           # Compliance-kø
│   │   │
│   │   ├── crm/                              # MODUL 2: CRM
│   │   │   ├── page.tsx                      # CRM Dashboard
│   │   │   ├── organizations/
│   │   │   │   ├── page.tsx                  # Liste
│   │   │   │   ├── [id]/page.tsx             # Organisasjonskort
│   │   │   │   └── new/page.tsx              # Ny organisasjon
│   │   │   ├── contacts/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── deals/
│   │   │   │   └── page.tsx                  # Deal pipeline (Kanban)
│   │   │   └── pipeline/page.tsx             # Org pipeline (Kanban)
│   │   │
│   │   ├── operations/                       # MODUL 3: OPERATIONS
│   │   │   ├── page.tsx                      # Operations Dashboard
│   │   │   ├── requests/
│   │   │   │   ├── page.tsx                  # Request liste/kanban
│   │   │   │   ├── [id]/page.tsx             # Request detaljer
│   │   │   │   └── new/page.tsx              # Ny request
│   │   │   ├── assignments/
│   │   │   │   ├── page.tsx                  # Assignments liste
│   │   │   │   └── [id]/page.tsx             # Assignment detaljer
│   │   │   └── matching/
│   │   │       └── page.tsx                  # Quick Match tool
│   │   │
│   │   ├── contracts/                        # MODUL 4: KONTRAKTER
│   │   │   ├── page.tsx                      # Kontraktliste
│   │   │   ├── [id]/page.tsx                 # Kontrakt detaljer
│   │   │   ├── templates/page.tsx            # Maler
│   │   │   └── signing/[id]/page.tsx         # Signerings-flow
│   │   │
│   │   ├── timesheets/                       # MODUL 5: TIMER
│   │   │   ├── page.tsx                      # Timeføring oversikt
│   │   │   ├── approve/page.tsx              # Godkjenning
│   │   │   └── reports/page.tsx              # Rapporter
│   │   │
│   │   ├── finance/                          # MODUL 6: ØKONOMI
│   │   │   ├── invoices/page.tsx
│   │   │   └── reports/page.tsx
│   │   │
│   │   ├── qms/                              # MODUL 7: QMS
│   │   │   ├── documents/page.tsx
│   │   │   ├── nonconformities/page.tsx
│   │   │   └── risks/page.tsx
│   │   │
│   │   └── settings/
│   │       ├── page.tsx
│   │       ├── users/page.tsx
│   │       └── integrations/page.tsx
│   │
│   ├── (employee)/                           # EMPLOYEE PORTAL
│   │   ├── layout.tsx
│   │   ├── page.tsx                          # My Dashboard
│   │   ├── assignments/page.tsx
│   │   ├── timesheets/page.tsx
│   │   ├── documents/page.tsx
│   │   └── contracts/page.tsx
│   │
│   ├── api/
│   │   ├── auth/callback/route.ts
│   │   ├── candidates/
│   │   ├── crm/
│   │   ├── operations/
│   │   ├── matching/route.ts                 # 10-sekunds matching
│   │   ├── contracts/
│   │   └── webhooks/
│   │
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                                   # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   ├── skeleton.tsx
│   │   ├── toast.tsx
│   │   ├── command.tsx                       # ⌘K search
│   │   └── ... (alle shadcn components)
│   │
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── nav-item.tsx
│   │   └── command-menu.tsx                  # Global ⌘K
│   │
│   ├── candidates/
│   │   ├── candidate-card.tsx                # Compact/Standard/Expanded
│   │   ├── candidate-list.tsx
│   │   ├── candidate-filters.tsx
│   │   ├── candidate-search.tsx
│   │   ├── pool-sidebar.tsx
│   │   ├── pool-create-dialog.tsx
│   │   ├── certification-badge.tsx
│   │   ├── availability-badge.tsx
│   │   ├── compliance-badge.tsx
│   │   └── document-upload.tsx
│   │
│   ├── crm/
│   │   ├── organization-card.tsx             # Full org view
│   │   ├── organization-list.tsx
│   │   ├── contact-card.tsx
│   │   ├── contact-mini.tsx
│   │   ├── deal-card.tsx
│   │   ├── pipeline-kanban.tsx
│   │   ├── activity-feed.tsx
│   │   ├── activity-log-item.tsx
│   │   └── task-list.tsx
│   │
│   ├── operations/
│   │   ├── request-card.tsx
│   │   ├── request-kanban.tsx
│   │   ├── request-form.tsx
│   │   ├── matching-panel.tsx                # 10-sek matching UI
│   │   ├── matching-result-card.tsx
│   │   ├── shortlist-manager.tsx
│   │   ├── assignment-card.tsx
│   │   ├── assignment-timeline.tsx
│   │   └── release-checklist.tsx
│   │
│   ├── contracts/
│   │   ├── contract-card.tsx
│   │   ├── contract-editor.tsx
│   │   ├── signature-status.tsx
│   │   └── template-selector.tsx
│   │
│   ├── timesheets/
│   │   ├── timesheet-grid.tsx
│   │   ├── timesheet-entry.tsx
│   │   ├── approval-queue.tsx
│   │   └── period-selector.tsx
│   │
│   └── shared/
│       ├── data-table.tsx                    # Generic TanStack Table
│       ├── empty-state.tsx
│       ├── loading-skeleton.tsx
│       ├── confirm-dialog.tsx
│       ├── file-upload.tsx
│       ├── date-picker.tsx
│       ├── date-range-picker.tsx
│       ├── multi-select.tsx
│       ├── tag-input.tsx
│       ├── rating-stars.tsx
│       ├── status-badge.tsx
│       └── metric-card.tsx
│
├── hooks/
│   ├── use-candidates.ts
│   ├── use-candidate.ts
│   ├── use-pools.ts
│   ├── use-organizations.ts
│   ├── use-contacts.ts
│   ├── use-requests.ts
│   ├── use-assignments.ts
│   ├── use-matching.ts
│   ├── use-contracts.ts
│   ├── use-timesheets.ts
│   ├── use-debounce.ts
│   ├── use-local-storage.ts
│   └── use-keyboard-shortcut.ts
│
├── stores/
│   ├── ui-store.ts                           # Sidebar, theme, etc
│   ├── candidate-store.ts                    # Current filters, selection
│   ├── operations-store.ts                   # Current request context
│   └── command-store.ts                      # ⌘K state
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                         # Browser client
│   │   ├── server.ts                         # Server client
│   │   ├── admin.ts                          # Service role client
│   │   └── middleware.ts                     # Auth middleware
│   │
│   ├── matching/
│   │   ├── engine.ts                         # Core matching algorithm
│   │   ├── scoring.ts                        # Scoring functions
│   │   ├── filters.ts                        # Hard filter queries
│   │   └── types.ts                          # Matching types
│   │
│   ├── contracts/
│   │   ├── generator.ts                      # PDF generation
│   │   ├── templates.ts                      # Template handling
│   │   └── esign.ts                          # E-sign integration
│   │
│   ├── utils/
│   │   ├── cn.ts                             # Class merge utility
│   │   ├── format.ts                         # Date, number formatting
│   │   ├── validators.ts                     # Common validators
│   │   └── constants.ts                      # App constants
│   │
│   └── api/
│       ├── candidates.ts                     # API functions
│       ├── crm.ts
│       ├── operations.ts
│       └── contracts.ts
│
├── types/
│   ├── database.types.ts                     # Auto-generated from Supabase
│   ├── candidates.ts
│   ├── crm.ts
│   ├── operations.ts
│   ├── contracts.ts
│   └── index.ts
│
├── supabase/
│   ├── migrations/
│   │   ├── 00001_enums.sql
│   │   ├── 00002_user_profiles.sql
│   │   ├── 00003_candidates.sql
│   │   ├── 00004_candidate_certifications.sql
│   │   ├── 00005_candidate_documents.sql
│   │   ├── 00006_candidate_pools.sql
│   │   ├── 00007_candidate_search_index.sql
│   │   ├── 00008_crm_organizations.sql
│   │   ├── 00009_crm_contacts.sql
│   │   ├── 00010_crm_deals.sql
│   │   ├── 00011_crm_activities.sql
│   │   ├── 00012_crm_tasks.sql
│   │   ├── 00013_customer_requests.sql
│   │   ├── 00014_request_shortlists.sql
│   │   ├── 00015_assignments.sql
│   │   ├── 00016_release_checklists.sql
│   │   ├── 00017_contracts.sql
│   │   ├── 00018_contract_parties.sql
│   │   ├── 00019_timesheets.sql
│   │   ├── 00020_invoices.sql
│   │   ├── 00021_qms_documents.sql
│   │   ├── 00022_qms_nonconformities.sql
│   │   ├── 00023_activity_log.sql
│   │   ├── 00024_rls_policies.sql
│   │   ├── 00025_functions_triggers.sql
│   │   └── 00026_indexes.sql
│   │
│   ├── functions/
│   │   ├── bridge-sync/index.ts              # Sync fra bluecrew.no
│   │   └── matching/index.ts                 # Server-side matching
│   │
│   └── seed.sql
│
├── scripts/
│   └── migration/
│       ├── migrate-candidates.ts             # Fra bluecrew.no
│       ├── role-mapping.ts
│       └── validate-migration.ts
│
├── public/
│   ├── logo.svg
│   └── favicon.ico
│
├── CLAUDE.md                                 # DENNE FILEN
├── .env.local.example
├── .env.local                                # Ikke commit
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── components.json                           # shadcn config
```

---

# ╔════════════════════════════════════════════════════════════════════════════════════╗
# ║                                                                                    ║
# ║                         DEL 2: MODUL 1 — KANDIDATER                                ║
# ║                                                                                    ║
# ╚════════════════════════════════════════════════════════════════════════════════════╝

## 2.1 KANDIDAT-OVERSIKT

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                      ║
║   KANDIDATER = PRODUKTET                                                            ║
║                                                                                      ║
║   700+ maritime fagfolk som er klare til å jobbe.                                   ║
║                                                                                      ║
║   HVER KANDIDAT HAR:                                                                ║
║   ├── Personalia (navn, kontakt, adresse, fødselsdato)                              ║
║   ├── Profesjonell info (roller, erfaring, sertifikater)                            ║
║   ├── Dokumenter (CV, pass, sjøfartsbok, diplomer)                                  ║
║   ├── Tilgjengelighet (status, dato, turnus-preferanser)                            ║
║   ├── Compliance-status (godkjent/pending/avvist)                                   ║
║   ├── Intern vurdering (rating 1-5, notater, tags)                                  ║
║   └── Pool-medlemskap (hvilke pools de tilhører)                                    ║
║                                                                                      ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

## 2.2 KANDIDAT DATABASE SCHEMA

```sql
-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00001_enums.sql
-- ══════════════════════════════════════════════════════════════════════════════════════

-- Brukerroller
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'admin',
  'recruiter',
  'coordinator',
  'employee'
);

-- Tilgjengelighet
CREATE TYPE availability_status AS ENUM (
  'available',
  'available_soon',
  'on_assignment',
  'unavailable',
  'inactive'
);

-- Compliance
CREATE TYPE compliance_status AS ENUM (
  'not_started',
  'documents_pending',
  'review_pending',
  'approved',
  'expired',
  'rejected'
);

-- Sertifikat-kategorier
CREATE TYPE certification_category AS ENUM (
  'competency',
  'safety',
  'medical',
  'endorsement',
  'special',
  'other'
);

-- Dokument-typer
CREATE TYPE document_type AS ENUM (
  'cv',
  'passport',
  'seabook',
  'certificate',
  'diploma',
  'reference',
  'contract',
  'other'
);

-- Request status
CREATE TYPE request_status AS ENUM (
  'draft',
  'pending_approval',
  'approved',
  'matching',
  'shortlisted',
  'offer_sent',
  'offer_accepted',
  'offer_rejected',
  'converted',
  'on_hold',
  'cancelled',
  'expired'
);

-- Assignment status
CREATE TYPE assignment_status AS ENUM (
  'draft',
  'pending_compliance',
  'compliance_ok',
  'contract_drafting',
  'contract_sent',
  'contract_signed',
  'ready_for_start',
  'active',
  'completed',
  'invoiced',
  'paid',
  'cancelled'
);

-- Pipeline stages
CREATE TYPE pipeline_stage AS ENUM (
  'lead',
  'contacted',
  'meeting_scheduled',
  'proposal_sent',
  'negotiation',
  'won',
  'lost',
  'churned'
);

-- Deal stages
CREATE TYPE deal_stage AS ENUM (
  'qualification',
  'needs_analysis',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost'
);

-- Activity types
CREATE TYPE activity_type AS ENUM (
  'call',
  'email',
  'meeting',
  'note',
  'task',
  'deal_created',
  'deal_won',
  'deal_lost',
  'request_created',
  'assignment_started',
  'contract_signed',
  'invoice_sent',
  'invoice_paid'
);

-- Priority
CREATE TYPE priority_level AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- Contract status
CREATE TYPE contract_status AS ENUM (
  'draft',
  'pending_review',
  'ready_for_signature',
  'sent',
  'partially_signed',
  'signed',
  'cancelled',
  'expired'
);

-- Timesheet status
CREATE TYPE timesheet_status AS ENUM (
  'draft',
  'submitted',
  'approved',
  'rejected',
  'invoiced'
);

-- QMS Document status
CREATE TYPE qms_document_status AS ENUM (
  'draft',
  'pending_approval',
  'approved',
  'obsolete'
);

-- NC Status
CREATE TYPE nc_status AS ENUM (
  'open',
  'analysis',
  'action_planned',
  'action_implemented',
  'verified',
  'closed'
);


-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00002_user_profiles.sql
-- ══════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  
  role user_role NOT NULL DEFAULT 'employee',
  permissions JSONB DEFAULT '[]',
  
  preferences JSONB DEFAULT '{
    "language": "no",
    "notifications": {"email": true, "push": true, "sms": false},
    "theme": "system"
  }',
  
  last_active_at TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);


-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00003_candidates.sql
-- ══════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Auth kobling (nullable)
  user_id UUID REFERENCES auth.users(id),
  
  -- Legacy tracking
  legacy_id UUID UNIQUE,
  legacy_source TEXT DEFAULT 'bluecrew_v3',
  
  -- ═══════════════════════════════════════════════════════
  -- PERSONALIA
  -- ═══════════════════════════════════════════════════════
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  phone_secondary TEXT,
  
  date_of_birth DATE,
  nationality TEXT DEFAULT 'NO',
  national_id_number TEXT,
  
  -- Adresse
  address_street TEXT,
  address_postal_code TEXT,
  address_city TEXT,
  address_country TEXT DEFAULT 'NO',
  
  -- Norsk fylke/kommune
  fylke TEXT,
  kommune TEXT,
  
  avatar_url TEXT,
  
  -- ═══════════════════════════════════════════════════════
  -- PROFESJONELL INFO
  -- ═══════════════════════════════════════════════════════
  primary_role TEXT NOT NULL,
  secondary_roles TEXT[] DEFAULT '{}',
  
  experience_years INTEGER DEFAULT 0,
  experience_details JSONB DEFAULT '[]',
  
  languages JSONB DEFAULT '[{"code": "no", "level": "native"}]',
  
  -- Turnus
  rotation_preferred TEXT[] DEFAULT '{}',
  rotation_max_weeks_on INTEGER,
  rotation_min_weeks_off INTEGER,
  rotation_flexible BOOLEAN DEFAULT TRUE,
  
  -- Lønn
  salary_min_monthly_nok INTEGER,
  salary_preferred_monthly_nok INTEGER,
  salary_negotiable BOOLEAN DEFAULT TRUE,
  
  -- Preferanser
  location_preferred_regions TEXT[] DEFAULT '{}',
  location_willing_to_relocate BOOLEAN DEFAULT FALSE,
  
  -- Sektorer
  sectors TEXT[] DEFAULT '{}',
  
  -- ═══════════════════════════════════════════════════════
  -- TILGJENGELIGHET
  -- ═══════════════════════════════════════════════════════
  availability_status availability_status DEFAULT 'available',
  availability_date DATE,
  availability_notes TEXT,
  availability_updated_at TIMESTAMPTZ,
  
  -- ═══════════════════════════════════════════════════════
  -- COMPLIANCE
  -- ═══════════════════════════════════════════════════════
  compliance_status compliance_status DEFAULT 'not_started',
  compliance_checked_at TIMESTAMPTZ,
  compliance_checked_by UUID REFERENCES user_profiles(id),
  compliance_notes TEXT,
  compliance_expires_at DATE,
  
  -- ═══════════════════════════════════════════════════════
  -- PROFIL-KVALITET
  -- ═══════════════════════════════════════════════════════
  profile_completeness INTEGER DEFAULT 0 CHECK (profile_completeness BETWEEN 0 AND 100),
  cv_summary TEXT,
  cv_file_path TEXT,
  
  -- ═══════════════════════════════════════════════════════
  -- INTERN VURDERING
  -- ═══════════════════════════════════════════════════════
  internal_rating INTEGER CHECK (internal_rating IS NULL OR internal_rating BETWEEN 1 AND 5),
  internal_notes TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- ═══════════════════════════════════════════════════════
  -- KILDE
  -- ═══════════════════════════════════════════════════════
  source TEXT DEFAULT 'website',
  source_details JSONB,
  referred_by UUID REFERENCES candidates(id),
  
  -- ═══════════════════════════════════════════════════════
  -- AUDIT
  -- ═══════════════════════════════════════════════════════
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES user_profiles(id),
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES user_profiles(id),
  archived_reason TEXT
);

-- Indekser
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_phone ON candidates(phone);
CREATE INDEX idx_candidates_primary_role ON candidates(primary_role);
CREATE INDEX idx_candidates_secondary_roles ON candidates USING gin(secondary_roles);
CREATE INDEX idx_candidates_availability ON candidates(availability_status, availability_date);
CREATE INDEX idx_candidates_compliance ON candidates(compliance_status);
CREATE INDEX idx_candidates_fylke ON candidates(fylke);
CREATE INDEX idx_candidates_sectors ON candidates USING gin(sectors);
CREATE INDEX idx_candidates_tags ON candidates USING gin(tags);
CREATE INDEX idx_candidates_legacy ON candidates(legacy_id) WHERE legacy_id IS NOT NULL;
CREATE INDEX idx_candidates_active ON candidates(id) WHERE archived_at IS NULL;
CREATE INDEX idx_candidates_experience ON candidates(experience_years);
CREATE INDEX idx_candidates_rating ON candidates(internal_rating) WHERE internal_rating IS NOT NULL;

-- Full-text search
CREATE INDEX idx_candidates_fts ON candidates USING gin(
  to_tsvector('norwegian', 
    coalesce(first_name, '') || ' ' || 
    coalesce(last_name, '') || ' ' || 
    coalesce(primary_role, '') || ' ' ||
    coalesce(cv_summary, '') || ' ' ||
    coalesce(internal_notes, '') || ' ' ||
    coalesce(array_to_string(tags, ' '), '')
  )
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();


-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00004_candidate_certifications.sql
-- ══════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE candidate_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  
  category certification_category NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  
  issuer TEXT,
  issuer_country TEXT DEFAULT 'NO',
  certificate_number TEXT,
  
  issue_date DATE,
  expiry_date DATE,
  is_permanent BOOLEAN DEFAULT FALSE,
  
  document_path TEXT,
  document_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES user_profiles(id),
  verified_at TIMESTAMPTZ,
  
  status TEXT DEFAULT 'active',
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(candidate_id, code, issuer_country)
);

CREATE INDEX idx_certs_candidate ON candidate_certifications(candidate_id);
CREATE INDEX idx_certs_code ON candidate_certifications(code);
CREATE INDEX idx_certs_category ON candidate_certifications(category);
CREATE INDEX idx_certs_expiry ON candidate_certifications(expiry_date) 
  WHERE status = 'active' AND NOT is_permanent;
CREATE INDEX idx_certs_status ON candidate_certifications(status);

CREATE TRIGGER certifications_updated_at
  BEFORE UPDATE ON candidate_certifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();


-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00005_candidate_documents.sql
-- ══════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE candidate_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  
  type document_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  
  issue_date DATE,
  expiry_date DATE,
  document_number TEXT,
  
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES user_profiles(id),
  verified_at TIMESTAMPTZ,
  
  version INTEGER DEFAULT 1,
  is_current BOOLEAN DEFAULT TRUE,
  previous_version_id UUID REFERENCES candidate_documents(id),
  
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES user_profiles(id),
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES user_profiles(id)
);

CREATE INDEX idx_docs_candidate ON candidate_documents(candidate_id);
CREATE INDEX idx_docs_type ON candidate_documents(type);
CREATE INDEX idx_docs_current ON candidate_documents(candidate_id, type) WHERE is_current = TRUE;
CREATE INDEX idx_docs_expiry ON candidate_documents(expiry_date) WHERE expiry_date IS NOT NULL;


-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00006_candidate_pools.sql
-- ══════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE candidate_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'users',
  
  pool_type TEXT NOT NULL DEFAULT 'static',  -- 'static', 'smart'
  
  -- For smart pools
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

CREATE INDEX idx_pools_slug ON candidate_pools(slug);
CREATE INDEX idx_pools_type ON candidate_pools(pool_type);
CREATE INDEX idx_pools_visible ON candidate_pools(is_visible, sort_order);

-- System pools
INSERT INTO candidate_pools (name, slug, pool_type, is_system, icon, color, sort_order, filter_criteria) VALUES
  ('Alle kandidater', 'alle', 'smart', TRUE, 'users', '#6B7280', 0, '{}'),
  ('Tilgjengelige', 'tilgjengelige', 'smart', TRUE, 'check-circle', '#10B981', 1, '{"availability": ["available", "available_soon"]}'),
  ('På oppdrag', 'pa-oppdrag', 'smart', TRUE, 'briefcase', '#3B82F6', 2, '{"availability": ["on_assignment"]}'),
  ('Compliance pending', 'compliance-pending', 'smart', TRUE, 'clock', '#F59E0B', 3, '{"compliance": ["documents_pending", "review_pending"]}'),
  ('Favoritter', 'favoritter', 'static', TRUE, 'star', '#EAB308', 4, NULL),
  ('Blacklist', 'blacklist', 'static', TRUE, 'x-circle', '#EF4444', 5, NULL);


CREATE TABLE candidate_pool_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES candidate_pools(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  
  added_by UUID REFERENCES user_profiles(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  
  UNIQUE(pool_id, candidate_id)
);

CREATE INDEX idx_pool_members_pool ON candidate_pool_memberships(pool_id);
CREATE INDEX idx_pool_members_candidate ON candidate_pool_memberships(candidate_id);


-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00007_candidate_search_index.sql
-- ══════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE candidate_search_index (
  candidate_id UUID PRIMARY KEY REFERENCES candidates(id) ON DELETE CASCADE,
  
  searchable_text TSVECTOR,
  
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  
  roles TEXT[] NOT NULL DEFAULT '{}',
  
  active_certifications TEXT[] DEFAULT '{}',
  certification_codes TEXT[] DEFAULT '{}',
  certification_expiry_map JSONB DEFAULT '{}',
  next_cert_expiry DATE,
  
  languages TEXT[] DEFAULT '{}',
  sectors TEXT[] DEFAULT '{}',
  
  availability_status availability_status,
  availability_date DATE,
  compliance_status compliance_status,
  
  experience_years INTEGER DEFAULT 0,
  profile_completeness INTEGER DEFAULT 0,
  internal_rating INTEGER,
  
  fylke TEXT,
  kommune TEXT,
  
  tags TEXT[] DEFAULT '{}',
  pool_ids UUID[] DEFAULT '{}',
  
  indexed_at TIMESTAMPTZ DEFAULT NOW()
);

-- KRITISKE indekser for 10-sekunds matching
CREATE INDEX idx_search_text ON candidate_search_index USING gin(searchable_text);
CREATE INDEX idx_search_roles ON candidate_search_index USING gin(roles);
CREATE INDEX idx_search_certs ON candidate_search_index USING gin(active_certifications);
CREATE INDEX idx_search_cert_codes ON candidate_search_index USING gin(certification_codes);
CREATE INDEX idx_search_langs ON candidate_search_index USING gin(languages);
CREATE INDEX idx_search_sectors ON candidate_search_index USING gin(sectors);
CREATE INDEX idx_search_tags ON candidate_search_index USING gin(tags);
CREATE INDEX idx_search_pools ON candidate_search_index USING gin(pool_ids);
CREATE INDEX idx_search_availability ON candidate_search_index(availability_status, availability_date);
CREATE INDEX idx_search_compliance ON candidate_search_index(compliance_status);
CREATE INDEX idx_search_experience ON candidate_search_index(experience_years);
CREATE INDEX idx_search_rating ON candidate_search_index(internal_rating DESC NULLS LAST);
CREATE INDEX idx_search_fylke ON candidate_search_index(fylke);

-- Composite for vanlige queries
CREATE INDEX idx_search_available ON candidate_search_index(
  availability_status,
  compliance_status,
  experience_years
) WHERE availability_status IN ('available', 'available_soon');


-- ══════════════════════════════════════════════════════════════════════════════════════
-- FUNCTION: Rebuild Search Index
-- ══════════════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION rebuild_candidate_search_index(p_candidate_id UUID)
RETURNS VOID AS $$
DECLARE
  v_candidate RECORD;
  v_certs RECORD;
  v_pools UUID[];
BEGIN
  SELECT * INTO v_candidate FROM candidates WHERE id = p_candidate_id AND archived_at IS NULL;
  
  IF NOT FOUND THEN
    DELETE FROM candidate_search_index WHERE candidate_id = p_candidate_id;
    RETURN;
  END IF;
  
  -- Hent sertifikater
  SELECT 
    array_agg(DISTINCT code) FILTER (WHERE status = 'active') as active_codes,
    array_agg(DISTINCT code) as all_codes,
    jsonb_object_agg(code, expiry_date) FILTER (WHERE expiry_date IS NOT NULL) as expiry_map,
    MIN(expiry_date) FILTER (WHERE expiry_date > NOW() AND status = 'active') as next_expiry
  INTO v_certs
  FROM candidate_certifications
  WHERE candidate_id = p_candidate_id;
  
  -- Hent pools
  SELECT array_agg(pool_id) INTO v_pools
  FROM candidate_pool_memberships
  WHERE candidate_id = p_candidate_id;
  
  -- Upsert
  INSERT INTO candidate_search_index (
    candidate_id, searchable_text, full_name, email, phone, roles,
    active_certifications, certification_codes, certification_expiry_map, next_cert_expiry,
    languages, sectors, availability_status, availability_date, compliance_status,
    experience_years, profile_completeness, internal_rating,
    fylke, kommune, tags, pool_ids, indexed_at
  ) VALUES (
    p_candidate_id,
    to_tsvector('norwegian', 
      coalesce(v_candidate.first_name, '') || ' ' || 
      coalesce(v_candidate.last_name, '') || ' ' || 
      coalesce(v_candidate.primary_role, '') || ' ' ||
      coalesce(v_candidate.cv_summary, '') || ' ' ||
      coalesce(v_candidate.internal_notes, '') || ' ' ||
      coalesce(array_to_string(v_candidate.tags, ' '), '')
    ),
    v_candidate.first_name || ' ' || v_candidate.last_name,
    v_candidate.email,
    v_candidate.phone,
    array_cat(ARRAY[v_candidate.primary_role], coalesce(v_candidate.secondary_roles, '{}')),
    coalesce(v_certs.active_codes, '{}'),
    coalesce(v_certs.all_codes, '{}'),
    coalesce(v_certs.expiry_map, '{}'),
    v_certs.next_expiry,
    (SELECT array_agg(lang->>'code') FROM jsonb_array_elements(v_candidate.languages) AS lang),
    v_candidate.sectors,
    v_candidate.availability_status,
    v_candidate.availability_date,
    v_candidate.compliance_status,
    v_candidate.experience_years,
    v_candidate.profile_completeness,
    v_candidate.internal_rating,
    v_candidate.fylke,
    v_candidate.kommune,
    v_candidate.tags,
    coalesce(v_pools, '{}'),
    NOW()
  )
  ON CONFLICT (candidate_id) DO UPDATE SET
    searchable_text = EXCLUDED.searchable_text,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    roles = EXCLUDED.roles,
    active_certifications = EXCLUDED.active_certifications,
    certification_codes = EXCLUDED.certification_codes,
    certification_expiry_map = EXCLUDED.certification_expiry_map,
    next_cert_expiry = EXCLUDED.next_cert_expiry,
    languages = EXCLUDED.languages,
    sectors = EXCLUDED.sectors,
    availability_status = EXCLUDED.availability_status,
    availability_date = EXCLUDED.availability_date,
    compliance_status = EXCLUDED.compliance_status,
    experience_years = EXCLUDED.experience_years,
    profile_completeness = EXCLUDED.profile_completeness,
    internal_rating = EXCLUDED.internal_rating,
    fylke = EXCLUDED.fylke,
    kommune = EXCLUDED.kommune,
    tags = EXCLUDED.tags,
    pool_ids = EXCLUDED.pool_ids,
    indexed_at = NOW();
END;
$$ LANGUAGE plpgsql;


-- Triggers for auto-rebuild
CREATE OR REPLACE FUNCTION trigger_rebuild_search_index()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM candidate_search_index WHERE candidate_id = OLD.id;
    RETURN OLD;
  ELSE
    PERFORM rebuild_candidate_search_index(NEW.id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER candidates_search_rebuild
  AFTER INSERT OR UPDATE OR DELETE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION trigger_rebuild_search_index();

CREATE OR REPLACE FUNCTION trigger_rebuild_from_cert()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM rebuild_candidate_search_index(OLD.candidate_id);
    RETURN OLD;
  ELSE
    PERFORM rebuild_candidate_search_index(NEW.candidate_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER certs_search_rebuild
  AFTER INSERT OR UPDATE OR DELETE ON candidate_certifications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_rebuild_from_cert();

CREATE OR REPLACE FUNCTION trigger_rebuild_from_pool_membership()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM rebuild_candidate_search_index(OLD.candidate_id);
    RETURN OLD;
  ELSE
    PERFORM rebuild_candidate_search_index(NEW.candidate_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pool_membership_search_rebuild
  AFTER INSERT OR UPDATE OR DELETE ON candidate_pool_memberships
  FOR EACH ROW
  EXECUTE FUNCTION trigger_rebuild_from_pool_membership();
```

## 2.3 KANDIDAT-POOLS

### 2.3.1 Pool Konsept

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                      ║
║   POOLS = Grupper av kandidater                                                     ║
║                                                                                      ║
║   TO TYPER:                                                                          ║
║                                                                                      ║
║   1. SMART POOLS (Dynamiske)                                                        ║
║      ├── Defineres av filter-kriterier                                              ║
║      ├── Oppdateres automatisk                                                      ║
║      └── Eksempel: "Alle kapteiner med D5+ som er tilgjengelige"                    ║
║                                                                                      ║
║   2. STATISKE POOLS (Manuelle)                                                      ║
║      ├── Kandidater legges til manuelt                                              ║
║      ├── Forblir til de fjernes                                                     ║
║      └── Eksempel: "Favoritter", "Blacklist"                                        ║
║                                                                                      ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

### 2.3.2 Pool Filter Criteria (Smart Pools)

```typescript
// types/candidates.ts

interface PoolFilterCriteria {
  // Roller
  roles?: {
    include?: string[];      // Må ha minst én
    exclude?: string[];      // Kan ikke ha
    primary_only?: boolean;  // Kun primærrolle
  };
  
  // Sertifikater
  certifications?: {
    required?: string[];     // Må ha ALLE
    any_of?: string[];       // Må ha minst én
    exclude?: string[];      // Kan ikke ha
    valid_until?: string;    // ISO date
  };
  
  // Tilgjengelighet
  availability?: ('available' | 'available_soon' | 'on_assignment' | 'unavailable')[];
  
  // Compliance
  compliance?: ('not_started' | 'documents_pending' | 'review_pending' | 'approved' | 'expired' | 'rejected')[];
  
  // Erfaring
  experience?: {
    min?: number;
    max?: number;
  };
  
  // Lokasjon
  location?: {
    fylke?: string[];
    kommune?: string[];
  };
  
  // Språk
  languages?: {
    required?: string[];
    any_of?: string[];
  };
  
  // Sektorer
  sectors?: {
    include?: string[];
    exclude?: string[];
  };
  
  // Rating
  rating?: {
    min?: number;
    max?: number;
  };
  
  // Tags
  tags?: {
    include?: string[];   // Må ha minst én
    exclude?: string[];   // Kan ikke ha
    all?: string[];       // Må ha ALLE
  };
}
```

### 2.3.3 Pool UI

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  KANDIDATER                                                           [+ Ny Pool]      │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌───────────────────────┐  ┌───────────────────────────────────────────────────────┐  │
│  │ POOLS                 │  │                                                       │  │
│  │                       │  │  🔍 [Søk kandidater...                    ]  [⚙️]    │  │
│  │ SYSTEM                │  │                                                       │  │
│  │ ────────────────────  │  │  AKTIVE FILTRE                                        │  │
│  │ ● Alle (742)          │  │  [Kaptein ×] [D5 ×] [Tilgjengelig ×]      [Nullstill] │  │
│  │ ○ Tilgjengelige (523) │  │                                                       │  │
│  │ ○ På oppdrag (89)     │  │  ═══════════════════════════════════════════════════  │  │
│  │ ○ Compliance (34)     │  │                                                       │  │
│  │                       │  │  Viser 45 av 742 kandidater                [List │ ▣] │  │
│  │ FAVORITTER            │  │                                                       │  │
│  │ ────────────────────  │  │  □ [Velg alle]                        [Bulk ▼]       │  │
│  │ ⭐ Favoritter (12)    │  │                                                       │  │
│  │ ❌ Blacklist (5)      │  │  ┌─────────────────────────────────────────────────┐  │  │
│  │                       │  │  │ □ ┌──┐ Ole Hansen              ⭐4.8  🟢        │  │  │
│  │ EGNE POOLS            │  │  │   │👤│ Kaptein • 12 år • Nordland               │  │  │
│  │ ────────────────────  │  │  │   └──┘ D5 STCW DP-ADV           [Match] [→]    │  │  │
│  │ 📁 Kapteiner D5+ (45) │  │  └─────────────────────────────────────────────────┘  │  │
│  │ 📁 Wellboat crew (67) │  │                                                       │  │
│  │ 📁 Nordland folk (89) │  │  ┌─────────────────────────────────────────────────┐  │  │
│  │                       │  │  │ □ ┌──┐ Kari Nordmann           ⭐4.5  🟡        │  │  │
│  │ [+ Ny pool]           │  │  │   │👤│ Styrmann • 8 år • Troms                  │  │  │
│  │                       │  │  │   └──┘ D4 STCW                  [Match] [→]    │  │  │
│  └───────────────────────┘  │  └─────────────────────────────────────────────────┘  │  │
│                             │                                                       │  │
│                             │  ┌─────────────────────────────────────────────────┐  │  │
│                             │  │ □ ┌──┐ Erik Larsen             ⭐4.2  🟢        │  │  │
│                             │  │   │👤│ Maskinist • 6 år • M&R                   │  │  │
│                             │  │   └──┘ D3 STCW ETO              [Match] [→]    │  │  │
│                             │  └─────────────────────────────────────────────────┘  │  │
│                             │                                                       │  │
│                             │  ... (virtualisert liste)                             │  │
│                             │                                                       │  │
│                             └───────────────────────────────────────────────────────┘  │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## 2.4 KANDIDATKORT

### 2.4.1 Compact Card (Liste-visning)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ □ ┌────┐ Ole Hansen                               ⭐ 4.8    🟢 Tilgj.   │
│   │ 👤 │ Kaptein • 12 år • Nordland                                     │
│   └────┘ [D5] [STCW] [DP-ADV] [Helse✓]           [🎯 Match] [→ Profil] │
└──────────────────────────────────────────────────────────────────────────┘

FORKLARING:
□           = Checkbox for bulk-operasjoner
👤          = Avatar/placeholder
⭐ 4.8     = Intern rating
🟢          = Availability badge (🟢 tilgj, 🟡 snart, 🔵 oppdrag, ⚫ utilgj)
[D5] etc   = Sertifikat-badges
[🎯 Match] = Quick match til åpen request
[→ Profil] = Åpne full profil
```

### 2.4.2 Standard Card (Grid-visning)

```
┌───────────────────────────────────────────────────────────────────┐
│                                                          ⋮ Menu  │
│  ┌────────┐                                                      │
│  │        │  Ole Hansen                            ⭐ 4.8        │
│  │   👤   │  Kaptein / Skipsfører                               │
│  │        │                                                      │
│  └────────┘  📍 Sortland, Nordland                              │
│              📧 ole@example.com  📱 +47 900 00 000               │
│                                                                  │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  SERTIFIKATER                                                    │
│  [D5 ✓ 2026] [STCW ✓ 2025] [DP-ADV ✓ 2027]                      │
│                                                                  │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  🟢 Tilgjengelig nå            ✅ Compliance OK                  │
│                                                                  │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  [erfaren] [wellboat] [havbruk]                                  │
│                                                                  │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  [📄 CV] [📞 Ring] [📧 Mail] [🎯 Match]                         │
│                                                                  │
└───────────────────────────────────────────────────────────────────┘
```

### 2.4.3 Expanded View (Full Profil - /candidates/[id])

Se separat seksjon for full UI-spesifikasjon.

## 2.5 KANDIDAT FILTERING

### 2.5.1 Filter Interface

```typescript
// types/candidates.ts

interface CandidateFilters {
  search?: string;
  
  roles?: {
    include?: string[];
    exclude?: string[];
    primary_only?: boolean;
  };
  
  certifications?: {
    required?: string[];
    any_of?: string[];
    exclude?: string[];
    valid_until?: Date;
  };
  
  availability?: {
    status?: AvailabilityStatus[];
    available_from?: Date;
    available_until?: Date;
  };
  
  compliance?: {
    status?: ComplianceStatus[];
  };
  
  experience?: {
    min_years?: number;
    max_years?: number;
  };
  
  location?: {
    fylke?: string[];
    kommune?: string[];
  };
  
  languages?: {
    required?: string[];
    any_of?: string[];
  };
  
  sectors?: {
    include?: string[];
    exclude?: string[];
  };
  
  rating?: {
    min?: number;
    max?: number;
  };
  
  tags?: {
    include?: string[];
    exclude?: string[];
    all?: string[];
  };
  
  pools?: {
    include?: string[];
    exclude?: string[];
  };
  
  profile?: {
    min_completeness?: number;
    has_cv?: boolean;
    has_photo?: boolean;
  };
}

type CandidateSortField = 
  | 'name' 
  | 'role' 
  | 'experience' 
  | 'availability'
  | 'rating' 
  | 'completeness' 
  | 'created_at' 
  | 'updated_at';

interface CandidateSort {
  field: CandidateSortField;
  direction: 'asc' | 'desc';
}
```

### 2.5.2 Filter Panel UI

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  FILTRE                                                    [Reset] [Lukk]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ROLLE                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ [x] Kaptein    [x] Overstyrmann  [ ] Styrmann     [ ] Matros       │   │
│  │ [ ] Maskinist  [ ] ETO           [ ] Kokk         [ ] Steward      │   │
│  │ [x] Skipper    [ ] DP-operatør   [ ] ROV-pilot    [ ] Dykker       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  [ ] Kun primærrolle                                                       │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  SERTIFIKATER                                                               │
│  Må ha ALLE:    [D5    ▼] [STCW  ▼] [+]                                   │
│  Må ha minst én:[DP-BAS▼] [DP-ADV▼] [+]                                   │
│  [ ] Kun gyldige  [ ] Gyldige til: [Dato    📅]                           │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  TILGJENGELIGHET                                                            │
│  [x] Tilgjengelig  [x] Snart  [ ] På oppdrag  [ ] Utilgjengelig           │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ERFARING                                                                   │
│  Min: [0  ] år    Maks: [30 ] år                                          │
│  ═════════●═══════════════●═════════════                                   │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  LOKASJON                                                                   │
│  Fylke:   [Nordland        ▼] [Troms          ▼] [+]                      │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  SPRÅK                                                                      │
│  Må kunne: [Norsk ▼] [Engelsk▼] [+]                                       │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  SEKTOR                                                                     │
│  [x] Havbruk  [x] Offshore  [ ] Shipping  [ ] Fiske                       │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  INTERN RATING                                                              │
│  Min: [★★★☆☆ 3    ▼]                                                      │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  TAGS                                                                       │
│  Inkluder: [erfaren ×] [wellboat ×] [+]                                   │
│  Ekskluder: [blacklist ×] [+]                                              │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│                                              [Lagre som pool] [Bruk filtre] │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2.6 ROLLE-MAPPING (Bluecrew.no → V2)

```typescript
// scripts/migration/role-mapping.ts

export const ROLE_MAP: Record<string, string> = {
  // Dekksoffiserer
  'Kaptein / Skipsfører': 'captain',
  'Kaptein': 'captain',
  'Skipsfører': 'captain',
  'Skipper / kyst': 'skipper',
  'Skipper': 'skipper',
  'Overstyrmann': 'chief_officer',
  'Styrmann': 'second_officer',
  '1. Styrmann': 'second_officer',
  '2. Styrmann': 'third_officer',
  'Kadett dekk': 'deck_cadet',
  
  // Maskinoffiserer
  'Maskinsjef': 'chief_engineer',
  'Maskinist': 'engineer',
  '1. Maskinist': 'second_engineer',
  '2. Maskinist': 'third_engineer',
  'Kadett maskin': 'engine_cadet',
  'ETO': 'electro_technical_officer',
  'ETO (Elektro-teknisk offiser)': 'electro_technical_officer',
  
  // Mannskap
  'Matros': 'able_seaman',
  'Dekksarbeider': 'ordinary_seaman',
  'Motormann': 'motorman',
  'Pumpemann': 'pumpman',
  
  // Service
  'Kokk': 'cook',
  'Steward': 'steward',
  'Messegutt': 'mess_boy',
  
  // Spesialister
  'ROV Pilot': 'rov_pilot',
  'ROV-pilot': 'rov_pilot',
  'DP Operatør': 'dp_operator',
  'DP-operatør': 'dp_operator',
  'Dykker': 'diver',
  'Kranfører': 'crane_operator',
  
  // Havbruk
  'Akvatekniker': 'aquaculture_technician',
  'Akvatekniker m/fagbrev': 'aquaculture_technician',
  'Røkter': 'fish_farm_worker',
  'Driftstekniker havbruk': 'aquaculture_operations',
  
  // Annet
  'Annet maritimt': 'other_maritime',
  'Annet': 'other',
};

export const STATUS_MAP: Record<string, AvailabilityStatus> = {
  'pending': 'available',
  'godkjent': 'available',
  'aktiv': 'available',
  'inaktiv': 'unavailable',
};

export const DISPLAY_NAMES: Record<string, string> = {
  'captain': 'Kaptein',
  'skipper': 'Skipper',
  'chief_officer': 'Overstyrmann',
  'second_officer': 'Styrmann',
  'third_officer': '2. Styrmann',
  'chief_engineer': 'Maskinsjef',
  'engineer': 'Maskinist',
  'second_engineer': '1. Maskinist',
  'third_engineer': '2. Maskinist',
  'electro_technical_officer': 'ETO',
  'able_seaman': 'Matros',
  'ordinary_seaman': 'Dekksarbeider',
  'motorman': 'Motormann',
  'cook': 'Kokk',
  'steward': 'Steward',
  'rov_pilot': 'ROV-pilot',
  'dp_operator': 'DP-operatør',
  'diver': 'Dykker',
  'aquaculture_technician': 'Akvatekniker',
  'other_maritime': 'Annet maritimt',
  'other': 'Annet',
};
```

---

# ╔════════════════════════════════════════════════════════════════════════════════════╗
# ║                                                                                    ║
# ║                            DEL 3: MODUL 2 — CRM                                    ║
# ║                                                                                    ║
# ╚════════════════════════════════════════════════════════════════════════════════════╝

## 3.1 CRM OVERSIKT

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                      ║
║   CRM = KUN B2B-KUNDER                                                              ║
║                                                                                      ║
║   STRUKTUR:                                                                          ║
║   ├── Organisasjoner (selskaper som kjøper våre tjenester)                          ║
║   │   ├── Kontakter (personer hos selskapet)                                        ║
║   │   ├── Deals (salgsmuligheter)                                                  ║
║   │   ├── Requests (behov for mannskap)                                            ║
║   │   ├── Assignments (aktive oppdrag)                                              ║
║   │   └── Contracts (kontrakter)                                                   ║
║   │                                                                                  ║
║   └── Activities (alle interaksjoner - samtaler, møter, e-poster)                   ║
║                                                                                      ║
║   VIKTIG: Kandidater er IKKE CRM! De er "produktet".                                ║
║                                                                                      ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

## 3.2 CRM DATABASE SCHEMA

```sql
-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00008_crm_organizations.sql
-- ══════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE crm_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identifikasjon
  name TEXT NOT NULL,
  org_number TEXT UNIQUE,  -- Norsk org.nr (9 siffer)
  
  -- Klassifisering
  industry TEXT,  -- 'aquaculture', 'offshore', 'shipping', 'fishing', 'maritime_services'
  company_size TEXT,  -- 'solo', 'small', 'medium', 'large', 'enterprise'
  customer_type TEXT DEFAULT 'prospect',  -- 'prospect', 'customer', 'partner', 'churned'
  
  -- Kontaktinfo
  website TEXT,
  email TEXT,
  phone TEXT,
  
  -- Adresse
  address_street TEXT,
  address_postal_code TEXT,
  address_city TEXT,
  address_country TEXT DEFAULT 'NO',
  
  -- Logo
  logo_url TEXT,
  
  -- Pipeline
  pipeline_stage pipeline_stage DEFAULT 'lead',
  pipeline_entered_at TIMESTAMPTZ DEFAULT NOW(),
  pipeline_won_at TIMESTAMPTZ,
  pipeline_lost_at TIMESTAMPTZ,
  pipeline_lost_reason TEXT,
  
  -- Eierskap
  owner_id UUID REFERENCES user_profiles(id),
  
  -- Økonomi (denormalisert)
  estimated_annual_value_nok DECIMAL(12,2),
  lifetime_value_nok DECIMAL(12,2) DEFAULT 0,
  outstanding_amount_nok DECIMAL(12,2) DEFAULT 0,
  
  -- Stats (oppdateres av triggers)
  stats JSONB DEFAULT '{
    "total_requests": 0,
    "open_requests": 0,
    "total_assignments": 0,
    "active_assignments": 0,
    "total_contracts": 0,
    "total_invoices": 0,
    "total_revenue_nok": 0,
    "avg_time_to_fill_days": null,
    "last_activity_at": null,
    "last_assignment_at": null
  }',
  
  -- Preferanser
  preferences JSONB DEFAULT '{
    "preferred_roles": [],
    "preferred_certifications": [],
    "preferred_experience_min": null,
    "billing_terms_days": 30,
    "communication_preference": "email"
  }',
  
  -- Notater og tags
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES user_profiles(id),
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES user_profiles(id)
);

CREATE INDEX idx_org_name ON crm_organizations(name);
CREATE INDEX idx_org_number ON crm_organizations(org_number);
CREATE INDEX idx_org_pipeline ON crm_organizations(pipeline_stage);
CREATE INDEX idx_org_customer_type ON crm_organizations(customer_type);
CREATE INDEX idx_org_industry ON crm_organizations(industry);
CREATE INDEX idx_org_owner ON crm_organizations(owner_id);
CREATE INDEX idx_org_tags ON crm_organizations USING gin(tags);
CREATE INDEX idx_org_active ON crm_organizations(id) WHERE archived_at IS NULL;

CREATE INDEX idx_org_fts ON crm_organizations USING gin(
  to_tsvector('norwegian', coalesce(name, '') || ' ' || coalesce(notes, ''))
);

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON crm_organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();


-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00009_crm_contacts.sql
-- ══════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES crm_organizations(id) ON DELETE CASCADE,
  
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  
  job_title TEXT,
  department TEXT,
  
  is_primary BOOLEAN DEFAULT FALSE,
  is_decision_maker BOOLEAN DEFAULT FALSE,
  is_billing_contact BOOLEAN DEFAULT FALSE,
  is_operational_contact BOOLEAN DEFAULT FALSE,
  
  preferred_contact_method TEXT DEFAULT 'email',
  language TEXT DEFAULT 'no',
  
  linkedin_url TEXT,
  avatar_url TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES user_profiles(id),
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES user_profiles(id)
);

CREATE INDEX idx_contacts_org ON crm_contacts(organization_id);
CREATE INDEX idx_contacts_email ON crm_contacts(email);
CREATE INDEX idx_contacts_primary ON crm_contacts(organization_id) WHERE is_primary = TRUE;
CREATE INDEX idx_contacts_active ON crm_contacts(id) WHERE archived_at IS NULL;

-- Ensure only one primary per org
CREATE OR REPLACE FUNCTION ensure_single_primary_contact()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = TRUE THEN
    UPDATE crm_contacts 
    SET is_primary = FALSE 
    WHERE organization_id = NEW.organization_id 
      AND id != NEW.id 
      AND is_primary = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contacts_single_primary
  BEFORE INSERT OR UPDATE ON crm_contacts
  FOR EACH ROW
  WHEN (NEW.is_primary = TRUE)
  EXECUTE FUNCTION ensure_single_primary_contact();

CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON crm_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();


-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00010_crm_deals.sql
-- ══════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE crm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES crm_organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id),
  
  title TEXT NOT NULL,
  description TEXT,
  
  value_nok DECIMAL(12,2),
  currency TEXT DEFAULT 'NOK',
  
  stage deal_stage DEFAULT 'qualification',
  probability INTEGER DEFAULT 10 CHECK (probability BETWEEN 0 AND 100),
  
  expected_close_date DATE,
  actual_close_date DATE,
  
  won_at TIMESTAMPTZ,
  lost_at TIMESTAMPTZ,
  lost_reason TEXT,
  
  owner_id UUID REFERENCES user_profiles(id),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES user_profiles(id),
  archived_at TIMESTAMPTZ
);

CREATE INDEX idx_deals_org ON crm_deals(organization_id);
CREATE INDEX idx_deals_contact ON crm_deals(contact_id);
CREATE INDEX idx_deals_stage ON crm_deals(stage);
CREATE INDEX idx_deals_owner ON crm_deals(owner_id);
CREATE INDEX idx_deals_expected_close ON crm_deals(expected_close_date);
CREATE INDEX idx_deals_open ON crm_deals(id) WHERE won_at IS NULL AND lost_at IS NULL;

CREATE TRIGGER deals_updated_at
  BEFORE UPDATE ON crm_deals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();


-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00011_crm_activities.sql
-- ══════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  organization_id UUID REFERENCES crm_organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL,
  request_id UUID,  -- FK added later
  assignment_id UUID,  -- FK added later
  
  type activity_type NOT NULL,
  subject TEXT,
  description TEXT,
  
  duration_minutes INTEGER,
  outcome TEXT,
  participants TEXT[],
  email_message_id TEXT,
  
  performed_by UUID REFERENCES user_profiles(id),
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT at_least_one_relation CHECK (
    organization_id IS NOT NULL OR 
    contact_id IS NOT NULL OR 
    deal_id IS NOT NULL
  )
);

CREATE INDEX idx_activities_org ON crm_activities(organization_id);
CREATE INDEX idx_activities_contact ON crm_activities(contact_id);
CREATE INDEX idx_activities_deal ON crm_activities(deal_id);
CREATE INDEX idx_activities_type ON crm_activities(type);
CREATE INDEX idx_activities_performed_at ON crm_activities(performed_at DESC);
CREATE INDEX idx_activities_performed_by ON crm_activities(performed_by);


-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00012_crm_tasks.sql
-- ══════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE crm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  organization_id UUID REFERENCES crm_organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  
  due_date DATE,
  due_time TIME,
  reminder_at TIMESTAMPTZ,
  
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES user_profiles(id),
  completion_notes TEXT,
  
  assigned_to UUID REFERENCES user_profiles(id),
  created_by UUID REFERENCES user_profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_org ON crm_tasks(organization_id);
CREATE INDEX idx_tasks_assigned ON crm_tasks(assigned_to);
CREATE INDEX idx_tasks_due ON crm_tasks(due_date) WHERE status = 'pending';
CREATE INDEX idx_tasks_status ON crm_tasks(status);

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON crm_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

## 3.3 ORGANISASJONSKORT

### 3.3.1 Organisasjonskort UI (Full side - /crm/organizations/[id])

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  ← CRM                                                              [⋮ Actions ▼]      │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                  │  │
│  │  ┌────────┐  FRØY AS                                          🟢 KUNDE          │  │
│  │  │  LOGO  │  Org.nr: 912 345 678                                                │  │
│  │  └────────┘  Havbruk • Enterprise • Trondheim                                   │  │
│  │                                                                                  │  │
│  │  📧 post@froy.no   📞 +47 73 00 00 00   🌐 froy.no                              │  │
│  │                                                                                  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ═════════════════════════════════════════════════════════════════════════════════════  │
│                                                                                         │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐              │
│  │   Oversikt    │ │   Kontakter   │ │   Requests    │ │    Oppdrag    │              │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘              │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐                                │
│  │  Kontrakter   │ │   Fakturaer   │ │  Aktiviteter  │                                │
│  └───────────────┘ └───────────────┘ └───────────────┘                                │
│                                                                                         │
│  ┌────────────────────────────────────┐  ┌────────────────────────────────────────┐   │
│  │ NØKKELTALL                         │  │ QUICK ACTIONS                          │   │
│  │                                    │  │                                        │   │
│  │ Aktive oppdrag:       3            │  │ [+ Ny request]                         │   │
│  │ Åpne requests:        2            │  │ [+ Nytt oppdrag]                       │   │
│  │ Lifetime value:       2.4M NOK     │  │ [+ Ny kontakt]                         │   │
│  │ Utestående:           156K NOK     │  │ [📞 Logg samtale]                      │   │
│  │ Siste aktivitet:      I dag        │  │ [📧 Send e-post]                       │   │
│  │ Gj.snitt fill-time:   4.2 dager    │  │ [📝 Legg til notat]                    │   │
│  │                                    │  │                                        │   │
│  └────────────────────────────────────┘  └────────────────────────────────────────┘   │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ KONTAKTPERSONER                                                    [+ Legg til]  │  │
│  │                                                                                  │  │
│  │ ┌────────────────────────────────────┐  ┌────────────────────────────────────┐  │  │
│  │ │ ┌──┐ Per Hansen                   │  │ ┌──┐ Kari Olsen                    │  │  │
│  │ │ │👤│ HR-sjef                      │  │ │👤│ Driftsleder                   │  │  │
│  │ │ └──┘ ⭐ Primær • Beslutningstaker │  │ └──┘ Operativ kontakt             │  │  │
│  │ │     📧 per@froy.no                │  │     📧 kari@froy.no                │  │  │
│  │ │     📱 +47 900 00 001             │  │     📱 +47 900 00 002              │  │  │
│  │ │     [Ring] [Mail]                 │  │     [Ring] [Mail]                  │  │  │
│  │ └────────────────────────────────────┘  └────────────────────────────────────┘  │  │
│  │                                                                                  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ AKTIVE REQUESTS                                                     [Se alle →]  │  │
│  │                                                                                  │  │
│  │ ┌────────────────────────────────────────────────────────────────────────────┐  │  │
│  │ │ REQ-2024-0089  │  2x Kaptein til MS Frøy Viking                           │  │  │
│  │ │ 🟡 Matching    │  Start: 15.01.2025  │  Verdi: ~180K         [Match →]    │  │  │
│  │ └────────────────────────────────────────────────────────────────────────────┘  │  │
│  │ ┌────────────────────────────────────────────────────────────────────────────┐  │  │
│  │ │ REQ-2024-0092  │  1x Maskinist til MS Frøy Australis                      │  │  │
│  │ │ 🟢 Shortlisted │  Start: 01.02.2025  │  Verdi: ~95K          [Se →]       │  │  │
│  │ └────────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ AKTIVE OPPDRAG                                                      [Se alle →]  │  │
│  │                                                                                  │  │
│  │ ┌────────────────────────────────────────────────────────────────────────────┐  │  │
│  │ │ ASN-2024-0045  │  Ole Hansen - Kaptein                                    │  │  │
│  │ │ 🟢 Aktiv       │  MS Frøy Viking  │  Sep-Des 2024         [Detaljer]      │  │  │
│  │ └────────────────────────────────────────────────────────────────────────────┘  │  │
│  │ ┌────────────────────────────────────────────────────────────────────────────┐  │  │
│  │ │ ASN-2024-0046  │  Kari Nordmann - Styrmann                                │  │  │
│  │ │ 🟢 Aktiv       │  MS Frøy Viking  │  Okt-Jan 2025         [Detaljer]      │  │  │
│  │ └────────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ØKONOMI                                                                          │  │
│  │                                                                                  │  │
│  │ ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐     │  │
│  │ │ Lifetime Value       │ │ Inneværende år       │ │ Utestående           │     │  │
│  │ │ 2 456 000 kr        │ │ 890 000 kr           │ │ 156 000 kr          │     │  │
│  │ │ ↑ 23% YoY           │ │ 67% av mål           │ │ 2 fakturaer          │     │  │
│  │ └──────────────────────┘ └──────────────────────┘ └──────────────────────┘     │  │
│  │                                                                                  │  │
│  │ [Se alle fakturaer →]                                                           │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ AKTIVITETSLOGG                                              [+ Logg aktivitet]   │  │
│  │                                                                                  │  │
│  │ ┌────────────────────────────────────────────────────────────────────────────┐  │  │
│  │ │ 📞 I dag 14:30 - Isak Dalen                                               │  │  │
│  │ │ Samtale med Per Hansen om behov for 2 kapteiner til januar.               │  │  │
│  │ │ Sendte over kandidatforslag. Venter på tilbakemelding.                    │  │  │
│  │ ├────────────────────────────────────────────────────────────────────────────┤  │  │
│  │ │ 📧 I går 09:15 - System                                                   │  │  │
│  │ │ E-post sendt: Kandidatforslag REQ-2024-0089                               │  │  │
│  │ ├────────────────────────────────────────────────────────────────────────────┤  │  │
│  │ │ 📝 12.12.2024 - Tor Faafeng                                               │  │  │
│  │ │ God kunde. Alltid rask tilbakemelding. Foretrekker erfarne folk.          │  │  │
│  │ └────────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                  │  │
│  │ [Vis alle aktiviteter →]                                                        │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ NOTATER                                                           [+ Ny notat]   │  │
│  │                                                                                  │  │
│  │ God kunde siden 2022. Foretrekker erfarne kapteiner med wellboat-erfaring.      │  │
│  │ Per Hansen er hovedkontakt for alle bemanningsspørsmål. Betaler alltid i tide.  │  │
│  │                                                                                  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ TAGS                                                                             │  │
│  │                                                                                  │  │
│  │ [havbruk] [wellboat] [enterprise] [god betaler] [høy prioritet]  [+ Legg til]   │  │
│  │                                                                                  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## 3.4 CRM PIPELINE (KANBAN)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  CRM PIPELINE                                              [+ Ny organisasjon]         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  🔍 [Søk...                    ]    [Bransje ▼] [Eier ▼] [Tags ▼]                      │
│                                                                                         │
│  ═════════════════════════════════════════════════════════════════════════════════════  │
│                                                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │     LEAD     │ │  KONTAKTET   │ │  MØTE BOOKA  │ │ TILBUD SENDT │ │    KUNDE     │ │
│  │     (12)     │ │     (8)      │ │     (3)      │ │     (2)      │ │    (45)      │ │
│  │    ~1.5M     │ │    ~800K     │ │    ~1.8M     │ │    ~900K     │ │   ~15.2M     │ │
│  ├──────────────┤ ├──────────────┤ ├──────────────┤ ├──────────────┤ ├──────────────┤ │
│  │              │ │              │ │              │ │              │ │              │ │
│  │ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐ │ │
│  │ │ Selskap  │ │ │ │ Selskap  │ │ │ │ Selskap  │ │ │ │ Selskap  │ │ │ │ Frøy AS  │ │ │
│  │ │ Alpha    │ │ │ │ Delta    │ │ │ │ Gamma    │ │ │ │ Kappa    │ │ │ │ 🏆       │ │ │
│  │ │ ~500K    │ │ │ │ ~200K    │ │ │ │ ~1.2M    │ │ │ │ ~800K    │ │ │ │ 2.4M     │ │ │
│  │ │ Havbruk  │ │ │ │ Offshore │ │ │ │ Shipping │ │ │ │ Havbruk  │ │ │ │ Havbruk  │ │ │
│  │ └──────────┘ │ │ └──────────┘ │ │ └──────────┘ │ │ └──────────┘ │ │ └──────────┘ │ │
│  │              │ │              │ │              │ │              │ │              │ │
│  │ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐ │ │              │ │ ┌──────────┐ │ │
│  │ │ Selskap  │ │ │ │ Selskap  │ │ │ │ Selskap  │ │ │              │ │ │ Nordlaks │ │ │
│  │ │ Beta     │ │ │ │ Epsilon  │ │ │ │ Theta    │ │ │              │ │ │ 🏆       │ │ │
│  │ │ ~300K    │ │ │ │ ~450K    │ │ │ │ ~600K    │ │ │              │ │ │ 1.8M     │ │ │
│  │ └──────────┘ │ │ └──────────┘ │ │ └──────────┘ │ │              │ │ └──────────┘ │ │
│  │              │ │              │ │              │ │              │ │              │ │
│  │    ...       │ │    ...       │ │              │ │              │ │    ...       │ │
│  │              │ │              │ │              │ │              │ │              │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │
│                                                                                         │
│  TOTALT: ~20.2M i pipeline (75 organisasjoner)                                         │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

DRAG & DROP: Dra kort mellom kolonner for å endre pipeline stage.
```

---

# ████████████████████████████████████████████████████████████████████████████████
# █                                                                              █
# █                    DEL 4: MODUL 3 — OPERATIONS CENTER                        █
# █                                                                              █
# ████████████████████████████████████████████████████████████████████████████████

---

## 4.1 OPERATIONS OVERSIKT

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   OPERATIONS = LEVERINGSMASKINEN                                            ║
║                                                                              ║
║   Her skjer det faktiske arbeidet:                                          ║
║   • Kunde har behov → Vi matcher kandidater → Vi leverer mannskap           ║
║                                                                              ║
║   FLYTEN:                                                                    ║
║   ┌─────────────────────────────────────────────────────────────────────┐   ║
║   │                                                                     │   ║
║   │  REQUEST    →   MATCH    →   SHORTLIST   →   OFFER                 │   ║
║   │  (Behov)        (10 sek)     (Utvalg)        (Tilbud)              │   ║
║   │                                                                     │   ║
║   │      ↓                                                              │   ║
║   │                                                                     │   ║
║   │  ASSIGNMENT   →   CONTRACT   →   ACTIVE   →   COMPLETE             │   ║
║   │  (Oppdrag)        (Kontrakt)     (Pågår)      (Ferdig)             │   ║
║   │                                                                     │   ║
║   │      ↓                                                              │   ║
║   │                                                                     │   ║
║   │  INVOICE   →   PAID                                                │   ║
║   │  (Faktura)     (Betalt)                                            │   ║
║   │                                                                     │   ║
║   └─────────────────────────────────────────────────────────────────────┘   ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 4.2 MATCHING ENGINE (10 SEKUNDER)

### 4.2.1 Matching Konsept

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   10-SEKUNDS MATCHING                                                        ║
║                                                                              ║
║   INPUT:                                                                     ║
║   • Rolle (f.eks. "Kaptein")                                                ║
║   • Sertifikater (f.eks. "D5", "STCW")                                      ║
║   • Startdato                                                                ║
║   • [Valgfritt] Erfaring, språk, lokasjon, etc.                             ║
║                                                                              ║
║   OUTPUT (på < 10 sekunder):                                                 ║
║   • Rangert liste med kandidater                                            ║
║   • Match-score (0-100) for hver                                            ║
║   • Breakdown av score per kategori                                         ║
║   • Blockers (f.eks. utløpte sertifikater)                                  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### 4.2.2 Quick Match UI

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🎯 QUICK MATCH                                                        [×]      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ HVA TRENGER DU?                                                         │   │
│  │                                                                         │   │
│  │ Rolle:        [Kaptein                    ▼]                           │   │
│  │                                                                         │   │
│  │ Sertifikater: [D5    ] [STCW  ] [DP-ADV] [+]                          │   │
│  │               ☑ Påkrevd                                                │   │
│  │                                                                         │   │
│  │ Startdato:    [15.01.2025        📅]                                   │   │
│  │                                                                         │   │
│  │ [+ Flere kriterier]                                                    │   │
│  │                                                                         │   │
│  │                                           [🔍 MATCH]                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  RESULTATER  (23 kandidater på 847ms)                      [Eksporter ▼]       │
│                                                                                 │
│  💪 STRONG MATCH (4)                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ ┌──┐ Ole Hansen                             Score: 96    ⭐ 4.8        │   │
│  │ │👤│ Kaptein • 12 år • Nordland             🟢 Tilgjengelig            │   │
│  │ └──┘ ✅ D5  ✅ STCW  ✅ DP-ADV              [Profil] [→ Shortlist]    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ ┌──┐ Kari Nordmann                          Score: 94    ⭐ 4.5        │   │
│  │ │👤│ Kaptein • 8 år • Troms                 🟢 Tilgjengelig            │   │
│  │ └──┘ ✅ D5  ✅ STCW  ✅ DP-ADV              [Profil] [→ Shortlist]    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  👍 GOOD MATCH (8)                                                             │
│  ⚠️ POSSIBLE (11)                                                              │
│                                                                                 │
│  [Legg alle sterke i shortlist]                                    [Avbryt]   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2.3 Matching Algorithm

```typescript
// lib/matching/engine.ts

interface MatchingCriteria {
  role: string;
  startDate: Date;
  certifications: {
    required: string[];
    preferred: string[];
  };
  experience?: { minYears?: number; preferredYears?: number };
  languages?: { required?: string[]; preferred?: string[] };
  location?: { fylke?: string[] };
  weights?: {
    certifications?: number;  // default: 35
    experience?: number;      // default: 25
    availability?: number;    // default: 20
    rating?: number;          // default: 10
    proximity?: number;       // default: 10
  };
}

interface MatchResult {
  candidateId: string;
  totalScore: number;  // 0-100
  scores: {
    certifications: { score: number; matched: string[]; missing: string[] };
    experience: { score: number; years: number };
    availability: { score: number; status: string };
    rating: { score: number; rating: number | null };
    proximity: { score: number; fylke: string | null };
  };
  isFullMatch: boolean;
  blockers: Array<{ type: string; description: string; severity: 'warning' | 'blocker' }>;
  recommendation: 'strong' | 'good' | 'possible' | 'weak';
}

async function runMatching(
  criteria: MatchingCriteria,
  options: { limit?: number; includePartial?: boolean } = {}
): Promise<{ results: MatchResult[]; executionTimeMs: number }> {
  const startTime = performance.now();
  
  // STEP 1: Query candidate_search_index with hard filters
  let query = supabase
    .from('candidate_search_index')
    .select('*')
    .in('availability_status', ['available', 'available_soon'])
    .in('compliance_status', ['approved', 'review_pending', 'not_started'])
    .contains('roles', [criteria.role]);
  
  if (criteria.certifications.required.length > 0) {
    query = query.contains('certification_codes', criteria.certifications.required);
  }
  
  const { data: candidates } = await query.limit((options.limit || 50) * 3);
  
  // STEP 2: Score each candidate in-memory
  const scoredResults = candidates.map(c => scoreCandidate(c, criteria));
  
  // STEP 3: Sort and return
  const results = scoredResults
    .filter(r => options.includePartial || r.isFullMatch)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, options.limit || 50);
  
  return { results, executionTimeMs: performance.now() - startTime };
}
```

---

## 4.3 REQUEST → ASSIGNMENT WORKFLOW

### Database Schema (kort versjon)

```sql
-- CUSTOMER REQUESTS (Kundebehov)
CREATE TABLE customer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT UNIQUE NOT NULL,  -- 'REQ-2025-0001'
  organization_id UUID NOT NULL REFERENCES crm_organizations(id),
  contact_id UUID REFERENCES crm_contacts(id),
  
  title TEXT NOT NULL,
  role_needed TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE,
  
  requirements JSONB,  -- {certifications, experience, languages}
  budget_max_daily_nok DECIMAL(10,2),
  estimated_value_nok DECIMAL(12,2),
  
  status request_status DEFAULT 'draft',
  priority TEXT DEFAULT 'medium',
  owner_id UUID REFERENCES user_profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REQUEST SHORTLISTS
CREATE TABLE request_shortlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES customer_requests(id),
  candidate_id UUID REFERENCES candidates(id),
  
  match_score INTEGER,
  rank_position INTEGER,
  status TEXT DEFAULT 'proposed',
  
  offer_sent_at TIMESTAMPTZ,
  offer_daily_rate_nok DECIMAL(10,2),
  customer_response TEXT,
  
  UNIQUE(request_id, candidate_id)
);

-- ASSIGNMENTS (Oppdrag)
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_number TEXT UNIQUE NOT NULL,  -- 'ASN-2025-0001'
  request_id UUID REFERENCES customer_requests(id),
  organization_id UUID REFERENCES crm_organizations(id),
  candidate_id UUID REFERENCES candidates(id),
  
  title TEXT NOT NULL,
  role TEXT NOT NULL,
  planned_start_date DATE NOT NULL,
  planned_end_date DATE,
  
  employee_rate_amount_nok DECIMAL(10,2),
  billing_rate_amount_nok DECIMAL(10,2),
  
  status assignment_status DEFAULT 'draft',
  release_checklist JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

# ████████████████████████████████████████████████████████████████████████████████
# █                                                                              █
# █                    DEL 5: MODUL 4 — KONTRAKTER                               █
# █                                                                              █
# ████████████████████████████████████████████████████████████████████████████████

---

## 5.1 KONTRAKT-SYSTEM

```sql
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT UNIQUE NOT NULL,  -- 'CON-2025-0001'
  assignment_id UUID REFERENCES assignments(id),
  organization_id UUID REFERENCES crm_organizations(id),
  candidate_id UUID REFERENCES candidates(id),
  
  type contract_type NOT NULL,  -- 'employment_temporary', 'contractor'
  title TEXT NOT NULL,
  content_html TEXT,
  
  template_id TEXT,
  variables JSONB,
  
  draft_pdf_path TEXT,
  signed_pdf_path TEXT,
  
  esign_provider TEXT,
  esign_request_id TEXT,
  esign_status TEXT DEFAULT 'not_started',
  
  status contract_status DEFAULT 'draft',
  signed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contract_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id),
  
  party_type TEXT NOT NULL,  -- 'employee', 'employer', 'customer'
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  national_id TEXT,
  
  signing_order INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending',
  signed_at TIMESTAMPTZ,
  signature_method TEXT
);
```

---

# ████████████████████████████████████████████████████████████████████████████████
# █                                                                              █
# █                    DEL 6: MODUL 5 — TIMEREGISTRERING                         █
# █                                                                              █
# ████████████████████████████████████████████████████████████████████████████████

---

## 6.1 TIMESHEETS

```sql
CREATE TABLE assignment_timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id),
  
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  entries JSONB DEFAULT '[]',
  
  total_hours DECIMAL(6,2) DEFAULT 0,
  total_days DECIMAL(4,1) DEFAULT 0,
  
  calculated_cost_nok DECIMAL(12,2),
  calculated_billing_nok DECIMAL(12,2),
  
  status TEXT DEFAULT 'draft',
  
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES user_profiles(id),
  
  invoice_id UUID,
  
  UNIQUE(assignment_id, period_start, period_end)
);
```

---

# ████████████████████████████████████████████████████████████████████████████████
# █                                                                              █
# █                    DEL 7: MODUL 6 — QMS (KVALITETSSYSTEM)                   █
# █                                                                              █
# ████████████████████████████████████████████████████████████████████████████████

---

## 7.1 QMS DOKUMENTER

```sql
CREATE TABLE qms_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_number TEXT UNIQUE NOT NULL,
  type qms_document_type NOT NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  current_version INTEGER DEFAULT 1,
  
  status qms_document_status DEFAULT 'draft',
  next_review_date DATE,
  
  owner_id UUID REFERENCES user_profiles(id),
  approved_by UUID REFERENCES user_profiles(id),
  approved_at TIMESTAMPTZ
);

CREATE TABLE qms_nonconformities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nc_number TEXT UNIQUE NOT NULL,
  
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  source TEXT NOT NULL,
  severity nc_severity DEFAULT 'minor',
  
  status nc_status DEFAULT 'open',
  due_date DATE,
  
  root_cause TEXT,
  immediate_action TEXT,
  
  responsible_id UUID REFERENCES user_profiles(id),
  closed_at TIMESTAMPTZ
);

CREATE TABLE qms_capa_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nonconformity_id UUID REFERENCES qms_nonconformities(id),
  
  type capa_type NOT NULL,
  description TEXT NOT NULL,
  due_date DATE,
  
  status capa_status DEFAULT 'planned',
  completed_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  
  responsible_id UUID REFERENCES user_profiles(id)
);

CREATE TABLE qms_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_number TEXT UNIQUE NOT NULL,
  
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category risk_category NOT NULL,
  
  likelihood INTEGER CHECK (likelihood BETWEEN 1 AND 5),
  impact INTEGER CHECK (impact BETWEEN 1 AND 5),
  risk_score INTEGER GENERATED ALWAYS AS (likelihood * impact) STORED,
  
  mitigation_strategy TEXT,
  status risk_status DEFAULT 'identified',
  
  owner_id UUID REFERENCES user_profiles(id),
  next_review_date DATE
);
```

---

# ████████████████████████████████████████████████████████████████████████████████
# █                                                                              █
# █                    DEL 8: RLS (ROW LEVEL SECURITY)                          █
# █                                                                              █
# ████████████████████████████████████████████████████████████████████████████████

---

```sql
-- HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS user_role AS $
  SELECT role FROM user_profiles WHERE id = auth.uid();
$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth.is_staff()
RETURNS BOOLEAN AS $
  SELECT auth.user_role() IN ('super_admin', 'admin', 'recruiter', 'coordinator');
$ LANGUAGE sql SECURITY DEFINER STABLE;

-- POLICIES
CREATE POLICY "Staff can view all candidates" ON candidates
  FOR SELECT USING (auth.is_staff());

CREATE POLICY "Staff can manage candidates" ON candidates
  FOR ALL USING (auth.is_staff());

CREATE POLICY "Employees can view own" ON candidates
  FOR SELECT USING (user_id = auth.uid());
```

---

# ████████████████████████████████████████████████████████████████████████████████
# █                                                                              █
# █                    DEL 9: IMPLEMENTERINGSFASER (50+)                        █
# █                                                                              █
# ████████████████████████████████████████████████████████████████████████████████

---

## FASE 1-5: FUNDAMENT

```
[ ] 1.1  Opprett Supabase-prosjekt (eu-north-1)
[ ] 1.2  Konfigurer Auth
[ ] 1.3  Sett opp Storage buckets
[ ] 1.4  Initialiser Next.js 15
[ ] 1.5  Installer dependencies
[ ] 2.1  Opprett alle migrations (00001-00027)
[ ] 2.2  Kjør migrations
[ ] 2.3  Generer TypeScript types
[ ] 3.1  Opprett auth utilities
[ ] 3.2  Implementer login/callback
[ ] 3.3  Opprett dashboard layout
[ ] 3.4  Implementer sidebar/header
[ ] 4.1  Opprett Supabase clients
[ ] 4.2  Sett opp React Query
[ ] 4.3  Test connections
[ ] 5.1  Opprett migrerings-scripts
[ ] 5.2  Test med --dry-run
[ ] 5.3  Kjør live migrering
[ ] 5.4  Verifiser data
```

## FASE 6-15: KANDIDATER

```
[ ] 6.1  Kandidat-liste page
[ ] 6.2  CandidateCard component
[ ] 6.3  Søk med debounce
[ ] 6.4  Filter-panel
[ ] 6.5  Virtualisert liste
[ ] 7.1  Kandidat-profil page
[ ] 7.2  Profil-faner
[ ] 7.3  Sertifikat-visning
[ ] 7.4  Dokument-liste
[ ] 7.5  Dokument-opplasting
[ ] 8.1  Pools sidebar
[ ] 8.2  Pool-filtering
[ ] 8.3  Smart pools
[ ] 8.4  Statisk pool CRUD
[ ] 8.5  Drag-to-pool
[ ] 9.1  Kandidat-opprettelse form
[ ] 9.2  Kandidat-redigering
[ ] 9.3  Sertifikat CRUD
[ ] 9.4  Dokument CRUD
[ ] 9.5  Notater, tags, rating
[ ] 10.1 Avansert filter UI
[ ] 10.2 Filter-lagring
[ ] 10.3 Eksport (CSV/Excel)
[ ] 10.4 Compliance-kø
```

## FASE 16-25: CRM

```
[ ] 11.1 CRM dashboard
[ ] 11.2 OrganizationCard
[ ] 11.3 Organisasjon-liste
[ ] 11.4 Organisasjon-profil
[ ] 11.5 Kontakt-liste og CRUD
[ ] 12.1 Pipeline Kanban
[ ] 12.2 Drag-and-drop stages
[ ] 12.3 Deal CRUD
[ ] 13.1 Aktivitetslogg
[ ] 13.2 Aktivitet-opprettelse
[ ] 13.3 Samtale/møte/e-post logging
[ ] 14.1 Oppgave-liste
[ ] 14.2 Oppgave CRUD
[ ] 14.3 Påminnelser
[ ] 15.1 CRM søk og filter
[ ] 15.2 Statistikk-dashboards
```

## FASE 26-35: OPERATIONS

```
[ ] 16.1 Operations dashboard
[ ] 16.2 Request-liste
[ ] 16.3 Request Kanban
[ ] 16.4 Request CRUD
[ ] 17.1 MATCHING ENGINE
[ ] 17.2 Scoring functions
[ ] 17.3 Quick Match UI
[ ] 17.4 Match-resultater
[ ] 17.5 Test ytelse (<10 sek)
[ ] 18.1 Shortlist-manager
[ ] 18.2 Kandidat-rangering
[ ] 18.3 Tilbud-sending
[ ] 19.1 Assignment CRUD
[ ] 19.2 Release checklist
[ ] 19.3 Status-transitions
[ ] 20.1 Timesheet UI
[ ] 20.2 Time-registrering
[ ] 20.3 Godkjennings-flow
```

## FASE 36-45: KONTRAKTER & QMS

```
[ ] 21.1 Kontrakt-system
[ ] 21.2 Template-manager
[ ] 21.3 Variable-substitution
[ ] 21.4 PDF-generering
[ ] 22.1 Kontrakt CRUD
[ ] 22.2 Parter-håndtering
[ ] 22.3 Review-flow
[ ] 23.1 E-sign integration
[ ] 23.2 Signatur-tracking
[ ] 24.1 QMS dokumenter
[ ] 24.2 Versjonering
[ ] 24.3 Godkjennings-flow
[ ] 25.1 Avviks-system
[ ] 25.2 CAPA
[ ] 25.3 Risikoregister
```

## FASE 46-50: FINPUSS

```
[ ] 26.1 Keyboard shortcuts
[ ] 26.2 Command palette (⌘K)
[ ] 26.3 Performance-optimalisering
[ ] 26.4 Loading states
[ ] 26.5 Error handling
[ ] 27.1 Responsive design
[ ] 27.2 Dark mode
[ ] 28.1 End-to-end testing
[ ] 28.2 Bug fixes
[ ] 29.1 Documentation
[ ] 30.1 Deploy til produksjon
```

---

# ████████████████████████████████████████████████████████████████████████████████
# █                                                                              █
# █                    DEL 10: MAPPESTRUKTUR                                     █
# █                                                                              █
# ████████████████████████████████████████████████████████████████████████████████

---

```
ADMINCREW/
├── app/
│   ├── (auth)/login, callback, layout
│   ├── (dashboard)/
│   │   ├── layout.tsx, page.tsx
│   │   ├── candidates/[id]/page.tsx, edit/, certifications/, documents/
│   │   ├── crm/organizations/[id]/, contacts/, deals/, pipeline/
│   │   ├── operations/requests/, assignments/, contracts/, timesheets/
│   │   ├── qms/documents/, nonconformities/, risks/
│   │   └── settings/
│   ├── (employee)/assignments/, timesheets/, contracts/, documents/
│   └── api/auth/, candidates/, matching/, contracts/, webhooks/
│
├── components/
│   ├── ui/ (shadcn)
│   ├── layout/ (sidebar, header, nav-item)
│   ├── candidates/ (card, list, profile, filters, pools-sidebar)
│   ├── crm/ (organization-card, contact-card, deal-kanban)
│   ├── operations/ (request-kanban, matching-panel, shortlist)
│   ├── contracts/ (editor, template-selector, signature-status)
│   ├── qms/ (document-list, nc-card, risk-matrix)
│   └── shared/ (data-table, empty-state, loading-skeleton)
│
├── hooks/ (use-candidates, use-organizations, use-requests, etc)
├── stores/ (candidates-store, crm-store, operations-store, ui-store)
│
├── lib/
│   ├── supabase/ (client, server, admin)
│   ├── matching/ (engine, scoring)
│   ├── contracts/ (generator, templates, esign)
│   └── utils/ (cn, format, date, validation)
│
├── types/ (database.types.ts, candidates.ts, crm.ts, operations.ts)
│
├── supabase/
│   ├── migrations/ (00001-00027.sql)
│   └── functions/ (bridge-sync, contract-signed)
│
├── scripts/migration/ (migrate-candidates.ts, role-mapping.ts)
│
├── CLAUDE.md  ← DENNE FILEN
├── .env.local.example
└── package.json
```

---

# ████████████████████████████████████████████████████████████████████████████████
# █                                                                              █
# █                    DEL 11: KEYBOARD SHORTCUTS                                █
# █                                                                              █
# ████████████████████████████████████████████████████████████████████████████████

---

```typescript
const SHORTCUTS = {
  // Global
  'mod+k': 'Command palette',
  'mod+b': 'Toggle sidebar',
  
  // Navigation
  'g h': 'Go to dashboard',
  'g c': 'Go to candidates',
  'g o': 'Go to CRM',
  'g r': 'Go to requests',
  'g a': 'Go to assignments',
  
  // Actions
  'n': 'New item',
  'm': 'Match (på request)',
  'e': 'Edit',
  's': 'Save',
  'Escape': 'Cancel/close',
  
  // Search
  '/': 'Focus search',
  'f': 'Open filters',
  
  // Lists
  'j': 'Move down',
  'k': 'Move up',
  'Enter': 'Open',
  'Space': 'Toggle select',
};
```

---

# ████████████████████████████████████████████████████████████████████████████████
# █                                                                              █
# █                              SLUTT                                           █
# █                                                                              █
# ████████████████████████████████████████████████████████████████████████████████

---

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   DETTE ER DIN BIBEL.                                                       ║
║                                                                              ║
║   10 SEKUNDER FRA BEHOV TIL MATCH.                                          ║
║   VERDENS ENKLESTE ARBEIDSDAG FOR ISAK.                                     ║
║                                                                              ║
║   FØLG SPESIFIKASJONEN. AVVIK IKKE.                                         ║
║                                                                              ║
║   Lykke til, Claude Code. 🚀                                                ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```
