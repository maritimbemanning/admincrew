// Matching Engine Types
// Used internally by the matching algorithm

export interface CandidateSearchRecord {
  candidate_id: string
  searchable_text: string | null
  full_name: string
  email: string
  phone: string | null
  roles: string[]
  active_certifications: string[]
  certification_codes: string[]
  certification_expiry_map: Record<string, string>
  next_cert_expiry: string | null
  languages: string[]
  sectors: string[]
  availability_status: string
  availability_date: string | null
  compliance_status: string
  experience_years: number
  profile_completeness: number
  internal_rating: number | null
  fylke: string | null
  kommune: string | null
  tags: string[]
  pool_ids: string[]
  indexed_at: string
}

export interface MatchingWeights {
  certifications: number  // Weight for certification match (default: 35)
  experience: number      // Weight for experience match (default: 25)
  availability: number    // Weight for availability match (default: 20)
  rating: number          // Weight for internal rating (default: 10)
  proximity: number       // Weight for location proximity (default: 10)
}

export const DEFAULT_WEIGHTS: MatchingWeights = {
  certifications: 35,
  experience: 25,
  availability: 20,
  rating: 10,
  proximity: 10,
}

export interface ScoringContext {
  required_certs: string[]
  preferred_certs: string[]
  min_experience: number
  preferred_experience: number
  required_languages: string[]
  preferred_languages: string[]
  target_fylke: string[]
  target_date: Date
  weights: MatchingWeights
}

export interface CertificationScore {
  score: number
  matched: string[]
  missing: string[]
  preferred_matched: string[]
}

export interface ExperienceScore {
  score: number
  years: number
  meets_minimum: boolean
}

export interface AvailabilityScore {
  score: number
  status: string
  available_date: string | null
}

export interface RatingScore {
  score: number
  rating: number | null
}

export interface ProximityScore {
  score: number
  fylke: string | null
}

export interface LanguageScore {
  score: number
  matched: string[]
  missing: string[]
}

export interface CandidateScores {
  certifications: CertificationScore
  experience: ExperienceScore
  availability: AvailabilityScore
  rating: RatingScore
  proximity: ProximityScore
  languages: LanguageScore
}

export type MatchRecommendation = 'strong' | 'good' | 'possible' | 'weak'

export interface MatchBlockerInfo {
  type: 'certification' | 'compliance' | 'availability' | 'experience'
  description: string
  severity: 'warning' | 'blocker'
}

export function getRecommendation(score: number): MatchRecommendation {
  if (score >= 85) return 'strong'
  if (score >= 70) return 'good'
  if (score >= 50) return 'possible'
  return 'weak'
}
