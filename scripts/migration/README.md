# MIGRERINGSGUIDE - STEG FOR STEG

## 🎯 MÅL
Migrer alle kandidater fra `bluecrew.no` til `admincrew.no` uten tap av data.

---

## ⚠️ VIKTIGE REGLER

1. ✅ **bluecrew.no = READ ONLY** - Vi endrer INGENTING der
2. ✅ **Test først** - Alltid test med 10 kandidater før full migration
3. ✅ **Batch prosessering** - 100 kandidater om gangen med pause
4. ✅ **Logging** - Alt logges så vi kan se hva som gikk galt
5. ✅ **Rollback plan** - Kan angre hvis noe går galt

---

## 📋 STEG 1: FORBEREDELSE

### 1.1 Sjekk at .env.local er korrekt

```bash
# Sjekk at disse er satt:
NEXT_PUBLIC_SUPABASE_URL=https://zhqocakrwcqwxubbondi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<din-service-role-key>
SOURCE_SUPABASE_URL=https://uqwfesvsfiqjcpzwetkz.supabase.co
SOURCE_SUPABASE_KEY=<bluecrew-service-role-key>
```

### 1.2 Logg inn i Supabase (admincrew)

1. Gå til https://supabase.com/dashboard
2. Velg prosjekt: `zhqocakrwcqwxubbondi`
3. Verifiser at projektet er tomt (ingen data enda)

### 1.3 Kjør migrations

```bash
# Fra Supabase dashboard → SQL Editor
# Kjør hver migration i rekkefølge (00001 til 00021)
```

**ELLER bruk Supabase CLI:**

```bash
# Installer Supabase CLI
npm install -g supabase

# Link til prosjekt
supabase link --project-ref zhqocakrwcqwxubbondi

# Kjør migrations
supabase db push
```

### 1.4 Verifiser migrations

```sql
-- Kjør i Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Skal se:
-- candidates
-- candidate_certifications
-- candidate_documents
-- candidate_pools
-- ... osv
```

---

## 📋 STEG 2: TEST MIGRATION (10 kandidater)

### 2.1 Kjør test-scriptet

```bash
cd c:\Users\isakd\code\admincrew

# Installer tsx for TypeScript kjøring
npm install -D tsx

# Kjør test migration
npx tsx scripts/migration/test-migration.ts
```

### 2.2 Forventet output

```
🧪 TEST MIGRATION - 10 kandidater
=====================================

📥 Henter 10 kandidater fra bluecrew.no...
✅ Hentet 10 kandidater

🔍 Analyserer data...
  - Ola Nordmann
    Email: ola@example.com
    Rolle: kaptein
    ID: abc123

🔄 Mapper og inserter kandidater...

  ✅ Ola Nordmann opprettet
  ✅ Kari Hansen opprettet
  ...

=====================================
📊 RESULTAT:
  Prosessert: 10
  Opprettet: 10
  Feil: 0

✅ TEST VELLYKKET!
Du kan nå fortsette med full migrasjon.
```

### 2.3 Verifiser i Supabase

```sql
-- Sjekk at kandidatene er opprettet
SELECT 
  first_name, 
  last_name, 
  email, 
  bluecrew_id,
  sync_status
FROM candidates
ORDER BY created_at DESC
LIMIT 10;

-- Skal se 10 kandidater med bluecrew_id
```

---

## 📋 STEG 3: FULL MIGRATION

### ⚠️ SER DU FEIL I TEST? 
→ **STOPP HER!** Fiks feilene først før du fortsetter.

### 3.1 Kjør full migration

```bash
# Dette tar tid! (avhengig av antall kandidater)
# 1000 kandidater = ca. 5-10 minutter
npx tsx scripts/migration/batch-migration.ts
```

### 3.2 Forventet output

```
🚀 FULL MIGRATION STARTER
=====================================

📊 Totalt 847 kandidater
📦 9 batches (100 per batch)

⚠️  VIKTIG: Dette vil migrere ALLE kandidater!
⚠️  Trykk Ctrl+C for å avbryte nå...

📦 BATCH 1/9 (offset: 0)
─────────────────────────────────────
  ✅ Opprettet: 100
  🔄 Oppdatert: 0
  ⏭️  Hoppet over: 0
  ❌ Feil: 0
  ⏸️  Venter 2000ms...

📦 BATCH 2/9 (offset: 100)
...
```

