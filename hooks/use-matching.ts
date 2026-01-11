'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { runMatching, quickMatch, getMatchStats } from '@/lib/matching'
import type { MatchingCriteria, MatchResult, MatchingResult } from '@/types/operations'

// ═══════════════════════════════════════════════════════════════════════════════
// QUERY KEYS
// ═══════════════════════════════════════════════════════════════════════════════

export const matchingKeys = {
  all: ['matching'] as const,
  results: (criteria: MatchingCriteria) => [...matchingKeys.all, 'results', criteria] as const,
  stats: (criteria: MatchingCriteria) => [...matchingKeys.all, 'stats', criteria] as const,
}

// ═══════════════════════════════════════════════════════════════════════════════
// MATCHING MUTATION (for on-demand matching)
// ═══════════════════════════════════════════════════════════════════════════════

interface MatchingOptions {
  limit?: number
  includePartial?: boolean
}

export function useRunMatching() {
  return useMutation({
    mutationFn: async ({
      criteria,
      options,
    }: {
      criteria: MatchingCriteria
      options?: MatchingOptions
    }) => {
      return await runMatching(criteria, options)
    },
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK MATCH MUTATION
// ═══════════════════════════════════════════════════════════════════════════════

export function useQuickMatch() {
  return useMutation({
    mutationFn: async ({
      role,
      startDate,
      requiredCerts = [],
      limit = 20,
    }: {
      role: string
      startDate: string
      requiredCerts?: string[]
      limit?: number
    }) => {
      return await quickMatch(role, startDate, requiredCerts, limit)
    },
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// MATCH STATS QUERY (cached)
// ═══════════════════════════════════════════════════════════════════════════════

export function useMatchStats(criteria: MatchingCriteria | undefined) {
  return useQuery({
    queryKey: matchingKeys.stats(criteria || {} as MatchingCriteria),
    queryFn: async () => {
      if (!criteria) return null
      return await getMatchStats(criteria)
    },
    enabled: !!criteria && !!criteria.role && !!criteria.start_date,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Helper to build criteria from a request
 */
export function buildCriteriaFromRequest(request: {
  role_needed: string
  start_date: string
  certifications_required?: string[]
  certifications_preferred?: string[]
  experience_min_years?: number | null
  experience_preferred_years?: number | null
  languages_required?: string[]
  languages_preferred?: string[]
}): MatchingCriteria {
  return {
    role: request.role_needed,
    start_date: request.start_date,
    certifications: {
      required: request.certifications_required || [],
      preferred: request.certifications_preferred || [],
    },
    experience: {
      min_years: request.experience_min_years || undefined,
      preferred_years: request.experience_preferred_years || undefined,
    },
    languages: {
      required: request.languages_required || [],
      preferred: request.languages_preferred || [],
    },
  }
}

/**
 * Get recommendation color class
 */
export function getRecommendationColor(recommendation: MatchResult['recommendation']): string {
  switch (recommendation) {
    case 'strong':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'good':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'possible':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'weak':
      return 'bg-gray-100 text-gray-600 border-gray-200'
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

/**
 * Get recommendation label
 */
export function getRecommendationLabel(recommendation: MatchResult['recommendation']): string {
  switch (recommendation) {
    case 'strong':
      return 'Sterk match'
    case 'good':
      return 'God match'
    case 'possible':
      return 'Mulig match'
    case 'weak':
      return 'Svak match'
    default:
      return 'Ukjent'
  }
}

/**
 * Format execution time
 */
export function formatExecutionTime(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  }
  return `${(ms / 1000).toFixed(2)}s`
}
