# AdminCrew System Status
> Sist oppdatert: 22. desember 2025

## 🟢 Fungerer

### Kandidater
- ✅ Liste over kandidater med paginering
- ✅ Søk på navn, email, rolle
- ✅ Pools i sidebar (18 rolle-pools + system pools)
- ✅ Legge til kandidat i pool
- ✅ Arkivere/slette kandidater
- ✅ Se kandidatdetaljer

### Innboks (bluecrew.no)
- ✅ Viser jobbsøknader (8 stk)
- ✅ Viser interesseskjemaer (37 stk)
- ✅ Konvertere til kandidat

### Database
- ✅ candidates (329 kandidater)
- ✅ candidate_pools (24 pools)
- ✅ candidate_pool_memberships
- ✅ job_applications (8 søknader)
- ✅ interest_leads (37 leads)

---

## 🟡 Delvis fungerer

### Kandidat-redigering
- ⚠️ Noen felt-mappinger kan være feil
- ⚠️ Sertifikater lagres i cv_summary, ikke egen tabell

### Filtrering
- ⚠️ Rolle-filter trenger testing
- ⚠️ Compliance-filter trenger testing

---

## 🔴 Mangler / Ødelagt

### CRM
- ❌ Pipeline bruker delvis mock-data
- ❌ Organisasjoner ikke fullstendig
- ❌ Kontakter trenger testing

### CV-håndtering
- ❌ CV-viewer ikke implementert
- ❌ Storage buckets ikke satt opp
- ❌ Fil-nedlasting fungerer ikke

### Operations
- ❌ Requests - ukjent status
- ❌ Assignments - ukjent status

---

## 📋 Database-kolonner som brukes

### candidates tabell
```
id, first_name, last_name, email, phone, phone_secondary,
primary_role, secondary_roles, experience_years,
availability_status, availability_date,
compliance_status, internal_rating, tags,
fylke, kommune, sectors, internal_notes, cv_summary,
created_at, updated_at, archived_at
```

### job_applications tabell
```
id, job_posting_id, name, email, phone, cover_letter,
cv_key, certificates_key, status (pending/new/reviewed/etc),
candidate_id, created_at
```

### interest_leads tabell
```
id, navn, epost, telefon, type (sjomann/sjofolk/rederi),
melding, status (new/converted), created_at
```

---

## 🎯 Prioritert TODO

1. [ ] Verifisere at kandidat-søk fungerer
2. [ ] Verifisere at innboks viser riktig data
3. [ ] Teste kandidat-redigering
4. [ ] Rydde opp i CRM-modulen
5. [ ] Dokumentere API-er

---

## 📁 Viktige filer

- `hooks/use-candidates.ts` - Kandidat-hooks
- `hooks/use-inbox.ts` - Innboks-hooks  
- `hooks/use-pools.ts` - Pool-hooks
- `app/(dashboard)/candidates/page.tsx` - Kandidat-side
- `app/(dashboard)/inbox/page.tsx` - Innboks-side

