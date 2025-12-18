// ══════════════════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ══════════════════════════════════════════════════════════════════════════════════════

export * from './database.types'

// ═══════════════════════════════════════════════════════
// CANDIDATE TYPES
// ═══════════════════════════════════════════════════════

export interface CandidateWithRelations {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  primary_role: string
  secondary_roles: string[]
  experience_years: number
  availability_status: import('./database.types').AvailabilityStatus
  availability_date: string | null
  compliance_status: import('./database.types').ComplianceStatus
  internal_rating: number | null
  tags: string[]
  fylke: string | null
  certifications?: import('./database.types').CandidateCertification[]
  documents?: import('./database.types').CandidateDocument[]
  pools?: import('./database.types').CandidatePool[]
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
