-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00021_storage.sql
-- Storage buckets for filer
-- ══════════════════════════════════════════════════════════════════════════════════════

-- Opprett buckets (må kjøres manuelt i Supabase Dashboard eller via API)
-- Denne filen dokumenterer bucket-strukturen

/*
BUCKETS TIL OPPRETTELSE:

1. candidate-avatars
   - Public: true
   - Allowed MIME types: image/jpeg, image/png, image/webp
   - Max file size: 2MB

2. candidate-documents
   - Public: false
   - Allowed MIME types: application/pdf, image/jpeg, image/png
   - Max file size: 10MB

3. contract-pdfs
   - Public: false
   - Allowed MIME types: application/pdf
   - Max file size: 20MB

4. organization-logos
   - Public: true
   - Allowed MIME types: image/jpeg, image/png, image/svg+xml, image/webp
   - Max file size: 2MB

5. qms-documents
   - Public: false
   - Allowed MIME types: application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document
   - Max file size: 50MB

*/

-- Storage policies (RLS)
-- Disse må settes opp i Supabase Dashboard under Storage > Policies

-- Candidate avatars - public read, authenticated write
-- INSERT: auth.role() = 'authenticated'
-- SELECT: true
-- UPDATE: auth.uid() = owner OR auth.is_staff()
-- DELETE: auth.uid() = owner OR auth.is_staff()

-- Candidate documents - staff only
-- INSERT: auth.is_staff()
-- SELECT: auth.is_staff() OR (auth.uid() = candidate.user_id)
-- UPDATE: auth.is_staff()
-- DELETE: auth.is_staff()

-- Contract PDFs - staff and related candidate
-- INSERT: auth.is_staff()
-- SELECT: auth.is_staff() OR (auth.uid() = candidate.user_id)
-- UPDATE: auth.is_staff()
-- DELETE: auth.is_staff()

-- Organization logos - public read, staff write
-- INSERT: auth.is_staff()
-- SELECT: true
-- UPDATE: auth.is_staff()
-- DELETE: auth.is_staff()

-- QMS documents - staff only
-- INSERT: auth.is_staff()
-- SELECT: auth.is_staff()
-- UPDATE: auth.is_staff()
-- DELETE: auth.is_staff()
