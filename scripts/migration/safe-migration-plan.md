# SIKKER MIGRASJONSPLAN - BLUECREW.NO → ADMINCREW.NO

## ⚠️ KRITISK: DETTE MÅ GJØRES RIKTIG

## FASE 1: FORBEREDELSE (2 timer)

### 1.1 Verifiser Source Database (bluecrew.no)
```bash
# Logg inn i bluecrew Supabase og kjør:
SELECT COUNT(*) FROM candidates;
SELECT COUNT(*) FROM certifications;
SELECT COUNT(*) FROM documents;

# Eksporter schema for sammenligning
```

**Sjekkliste:**
- [ ] Få antall kandidater fra bluecrew
- [ ] Få antall sertifikater
- [ ] Få antall dokumenter
- [ ] Ta FULL BACKUP av bluecrew (for sikkerhet)

### 1.2 Sett opp Target Database (admincrew.no)
```bash
# 1. Sjekk at migrations IKKE er kjørt enda
# 2. Kjør alle migrations i riktig rekkefølge
# 3. Verifiser at alle tabeller er opprettet
```

**Sjekkliste:**
- [ ] Kjør migrations 00001-00021
- [ ] Verifiser RLS policies er aktive
- [ ] Test at enums er opprettet
- [ ] Test at triggers fungerer

---

## FASE 2: TESTMIGRASJON (3 timer)

### 2.1 Lag Test Script
```typescript
// scripts/migration/test-migration.ts
// Migrer KUN 10 kandidater først
```

**Sjekkliste:**
- [ ] Script som henter 10 kandidater fra bluecrew
- [ ] Mapper felter korrekt
- [ ] Verifiserer data etter insert
- [ ] Logger eventuelle feil

### 2.2 Verifiser Data Mapping
```typescript
// Sjekk at disse feltene mappes korrekt:
// bluecrew.fornavn    → admincrew.first_name
// bluecrew.etternavn  → admincrew.last_name
// bluecrew.telefon    → admincrew.phone
// bluecrew.fodselsdato → admincrew.date_of_birth
```

**Sjekkliste:**
- [ ] Navn-felt mapper riktig
- [ ] Norske tegn (æøå) håndteres
- [ ] Datoer konverteres riktig (timezone)
- [ ] Roller mappes til enum-verdier
- [ ] Tilgjengelighet mappes til enum

### 2.3 Kjør Test
```bash
deno run --allow-net --allow-env scripts/migration/test-migration.ts
```

**Verifiser:**
- [ ] 10 kandidater opprettet i admincrew
- [ ] Alle felt har korrekte verdier
- [ ] Ingen manglende data
- [ ] bluecrew_id er satt (for sync)

---

## FASE 3: DATA ANALYSE (2 timer)

### 3.1 Identifiser Edge Cases
```sql
-- Finn kandidater med spesielle tegn
SELECT * FROM candidates WHERE 
  first_name ~ '[æøåÆØÅ]' 
  OR last_name ~ '[æøåÆØÅ]';

-- Finn kandidater uten email
SELECT * FROM candidates WHERE email IS NULL OR email = '';

-- Finn kandidater med gamle roller som ikke finnes i ny enum
SELECT DISTINCT primary_role FROM candidates;

-- Finn kandidater med rare datoer
SELECT * FROM candidates WHERE 
  date_of_birth < '1940-01-01' 
  OR date_of_birth > CURRENT_DATE;
```

**Dokumenter:**
- [ ] Antall kandidater uten email
- [ ] Roller som må mappes manuelt
- [ ] Ugyldig data som må renses

---

## FASE 4: BATCH MIGRATION (8 timer)

### 4.1 Lag Batch Script
```typescript
// scripts/migration/batch-migration.ts
// Migrer 100 kandidater om gangen med pause mellom hver batch

const BATCH_SIZE = 100;
const PAUSE_MS = 2000; // 2 sekunder pause mellom hver batch

async function migrateBatch(offset: number) {
  // 1. Hent 100 kandidater
  // 2. Mapper felter
  // 3. Insert i admincrew
  // 4. Logg resultat
  // 5. Vent 2 sekunder
}
```

