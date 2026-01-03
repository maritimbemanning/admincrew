// ══════════════════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ══════════════════════════════════════════════════════════════════════════════════════

export * from './database.types'

// ═══════════════════════════════════════════════════════
// RAW DATABASE CANDIDATE TYPE (admincrew Supabase schema)
// ═══════════════════════════════════════════════════════

/**
 * This represents the candidates table schema in admincrew Supabase
 * Supports both migration schema (00003_candidates.sql) and legacy columns
 */
export interface CandidateDbRow {
  id: string
  created_at: string
  updated_at: string | null

  // Core identity - migration schema uses first_name/last_name
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  phone_secondary: string | null

  // Location
  fylke: string | null
  kommune: string | null
  address_street: string | null
  address_postal_code: string | null
  address_city: string | null
  address_country: string | null
  nationality: string | null
  date_of_birth: string | null

  // Professional info - migration schema
  primary_role: string | null
  secondary_roles: string[] | null
  experience_years: number | null
  experience_details: unknown | null  // JSONB

  // Languages
  languages: unknown | null  // JSONB

  // Rotation preferences
  rotation_preferred: string[] | null
  rotation_max_weeks_on: number | null
  rotation_min_weeks_off: number | null
  rotation_flexible: boolean | null

  // Salary
  salary_min_monthly_nok: number | null
  salary_preferred_monthly_nok: number | null
  salary_negotiable: boolean | null

  // Location preferences
  location_preferred_regions: string[] | null
  location_willing_to_relocate: boolean | null

  // Sectors
  sectors: string[] | null

  // Availability - migration schema
  availability_status: string | null  // 'available', 'available_soon', 'on_assignment', 'unavailable', 'inactive'
  availability_date: string | null
  availability_notes: string | null
  availability_updated_at: string | null

  // Compliance - migration schema
  compliance_status: string | null  // 'not_started', 'documents_pending', 'review_pending', 'approved', 'expired', 'rejected'
  compliance_checked_at: string | null
  compliance_checked_by: string | null
  compliance_notes: string | null
  compliance_expires_at: string | null

  // Profile quality
  profile_completeness: number | null
  cv_summary: string | null
  cv_file_path: string | null
  cv_key: string | null

  // Internal evaluation
  internal_rating: number | null
  internal_notes: string | null
  tags: string[] | null

  // Source
  source: string | null
  source_details: unknown | null  // JSONB
  referred_by: string | null

  // Legacy/Auth
  user_id: string | null
  legacy_id: string | null
  legacy_source: string | null

  // Files
  avatar_url: string | null

  // Audit
  created_by: string | null
  updated_by: string | null
  archived_at: string | null
  archived_by: string | null
  archived_reason: string | null
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
