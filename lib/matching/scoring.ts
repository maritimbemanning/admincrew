// Matching Engine - Scoring Functions
// Each function scores a specific aspect of candidate fit (0-100)

import type {
  CandidateSearchRecord,
  ScoringContext,
  CertificationScore,
  ExperienceScore,
  AvailabilityScore,
  RatingScore,
  ProximityScore,
  LanguageScore,
  CandidateScores,
  MatchBlockerInfo,
} from './types'

/**
 * Score certification match
 * - 100 if all required AND preferred certs are present
 * - Penalize heavily for missing required certs
 * - Bonus for preferred certs
 */
export function scoreCertifications(
  candidate: CandidateSearchRecord,
  context: ScoringContext
): CertificationScore {
  const candidateCerts = new Set(candidate.active_certifications.map(c => c.toLowerCase()))
  const requiredCerts = context.required_certs.map(c => c.toLowerCase())
  const preferredCerts = context.preferred_certs.map(c => c.toLowerCase())

  const matchedRequired = requiredCerts.filter(c => candidateCerts.has(c))
  const missingRequired = requiredCerts.filter(c => !candidateCerts.has(c))
  const matchedPreferred = preferredCerts.filter(c => candidateCerts.has(c))

  // If no requirements, perfect score
  if (requiredCerts.length === 0 && preferredCerts.length === 0) {
    return { score: 100, matched: [], missing: [], preferred_matched: [] }
  }

  let score = 0

  // Required certs: 80% of score potential
  if (requiredCerts.length > 0) {
    const requiredRatio = matchedRequired.length / requiredCerts.length
    score += requiredRatio * 80
  } else {
    score += 80 // No required = full required score
  }

  // Preferred certs: 20% of score potential
  if (preferredCerts.length > 0) {
    const preferredRatio = matchedPreferred.length / preferredCerts.length
    score += preferredRatio * 20
  } else {
    score += 20 // No preferred = full preferred score
  }

  return {
    score: Math.round(score),
    matched: matchedRequired,
    missing: missingRequired,
    preferred_matched: matchedPreferred,
  }
}

/**
 * Score experience match
 * - 100 if meets or exceeds preferred experience
 * - Scaled down if below preferred but above minimum
 * - Low score if below minimum
 */
export function scoreExperience(
  candidate: CandidateSearchRecord,
  context: ScoringContext
): ExperienceScore {
  const years = candidate.experience_years || 0
  const { min_experience, preferred_experience } = context

  // No requirements = perfect score
  if (min_experience === 0 && preferred_experience === 0) {
    return { score: 100, years, meets_minimum: true }
  }

  const meetsMinimum = years >= min_experience

  if (years >= preferred_experience && preferred_experience > 0) {
    // Meets or exceeds preferred
    return { score: 100, years, meets_minimum: true }
  }

  if (years >= min_experience && preferred_experience > 0) {
    // Between min and preferred
    const range = preferred_experience - min_experience
    const position = years - min_experience
    const ratio = range > 0 ? position / range : 1
    const score = 60 + Math.round(ratio * 40) // 60-100 range
    return { score, years, meets_minimum: true }
  }

  if (years < min_experience && min_experience > 0) {
    // Below minimum
    const ratio = min_experience > 0 ? years / min_experience : 0
    const score = Math.round(ratio * 50) // 0-50 range
    return { score, years, meets_minimum: false }
  }

  // Fallback
  return { score: 80, years, meets_minimum: true }
}

/**
 * Score availability match
 * - 100 if available now
 * - Scaled based on how soon available vs target date
 * - Low score if on assignment or unavailable
 */
