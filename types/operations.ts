// Operations Types - Requests, Assignments, Shortlists, Matching

// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST STATUS (Pipeline stages)
// ═══════════════════════════════════════════════════════════════════════════════

export const REQUEST_STATUSES = [
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
  'expired',
] as const

export type RequestStatus = (typeof REQUEST_STATUSES)[number]

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  draft: 'Utkast',
  pending_approval: 'Venter godkjenning',
  approved: 'Godkjent',
  matching: 'Matcher',
  shortlisted: 'Shortlistet',
  offer_sent: 'Tilbud sendt',
  offer_accepted: 'Tilbud akseptert',
  offer_rejected: 'Tilbud avslått',
  converted: 'Konvertert',
  on_hold: 'På vent',
  cancelled: 'Kansellert',
  expired: 'Utløpt',
}

export const REQUEST_STATUS_COLORS: Record<RequestStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  matching: 'bg-purple-100 text-purple-800',
  shortlisted: 'bg-indigo-100 text-indigo-800',
  offer_sent: 'bg-orange-100 text-orange-800',
  offer_accepted: 'bg-green-100 text-green-800',
  offer_rejected: 'bg-red-100 text-red-800',
  converted: 'bg-emerald-100 text-emerald-800',
  on_hold: 'bg-slate-100 text-slate-800',
  cancelled: 'bg-gray-100 text-gray-500',
  expired: 'bg-gray-100 text-gray-500',
}

// ═══════════════════════════════════════════════════════════════════════════════
// ASSIGNMENT STATUS
// ═══════════════════════════════════════════════════════════════════════════════

export const ASSIGNMENT_STATUSES = [
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
  'cancelled',
] as const

export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number]

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  draft: 'Utkast',
  pending_compliance: 'Venter compliance',
  compliance_ok: 'Compliance OK',
  contract_drafting: 'Kontrakt lages',
  contract_sent: 'Kontrakt sendt',
  contract_signed: 'Kontrakt signert',
  ready_for_start: 'Klar for start',
  active: 'Aktiv',
  completed: 'Fullført',
  invoiced: 'Fakturert',
  paid: 'Betalt',
  cancelled: 'Kansellert',
}

export const ASSIGNMENT_STATUS_COLORS: Record<AssignmentStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending_compliance: 'bg-yellow-100 text-yellow-800',
  compliance_ok: 'bg-blue-100 text-blue-800',
  contract_drafting: 'bg-purple-100 text-purple-800',
  contract_sent: 'bg-orange-100 text-orange-800',
  contract_signed: 'bg-green-100 text-green-800',
  ready_for_start: 'bg-teal-100 text-teal-800',
  active: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-slate-100 text-slate-800',
  invoiced: 'bg-indigo-100 text-indigo-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-500',
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRIORITY LEVELS
// ═══════════════════════════════════════════════════════════════════════════════

export const PRIORITY_LEVELS = ['low', 'medium', 'high', 'urgent'] as const
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number]

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  low: 'Lav',
  medium: 'Normal',
  high: 'Høy',
  urgent: 'Haster',
}

export const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHORTLIST STATUS
// ═══════════════════════════════════════════════════════════════════════════════

export const SHORTLIST_STATUSES = [
  'proposed',
  'customer_reviewing',
  'customer_approved',
  'customer_rejected',
  'offer_sent',
  'offer_accepted',
  'offer_declined',
  'converted',
  'withdrawn',
] as const

export type ShortlistStatus = (typeof SHORTLIST_STATUSES)[number]

