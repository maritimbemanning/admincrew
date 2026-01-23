/**
 * Candidates API Helper
 *
 * Server-side API functions for candidate operations.
 */

import { createClient } from '@/lib/supabase/server'
import type {
  TablesInsert,
  TablesUpdate,
  Candidate,
  AvailabilityStatus,
  ComplianceStatus
} from '@/types/database.types'

// ═══════════════════════════════════════════════════════
// INPUT TYPES
// ═══════════════════════════════════════════════════════

export type CreateCandidateInput = TablesInsert<'candidates'>
export type UpdateCandidateInput = TablesUpdate<'candidates'>

export interface CandidateFilters {
  search?: string
  availability?: string[]
  compliance?: string[]
  skills?: string[]
  certifications?: string[]
  minRating?: number
  maxHourlyRate?: number
  locations?: string[]
  poolId?: string
}

export interface CandidateListOptions {
  filters?: CandidateFilters
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Get candidates list with filters
 */
export async function getCandidates(options: CandidateListOptions = {}) {
  const supabase = await createClient()
  const {
    filters = {},
    limit = 50,
    offset = 0,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = options

  let query = supabase
    .from('candidates')
    .select('*, candidate_skills(skill_id, skills(name)), candidate_certifications(certification_id, certifications(name, expires_at))', { count: 'exact' })
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(offset, offset + limit - 1)

  // Apply filters
  if (filters.search) {
    query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
  }

  if (filters.availability?.length) {
    query = query.in('availability_status', filters.availability)
  }

  if (filters.compliance?.length) {
    query = query.in('compliance_status', filters.compliance)
  }

  if (filters.minRating) {
    query = query.gte('rating', filters.minRating)
  }

  if (filters.maxHourlyRate) {
    query = query.lte('hourly_rate', filters.maxHourlyRate)
  }

  if (filters.poolId) {
    query = query.eq('pool_id', filters.poolId)
  }

  const { data, error, count } = await query

  if (error) throw error

  return { candidates: data, count: count ?? 0 }
}

/**
 * Get single candidate by ID
 */
export async function getCandidate(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('candidates')
    .select(`
      *,
      candidate_skills(skill_id, skills(id, name, category)),
      candidate_certifications(certification_id, certifications(id, name, issuing_org, expires_at)),
      candidate_documents(id, document_type, file_name, uploaded_at, status)
    `)
    .eq('id', id)
    .single()

  if (error) throw error

  return data
}

/**
 * Create new candidate
 */
export async function createCandidate(input: CreateCandidateInput): Promise<Candidate> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('candidates')
    .insert(input)
    .select()
    .single()

  if (error) throw error

  return data
}

/**
 * Update candidate
 */
export async function updateCandidate(id: string, input: UpdateCandidateInput): Promise<Candidate> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('candidates')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return data
}

/**
 * Delete candidate
 */
export async function deleteCandidate(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('candidates')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Add skill to candidate
 */
export async function addCandidateSkill(candidateId: string, skillId: string, level?: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('candidate_skills')
    .insert({
      candidate_id: candidateId,
      skill_id: skillId,
      proficiency_level: level || 3,
    })
    .select()
    .single()

  if (error) throw error

  return data
}

/**
 * Remove skill from candidate
 */
export async function removeCandidateSkill(candidateId: string, skillId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('candidate_skills')
    .delete()
    .eq('candidate_id', candidateId)
    .eq('skill_id', skillId)

  if (error) throw error
}

/**
 * Add certification to candidate
 */
export async function addCandidateCertification(
  candidateId: string,
  certificationId: string,
  expiresAt?: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('candidate_certifications')
    .insert({
      candidate_id: candidateId,
      certification_id: certificationId,
      expires_at: expiresAt,
    })
    .select()
    .single()

  if (error) throw error

  return data
}

/**
 * Upload candidate document
 */
export async function uploadCandidateDocument(
  candidateId: string,
  file: File,
  documentType: string
) {
  const supabase = await createClient()

  // Upload file to storage
  const fileName = `${candidateId}/${documentType}/${Date.now()}-${file.name}`
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('candidate-documents')
    .upload(fileName, file)

  if (uploadError) throw uploadError

  // Create document record
  const { data, error } = await supabase
    .from('candidate_documents')
    .insert({
      candidate_id: candidateId,
      document_type: documentType,
      file_name: file.name,
      file_path: uploadData.path,
      file_size: file.size,
      mime_type: file.type,
      status: 'pending_review',
    })
    .select()
    .single()

  if (error) throw error

  return data
}

/**
 * Get candidates for matching
 */
export async function getCandidatesForMatching(
  requirements: {
    skills: string[]
    certifications?: string[]
    availability?: string
    location?: string
  }
) {
  const supabase = await createClient()

  // Start with base query
  let query = supabase
    .from('candidates')
    .select(`
      *,
      candidate_skills(skill_id, skills(id, name)),
      candidate_certifications(certification_id, certifications(id, name))
    `)
    .eq('availability_status', requirements.availability || 'available')
    .eq('compliance_status', 'approved')

  const { data, error } = await query

  if (error) throw error

  // Define types for the query result
  interface CandidateSkillRelation {
    skill_id: string
    skills: { id: string; name: string } | null
  }

  interface CandidateCertRelation {
    certification_id: string
    certifications: { id: string; name: string } | null
  }

  interface CandidateWithRelations extends Candidate {
    candidate_skills?: CandidateSkillRelation[]
    candidate_certifications?: CandidateCertRelation[]
  }

  // Score and filter candidates
  const scoredCandidates = (data as CandidateWithRelations[]).map((candidate) => {
    let score = 0
    const candidateSkillIds = candidate.candidate_skills?.map((cs) => cs.skill_id) || []

    // Score based on matching skills
    requirements.skills.forEach((skillId) => {
      if (candidateSkillIds.includes(skillId)) {
        score += 20
      }
    })

    return { ...candidate, matchScore: score }
  })

  // Sort by score and return top matches
  return scoredCandidates
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 20)
}
