// supabase/functions/matching/index.ts
// Edge Function for server-side 10-sekunds matching

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MatchingCriteria {
  role: string
  start_date: string
  certifications?: {
    required?: string[]
    preferred?: string[]
  }
  experience?: {
    min_years?: number
    preferred_years?: number
  }
  availability?: {
    status?: string[]
  }
  include_pool_ids?: string[]
  exclude_candidate_ids?: string[]
}

interface MatchResult {
  candidate_id: string
  total_score: number
  scores: {
    certifications: number
    experience: number
    availability: number
    rating: number
  }
  recommendation: 'strong' | 'good' | 'possible' | 'weak'
  blockers: Array<{ type: string; description: string }>
  candidate: any
}

const DEFAULT_WEIGHTS = {
  certifications: 40,
  experience: 30,
  availability: 20,
  rating: 10,
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const startTime = Date.now()

    // Authenticate
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request
    const { criteria, options = {} } = await req.json() as {
      criteria: MatchingCriteria
      options?: { limit?: number; weights?: Partial<typeof DEFAULT_WEIGHTS> }
    }

    if (!criteria?.role || !criteria?.start_date) {
      return new Response(
        JSON.stringify({ error: 'Role and start_date are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const limit = options.limit || 50
    const weights = { ...DEFAULT_WEIGHTS, ...options.weights }

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Query candidates with hard filters using search index
    // ═══════════════════════════════════════════════════════════════

    let query = supabase
      .from('candidate_search_index')
      .select('*')
      .contains('roles', [criteria.role])
      .not('compliance_status', 'in', '(rejected,expired)')

    // Availability filter
    const statuses = criteria.availability?.status || ['available', 'available_soon']
    query = query.in('availability_status', statuses)

    // Required certifications
    if (criteria.certifications?.required?.length) {
      query = query.contains('certification_codes', criteria.certifications.required)
    }

    // Pool filter
    if (criteria.include_pool_ids?.length) {
      query = query.overlaps('pool_ids', criteria.include_pool_ids)
    }

    // Exclude candidates
    if (criteria.exclude_candidate_ids?.length) {
      query = query.not('candidate_id', 'in', `(${criteria.exclude_candidate_ids.join(',')})`)
    }

    const { data: candidates, error: queryError } = await query.limit(limit * 2)

    if (queryError) {
      throw new Error(`Query failed: ${queryError.message}`)
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Score each candidate
    // ═══════════════════════════════════════════════════════════════

    const results: MatchResult[] = []

    for (const candidate of candidates || []) {
      const scores = calculateScores(candidate, criteria, weights)
      const totalScore = calculateTotalScore(scores, weights)
      const blockers = identifyBlockers(candidate, criteria)
      const recommendation = getRecommendation(totalScore, blockers)

      results.push({
        candidate_id: candidate.candidate_id,
        total_score: totalScore,
        scores,
        recommendation,
        blockers,
        candidate: {
          id: candidate.candidate_id,
          first_name: candidate.first_name,
          last_name: candidate.last_name,
          email: candidate.email,
          phone: candidate.phone,
          primary_role: candidate.primary_role,
          experience_years: candidate.experience_years,
          availability_status: candidate.availability_status,
          available_from: candidate.available_from,
          compliance_status: candidate.compliance_status,
          internal_rating: candidate.internal_rating,
          profile_image_url: candidate.profile_image_url,
        },
      })
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Sort and group results
    // ═══════════════════════════════════════════════════════════════

    results.sort((a, b) => b.total_score - a.total_score)
    const topResults = results.slice(0, limit)

    const grouped = {
      strong: topResults.filter(r => r.recommendation === 'strong'),
      good: topResults.filter(r => r.recommendation === 'good'),
      possible: topResults.filter(r => r.recommendation === 'possible'),
      weak: topResults.filter(r => r.recommendation === 'weak'),
    }

    const duration = Date.now() - startTime

    return new Response(
      JSON.stringify({
        results: topResults,
        grouped,
        total_count: results.length,
        meta: {
          duration_ms: duration,
          within_target: duration < 10000,
          criteria_summary: {
            role: criteria.role,
            certifications_required: criteria.certifications?.required?.length || 0,
          },
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Matching error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function calculateScores(
  candidate: any,
  criteria: MatchingCriteria,
  weights: typeof DEFAULT_WEIGHTS
) {
  return {
    certifications: scoreCertifications(candidate, criteria),
    experience: scoreExperience(candidate, criteria),
    availability: scoreAvailability(candidate, criteria),
    rating: scoreRating(candidate),
  }
}

function scoreCertifications(candidate: any, criteria: MatchingCriteria): number {
  const required = criteria.certifications?.required || []
  const preferred = criteria.certifications?.preferred || []
  const candidateCerts = candidate.certification_codes || []

  if (required.length === 0 && preferred.length === 0) return 100

  let score = 0
  let total = required.length + preferred.length

  // Required certs (weighted more heavily)
  for (const cert of required) {
    if (candidateCerts.includes(cert)) {
      score += 2
    }
  }

  // Preferred certs
  for (const cert of preferred) {
    if (candidateCerts.includes(cert)) {
      score += 1
    }
  }

  const maxScore = required.length * 2 + preferred.length
  return Math.round((score / maxScore) * 100)
}

function scoreExperience(candidate: any, criteria: MatchingCriteria): number {
  const minYears = criteria.experience?.min_years || 0
  const preferredYears = criteria.experience?.preferred_years || minYears + 3
  const candidateYears = candidate.experience_years || 0

  if (candidateYears >= preferredYears) return 100
  if (candidateYears >= minYears) {
    const range = preferredYears - minYears
    const above = candidateYears - minYears
    return 50 + Math.round((above / range) * 50)
  }
  return 0
}

function scoreAvailability(candidate: any, criteria: MatchingCriteria): number {
  const status = candidate.availability_status
  const availableFrom = candidate.available_from ? new Date(candidate.available_from) : null
  const startDate = new Date(criteria.start_date)

  if (status === 'available') return 100
  if (status === 'available_soon') {
    if (availableFrom && availableFrom <= startDate) return 90
    return 60
  }
  if (status === 'on_assignment') return 30
  return 0
}

function scoreRating(candidate: any): number {
  const rating = candidate.internal_rating
  if (!rating) return 50 // Neutral score for unrated
  return Math.round((rating / 5) * 100)
}

function calculateTotalScore(
  scores: Record<string, number>,
  weights: typeof DEFAULT_WEIGHTS
): number {
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0)
  let weightedSum = 0

  for (const [key, weight] of Object.entries(weights)) {
    weightedSum += (scores[key as keyof typeof scores] || 0) * weight
  }

  return Math.round(weightedSum / totalWeight)
}

function identifyBlockers(candidate: any, criteria: MatchingCriteria): Array<{ type: string; description: string }> {
  const blockers: Array<{ type: string; description: string }> = []

  // Compliance issues
  if (candidate.compliance_status === 'documents_pending') {
    blockers.push({ type: 'compliance', description: 'Dokumenter mangler' })
  }
  if (candidate.compliance_status === 'review_pending') {
    blockers.push({ type: 'compliance', description: 'Venter på godkjenning' })
  }

  // Missing required certifications
  const required = criteria.certifications?.required || []
  const candidateCerts = candidate.certification_codes || []
  const missingCerts = required.filter((c: string) => !candidateCerts.includes(c))
  if (missingCerts.length > 0) {
    blockers.push({ type: 'certification', description: `Mangler: ${missingCerts.join(', ')}` })
  }

  // Availability
  if (candidate.availability_status === 'on_assignment') {
    blockers.push({ type: 'availability', description: 'På oppdrag' })
  }

  return blockers
}

function getRecommendation(score: number, blockers: any[]): 'strong' | 'good' | 'possible' | 'weak' {
  const hasBlockers = blockers.some(b => b.type === 'certification' || b.type === 'compliance')
  
  if (hasBlockers) return score >= 60 ? 'possible' : 'weak'
  if (score >= 85) return 'strong'
  if (score >= 70) return 'good'
  if (score >= 50) return 'possible'
  return 'weak'
}
