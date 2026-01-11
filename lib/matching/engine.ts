// Matching Engine - Core 10-Second Matching Algorithm
// This is the heart of AdminCrew's "10 SEKUNDER FRA BEHOV TIL MATCH" vision

import { createClient } from '@/lib/supabase/client'
import type { MatchingCriteria, MatchResult, MatchingResult } from '@/types/operations'
import type {
  CandidateSearchRecord,
  ScoringContext,
  DEFAULT_WEIGHTS,
  MatchingWeights,
} from './types'
import { getRecommendation } from './types'
import {
  calculateAllScores,
  calculateTotalScore,
  identifyBlockers,
  isFullMatch,
} from './scoring'

interface MatchingOptions {
  limit?: number
  includePartial?: boolean
  weights?: Partial<MatchingWeights>
}

const DEFAULT_OPTIONS: MatchingOptions = {
  limit: 50,
  includePartial: true,
  weights: {
    certifications: 40,
    experience: 30,
    availability: 20,
    rating: 10,
  },
}

/**
 * Run the matching engine
 *
 * This function:
 * 1. Queries candidate_search_index with hard filters (role, availability)
 * 2. Scores each candidate against the criteria
 * 3. Returns ranked results with score breakdowns
 *
 * Target: < 10 seconds for 1000+ candidates
 */
export async function runMatching(
  criteria: MatchingCriteria,
  options: MatchingOptions = {}
): Promise<MatchingResult> {
  const startTime = performance.now()
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const weights = { ...DEFAULT_OPTIONS.weights, ...opts.weights } as MatchingWeights

  const supabase = createClient()

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1: Build query with hard filters
  // ═══════════════════════════════════════════════════════════════════════════

  let query = supabase
    .from('candidate_search_index')
    .select('*')

  // Filter by role (primary or secondary)
  query = query.contains('roles', [criteria.role])

  // Filter by availability status
  const availabilityStatuses = criteria.availability?.status || ['available', 'available_soon']
  query = query.in('availability_status', availabilityStatuses)

  // Filter by compliance (exclude rejected/expired)
  query = query.not('compliance_status', 'in', '(rejected,expired)')

  // Filter by required certifications (if any)
  if (criteria.certifications?.required && criteria.certifications.required.length > 0) {
    // Candidate must have ALL required certifications
    query = query.contains('certification_codes', criteria.certifications.required)
  }

  // Filter by minimum experience (if specified)
  if (criteria.experience?.min_years && criteria.experience.min_years > 0) {
    query = query.gte('experience_years', criteria.experience.min_years)
  }

  // Filter by pool membership (if specified)
  if (criteria.include_pool_ids && criteria.include_pool_ids.length > 0) {
    query = query.overlaps('pool_ids', criteria.include_pool_ids)
  }

  // Exclude specific candidates
  if (criteria.exclude_candidate_ids && criteria.exclude_candidate_ids.length > 0) {
    query = query.not('candidate_id', 'in', `(${criteria.exclude_candidate_ids.join(',')})`)
  }

  // Limit initial fetch (fetch more than needed for scoring/filtering)
  const fetchLimit = (opts.limit || 50) * 3
  query = query.limit(fetchLimit)

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2: Execute query
  // ═══════════════════════════════════════════════════════════════════════════

  const { data: candidates, error } = await query

  if (error) {
    console.error('Matching query error:', error)
    throw new Error(`Matching failed: ${error.message}`)
  }

  const totalSearched = candidates?.length || 0

  if (!candidates || candidates.length === 0) {
    return {
      criteria,
      results: [],
      total_candidates_searched: 0,
      execution_time_ms: performance.now() - startTime,
      timestamp: new Date().toISOString(),
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3: Build scoring context
  // ═══════════════════════════════════════════════════════════════════════════

  const context: ScoringContext = {
    required_certs: criteria.certifications?.required || [],
    preferred_certs: criteria.certifications?.preferred || [],
    min_experience: criteria.experience?.min_years || 0,
    preferred_experience: criteria.experience?.preferred_years || 0,
    required_languages: criteria.languages?.required || [],
    preferred_languages: criteria.languages?.preferred || [],
    target_date: new Date(criteria.start_date),
    weights,
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 4: Score each candidate
  // ═══════════════════════════════════════════════════════════════════════════

  const scoredResults: MatchResult[] = candidates.map((candidate: CandidateSearchRecord) => {
    const scores = calculateAllScores(candidate, context)
    const totalScore = calculateTotalScore(scores, weights)
    const blockers = identifyBlockers(candidate, scores, context)
    const fullMatch = isFullMatch(blockers)
    const recommendation = getRecommendation(totalScore)

    return {
      candidate_id: candidate.candidate_id,
      total_score: totalScore,
      scores: {
        certifications: scores.certifications,
        experience: scores.experience,
        availability: scores.availability,
        rating: scores.rating,
        languages: scores.languages,
      },
      is_full_match: fullMatch,
      blockers,
      recommendation,
      candidate: {
        id: candidate.candidate_id,
        full_name: candidate.full_name,
        email: candidate.email,
        phone: candidate.phone,
        roles: candidate.roles,
        active_certifications: candidate.active_certifications,
        experience_years: candidate.experience_years,
        availability_status: candidate.availability_status,
        availability_date: candidate.availability_date,
        compliance_status: candidate.compliance_status,
        internal_rating: candidate.internal_rating,
        tags: candidate.tags,
      },
    }
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 5: Filter and sort results
  // ═══════════════════════════════════════════════════════════════════════════

  let filteredResults = scoredResults

  // Optionally filter out partial matches (those with blockers)
  if (!opts.includePartial) {
    filteredResults = filteredResults.filter(r => r.is_full_match)
  }

  // Sort by total score (descending)
  filteredResults.sort((a, b) => b.total_score - a.total_score)

  // Limit to requested number
  const finalResults = filteredResults.slice(0, opts.limit || 50)

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 6: Return results
  // ═══════════════════════════════════════════════════════════════════════════

  const executionTime = performance.now() - startTime

  return {
    criteria,
    results: finalResults,
    total_candidates_searched: totalSearched,
    execution_time_ms: Math.round(executionTime),
    timestamp: new Date().toISOString(),
  }
}

/**
 * Quick match - simplified interface for common use case
 */
export async function quickMatch(
  role: string,
  startDate: string,
  requiredCerts: string[] = [],
  limit: number = 20
): Promise<MatchResult[]> {
  const result = await runMatching(
    {
      role,
      start_date: startDate,
      certifications: {
        required: requiredCerts,
        preferred: [],
      },
    },
    { limit }
  )

  return result.results
}

/**
 * Get match statistics for a criteria
 */
export async function getMatchStats(criteria: MatchingCriteria): Promise<{
  total: number
  strong: number
  good: number
  possible: number
  weak: number
}> {
  const result = await runMatching(criteria, { limit: 500, includePartial: true })

  const stats = {
    total: result.results.length,
    strong: 0,
    good: 0,
    possible: 0,
    weak: 0,
  }

  for (const match of result.results) {
    stats[match.recommendation]++
  }

  return stats
}
