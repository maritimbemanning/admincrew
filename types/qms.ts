// ============================================================================
// QMS (Quality Management System) MODULE - TypeScript Interfaces
// ============================================================================

// ============================================================================
// DOCUMENT TYPES
// ============================================================================

export type QmsDocumentType =
  | 'policy'
  | 'procedure'
  | 'work_instruction'
  | 'form'
  | 'checklist'
  | 'manual'
  | 'record'
  | 'external'

export type QmsDocumentStatus = 'draft' | 'pending_approval' | 'approved' | 'obsolete'

export interface QmsDocument {
  id: string
  document_number: string
  type: QmsDocumentType
  title: string
  description: string | null
  category: string | null
  current_version: number
  status: QmsDocumentStatus
  file_path: string | null
  content_html: string | null
  next_review_date: string | null
  owner_id: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
  created_by: string | null
  updated_at: string
  archived_at: string | null

  // Relations
  owner?: {
    id: string
    full_name: string
    email: string
  } | null
  approver?: {
    id: string
    full_name: string
    email: string
  } | null
  versions?: QmsDocumentVersion[]
}

export interface QmsDocumentVersion {
  id: string
  document_id: string
  version_number: number
  file_path: string | null
  content_html: string | null
  change_summary: string | null
  created_at: string
  created_by: string | null
}

// ============================================================================
// NONCONFORMITY (NC) TYPES
// ============================================================================

export type NcSeverity = 'minor' | 'major' | 'critical'

export type NcStatus =
  | 'open'
  | 'analysis'
  | 'action_planned'
  | 'action_implemented'
  | 'verified'
  | 'closed'

export type NcSource =
  | 'internal_audit'
  | 'external_audit'
  | 'customer_complaint'
  | 'supplier_issue'
  | 'incident'
  | 'observation'
  | 'other'

export interface Nonconformity {
  id: string
  nc_number: string
  title: string
  description: string
  source: NcSource
  severity: NcSeverity
  status: NcStatus
  category: string | null
  location: string | null
  due_date: string | null
  root_cause: string | null
  immediate_action: string | null
  responsible_id: string | null
  reported_by: string | null
  detected_at: string | null
  closed_at: string | null
  verified_at: string | null
  verified_by: string | null
  created_at: string
  created_by: string | null
  updated_at: string

  // Relations
  responsible?: {
    id: string
    full_name: string
    email: string
  } | null
  reporter?: {
    id: string
    full_name: string
    email: string
  } | null
  capa_actions?: CapaAction[]
}

// ============================================================================
// CAPA (Corrective and Preventive Action) TYPES
// ============================================================================

export type CapaType = 'corrective' | 'preventive'

export type CapaStatus = 'planned' | 'in_progress' | 'completed' | 'verified' | 'cancelled'

export interface CapaAction {
  id: string
  nonconformity_id: string
  type: CapaType
  description: string
  due_date: string | null
  status: CapaStatus
  completed_at: string | null
  verified_at: string | null
  verified_by: string | null
  effectiveness_note: string | null
  responsible_id: string | null
  created_at: string
  created_by: string | null
  updated_at: string

  // Relations
  responsible?: {
    id: string
    full_name: string
    email: string
  } | null
}

// ============================================================================
// RISK TYPES
// ============================================================================

export type RiskCategory =
  | 'operational'
  | 'financial'
  | 'compliance'
  | 'safety'
  | 'environmental'
  | 'strategic'
  | 'reputational'
  | 'other'

export type RiskStatus = 'identified' | 'assessed' | 'mitigated' | 'accepted' | 'closed'

export interface Risk {
  id: string
  risk_number: string
  title: string
  description: string
  category: RiskCategory
  likelihood: number // 1-5
  impact: number // 1-5
  risk_score: number // likelihood * impact (computed)
  mitigation_strategy: string | null
  residual_likelihood: number | null
  residual_impact: number | null
  residual_score: number | null
  status: RiskStatus
  owner_id: string | null
  next_review_date: string | null
  created_at: string
  created_by: string | null
  updated_at: string
  archived_at: string | null

