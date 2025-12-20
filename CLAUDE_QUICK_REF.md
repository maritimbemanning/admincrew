# CLAUDE HUSKELISTE - ADMINCREW ARKITEKTUR
# ═══════════════════════════════════════════════════════════════════════════════
# DENNE FILEN ER KJAPT OPPSLAG FOR CLAUDE. LES ALLTID DENNE FØRST!
# ═══════════════════════════════════════════════════════════════════════════════

## SUPABASE INSTANSER (KRITISK!)

```
GAMMEL BLUECREW.NO:  uqwfesvsfiqjcpzwetkz (SKAL IKKE RØRES!)
NY ADMINCREW:        zhqocakrwcqwxubbondi (Single Source of Truth)
```

## DOMENE-SANNHETER

1. **KANDIDATER = PRODUKTET** (sjøfolk) - Lever i `candidates` tabell
2. **CRM = KUN B2B-KUNDER** (rederier) - `crm_organizations`, `crm_contacts`
3. **OPERATIONS = LEVERINGSMASKINEN** - `customer_requests` → `assignments`
4. **BLUECREW.NO ER PORTAL** - sender data til samme Supabase

## HOVEDTABELLER (00001-00027 migrations)

### KANDIDATER (Modul 1)
- `candidates` - Hovedtabell for 700+ maritime fagfolk
- `candidate_certifications` - Sertifikater (D1-D6, STCW, osv)
- `candidate_documents` - Dokumenter (CV, pass, sjøfartsbok)
- `candidate_pools` - Grupper (statiske og smarte)
- `candidate_pool_memberships` - Kobling kandidat ↔ pool
- `candidate_search_index` - Denormalisert for 10-sek matching

### CRM (Modul 2)
- `crm_organizations` - Rederier, selskaper (B2B kunder)
- `crm_contacts` - Kontaktpersoner i organisasjoner
- `crm_deals` - Salgs-pipeline
- `crm_activities` - Aktivitetslogg
- `crm_tasks` - Oppgaver

### OPERATIONS (Modul 3)
- `customer_requests` - Kundebehov for mannskap (REQ-2025-0001)
- `request_shortlists` - Matchede kandidater per request
- `assignments` - Oppdrag (ASN-2025-0001)
- `release_checklists` - Pre-start checklists

### KONTRAKTER (Modul 4)
- `contracts` - Kontrakter (CON-2025-0001)
- `contract_parties` - Parter (ansatt, arbeidsgiver, kunde)

### TIMER (Modul 5)
- `assignment_timesheets` - Timeregistrering per oppdrag

### FAKTURA (Modul 6)
- `invoices` - Fakturaer
- `invoice_lines` - Fakturalinjer

### QMS (Modul 7)
- `qms_documents` - Prosedyrer, instrukser
- `qms_nonconformities` - Avvik
- `qms_capa_actions` - Korrigerende tiltak
- `qms_risks` - Risikoregister

### BLUECREW PORTAL (00027) - FAKTISK DB SCHEMA
- `job_postings` - Stillingsannonser
- `job_applications` - Jobbsøknader (name, email, phone, status default: 'pending')
- `contacts` - Kontaktskjema (navn, epost, telefon, melding)
- `interest_leads` - Interesse-registreringer (type default: 'sjomann')
- `staffing_needs` - Bemanningsbehov (stillinger=TEXT, oppstart=TEXT)

## POOL SYSTEM (00006_candidate_pools.sql)

### Pool Typer
- `static` - Manuelt lagt til
- `smart` - Filter-basert (auto-beregnet)

### System Pools (is_system = TRUE)
1. `alle` - Smart - Alle kandidater
2. `tilgjengelige` - Smart - available/available_soon
3. `pa-oppdrag` - Smart - on_assignment
4. `compliance-pending` - Smart - documents_pending/review_pending
5. `favoritter` - Statisk - Manuelt merket
6. `blacklist` - Statisk - Skal ikke brukes

## STATUS ENUMS

### availability_status
- available, available_soon, on_assignment, unavailable, inactive

### compliance_status
- not_started, documents_pending, review_pending, approved, expired, rejected

### request_status
- draft, pending_approval, approved, matching, shortlisted, offer_sent, 
  offer_accepted, offer_rejected, converted, on_hold, cancelled, expired

### assignment_status
- draft, pending_compliance, compliance_ok, contract_drafting, contract_sent,
  contract_signed, ready_for_start, active, completed, invoiced, paid, cancelled

### job_applications.status (DB CHECK constraint)
- pending (DEFAULT!), reviewed, shortlisted, rejected, hired

### interest_leads.type
- sjomann (DEFAULT), rederi
- sjofolk, rederi

### staffing_needs kolonner
- fartoytype, stillinger (TEXT[]), antall, oppstart, rotasjon
- kontakt_navn, kontakt_epost, kontakt_telefon, bedrift, merknad
- organization_id, converted_to_request_id

## FLYTEN FOR PORTAL DATA

```
bluecrew.no FORM → Supabase tabell → AdminCrew Inbox → Behandle

job_applications    → Konverter til candidates (sjøfolk)
interest_leads      → 
  - type=sjofolk   → Konverter til candidates
  - type=rederi    → Konverter til crm_organizations/crm_contacts
staffing_needs      → Konverter til customer_requests (Operations)
portal_contacts     → Les og svar (generell kontakt)
```

## MATCHING ENGINE

**10 SEKUNDER FRA BEHOV TIL MATCH**

Query `candidate_search_index` med:
- availability_status IN (available, available_soon)
- compliance_status IN (approved, review_pending, not_started)
- roles @> [ønsket rolle]
- certification_codes @> [påkrevde sertifikater]

Score hver kandidat på:
- certifications (35%)
- experience (25%)
- availability (20%)
- rating (10%)
- proximity (10%)

## KRITISKE REGLER

1. **3 KLIKK MAX** for alle handlinger
2. **10 SEKUNDER MAX** for alle søk
3. **1 SEKUND MAX** sidelasting
4. **KEYBOARD SHORTCUTS** for vanlige handlinger
5. **MANUELL GODKJENNING** for compliance, kontrakter, faktura

## TECH STACK (LÅST)

- Next.js 15 (App Router)
- TypeScript strict
- Tailwind CSS v4
- shadcn/ui
- Zustand (global state)
- TanStack Query v5 (server state)
- React Hook Form + Zod
- TanStack Table v8
- Supabase (PostgreSQL 15)
- Vercel hosting
