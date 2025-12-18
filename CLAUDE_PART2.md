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
  /*
    [
      {"date": "2025-01-15", "hours_normal": 7.5, "hours_overtime": 2, "notes": ""}
    ]
  */
  
  total_hours DECIMAL(6,2) DEFAULT 0,
  total_days DECIMAL(4,1) DEFAULT 0,
  
  calculated_cost_nok DECIMAL(12,2),
  calculated_billing_nok DECIMAL(12,2),
  
  status TEXT DEFAULT 'draft',  -- 'draft', 'submitted', 'approved', 'rejected', 'invoiced'
  
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
  document_number TEXT UNIQUE NOT NULL,  -- 'PRO-001'
  type qms_document_type NOT NULL,  -- 'QH', 'PRO', 'INS', 'SKJEMA'
  
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
  nc_number TEXT UNIQUE NOT NULL,  -- 'NC-2025-0001'
  
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  source TEXT NOT NULL,  -- 'audit', 'customer', 'internal'
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
  
  type capa_type NOT NULL,  -- 'corrective', 'preventive'
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
RETURNS user_role AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth.is_staff()
RETURNS BOOLEAN AS $$
  SELECT auth.user_role() IN ('super_admin', 'admin', 'recruiter', 'coordinator');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- POLICIES (eksempler)
CREATE POLICY "Staff can view all candidates" ON candidates
  FOR SELECT USING (auth.is_staff());

CREATE POLICY "Staff can manage candidates" ON candidates
  FOR ALL USING (auth.is_staff());

CREATE POLICY "Employees can view own" ON candidates
  FOR SELECT USING (user_id = auth.uid());

-- Lignende policies for alle tabeller...
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
[ ] 1.5  Installer dependencies (se package.json)
[ ] 2.1  Opprett alle migrations (00001-00027)
[ ] 2.2  Kjør migrations
[ ] 2.3  Generer TypeScript types
[ ] 3.1  Opprett auth utilities
[ ] 3.2  Implementer login/callback
[ ] 3.3  Opprett dashboard layout
[ ] 3.4  Implementer sidebar/header
[ ] 4.1  Opprett Supabase clients (client/server/admin)
[ ] 4.2  Sett opp React Query
[ ] 4.3  Test connections
[ ] 5.1  Opprett migrerings-scripts
[ ] 5.2  Test med --dry-run
[ ] 5.3  Kjør live migrering fra bluecrew.no
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
[ ] 11.4 Organisasjon-profil (OrganisasjonsKort)
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
[ ] 23.1 E-sign integration (Signicat/BankID)
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
│   ├── operations/ (request-kanban, matching-panel, shortlist, release-checklist)
│   ├── contracts/ (editor, template-selector, signature-status)
│   ├── qms/ (document-list, nc-card, risk-matrix)
│   └── shared/ (data-table, empty-state, loading-skeleton, command-palette)
│
├── hooks/ (use-candidates, use-organizations, use-requests, use-matching, etc)
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
