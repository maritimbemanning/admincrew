// ══════════════════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ══════════════════════════════════════════════════════════════════════════════════════

export * from './database.types'

// ═══════════════════════════════════════════════════════
// RAW DATABASE CANDIDATE TYPE (actual schema)
// ═══════════════════════════════════════════════════════

/**
 * This represents the ACTUAL candidates table schema in Supabase
 * Different from the CLAUDE.md spec - this is what's really in the DB
 */
export interface CandidateDbRow {
  id: string
  created_at: string
  updated_at: string | null

  // Name fields - DB has both 'name' and first_name/last_name
  name: string
  first_name: string | null
  last_name: string | null
  navn: string | null  // Legacy Norwegian field

  // Contact
  email: string
  phone: string | null
  mobile: string | null

  // Location
  county: string | null
  municipality: string | null
  fylke: string | null
  kommune: string | null
  city: string | null
  country: string | null
  lokasjon: string | null  // Legacy field

  // Roles - DB uses arrays and multiple fields
  work_main: string[] | null
  primary_rank: string | null
  secondary_ranks: string[] | null
  rolle: string | null  // Legacy field

  // Experience
  years_of_experience: number | null
  erfaring: string | null  // Legacy field

  // Status fields (actual DB values)
  status: string | null  // pending, godkjent, ansatt, avslått
  compliance_state: string | null  // pending, verified
  employment_status: string | null
  verification_status: string | null
  is_active: boolean | null
  pipeline_stage: string | null

  // Availability
  available_from: string | null
  available_to: string | null
  available_until: string | null
  tilgjengelighet: string | null  // Legacy field
  wants_temporary: string | null

  // Certifications in DB
  stcw_has: string | null
  stcw_mod: string[] | null
  stcw_confirm: boolean | null
  stcw_confirmed: boolean | null
  deck_has: string | null
  deck_class: string | null
  sertifikater: Record<string, unknown> | null  // JSONB field

  // Skills and other
  skills: string | null
  other_comp: string | null
  sectors: string[] | null
  departments: string[] | null
  positions: string[] | null
  vessel_types: string[] | null

  // Files
  cv_key: string | null
  certs_key: string | null

  // Personal
  nationality: string | null
  date_of_birth: string | null

  // Rates
  expected_daily_rate: number | null
  currency: string | null
  preferred_contract_length_months: number | null

  // Internal
  internal_notes: string | null
  flagged_reason: string | null

  // Verification
  bankid_verified_at: string | null
  national_id_hash: string | null
  ocr_confidence_score: number | null
  verified_by: string | null
  verified_at: string | null
  gdpr_consent: boolean | null

  // Tracking
  submitted_at: string | null
  source_ip: string | null
  source_table: string | null
  clerk_user_id: string | null
  archived_at: string | null

  // Encrypted fields (not used in UI)
  is_encrypted: boolean | null
  name_encrypted: string | null
  email_encrypted: string | null
  phone_encrypted: string | null
  source_ip_encrypted: string | null
}

// ═══════════════════════════════════════════════════════
// CANDIDATE TYPES (App interface)
// ═══════════════════════════════════════════════════════

/**
 * Normalized candidate interface for use in the app
 * Components should use this, hooks transform CandidateDbRow to this
 */
export interface CandidateWithRelations {
  id: string
  // Derived from name/first_name/last_name
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  // Derived from work_main/primary_rank/rolle
  primary_role: string
  secondary_roles: string[]
  // Mapped from years_of_experience
  experience_years: number
  // Mapped from status
  availability_status: import('./database.types').AvailabilityStatus
  // From available_from
  availability_date: string | null
  // Mapped from compliance_state
  compliance_status: import('./database.types').ComplianceStatus
  // May not exist in DB
  internal_rating: number | null
  // May not exist in DB
  tags: string[]
  fylke: string | null
  kommune: string | null
  // Certifications (inline from DB fields)
  stcw_has: string | null
  stcw_mod: string[] | null
  deck_has: string | null
  deck_class: string | null
  // Sectors
  sectors: string[]
  // Internal
  internal_notes: string | null
  // Optional relations (may not be loaded)
  certifications?: import('./database.types').CandidateCertification[]
  documents?: import('./database.types').CandidateDocument[]
  pools?: import('./database.types').CandidatePool[]
  // Raw DB row for access to all fields
  _raw?: CandidateDbRow
}

export interface CandidateFilters {
  search?: string
  roles?: string[]
  certifications?: {
    required?: string[]
    any_of?: string[]
  }
  availability?: import('./database.types').AvailabilityStatus[]
  compliance?: import('./database.types').ComplianceStatus[]
  experience?: {
    min?: number
    max?: number
  }
  location?: {
    fylke?: string[]
  }
  rating?: {
    min?: number
  }
  tags?: string[]
  pools?: string[]
}

export type CandidateSortField =
  | 'name'
  | 'role'
  | 'experience'
  | 'availability'
  | 'rating'
  | 'created_at'
  | 'updated_at'

export interface CandidateSort {
  field: CandidateSortField
  direction: 'asc' | 'desc'
}

// ═══════════════════════════════════════════════════════
// MATCHING TYPES
// ═══════════════════════════════════════════════════════

export interface MatchingCriteria {
  role: string
  startDate: Date
  certifications: {
    required: string[]
    preferred: string[]
  }
  experience?: {
    minYears?: number
    preferredYears?: number
  }
  languages?: {
    required?: string[]
    preferred?: string[]
  }
  location?: {
    fylke?: string[]
  }
  weights?: {
    certifications?: number
    experience?: number
    availability?: number
    rating?: number
    proximity?: number
  }
}

export interface MatchResult {
  candidateId: string
  candidate: CandidateWithRelations
  totalScore: number
  scores: {
    certifications: { score: number; matched: string[]; missing: string[] }
    experience: { score: number; years: number }
    availability: { score: number; status: string }
    rating: { score: number; rating: number | null }
    proximity: { score: number; fylke: string | null }
  }
  isFullMatch: boolean
  blockers: Array<{ type: string; description: string; severity: 'warning' | 'blocker' }>
  recommendation: 'strong' | 'good' | 'possible' | 'weak'
}

export interface MatchingResult {
  results: MatchResult[]
  executionTimeMs: number
  totalCandidates: number
}

// ═══════════════════════════════════════════════════════
// POOL FILTER CRITERIA
// ═══════════════════════════════════════════════════════

export interface PoolFilterCriteria {
  roles?: {
    include?: string[]
    exclude?: string[]
    primary_only?: boolean
  }
  certifications?: {
    required?: string[]
    any_of?: string[]
    exclude?: string[]
    valid_until?: string
  }
  availability?: import('./database.types').AvailabilityStatus[]
  compliance?: import('./database.types').ComplianceStatus[]
  experience?: {
    min?: number
    max?: number
  }
  location?: {
    fylke?: string[]
    kommune?: string[]
  }
  languages?: {
    required?: string[]
    any_of?: string[]
  }
  sectors?: {
    include?: string[]
    exclude?: string[]
  }
  rating?: {
    min?: number
    max?: number
  }
  tags?: {
    include?: string[]
    exclude?: string[]
    all?: string[]
  }
}

// ═══════════════════════════════════════════════════════
// UI TYPES
// ═══════════════════════════════════════════════════════

export type ViewMode = 'list' | 'grid' | 'kanban'

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export interface SelectOption {
  value: string
  label: string
}

// ═══════════════════════════════════════════════════════
// API RESPONSE TYPES
// ═══════════════════════════════════════════════════════

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  count?: number
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationState
}
