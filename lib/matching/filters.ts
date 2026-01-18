/**
 * Matching Filters
 * Hard filters for candidate matching
 *
 * NOTE: These filters query bluecrew_profiles as the source of truth.
 * Relations (certifications, pools) are accessed via candidate_id link.
 */

import { createClient } from '@/lib/supabase/client'
import type { MatchingCriteria } from '@/types/operations'

export interface FilterResult {
  candidateIds: string[]
  profileIds: string[]
  appliedFilters: string[]
  excludedCount: number
}

/**
 * Build and apply hard filters on bluecrew_profiles
 * These are non-negotiable requirements that must be met
 *
 * Returns both profile IDs (bluecrew_profiles.id) and candidate_ids (for relations)
 */
export async function applyHardFilters(
  criteria: MatchingCriteria
): Promise<FilterResult> {
  const supabase = createClient()
  const appliedFilters: string[] = []
  let excludedCount = 0

  // Query bluecrew_profiles as source of truth
  // Profile is "confirmed" if cv_key is present
  let query = supabase
    .from('bluecrew_profiles')
    .select('id, candidate_id')
    .not('cv_key', 'is', null) // Only confirmed profiles (has cv_key)
    .is('archived_at', null)

  appliedFilters.push('confirmed:true')

  // Filter by availability
  if (criteria.availability?.available_by) {
    query = query.or(`availability_date.is.null,availability_date.lte.${criteria.availability.available_by}`)
    appliedFilters.push(`available_from:${criteria.availability.available_by}`)
  }

  // Filter by role (primary_role matches)
  if (criteria.role) {
    query = query.eq('primary_role', criteria.role)
    appliedFilters.push(`role:${criteria.role}`)
  }

  // Filter by minimum experience years
  if (criteria.experience?.min_years && criteria.experience.min_years > 0) {
    query = query.gte('experience_years', criteria.experience.min_years)
    appliedFilters.push(`min_experience:${criteria.experience.min_years}`)
  }

  // Execute query
  const { data: profiles, error } = await query

  if (error) {
    console.error('Filter query error:', error)
    throw new Error(`Failed to apply filters: ${error.message}`)
  }

  const profileIds = profiles?.map(p => p.id) || []
  const candidateIds = profiles?.map(p => p.candidate_id).filter(Boolean) as string[] || []

  return {
    profileIds,
    candidateIds,
    appliedFilters,
    excludedCount,
  }
}

/**
 * Filter candidates with required certifications
 * Uses candidate_id to join with candidate_certifications
 */
export async function filterByCertifications(
  candidateIds: string[],
  requiredCertifications: string[]
): Promise<string[]> {
  if (requiredCertifications.length === 0 || candidateIds.length === 0) {
    return candidateIds
  }

  const supabase = createClient()

  // Find candidates that have ALL required certifications (active)
  const { data: certData, error } = await supabase
    .from('candidate_certifications')
    .select('candidate_id, code')
    .in('candidate_id', candidateIds)
    .in('code', requiredCertifications)
    .eq('status', 'active')

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
    certCountMap.get(cert.candidate_id)!.add(cert.code)
  })

  // Only include candidates with ALL required certifications
  return candidateIds.filter(id => {
    const certs = certCountMap.get(id)
    return certs && certs.size >= requiredCertifications.length
  })
}

/**
 * Filter out profiles with blocking issues
 * Note: bluecrew_profiles doesn't have blocking_reason, so we check for archived
 */
export async function filterByBlockingStatus(
  profileIds: string[]
): Promise<{ eligible: string[]; blocked: { id: string; reason: string }[] }> {
  if (profileIds.length === 0) {
    return { eligible: [], blocked: [] }
  }

  const supabase = createClient()

  // Check for profiles that are archived
  const { data: profiles, error } = await supabase
    .from('bluecrew_profiles')
    .select('id, archived_at')
    .in('id', profileIds)

  if (error) {
    console.error('Blocking status filter error:', error)
    return { eligible: profileIds, blocked: [] }
  }

  const eligible: string[] = []
  const blocked: { id: string; reason: string }[] = []

  profiles?.forEach(profile => {
    if (profile.archived_at) {
      blocked.push({ id: profile.id, reason: 'Arkivert' })
    } else {
      eligible.push(profile.id)
    }
  })

  return { eligible, blocked }
}

/**
 * Filter by language requirements
 */
export async function filterByLanguages(
  profileIds: string[],
  requiredLanguages: { code: string; minLevel: 'basic' | 'conversational' | 'fluent' | 'native' }[]
): Promise<string[]> {
  if (requiredLanguages.length === 0 || profileIds.length === 0) {
    return profileIds
  }

  const supabase = createClient()

  const { data: profiles, error } = await supabase
    .from('bluecrew_profiles')
    .select('id, languages')
    .in('id', profileIds)

  if (error) {
    console.error('Language filter error:', error)
    return profileIds
  }

  const levelOrder = ['basic', 'conversational', 'fluent', 'native']

  return profiles
    ?.filter(profile => {
      const candidateLanguages = profile.languages as Record<string, string> | null
      if (!candidateLanguages) return false

      return requiredLanguages.every(req => {
        const candidateLevel = candidateLanguages[req.code]
        if (!candidateLevel) return false
        return levelOrder.indexOf(candidateLevel) >= levelOrder.indexOf(req.minLevel)
      })
    })
    .map(p => p.id) || []
}

/**
 * Filter by current assignment status
 * Uses candidate_id to check assignments
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
 * Uses candidate_id to check pool memberships
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
    .from('candidate_pool_memberships')
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