  // Relations
  owner?: {
    id: string
    full_name: string
    email: string
  } | null
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateQmsDocumentInput {
  type: QmsDocumentType
  title: string
  description?: string
  category?: string
  content_html?: string
  file_path?: string
  next_review_date?: string
  owner_id?: string
}

export interface UpdateQmsDocumentInput {
  title?: string
  description?: string
  category?: string
  content_html?: string
  file_path?: string
  next_review_date?: string
  owner_id?: string
}

export interface CreateNonconformityInput {
  title: string
  description: string
  source: NcSource
  severity: NcSeverity
  category?: string
  location?: string
  due_date?: string
  responsible_id?: string
  detected_at?: string
}

export interface UpdateNonconformityInput {
  title?: string
  description?: string
  severity?: NcSeverity
  status?: NcStatus
  category?: string
  location?: string
  due_date?: string
  root_cause?: string
  immediate_action?: string
  responsible_id?: string
}

export interface CreateCapaInput {
  nonconformity_id: string
  type: CapaType
  description: string
  due_date?: string
  responsible_id?: string
}

export interface UpdateCapaInput {
  description?: string
  due_date?: string
  status?: CapaStatus
  responsible_id?: string
  effectiveness_note?: string
}

export interface CreateRiskInput {
  title: string
  description: string
  category: RiskCategory
  likelihood: number
  impact: number
  mitigation_strategy?: string
  owner_id?: string
  next_review_date?: string
}

export interface UpdateRiskInput {
  title?: string
  description?: string
  category?: RiskCategory
  likelihood?: number
  impact?: number
  mitigation_strategy?: string
  residual_likelihood?: number
  residual_impact?: number
  status?: RiskStatus
  owner_id?: string
  next_review_date?: string
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface QmsDocumentFilters {
  search?: string
  type?: QmsDocumentType[]
  status?: QmsDocumentStatus[]
  category?: string
  owner_id?: string
  review_due?: boolean
}

export interface NcFilters {
  search?: string
  severity?: NcSeverity[]
  status?: NcStatus[]
  source?: NcSource[]
  responsible_id?: string
  overdue?: boolean
}

export interface RiskFilters {
  search?: string
  category?: RiskCategory[]
  status?: RiskStatus[]
  min_score?: number
  owner_id?: string
}

// ============================================================================
// STATUS LABELS & COLORS
// ============================================================================

export const QMS_DOCUMENT_TYPE_LABELS: Record<QmsDocumentType, string> = {
  policy: 'Retningslinje',
  procedure: 'Prosedyre',
  work_instruction: 'Arbeidsinstruks',
  form: 'Skjema',
  checklist: 'Sjekkliste',
  manual: 'Håndbok',
  record: 'Registrering',
  external: 'Eksternt dokument',
}

export const QMS_DOCUMENT_STATUS_LABELS: Record<QmsDocumentStatus, string> = {
  draft: 'Utkast',
  pending_approval: 'Venter godkjenning',
  approved: 'Godkjent',
  obsolete: 'Utgått',
}

export const QMS_DOCUMENT_STATUS_COLORS: Record<QmsDocumentStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 border-gray-200',
  pending_approval: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  obsolete: 'bg-red-100 text-red-800 border-red-200',
}

export const NC_SEVERITY_LABELS: Record<NcSeverity, string> = {
  minor: 'Mindre',
  major: 'Større',
  critical: 'Kritisk',
}

export const NC_SEVERITY_COLORS: Record<NcSeverity, string> = {
  minor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  major: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
}

export const NC_STATUS_LABELS: Record<NcStatus, string> = {
  open: 'Åpen',
  analysis: 'Under analyse',
  action_planned: 'Tiltak planlagt',
  action_implemented: 'Tiltak gjennomført',
  verified: 'Verifisert',
  closed: 'Lukket',
}

export const NC_STATUS_COLORS: Record<NcStatus, string> = {
  open: 'bg-red-100 text-red-800 border-red-200',
  analysis: 'bg-orange-100 text-orange-800 border-orange-200',
  action_planned: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  action_implemented: 'bg-blue-100 text-blue-800 border-blue-200',
  verified: 'bg-purple-100 text-purple-800 border-purple-200',
  closed: 'bg-green-100 text-green-800 border-green-200',
}

export const NC_SOURCE_LABELS: Record<NcSource, string> = {
  internal_audit: 'Intern revisjon',
  external_audit: 'Ekstern revisjon',
  customer_complaint: 'Kundehenvendelse',
  supplier_issue: 'Leverandørproblem',
  incident: 'Hendelse',
  observation: 'Observasjon',
  other: 'Annet',
}

export const CAPA_TYPE_LABELS: Record<CapaType, string> = {
  corrective: 'Korrigerende',
  preventive: 'Forebyggende',
}

export const CAPA_STATUS_LABELS: Record<CapaStatus, string> = {
  planned: 'Planlagt',
  in_progress: 'Pågår',
  completed: 'Fullført',
  verified: 'Verifisert',
  cancelled: 'Kansellert',
}

export const RISK_CATEGORY_LABELS: Record<RiskCategory, string> = {
  operational: 'Operasjonell',
  financial: 'Finansiell',
  compliance: 'Compliance',
  safety: 'Sikkerhet',
  environmental: 'Miljø',
  strategic: 'Strategisk',
  reputational: 'Omdømme',
  other: 'Annet',
}

export const RISK_STATUS_LABELS: Record<RiskStatus, string> = {
  identified: 'Identifisert',
  assessed: 'Vurdert',
  mitigated: 'Mitigert',
  accepted: 'Akseptert',
  closed: 'Lukket',
}

export const RISK_STATUS_COLORS: Record<RiskStatus, string> = {
  identified: 'bg-gray-100 text-gray-800 border-gray-200',
  assessed: 'bg-blue-100 text-blue-800 border-blue-200',
  mitigated: 'bg-green-100 text-green-800 border-green-200',
  accepted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  closed: 'bg-gray-100 text-gray-600 border-gray-200',
}

// ============================================================================
// RISK MATRIX HELPERS
// ============================================================================

export function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score <= 4) return 'low'
  if (score <= 9) return 'medium'
  if (score <= 16) return 'high'
  return 'critical'
}

export const RISK_LEVEL_LABELS: Record<string, string> = {
  low: 'Lav',
  medium: 'Middels',
  high: 'Høy',
  critical: 'Kritisk',
}

export const RISK_LEVEL_COLORS: Record<string, string> = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
}
