// ============================================================================
// CONTRACTS & TIMESHEETS MODULE - TypeScript Interfaces
// ============================================================================

// Contract status enum
export type ContractStatus =
  | 'draft'
  | 'pending_review'
  | 'ready_for_signature'
  | 'sent'
  | 'partially_signed'
  | 'signed'
  | 'cancelled'
  | 'expired'

// Contract type enum
export type ContractType =
  | 'employment_temporary'
  | 'employment_permanent'
  | 'contractor'
  | 'service_agreement'
  | 'nda'
  | 'other'

// E-sign status
export type EsignStatus =
  | 'not_started'
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'expired'
  | 'cancelled'

// Party type
export type PartyType = 'employee' | 'employer' | 'customer' | 'witness'

// Signature method
export type SignatureMethod = 'bankid' | 'bankid_mobile' | 'manual' | 'electronic'

// Party status
export type PartyStatus = 'pending' | 'notified' | 'viewed' | 'signed' | 'rejected'

// ============================================================================
// Contract Template
// ============================================================================

export interface ContractTemplate {
  id: string
  name: string
  slug: string
  description: string | null
  type: ContractType
  content_html: string
  content_json: Record<string, unknown> | null
  variables: ContractVariable[]
  version: number
  is_active: boolean
  is_default: boolean
  created_at: string
  created_by: string | null
  updated_at: string
}

export interface ContractVariable {
  key: string
  label: string
  type: 'text' | 'date' | 'number' | 'currency' | 'select' | 'boolean'
  required: boolean
  default_value?: string | number | boolean
  options?: { value: string; label: string }[]
  description?: string
}

// ============================================================================
// Contract
// ============================================================================

export interface Contract {
  id: string
  contract_number: string
  assignment_id: string | null
  organization_id: string | null
  candidate_id: string | null
  template_id: string | null
  type: ContractType
  title: string
  description: string | null
  content_html: string | null
  variables: Record<string, unknown>
  effective_date: string | null
  expiry_date: string | null
  draft_pdf_path: string | null
  signed_pdf_path: string | null
  esign_provider: string | null
  esign_request_id: string | null
  esign_status: EsignStatus
  status: ContractStatus
  sent_at: string | null
  signed_at: string | null
  cancelled_at: string | null
  cancelled_reason: string | null
  created_at: string
  created_by: string | null
  updated_at: string

  // Relations (populated)
  parties?: ContractParty[]
  assignment?: {
    id: string
    assignment_number: string
    title: string
    role: string
  } | null
  organization?: {
    id: string
    name: string
  } | null
  candidate?: {
    id: string
    first_name: string
    last_name: string
    email: string
  } | null
}

// ============================================================================
// Contract Party
// ============================================================================

export interface ContractParty {
  id: string
  contract_id: string
  party_type: PartyType
  name: string
  email: string
  phone: string | null
  national_id: string | null
  organization_name: string | null
  organization_number: string | null
  signing_order: number
  status: PartyStatus
  esign_recipient_id: string | null
  signed_at: string | null
  signature_method: SignatureMethod | null
  signature_ip: string | null
  notified_at: string | null
  viewed_at: string | null
  rejected_at: string | null
  rejected_reason: string | null
  created_at: string
  updated_at: string
}

// ============================================================================
// Input Types
// ============================================================================

export interface CreateContractInput {
  assignment_id?: string
  organization_id?: string
  candidate_id?: string
  template_id?: string
  type: ContractType
  title: string
  description?: string
  content_html?: string
  variables?: Record<string, unknown>
  effective_date?: string
  expiry_date?: string
}

export interface UpdateContractInput {
  title?: string
  description?: string
  content_html?: string
  variables?: Record<string, unknown>
  effective_date?: string
  expiry_date?: string
}

export interface AddPartyInput {
  contract_id: string
  party_type: PartyType
  name: string
  email: string
  phone?: string
  national_id?: string
  organization_name?: string
  organization_number?: string
  signing_order?: number
}

// ============================================================================
// Filter Types
// ============================================================================

export interface ContractFilters {
  search?: string
  status?: ContractStatus[]
  type?: ContractType[]
  organization_id?: string
  candidate_id?: string
  assignment_id?: string
  esign_status?: EsignStatus[]
  date_from?: string
  date_to?: string
}

