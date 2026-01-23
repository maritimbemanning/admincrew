-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00021_qms_documents.sql
-- Kvalitetssystem - Dokumenter og versjonering
-- ══════════════════════════════════════════════════════════════════════════════════════

-- QMS Dokumenter
CREATE TABLE qms_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_number TEXT UNIQUE NOT NULL,  -- 'PRO-001', 'INS-001', 'SKJEMA-001'
  type qms_document_type NOT NULL,

  title TEXT NOT NULL,
  description TEXT,
  current_version INTEGER DEFAULT 1,

  -- Innhold
  content_html TEXT,
  file_path TEXT,

  -- Status
  status qms_document_status DEFAULT 'draft',

  -- Review
  next_review_date DATE,
  last_reviewed_at TIMESTAMPTZ,
  last_reviewed_by UUID REFERENCES user_profiles(id),

  -- Eierskap
  owner_id UUID REFERENCES user_profiles(id),
  approved_by UUID REFERENCES user_profiles(id),
  approved_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

-- Document versions for audit trail
CREATE TABLE qms_document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES qms_documents(id) ON DELETE CASCADE,

  version INTEGER NOT NULL,
  content_html TEXT,
  file_path TEXT,

  change_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),

  UNIQUE(document_id, version)
);

-- Indekser
CREATE INDEX idx_qms_docs_number ON qms_documents(document_number);
CREATE INDEX idx_qms_docs_type ON qms_documents(type);
CREATE INDEX idx_qms_docs_status ON qms_documents(status);
CREATE INDEX idx_qms_docs_review ON qms_documents(next_review_date)
  WHERE status = 'approved' AND archived_at IS NULL;
CREATE INDEX idx_qms_doc_versions_doc ON qms_document_versions(document_id);

-- Trigger
CREATE TRIGGER qms_docs_updated_at
  BEFORE UPDATE ON qms_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to create new document version
CREATE OR REPLACE FUNCTION create_document_version()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.content_html IS DISTINCT FROM NEW.content_html OR OLD.file_path IS DISTINCT FROM NEW.file_path THEN
    INSERT INTO qms_document_versions (document_id, version, content_html, file_path, created_by)
    VALUES (OLD.id, OLD.current_version, OLD.content_html, OLD.file_path, auth.uid());
    
    NEW.current_version := OLD.current_version + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER qms_docs_versioning
  BEFORE UPDATE ON qms_documents
  FOR EACH ROW
  WHEN (OLD.status = 'approved')
  EXECUTE FUNCTION create_document_version();

-- RLS
ALTER TABLE qms_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE qms_document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view qms_documents" ON qms_documents
  FOR SELECT USING (public.is_staff());

CREATE POLICY "Staff can manage qms_documents" ON qms_documents
  FOR ALL USING (public.is_staff());

CREATE POLICY "Staff can view qms_document_versions" ON qms_document_versions
  FOR SELECT USING (public.is_staff());

CREATE POLICY "Staff can manage qms_document_versions" ON qms_document_versions
  FOR ALL USING (public.is_staff());