export function scoreAvailability(
  candidate: CandidateSearchRecord,
  context: ScoringContext
): AvailabilityScore {
  const status = candidate.availability_status
  const availableDate = candidate.availability_date
    ? new Date(candidate.availability_date)
    : null

  if (status === 'available') {
    return { score: 100, status, available_date: candidate.availability_date }
  }

  if (status === 'available_soon') {
    if (!availableDate) {
      return { score: 80, status, available_date: null }
    }

    const targetDate = context.target_date
    const daysUntilNeeded = Math.ceil(
      (targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    const daysUntilAvailable = Math.ceil(
      (availableDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )

    if (daysUntilAvailable <= daysUntilNeeded) {
      // Available before or on target date
      return { score: 95, status, available_date: candidate.availability_date }
    }

    // Available after target date - penalize based on delay
    const daysLate = daysUntilAvailable - daysUntilNeeded
    const penalty = Math.min(daysLate * 3, 50) // Max 50 point penalty
    return {
      score: Math.max(45, 95 - penalty),
      status,
      available_date: candidate.availability_date,
    }
  }

  if (status === 'on_assignment') {
    // Check if assignment ends before target date
    if (availableDate && availableDate <= context.target_date) {
      return { score: 70, status, available_date: candidate.availability_date }
    }
    return { score: 30, status, available_date: candidate.availability_date }
  }

  // Unavailable or inactive
  return { score: 0, status, available_date: candidate.availability_date }
}

/**
 * Score internal rating
 * - Normalize 1-5 rating to 0-100 scale
 * - No rating = neutral score of 60
 */
export function scoreRating(candidate: CandidateSearchRecord): RatingScore {
  const rating = candidate.internal_rating

  if (rating === null || rating === undefined) {
    return { score: 60, rating: null } // Neutral if no rating
  }

  // Rating is 1-5, convert to 0-100
  // 1 = 20, 2 = 40, 3 = 60, 4 = 80, 5 = 100
  const score = rating * 20
  return { score, rating }
}

/**
 * Score location proximity
 * - 100 if in target fylke
 * - Lower scores for other locations
 * - Could be expanded with distance calculations
 */
export function scoreProximity(
  candidate: CandidateSearchRecord,
  context: ScoringContext
): ProximityScore {
  const fylke = candidate.fylke

  // No location requirement = perfect score
  if (context.target_fylke.length === 0) {
    return { score: 100, fylke }
  }

  if (!fylke) {
    return { score: 50, fylke: null } // Unknown location = neutral
  }

  const targetFylker = context.target_fylke.map(f => f.toLowerCase())
  const candidateFylke = fylke.toLowerCase()

  if (targetFylker.includes(candidateFylke)) {
    return { score: 100, fylke }
  }

  // Not in target area - could add region-based scoring here
  // For now, give partial score
  return { score: 40, fylke }
}

/**
 * Score language match
 * - Similar logic to certifications
 */
export function scoreLanguages(
  candidate: CandidateSearchRecord,
  context: ScoringContext
): LanguageScore {
  const candidateLangs = new Set(candidate.languages.map(l => l.toLowerCase()))
  const requiredLangs = context.required_languages.map(l => l.toLowerCase())
  const preferredLangs = context.preferred_languages.map(l => l.toLowerCase())

  const matchedRequired = requiredLangs.filter(l => candidateLangs.has(l))
  const missingRequired = requiredLangs.filter(l => !candidateLangs.has(l))
  const matchedPreferred = preferredLangs.filter(l => candidateLangs.has(l))

  if (requiredLangs.length === 0 && preferredLangs.length === 0) {
    return { score: 100, matched: [], missing: [] }
  }

  let score = 0

  if (requiredLangs.length > 0) {
    const requiredRatio = matchedRequired.length / requiredLangs.length
    score += requiredRatio * 80
  } else {
    score += 80
  }

  if (preferredLangs.length > 0) {
    const preferredRatio = matchedPreferred.length / preferredLangs.length
    score += preferredRatio * 20
  } else {
    score += 20
  }

  return {
    score: Math.round(score),
    matched: [...matchedRequired, ...matchedPreferred],
    missing: missingRequired,
  }
}

/**
 * Calculate all scores for a candidate
 */
export function calculateAllScores(
  candidate: CandidateSearchRecord,
  context: ScoringContext
): CandidateScores {
  return {
    certifications: scoreCertifications(candidate, context),
    experience: scoreExperience(candidate, context),
    availability: scoreAvailability(candidate, context),
    rating: scoreRating(candidate),
    proximity: scoreProximity(candidate, context),
    languages: scoreLanguages(candidate, context),
  }
}

/**
 * Calculate weighted total score
 */
export function calculateTotalScore(
  scores: CandidateScores,
  weights: { certifications: number; experience: number; availability: number; rating: number; proximity: number }
): number {
  const totalWeight =
    weights.certifications +
    weights.experience +
    weights.availability +
    weights.rating +
    weights.proximity

  const weightedSum =
    scores.certifications.score * weights.certifications +
    scores.experience.score * weights.experience +
    scores.availability.score * weights.availability +
    scores.rating.score * weights.rating +
    scores.proximity.score * weights.proximity

  return Math.round(weightedSum / totalWeight)
}

/**
 * Identify blockers that prevent assignment
 */
export function identifyBlockers(
  candidate: CandidateSearchRecord,
  scores: CandidateScores,
  context: ScoringContext
): MatchBlockerInfo[] {
  const blockers: MatchBlockerInfo[] = []

  // Compliance blockers
  if (candidate.compliance_status === 'rejected') {
    blockers.push({
      type: 'compliance',
      description: 'Kandidat har ikke bestått compliance-sjekk',
      severity: 'blocker',
    })
  } else if (candidate.compliance_status === 'expired') {
    blockers.push({
      type: 'compliance',
      description: 'Compliance-godkjenning har utløpt',
      severity: 'blocker',
    })
  } else if (['not_started', 'documents_pending', 'review_pending'].includes(candidate.compliance_status)) {
    blockers.push({
      type: 'compliance',
      description: `Compliance-status: ${candidate.compliance_status}`,
      severity: 'warning',
    })
  }

  // Missing required certifications
  if (scores.certifications.missing.length > 0) {
    blockers.push({
      type: 'certification',
      description: `Mangler sertifikater: ${scores.certifications.missing.join(', ')}`,
      severity: context.required_certs.length > 0 ? 'blocker' : 'warning',
    })
  }

  // Availability blockers
  if (candidate.availability_status === 'unavailable' || candidate.availability_status === 'inactive') {
    blockers.push({
      type: 'availability',
      description: 'Kandidat er ikke tilgjengelig',
      severity: 'blocker',
    })
  } else if (candidate.availability_status === 'on_assignment') {
    blockers.push({
      type: 'availability',
      description: 'Kandidat er på oppdrag',
      severity: 'warning',
    })
  }

  // Experience blocker
  if (!scores.experience.meets_minimum && context.min_experience > 0) {
    blockers.push({
      type: 'experience',
      description: `Har ${scores.experience.years} års erfaring, minimum ${context.min_experience} år kreves`,
      severity: 'warning',
    })
  }

  return blockers
}

/**
 * Determine if candidate is a full match (no blockers)
 */
export function isFullMatch(blockers: MatchBlockerInfo[]): boolean {
  return !blockers.some(b => b.severity === 'blocker')
}
