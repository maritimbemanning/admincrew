# ADMINCREW - TEST & LAUNCH SJEKKLISTE
## 5 DAGER TIL LANSERING

---

## DAG 1: GRUNNLEGGENDE TESTING

### Auth & Login
- [ ] Login med epost/passord fungerer
- [ ] Google OAuth fungerer
- [ ] Logout fungerer
- [ ] Redirect til login når ikke innlogget

### Dashboard
- [ ] Stats viser riktige tall fra DB
- [ ] Quick Actions navigerer riktig
- [ ] "Krever oppmerksomhet" fungerer

---

## DAG 2: KANDIDAT-MODUL

### Kandidat-liste
- [ ] Liste laster alle kandidater (331 stk)
- [ ] Søk fungerer (navn, epost)
- [ ] Filter fungerer (tilgjengelighet, compliance, rolle)
- [ ] Sortering fungerer (navn, dato, rating)
- [ ] Pagination fungerer

### Pools
- [ ] Alle pools vises i sidebar
- [ ] Klikk på pool filtrerer kandidater
- [ ] "Lag ny pool" fungerer
- [ ] Legg kandidater til pool (multi-select)
- [ ] Fjern kandidater fra pool

### Kandidat-profil
- [ ] Profil-side laster
- [ ] Sertifikater vises
- [ ] Dokumenter kan lastes opp
- [ ] Redigering fungerer

---

## DAG 3: CRM & OPERATIONS

### CRM
- [ ] Organisasjoner CRUD
- [ ] Kontakter CRUD
- [ ] Pipeline Kanban drag-drop
- [ ] Aktivitetslogging
- [ ] Oppgaver

### Operations
- [ ] Customer Requests CRUD
- [ ] Matching engine (10 sek!)
- [ ] Shortlist management
- [ ] Konverter til Assignment

### Assignments
- [ ] Assignment-liste
- [ ] Release checklist
- [ ] Status-endringer

---

## DAG 4: KONTRAKTER, TIMER & INBOX

### Kontrakter
- [ ] Lag ny kontrakt
- [ ] Legg til parter
- [ ] Send til signering (mock)
- [ ] Status-tracking

### Timesheets
- [ ] Lag timesheet
- [ ] Registrer timer
- [ ] Send til godkjenning
- [ ] Godkjenn/avvis

### Portal Inbox
- [ ] Jobbsøknader vises
- [ ] Interest leads vises
- [ ] Staffing needs vises
- [ ] Kontaktskjema vises
- [ ] Konverter søknad → kandidat
- [ ] Konverter lead → kandidat/org
- [ ] Konverter behov → request

---

## DAG 5: FINPUSS & DEPLOY

### UI/UX
- [ ] Keyboard shortcuts fungerer (Cmd+K, etc.)
- [ ] Command palette fungerer
- [ ] Dark mode fungerer
- [ ] Responsive på mobil

### Performance
- [ ] Sider laster < 1 sek
- [ ] Søk < 1 sek
- [ ] Matching < 10 sek

### Deploy
- [ ] Vercel preview deploy
- [ ] Test på admincrew.no
- [ ] DNS/domene
- [ ] Environment variables
- [ ] Supabase connection

---

## KJENTE ISSUES (MÅ FIKSES)

1. **Migrering fra bluecrew.no** - Kandidatene er allerede i DB (331 stk), men sync må settes opp
2. **Inbox → Pool** - Må legge til "Legg til pool" knapp i Inbox
3. **Multi-pool select** - Trenger bulk-actions i kandidat-liste

---

## NICE-TO-HAVE (KAN VENTE)

- [ ] E-post varsler
- [ ] Tripletex integrasjon
- [ ] SMS notifikasjoner
- [ ] Avansert rapportering
- [ ] Employee Portal

---

## KONTAKTINFO

- **Supabase Dashboard**: https://supabase.com/dashboard/project/zhqocakrwcqwxubbondi
- **Vercel**: TBD
- **Domain**: admincrew.no (må settes opp)