### 3.3 Logger

Alle batches logges til:
```
scripts/migration/logs/
  ├── batch_0001.json
  ├── batch_0002.json
  └── full_migration_report.json
```

---

## 📋 STEG 4: VERIFISERING

### 4.1 Sjekk antall

```sql
-- Hvor mange kandidater er migrert?
SELECT COUNT(*) FROM candidates;

-- Sammenlign med bluecrew (skal være likt)
```

### 4.2 Sjekk for feil

```sql
-- Kandidater uten bluecrew_id (skal være 0)
SELECT COUNT(*) 
FROM candidates 
WHERE bluecrew_id IS NULL;

-- Duplikater (skal være 0)
SELECT bluecrew_id, COUNT(*) 
FROM candidates 
GROUP BY bluecrew_id 
HAVING COUNT(*) > 1;
```

### 4.3 Sjekk data quality

```sql
-- Kandidater uten email (problematisk)
SELECT COUNT(*) 
FROM candidates 
WHERE email IS NULL OR email = '';

-- Compliance status fordeling
SELECT compliance_status, COUNT(*) 
FROM candidates 
GROUP BY compliance_status;
```

---

## 📋 STEG 5: ROLLBACK (hvis nødvendig)

### ⚠️ Hvis noe gikk galt:

```sql
-- Slett alle migrerte kandidater
DELETE FROM candidates WHERE bluecrew_id IS NOT NULL;

-- Verifiser
SELECT COUNT(*) FROM candidates; -- Skal være 0

-- Prøv igjen fra STEG 2
```

---

## 📋 STEG 6: KONTINUERLIG SYNC

### 6.1 Deploy Edge Function

```bash
# Deploy bridge-sync til Supabase
supabase functions deploy bridge-sync
```

### 6.2 Test Edge Function

```bash
curl -X POST https://zhqocakrwcqwxubbondi.supabase.co/functions/v1/bridge-sync \
  -H "Authorization: Bearer <din-anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"mode": "incremental", "limit": 10}'
```

### 6.3 Sett opp Cron Job

I Supabase Dashboard → Database → Cron Jobs:

```sql
-- Kjør sync hver 15. minutt
SELECT cron.schedule(
  'bluecrew-sync',
  '*/15 * * * *', -- Hver 15. minutt
  $$
  SELECT net.http_post(
    url := 'https://zhqocakrwcqwxubbondi.supabase.co/functions/v1/bridge-sync',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.anon_key') || '"}'::jsonb,
    body := '{"mode": "incremental", "limit": 100}'::jsonb
  );
  $$
);
```

---

## 📋 STEG 7: DEPLOY TIL PROD

Nå som data er migrert:

```bash
# 1. Commit alt
git add .
git commit -m "feat: Migration complete"
git push

# 2. Deploy til Vercel
vercel deploy --prod
```

---

## 🚨 TROUBLESHOOTING

### Problem: "Fetch error: 403 Forbidden"
**Løsning:** Sjekk at `SOURCE_SUPABASE_KEY` har service_role tilgang

### Problem: "Insert failed: column xyz doesn't exist"
**Løsning:** Migrations er ikke kjørt riktig. Kjør dem på nytt.

### Problem: "Mange kandidater mangler email"
**Løsning:** Dette er OK - de hoppes over. De kan legges til manuelt senere.

### Problem: "Rolle mappes ikke korrekt"
**Løsning:** Legg til mapping i `mapRole()` funksjonen.

---

## 📊 ESTIMERT TIDSBRUK

| Antall kandidater | Estimert tid |
|-------------------|--------------|
| 100 | 1 minutt |
| 500 | 5 minutter |
| 1000 | 10 minutter |
| 5000 | 50 minutter |

---

## ✅ SUKSESS KRITERIER

- [ ] Alle kandidater migrert (antall matcher bluecrew)
- [ ] Ingen duplikater
- [ ] Alle har bluecrew_id
- [ ] Data er korrekt mapped
- [ ] Sync fungerer
- [ ] UI viser kandidatene

---

## 📞 NESTE STEG

Når migreringen er vellykket:

1. ✅ Deploy til Vercel
2. ✅ Koble domene (admincrew.no)
3. ✅ Test alle moduler med ekte data
4. ✅ GO LIVE! 🚀