export const SHORTLIST_STATUS_LABELS: Record<ShortlistStatus, string> = {
  proposed: 'Foreslått',
  customer_reviewing: 'Kunde vurderer',
  customer_approved: 'Kunde godkjent',
  customer_rejected: 'Kunde avslått',
  offer_sent: 'Tilbud sendt',
  offer_accepted: 'Tilbud akseptert',
  offer_declined: 'Tilbud avslått',
  converted: 'Konvertert til oppdrag',
  withdrawn: 'Trukket tilbake',
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface CustomerRequest {
  id: string
  request_number: string
  organization_id: string | null
  contact_id: string | null

  title: string
  description: string | null
  role_needed: string
  quantity: number

  start_date: string
  end_date: string | null
  duration_weeks: number | null
  rotation_pattern: string | null

  // Requirements
  certifications_required: string[]
  certifications_preferred: string[]
  experience_min_years: number | null
  experience_preferred_years: number | null
  languages_required: string[]
  languages_preferred: string[]

  // Budget
  budget_min_daily_nok: number | null
  budget_max_daily_nok: number | null
  estimated_value_nok: number | null

  // Status
  status: RequestStatus
  priority: PriorityLevel

  // Owner
  owner_id: string | null
  owner_name: string | null

  // Timestamps
  created_at: string
  updated_at: string
  approved_at: string | null
  approved_by: string | null
  converted_at: string | null
  expires_at: string | null

  // Relations (optional, when fetched with joins)
  organization?: {
    id: string
    name: string
  }
  contact?: {
    id: string
    name: string
  }
  shortlist_count?: number
}

export interface RequestShortlist {
  id: string
  request_id: string
  candidate_id: string

  match_score: number | null
  match_breakdown: MatchScoreBreakdown | null
  rank_position: number | null

  status: ShortlistStatus
  notes: string | null

  // Offer details
  offer_sent_at: string | null
  offer_daily_rate_nok: number | null
  offer_response: string | null
  offer_response_at: string | null

  // Customer feedback
  customer_feedback: string | null
  customer_rating: number | null

  created_at: string
  created_by: string | null
  updated_at: string

  // Relations
  candidate?: {
    id: string
    first_name: string
    last_name: string
    primary_role: string
    avatar_url: string | null
    availability_status: string
    compliance_status: string
    internal_rating: number | null
  }
}

export interface Assignment {
  id: string
  assignment_number: string
  request_id: string | null
  organization_id: string | null
  candidate_id: string

  title: string
  description: string | null
  role: string

  // Dates
  planned_start_date: string
  planned_end_date: string | null
  actual_start_date: string | null
  actual_end_date: string | null

  // Location
  vessel_name: string | null
  work_location: string | null

  // Rates
  employee_rate_type: 'daily' | 'hourly' | 'monthly'
  employee_rate_amount_nok: number | null
  billing_rate_type: 'daily' | 'hourly' | 'monthly'
  billing_rate_amount_nok: number | null

  // Status
  status: AssignmentStatus

  // Release checklist
  release_checklist: ReleaseChecklist | null
  release_approved_at: string | null
  release_approved_by: string | null

  // Contract
  contract_id: string | null

  // Owner
  owner_id: string | null
  owner_name: string | null

  // Timestamps
  created_at: string
  updated_at: string

  // Relations
  organization?: {
    id: string
    name: string
  }
  candidate?: {
    id: string
    first_name: string
    last_name: string
    primary_role: string
    avatar_url: string | null
    phone: string | null
    email: string
  }
  request?: {
    id: string
    request_number: string
    title: string
  }
}

export interface ReleaseChecklist {
  compliance_verified: boolean
  certifications_valid: boolean
  contract_signed: boolean
  travel_arranged: boolean
  accommodation_arranged: boolean
  ppe_provided: boolean
  customer_notified: boolean
  candidate_briefed: boolean
  notes: string | null
}

// ═══════════════════════════════════════════════════════════════════════════════
// MATCHING TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface MatchingCriteria {
  role: string
  start_date: string

  certifications?: {
    required?: string[]
    preferred?: string[]
  }

  experience?: {
    min_years?: number
    preferred_years?: number
  }

  languages?: {
    required?: string[]
    preferred?: string[]
  }

  availability?: {
    status?: string[]
    available_by?: string
  }

  exclude_candidate_ids?: string[]
  include_pool_ids?: string[]
}

export interface MatchScoreBreakdown {
  certifications: {
    score: number
    matched: string[]
    missing: string[]
    preferred_matched: string[]
  }
  experience: {
    score: number
    years: number
    meets_minimum: boolean
  }
  availability: {
    score: number
    status: string
    available_date: string | null
  }
  rating: {
    score: number
    rating: number | null
  }
  languages: {
    score: number
    matched: string[]
    missing: string[]
  }
}

export interface MatchResult {
  candidate_id: string
  total_score: number
  scores: MatchScoreBreakdown
  is_full_match: boolean
  blockers: MatchBlocker[]
  recommendation: 'strong' | 'good' | 'possible' | 'weak'

  // Candidate data (from search index)
  candidate: {
    id: string
    full_name: string
    email: string
    phone: string | null
    roles: string[]
    active_certifications: string[]
    experience_years: number
    availability_status: string
    availability_date: string | null
    compliance_status: string
    internal_rating: number | null
    tags: string[]
  }
}

export interface MatchBlocker {
  type: 'certification' | 'compliance' | 'availability' | 'experience'
  description: string
  severity: 'warning' | 'blocker'
}

export interface MatchingResult {
  criteria: MatchingCriteria
  results: MatchResult[]
  total_candidates_searched: number
  execution_time_ms: number
  timestamp: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// FILTER TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface RequestFilters {
  search?: string
  status?: RequestStatus[]
  priority?: PriorityLevel[]
  organization_id?: string
  owner_id?: string
  role?: string[]
  date_range?: {
    start?: string
    end?: string
  }
}

export interface AssignmentFilters {
  search?: string
  status?: AssignmentStatus[]
  organization_id?: string
  candidate_id?: string
  owner_id?: string
  date_range?: {
    start?: string
    end?: string
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// KANBAN PIPELINE STAGES
// ═══════════════════════════════════════════════════════════════════════════════

export const REQUEST_PIPELINE_STAGES: RequestStatus[] = [
  'draft',
  'approved',
  'matching',
  'shortlisted',
  'offer_sent',
  'converted',
]

export const ASSIGNMENT_PIPELINE_STAGES: AssignmentStatus[] = [
  'draft',
  'pending_compliance',
  'contract_sent',
  'contract_signed',
  'active',
  'completed',
]
