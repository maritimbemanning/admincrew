/**
 * Matching Filters
 * Hard filters for candidate matching
 */

import { createClient } from '@/lib/supabase/client'
import type { MatchingCriteria } from '@/types/operations'

export interface FilterResult {
  candidateIds: string[]
  appliedFilters: string[]
  excludedCount: number
}

/**
 * Build and apply hard filters on candidates
 * These are non-negotiable requirements that must be met
 */
export async function applyHardFilters(
  criteria: MatchingCriteria
): Promise<FilterResult> {
  const supabase = createClient()
  const appliedFilters: string[] = []
  let excludedCount = 0

  // Start with base query
  let query = supabase
    .from('candidates')
    .select('id')
    .eq('status', 'approved') // Only approved candidates

  appliedFilters.push('status:approved')

  // Filter by availability
  if (criteria.availability?.available_by) {
    query = query.or(`available_from.is.null,available_from.lte.${criteria.availability.available_by}`)
    appliedFilters.push(`available_from:${criteria.availability.available_by}`)
  }

  // Filter by role
  if (criteria.role) {
    query = query.contains('roles', [criteria.role])
    appliedFilters.push(`role:${criteria.role}`)
  }

  // Filter by minimum experience years
  if (criteria.experience?.min_years && criteria.experience.min_years > 0) {
    query = query.gte('experience_years', criteria.experience.min_years)
    appliedFilters.push(`min_experience:${criteria.experience.min_years}`)
  }

  // Execute query
  const { data: candidates, error } = await query

  if (error) {
    console.error('Filter query error:', error)
    throw new Error(`Failed to apply filters: ${error.message}`)
  }

  const candidateIds = candidates?.map(c => c.id) || []

  return {
    candidateIds,
    appliedFilters,
    excludedCount,
  }
}

/**
 * Filter candidates with required certifications
 */
export async function filterByCertifications(
  candidateIds: string[],
  requiredCertifications: string[]
): Promise<string[]> {
  if (requiredCertifications.length === 0 || candidateIds.length === 0) {
    return candidateIds
  }

  const supabase = createClient()
  
  // Find candidates that have ALL required certifications (valid)
  const { data: certData, error } = await supabase
    .from('candidate_certifications')
    .select('candidate_id, certification_type')
    .in('candidate_id', candidateIds)
    .in('certification_type', requiredCertifications)
    .eq('status', 'valid')

  if (error) {
    console.error('Certification filter error:', error)
    return candidateIds
  }

  // Count certifications per candidate
  const certCountMap = new Map<string, Set<string>>()
  certData?.forEach(cert => {
    if (!certCountMap.has(cert.candidate_id)) {
      certCountMap.set(cert.candidate_id, new Set())
    }
    certCountMap.get(cert.candidate_id)!.add(cert.certification_type)
  })

  // Only include candidates with ALL required certifications
  return candidateIds.filter(id => {
    const certs = certCountMap.get(id)
    return certs && certs.size >= requiredCertifications.length
  })
}

/**
 * Filter out candidates with blocking issues
 */
export async function filterByBlockingStatus(
  candidateIds: string[]
): Promise<{ eligible: string[]; blocked: { id: string; reason: string }[] }> {
  if (candidateIds.length === 0) {
    return { eligible: [], blocked: [] }
  }

  const supabase = createClient()
  
  // Check for candidates with blocking flags
  const { data: candidates, error } = await supabase
    .from('candidates')
    .select('id, blocking_reason, compliance_status')
    .in('id', candidateIds)

  if (error) {
    console.error('Blocking status filter error:', error)
    return { eligible: candidateIds, blocked: [] }
  }

  const eligible: string[] = []
  const blocked: { id: string; reason: string }[] = []

  candidates?.forEach(candidate => {
    if (candidate.blocking_reason) {
      blocked.push({ id: candidate.id, reason: candidate.blocking_reason })
    } else if (candidate.compliance_status === 'blocked') {
      blocked.push({ id: candidate.id, reason: 'Compliance blokkert' })
    } else {
      eligible.push(candidate.id)
    }
  })

  return { eligible, blocked }
}

/**
 * Filter by language requirements
 */
export async function filterByLanguages(
  candidateIds: string[],
  requiredLanguages: { code: string; minLevel: 'basic' | 'conversational' | 'fluent' | 'native' }[]
): Promise<string[]> {
  if (requiredLanguages.length === 0 || candidateIds.length === 0) {
    return candidateIds
  }

  const supabase = createClient()
  
  const { data: candidates, error } = await supabase
    .from('candidates')
    .select('id, languages')
    .in('id', candidateIds)

  if (error) {
    console.error('Language filter error:', error)
    return candidateIds
  }

  const levelOrder = ['basic', 'conversational', 'fluent', 'native']
  
  return candidates
    ?.filter(candidate => {
      const candidateLanguages = candidate.languages as Record<string, string> | null
      if (!candidateLanguages) return false

      return requiredLanguages.every(req => {
        const candidateLevel = candidateLanguages[req.code]
        if (!candidateLevel) return false
        return levelOrder.indexOf(candidateLevel) >= levelOrder.indexOf(req.minLevel)
      })
    })
    .map(c => c.id) || []
}

/**
 * Filter by current assignment status
 */
export async function filterByAvailability(
  candidateIds: string[],
  startDate: string,
  endDate: string
): Promise<string[]> {
  if (candidateIds.length === 0) {
    return candidateIds
  }

  const supabase = createClient()
  
  // Find candidates with overlapping assignments
  const { data: busyCandidates, error } = await supabase
    .from('assignments')
    .select('candidate_id')
    .in('candidate_id', candidateIds)
    .in('status', ['confirmed', 'active'])
    .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`)

  if (error) {
    console.error('Availability filter error:', error)
    return candidateIds
  }

  const busyIds = new Set(busyCandidates?.map(a => a.candidate_id) || [])
  
  return candidateIds.filter(id => !busyIds.has(id))
}

/**
 * Filter by pool membership
 */
export async function filterByPool(
  candidateIds: string[],
  poolId: string
): Promise<string[]> {
  if (candidateIds.length === 0) {
    return candidateIds
  }

  const supabase = createClient()
  
  const { data: poolMembers, error } = await supabase
    .from('candidate_pool_members')
    .select('candidate_id')
    .eq('pool_id', poolId)
    .in('candidate_id', candidateIds)

  if (error) {
    console.error('Pool filter error:', error)
    return candidateIds
  }

  return poolMembers?.map(m => m.candidate_id) || []
}

/**
 * Exclude candidates that are already in a shortlist for this request
 */
export async function excludeShortlisted(
  candidateIds: string[],
  requestId: string
): Promise<string[]> {
  if (candidateIds.length === 0) {
    return candidateIds
  }

  const supabase = createClient()
  
  const { data: shortlisted, error } = await supabase
    .from('request_shortlists')
    .select('candidate_id')
    .eq('request_id', requestId)

  if (error) {
    console.error('Shortlist exclusion error:', error)
    return candidateIds
  }

  const shortlistedIds = new Set(shortlisted?.map(s => s.candidate_id) || [])
  
  return candidateIds.filter(id => !shortlistedIds.has(id))
}
