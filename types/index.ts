// ══════════════════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ══════════════════════════════════════════════════════════════════════════════════════

export * from './database.types'

// ═══════════════════════════════════════════════════════
// RAW DATABASE CANDIDATE TYPE (admincrew Supabase schema)
// ═══════════════════════════════════════════════════════

/**
 * This represents the ACTUAL candidates table schema in admincrew Supabase
 * Updated to match actual production database schema (2024-12)
 */
export interface CandidateDbRow {
  id: string
  created_at: string
  updated_at: string | null

  // Core identity - actual DB columns
  name: string  // Primary name field in actual DB
  email: string
  phone: string | null
  mobile: string | null

  // Legacy name fields (may be null)
  first_name: string | null
  last_name: string | null

  // Location - actual DB columns
  county: string | null
  municipality: string | null
  fylke: string | null  // Norwegian location
  kommune: string | null
  city: string | null
  country: string | null
  nationality: string | null
  date_of_birth: string | null

  // Professional info - actual DB columns
  primary_rank: string | null  // Actual column name for role
  rolle: string | null  // Alternative role column
  secondary_ranks: string[] | null
  years_of_experience: number | null  // Actual column name
  erfaring: string | null  // Norwegian experience text

  // Work preferences
  work_main: string[] | null
  wants_temporary: string | null
  skills: string | null
  other_comp: string | null

  // Certifications - stored as JSONB in sertifikater column
  sertifikater: unknown | null  // JSONB
  stcw_has: string | null
  stcw_mod: string[] | null
  stcw_confirm: boolean | null
  stcw_confirmed: boolean | null
  deck_has: string | null
  deck_class: string | null

  // Availability - actual DB columns
  employment_status: string | null  // 'available', 'on_assignment', 'unavailable'
  available_from: string | null
  available_until: string | null
  available_to: string | null

  // Compliance/Verification - actual DB columns
  verification_status: string | null  // 'pending_bankid', 'pending_documents', 'verified', 'rejected'
  compliance_state: string | null  // 'pending', etc.
  bankid_verified_at: string | null
  verified_by: string | null
  verified_at: string | null

  // Pipeline/Status - actual DB columns
  status: string | null  // 'pending', 'godkjent', 'avslått'
  pipeline_stage: string | null  // 'ny', 'vurdert', etc.

  // Files
  cv_key: string | null
  certs_key: string | null

  // Additional fields
  avatar_url: string | null
  sectors: string[] | null
  departments: string[] | null
  positions: string[] | null
  vessel_types: string[] | null
  internal_notes: string | null
  internal_rating: number | null
  tags: string[] | null
  cv_summary: string | null

  // Rate/Compensation
  expected_daily_rate: number | null
  currency: string | null
  preferred_contract_length_months: number | null

  // Meta
  is_active: boolean | null
  is_encrypted: boolean | null
  gdpr_consent: boolean | null
  source_table: string | null
  source_ip: string | null
  submitted_at: string | null
  archived_at: string | null
  flagged_reason: string | null
  ocr_confidence_score: number | null
  clerk_user_id: string | null
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
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  primary_role: string
  secondary_roles: string[]
  experience_years: number
  availability_status: string  // 'available', 'on_assignment', 'unavailable'
  availability_date: string | null
  compliance_status: string  // 'pending_bankid', 'pending_documents', 'verified', 'rejected'
  internal_rating: number | null
  tags: string[]
  fylke: string | null
  kommune: string | null
  sectors: string[]
  internal_notes: string | null
  cv_summary: string | null
  // Pipeline/Status fields from actual DB
  status?: string | null  // 'pending', 'godkjent', 'avslått'
  pipeline_stage?: string | null  // 'ny', 'vurdert', etc.
  cv_key?: string | null
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
  availability?: string[]  // 'available', 'on_assignment', 'unavailable'
  compliance?: string[]  // 'pending_bankid', 'pending_documents', 'verified', 'rejected'
  status?: string[]  // 'pending', 'godkjent', 'avslått', 'ny' (pipeline_stage)
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
