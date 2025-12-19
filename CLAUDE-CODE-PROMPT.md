# AdminCrew + Bluecrew Migration - Komplett Prompt for Claude Code

## SITUASJON

Jeg har to prosjekter som må fungere sammen:

1. **AdminCrew** (admincrew.vercel.app) - Admin-panel for maritim bemanning
2. **Bluecrew-v3** (bluecrew.no) - Offentlig kandidat-portal med Vipps-login

Begge skal bruke SAMME Supabase database: `zhqocakrwcqwxubbondi`

## PROBLEM 1: Kandidater vises ikke i AdminCrew

På https://admincrew.vercel.app/candidates vises "Ingen kandidater funnet" selv om det er 331 kandidater i databasen.

**Sjekk:**
- Fungerer API-kallet `/api/candidates`?
- Er det RLS-policies som blokkerer?
- Er det felt-mismatch mellom frontend og database?

## PROBLEM 2: Bluecrew-v3 og AdminCrew har ulik database-struktur

**Bluecrew-v3 (gammel struktur) bruker:**
```typescript
{
  name: string,           // Fullt navn
  status: string,         // 'godkjent' | 'pending' | 'avslått'
  email: string,
  phone: string
}
```

**AdminCrew (ny struktur) bruker:**
```typescript
{
  first_name: string,
  last_name: string,
  compliance_status: 'approved' | 'review_pending' | 'rejected' | 'expired' | 'not_started',
  email: string,
  phone: string | null,
  primary_role: string,
  // ... mange flere felter
}
```

## HVA MÅ GJØRES

### 1. Fiks AdminCrew kandidat-visning
- Finn ut hvorfor kandidater ikke vises
- Sjekk `/app/(dashboard)/candidates/page.tsx` og relaterte hooks
- Sjekk `/app/api/candidates/route.ts`
- Sjekk RLS policies i Supabase

### 2. Gjør databasen kompatibel med begge systemer
Legg til `name` og `status` kolonner i candidates-tabellen med trigger som synkroniserer:

```sql
-- Legg til kolonner
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS status text;

-- Populer eksisterende data
UPDATE public.candidates SET
  name = first_name || ' ' || COALESCE(last_name, ''),
  status = CASE compliance_status
    WHEN 'approved' THEN 'godkjent'
    WHEN 'review_pending' THEN 'pending'
    WHEN 'rejected' THEN 'avslått'
    ELSE 'pending'
  END;

-- Lag trigger som synkroniserer begge veier ved INSERT/UPDATE
```

### 3. Bytt bluecrew-v3 til ny Supabase
Etter at databasen er kompatibel, oppdater `.env.local` i bluecrew-v3:

```env
NEXT_PUBLIC_SUPABASE_URL=https://zhqocakrwcqwxubbondi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpocW9jYWtyd2Nxd3h1YmJvbmRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Mzc5MzQsImV4cCI6MjA4MTQxMzkzNH0.l2hyU2rhx4cn6FnKPbPW2oqM7raYWoY0mXYqbkyvrOc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpocW9jYWtyd2Nxd3h1YmJvbmRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTgzNzkzNCwiZXhwIjoyMDgxNDEzOTM0fQ.odvAkxisRmDPqogaXHhCl_W9byg-857X-ruR8GShdt8
```

## SUPABASE DETALJER

**NY Supabase (mål):**
- Project: `zhqocakrwcqwxubbondi`
- URL: https://zhqocakrwcqwxubbondi.supabase.co
- Dashboard: https://supabase.com/dashboard/project/zhqocakrwcqwxubbondi

**Gammel Supabase (kilde):**
- Project: `uqwfesvsfiqjcpzwetkz`
- URL: https://uqwfesvsfiqjcpzwetkz.supabase.co

## FILER Å SJEKKE

### AdminCrew:
- `app/(dashboard)/candidates/page.tsx`
- `app/api/candidates/route.ts`
- `hooks/use-candidates.ts`
- `lib/supabase/` - klient-konfigurasjon
- `types/database.types.ts`

### Bluecrew-v3:
- `src/app/api/vipps/callback/route.ts` - Vipps login, lager nye kandidater
- `src/app/profil/page.tsx` - Viser kandidat-profil
- `src/lib/supabase/admin.ts`

## PRIORITET

1. **FØRST:** Fiks at kandidater vises i AdminCrew
2. **SÅ:** Kjør SQL for å legge til kompatibilitets-kolonner
3. **TIL SLUTT:** Bytt bluecrew-v3 til ny Supabase og test