// ============================================================================
// Status Labels & Colors
// ============================================================================

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: 'Utkast',
  pending_review: 'Venter gjennomgang',
  ready_for_signature: 'Klar for signering',
  sent: 'Sendt',
  partially_signed: 'Delvis signert',
  signed: 'Signert',
  cancelled: 'Kansellert',
  expired: 'Utløpt',
}

export const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 border-gray-200',
  pending_review: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ready_for_signature: 'bg-blue-100 text-blue-800 border-blue-200',
  sent: 'bg-purple-100 text-purple-800 border-purple-200',
  partially_signed: 'bg-orange-100 text-orange-800 border-orange-200',
  signed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  expired: 'bg-gray-100 text-gray-600 border-gray-200',
}

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  employment_temporary: 'Midlertidig ansettelse',
  employment_permanent: 'Fast ansettelse',
  contractor: 'Oppdragskontrakt',
  service_agreement: 'Tjenesteavtale',
  nda: 'Konfidensialitetsavtale',
  other: 'Annet',
}

export const PARTY_TYPE_LABELS: Record<PartyType, string> = {
  employee: 'Ansatt',
  employer: 'Arbeidsgiver',
  customer: 'Kunde',
  witness: 'Vitne',
}

export const PARTY_STATUS_LABELS: Record<PartyStatus, string> = {
  pending: 'Venter',
  notified: 'Varslet',
  viewed: 'Sett',
  signed: 'Signert',
  rejected: 'Avvist',
}

export const ESIGN_STATUS_LABELS: Record<EsignStatus, string> = {
  not_started: 'Ikke startet',
  pending: 'Venter',
  in_progress: 'Pågår',
  completed: 'Fullført',
  rejected: 'Avvist',
  expired: 'Utløpt',
  cancelled: 'Kansellert',
}

// ============================================================================
// TIMESHEET TYPES
// ============================================================================

export type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'invoiced'

export type TimesheetEntryType = 'regular' | 'overtime' | 'holiday' | 'sick' | 'travel'

export interface TimesheetEntry {
  date: string
  hours: number
  type: TimesheetEntryType
  description?: string
}

export interface Timesheet {
  id: string
  assignment_id: string
  period_start: string
  period_end: string
  entries: TimesheetEntry[]
  total_hours: number
  total_days: number
  calculated_cost_nok: number | null
  calculated_billing_nok: number | null
  status: TimesheetStatus
  submitted_at: string | null
  submitted_by: string | null
  approved_at: string | null
  approved_by: string | null
  rejected_at: string | null
  rejected_by: string | null
  rejection_reason: string | null
  invoice_id: string | null
  created_at: string
  updated_at: string

  // Relations
  assignment?: {
    id: string
    assignment_number: string
    title: string
    role: string
    employee_rate_amount_nok: number | null
    billing_rate_amount_nok: number | null
    candidate: {
      id: string
      first_name: string
      last_name: string
    } | null
    organization: {
      id: string
      name: string
    } | null
  } | null
}

export interface CreateTimesheetInput {
  assignment_id: string
  period_start: string
  period_end: string
  entries?: TimesheetEntry[]
}

export interface UpdateTimesheetInput {
  entries?: TimesheetEntry[]
}

export interface TimesheetFilters {
  assignment_id?: string
  candidate_id?: string
  organization_id?: string
  status?: TimesheetStatus[]
  period_from?: string
  period_to?: string
}

export const TIMESHEET_STATUS_LABELS: Record<TimesheetStatus, string> = {
  draft: 'Utkast',
  submitted: 'Innsendt',
  approved: 'Godkjent',
  rejected: 'Avvist',
  invoiced: 'Fakturert',
}

export const TIMESHEET_STATUS_COLORS: Record<TimesheetStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 border-gray-200',
  submitted: 'bg-blue-100 text-blue-800 border-blue-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  invoiced: 'bg-purple-100 text-purple-800 border-purple-200',
}

export const TIMESHEET_ENTRY_TYPE_LABELS: Record<TimesheetEntryType, string> = {
  regular: 'Ordinær',
  overtime: 'Overtid',
  holiday: 'Helligdag',
  sick: 'Syk',
  travel: 'Reise',
}
