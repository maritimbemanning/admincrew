-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00001_enums.sql
-- Opprett alle enum-typer for AdminCrew
-- ══════════════════════════════════════════════════════════════════════════════════════

-- Brukerroller
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'admin',
  'recruiter',
  'coordinator',
  'employee'
);

-- Tilgjengelighet
CREATE TYPE availability_status AS ENUM (
  'available',
  'available_soon',
  'on_assignment',
  'unavailable',
  'inactive'
);

-- Compliance
CREATE TYPE compliance_status AS ENUM (
  'not_started',
  'documents_pending',
  'review_pending',
  'approved',
  'expired',
  'rejected'
);

-- Sertifikat-kategorier
CREATE TYPE certification_category AS ENUM (
  'competency',
  'safety',
  'medical',
  'endorsement',
  'special',
  'other'
);

-- Dokument-typer
CREATE TYPE document_type AS ENUM (
  'cv',
  'passport',
  'seabook',
  'certificate',
  'diploma',
  'reference',
  'contract',
  'other'
);

-- Request status
CREATE TYPE request_status AS ENUM (
  'draft',
  'pending_approval',
  'approved',
  'matching',
  'shortlisted',
  'offer_sent',
  'offer_accepted',
  'offer_rejected',
  'converted',
  'on_hold',
  'cancelled',
  'expired'
);

-- Assignment status
CREATE TYPE assignment_status AS ENUM (
  'draft',
  'pending_compliance',
  'compliance_ok',
  'contract_drafting',
  'contract_sent',
  'contract_signed',
  'ready_for_start',
  'active',
  'completed',
  'invoiced',
  'paid',
  'cancelled'
);

-- Pipeline stages (CRM)
CREATE TYPE pipeline_stage AS ENUM (
  'lead',
  'contacted',
  'meeting_scheduled',
  'proposal_sent',
  'negotiation',
  'won',
  'lost',
  'churned'
);

-- Deal stages
CREATE TYPE deal_stage AS ENUM (
  'qualification',
  'needs_analysis',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost'
);

-- Activity types
CREATE TYPE activity_type AS ENUM (
  'call',
  'email',
  'meeting',
  'note',
  'task',
  'deal_created',
  'deal_won',
  'deal_lost',
  'request_created',
  'assignment_started',
  'contract_signed',
  'invoice_sent',
  'invoice_paid'
);

-- Priority
CREATE TYPE priority_level AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- Contract status
CREATE TYPE contract_status AS ENUM (
  'draft',
  'pending_review',
  'ready_for_signature',
  'sent',
  'partially_signed',
  'signed',
  'cancelled',
  'expired'
);

-- Contract type
CREATE TYPE contract_type AS ENUM (
  'employment_temporary',
  'employment_permanent',
  'contractor',
  'framework_agreement',
  'service_agreement'
);

-- Timesheet status
CREATE TYPE timesheet_status AS ENUM (
  'draft',
  'submitted',
  'approved',
  'rejected',
  'invoiced'
);

-- QMS Document type
CREATE TYPE qms_document_type AS ENUM (
  'QH',
  'PRO',
  'INS',
  'SKJEMA'
);

-- QMS Document status
CREATE TYPE qms_document_status AS ENUM (
  'draft',
  'pending_approval',
  'approved',
  'obsolete'
);

-- NC Severity
CREATE TYPE nc_severity AS ENUM (
  'observation',
  'minor',
  'major',
  'critical'
);

-- NC Status
CREATE TYPE nc_status AS ENUM (
  'open',
  'analysis',
  'action_planned',
  'action_implemented',
  'verified',
  'closed'
);

-- CAPA Type
CREATE TYPE capa_type AS ENUM (
  'corrective',
  'preventive'
);

-- CAPA Status
CREATE TYPE capa_status AS ENUM (
  'planned',
  'in_progress',
  'completed',
  'verified',
  'closed'
);

-- Risk Category
CREATE TYPE risk_category AS ENUM (
  'operational',
  'financial',
  'compliance',
  'strategic',
  'reputational',
  'safety'
);

-- Risk Status
CREATE TYPE risk_status AS ENUM (
  'identified',
  'assessed',
  'mitigated',
  'accepted',
  'closed'
);
