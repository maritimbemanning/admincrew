-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00005_candidate_documents.sql
-- Dokumenter for kandidater (CV, pass, sjøfartsbok, diplomer)
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

-- Indekser
CREATE INDEX idx_docs_candidate ON candidate_documents(candidate_id);
CREATE INDEX idx_docs_type ON candidate_documents(type);
CREATE INDEX idx_docs_current ON candidate_documents(candidate_id, type) WHERE is_current = TRUE;
CREATE INDEX idx_docs_expiry ON candidate_documents(expiry_date) WHERE expiry_date IS NOT NULL;

-- RLS
ALTER TABLE candidate_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view all documents" ON candidate_documents
  FOR SELECT USING (public.is_staff());

CREATE POLICY "Staff can manage documents" ON candidate_documents
  FOR ALL USING (public.is_staff());

CREATE POLICY "Candidates can view own documents" ON candidate_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM candidates
      WHERE candidates.id = candidate_documents.candidate_id
      AND candidates.user_id = auth.uid()
    )
  );