**Sikkerhet:**
- [ ] Batch size på 100 (ikke for mye)
- [ ] Pause mellom hver batch (ikke overload)
- [ ] Logging av hver batch
- [ ] Feil stopper IKKE hele migreringen

### 4.2 Migreringslogg
```typescript
interface MigrationLog {
  batch_number: number
  total_processed: number
  successful: number
  failed: number
  errors: string[]
  timestamp: string
}
```

**Sjekkliste:**
- [ ] Logger hver batch
- [ ] Lagrer feil separat
- [ ] Kan fortsette fra siste batch ved feil

---

## FASE 5: VERIFISERING (4 timer)

### 5.1 Data Integrity Check
```sql
-- 1. Sjekk antall
SELECT COUNT(*) FROM candidates; -- Skal matche bluecrew

-- 2. Sjekk at alle har bluecrew_id
SELECT COUNT(*) FROM candidates WHERE bluecrew_id IS NULL;

-- 3. Sjekk for duplikater
SELECT bluecrew_id, COUNT(*) 
FROM candidates 
GROUP BY bluecrew_id 
HAVING COUNT(*) > 1;

-- 4. Sjekk compliance status
SELECT compliance_status, COUNT(*) 
FROM candidates 
GROUP BY compliance_status;
```

**Verifiser:**
- [ ] Antall kandidater matcher
- [ ] Ingen duplikater
- [ ] Alle har bluecrew_id
- [ ] Compliance status er satt

### 5.2 Relasjonell Data
```sql
-- Migrer sertifikater
-- Migrer dokumenter
-- Migrer pool memberships (hvis eksisterer)
```

---

## FASE 6: KONTINUERLIG SYNC (2 timer)

### 6.1 Sett opp Webhook fra Bluecrew
```typescript
// app/api/webhooks/bluecrew/route.ts
// Når kandidat oppdateres i bluecrew → trigger sync i admincrew
```

**Eller:**

### 6.2 Scheduled Sync (enklere)
```typescript
// Supabase Cron Job
// Hver 15. minutt: Kjør incremental sync
```

**Sjekkliste:**
- [ ] Edge function er deployet
- [ ] Cron job er satt opp
- [ ] Test at sync fungerer
- [ ] Monitor sync errors

---

## FASE 7: ROLLBACK PLAN (hvis noe går galt)

### 7.1 Quick Rollback
```sql
-- Slett alle migrerte kandidater
DELETE FROM candidates WHERE bluecrew_id IS NOT NULL;

-- Kjør migrations på nytt
-- Start migrasjon fra scratch
```

### 7.2 Partial Rollback
```sql
-- Slett kun siste batch
DELETE FROM candidates 
WHERE created_at > '2025-12-19 XX:XX:XX';
```

---

## FASE 8: GO LIVE CHECKLIST

- [ ] Alle kandidater migrert
- [ ] Data verifisert
- [ ] Sync fungerer
- [ ] UI fungerer med ekte data
- [ ] Performance test gjennomført
- [ ] Backup tatt
- [ ] Deploy til Vercel
- [ ] Domene koblet
- [ ] SSL aktivert
- [ ] Monitoring aktivert

---

## ESTIMERT TIDSBRUK

| Fase | Beskrivelse | Timer |
|------|-------------|-------|
| 1 | Forberedelse | 2 |
| 2 | Test (10 kandidater) | 3 |
| 3 | Analyse | 2 |
| 4 | Batch migration | 8 |
| 5 | Verifisering | 4 |
| 6 | Sync setup | 2 |
| 7 | Testing & fixes | 3 |
| **Total** | | **24 timer** |

---

## VIKTIGE REGLER

1. **ALDRI endre data i bluecrew.no** - Kun READ
2. **ALLTID batch prosessering** - Ikke alt på en gang
3. **ALLTID log resultat** - Må kunne se hva som gikk galt
4. **ALLTID ha rollback plan** - Må kunne angre
5. **TEST med 10 kandidater først** - Ikke begynn med alle

---

## NESTE STEG

1. Kjør `SELECT COUNT(*) FROM candidates` i bluecrew.no
2. Gi meg antallet så lager jeg exact batch plan
3. Kjør migrations i admincrew.no
4. Start test med 10 kandidater
