'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// ═══════════════════════════════════════════════════════
// TYPES - Matching actual database tables
// ═══════════════════════════════════════════════════════

// candidates table - new registrations from bluecrew.no
export interface InboxCandidate {
  id: string
  name: string
  email: string
  phone: string | null
  status: string
  pipeline_stage: string | null
  cv_key: string | null
  rolle: string | null
  erfaring: string | null
  fylke: string | null
  created_at: string
}

// candidate_interest table - interest leads from bluecrew.no
export interface InboxInterest {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  pipeline_status: string
  status: string
  experience: number | null
  notes: string | null
  cv_url: string | null
  created_at: string
}

// leads table - B2B staffing needs
export interface InboxLead {
  id: string
  company: string
  contact: string
  email: string
  phone: string | null
  need_type: string
  need_duration: string
  num_people: string | null
  start_date: string | null
  work_location: string | null
  status: string
  created_at: string
}

export interface InboxStats {
  newApplications: number
  newLeads: number
  newStaffingNeeds: number
  total: number
}

// Legacy type aliases for backwards compatibility
export type JobApplication = InboxCandidate
export type InterestLead = InboxInterest
export type StaffingNeed = InboxLead

// ═══════════════════════════════════════════════════════
// QUERY KEYS
// ═══════════════════════════════════════════════════════

export const inboxKeys = {
  all: ['inbox'] as const,
  applications: () => [...inboxKeys.all, 'applications'] as const,
  leads: () => [...inboxKeys.all, 'leads'] as const,
  staffing: () => [...inboxKeys.all, 'staffing'] as const,
  stats: () => [...inboxKeys.all, 'stats'] as const,
}

// ═══════════════════════════════════════════════════════
// FETCH FUNCTIONS - Now querying correct tables
// ═══════════════════════════════════════════════════════

async function fetchNewCandidates(): Promise<InboxCandidate[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('candidates')
    .select('id, name, email, phone, status, pipeline_stage, cv_key, rolle, erfaring, fylke, created_at')
    .eq('pipeline_stage', 'ny')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[fetchNewCandidates] Error:', error)
    throw error
  }

  return data || []
}

async function fetchNewInterests(): Promise<InboxInterest[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('candidate_interest')
    .select('id, name, email, phone, role, pipeline_status, status, experience, notes, cv_url, created_at')
    .eq('pipeline_status', 'new')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[fetchNewInterests] Error:', error)
    throw error
  }
  return data || []
}

async function fetchNewLeads(): Promise<InboxLead[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('leads')
    .select('id, company, contact, email, phone, need_type, need_duration, num_people, start_date, work_location, status, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[fetchNewLeads] Error:', error)
    throw error
  }
  return data || []
}

async function fetchInboxStats(): Promise<InboxStats> {
  const supabase = createClient()

  const [candidates, interests, leads] = await Promise.all([
    supabase.from('candidates').select('id', { count: 'exact', head: true }).eq('pipeline_stage', 'ny'),
    supabase.from('candidate_interest').select('id', { count: 'exact', head: true }).eq('pipeline_status', 'new'),
    supabase.from('leads').select('id', { count: 'exact', head: true }),
  ])

  if (candidates.error) console.error('[fetchInboxStats] candidates error:', candidates.error)
  if (interests.error) console.error('[fetchInboxStats] interests error:', interests.error)
  if (leads.error) console.error('[fetchInboxStats] leads error:', leads.error)

  return {
    newApplications: candidates.count || 0,
    newLeads: interests.count || 0,
    newStaffingNeeds: leads.count || 0,
    total: (candidates.count || 0) + (interests.count || 0) + (leads.count || 0),
  }
}

// ═══════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════

export function useJobApplications() {
  return useQuery({
    queryKey: inboxKeys.applications(),
    queryFn: fetchNewCandidates,
  })
}

export function useInterestLeads() {
  return useQuery({
    queryKey: inboxKeys.leads(),
    queryFn: fetchNewInterests,
  })
}

export function useStaffingNeeds() {
  return useQuery({
    queryKey: inboxKeys.staffing(),
    queryFn: fetchNewLeads,
  })
}

export function useInboxStats() {
  return useQuery({
    queryKey: inboxKeys.stats(),
    queryFn: fetchInboxStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

// Alias hooks with new names
export const useNewCandidates = useJobApplications
export const useNewInterests = useInterestLeads
export const useNewLeads = useStaffingNeeds

// Stats hooks - aliases to useInboxStats for backwards compatibility
export function useJobApplicationStats() {
  const { data: stats, ...rest } = useInboxStats()
  return {
    ...rest,
    data: stats ? { count: stats.newApplications, pending: stats.newApplications, new: stats.newApplications, total: stats.newApplications } : null
  }
}

export function useInterestLeadStats() {
  const { data: stats, ...rest } = useInboxStats()
  return {
    ...rest,
    data: stats ? { count: stats.newLeads, pending: stats.newLeads, new: stats.newLeads, total: stats.newLeads } : null
  }
}

export function useStaffingNeedStats() {
  const { data: stats, ...rest } = useInboxStats()
  return {
    ...rest,
    data: stats ? { count: stats.newStaffingNeeds, pending: stats.newStaffingNeeds, new: stats.newStaffingNeeds, total: stats.newStaffingNeeds } : null
  }
}

export function useInboxTotalStats() {
  const { data: stats, ...rest } = useInboxStats()
  return {
    ...rest,
    data: stats ? { count: stats.total, pending: stats.total, new: stats.total, total: stats.total } : null
  }
}

// ═══════════════════════════════════════════════════════
// MUTATIONS
// ═══════════════════════════════════════════════════════

// Mark a candidate as reviewed (move from 'ny' pipeline stage)
export function useMarkCandidateReviewed() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (candidateId: string) => {
      const { error } = await supabase
        .from('candidates')
        .update({ pipeline_stage: 'vurdert' })
        .eq('id', candidateId)

      if (error) throw error
      return { candidateId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inboxKeys.all })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
    onError: (error, candidateId) => {
      console.error('[useMarkCandidateReviewed] Failed:', {
        candidateId,
        error: error instanceof Error ? error.message : error,
      })
    },
  })
}

// Convert interest lead to candidate
export function useConvertInterestToCandidate() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (interestId: string) => {
      // 1. Get the interest lead
      const { data: interest, error: interestError } = await supabase
        .from('candidate_interest')
        .select('*')
        .eq('id', interestId)
        .single()

      if (interestError) throw interestError

      // 2. Check if candidate already exists (by email)
      const { data: existing } = await supabase
        .from('candidates')
        .select('id')
        .eq('email', interest.email)
        .single()

      if (existing) {
        // Update interest status
        await supabase
          .from('candidate_interest')
          .update({ pipeline_status: 'converted', status: 'konvertert' })
          .eq('id', interestId)

        return { candidateId: existing.id, isNew: false }
      }

      // 3. Create new candidate
      const { data: newCandidate, error: createError } = await supabase
        .from('candidates')
        .insert({
          name: interest.name,
          email: interest.email,
          phone: interest.phone,
          rolle: interest.role,
          erfaring: interest.experience?.toString() || null,
          cv_key: interest.cv_url,
          status: 'pending',
          pipeline_stage: 'ny',
          source: 'interest_lead',
        })
        .select('id')
        .single()

      if (createError) throw createError

      // 4. Update interest status
      await supabase
        .from('candidate_interest')
        .update({ pipeline_status: 'converted', status: 'konvertert' })
        .eq('id', interestId)

      return { candidateId: newCandidate.id, isNew: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inboxKeys.all })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
    onError: (error, interestId) => {
      console.error('[useConvertInterestToCandidate] Failed:', {
        interestId,
        error: error instanceof Error ? error.message : error,
      })
    },
  })
}

// Update candidate status
export function useUpdateCandidateStatus() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, status, pipeline_stage }: { id: string; status?: string; pipeline_stage?: string }) => {
      const updates: Record<string, string> = {}
      if (status) updates.status = status
      if (pipeline_stage) updates.pipeline_stage = pipeline_stage

      const { error } = await supabase
        .from('candidates')
        .update(updates)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inboxKeys.applications() })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
  })
}

// Update interest status
export function useUpdateInterestStatus() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, status, pipeline_status }: { id: string; status?: string; pipeline_status?: string }) => {
      const updates: Record<string, string> = {}
      if (status) updates.status = status
      if (pipeline_status) updates.pipeline_status = pipeline_status

      const { error } = await supabase
        .from('candidate_interest')
        .update(updates)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inboxKeys.leads() })
    },
  })
}

// Bulk mark candidates as reviewed
export function useBulkMarkCandidatesReviewed() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (candidateIds: string[]) => {
      const { error } = await supabase
        .from('candidates')
        .update({ pipeline_stage: 'vurdert' })
        .in('id', candidateIds)

      if (error) throw error
      return { successful: candidateIds.length, failed: 0, total: candidateIds.length }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inboxKeys.all })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
  })
}

// Legacy alias for backwards compatibility
export const useConvertApplicationToCandidate = useMarkCandidateReviewed
export const useConvertLeadToCandidate = useConvertInterestToCandidate
export const useUpdateApplicationStatus = useUpdateCandidateStatus
export const useBulkConvertApplications = useBulkMarkCandidatesReviewed

// Update lead (staffing need) status
export function useUpdateLeadStatus() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('leads')
        .update({ status })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inboxKeys.staffing() })
      queryClient.invalidateQueries({ queryKey: inboxKeys.stats() })
    },
  })
}

// Update job application (candidate) status - alias for portal components
export function useUpdateJobApplicationStatus() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('candidates')
        .update({ status })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inboxKeys.applications() })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
  })
}

// Update staffing need status - alias
export const useUpdateStaffingNeedStatus = useUpdateLeadStatus

// Convert lead to customer request
export function useConvertToCustomerRequest() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (leadId: string) => {
      // 1. Get the lead
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single()

      if (leadError) throw leadError

      // 2. Create customer request from lead data
      const { data: request, error: requestError } = await supabase
        .from('customer_requests')
        .insert({
          title: `${lead.need_type} - ${lead.company}`,
          organization_name: lead.company,
          contact_name: lead.contact,
          contact_email: lead.email,
          contact_phone: lead.phone,
          role_needed: lead.need_type,
          quantity: lead.num_people ? parseInt(lead.num_people) : 1,
          start_date: lead.start_date,
          duration_description: lead.need_duration,
          work_location: lead.work_location,
          status: 'draft',
          source: 'lead',
          source_lead_id: leadId,
        })
        .select('id')
        .single()

      if (requestError) throw requestError

      // 3. Update lead status
      await supabase
        .from('leads')
        .update({ status: 'converted' })
        .eq('id', leadId)

      return { requestId: request.id }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inboxKeys.staffing() })
      queryClient.invalidateQueries({ queryKey: inboxKeys.stats() })
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
    onError: (error, leadId) => {
      console.error('[useConvertToCustomerRequest] Failed:', {
        leadId,
        error: error instanceof Error ? error.message : error,
      })
    },
  })
}

// ═══════════════════════════════════════════════════════
// CV / DOCUMENT HELPERS
// ═══════════════════════════════════════════════════════

export function useCvDownloadUrl(cvKey: string | null) {
  return useQuery({
    queryKey: ['cv-url', cvKey],
    queryFn: async () => {
      if (!cvKey) return null
      return getCvSignedUrl(cvKey)
    },
    enabled: !!cvKey,
    staleTime: 1000 * 60 * 50, // Cache i 50 minutter
  })
}

export function useCertificateDownloadUrl(certKey: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['cert-url', certKey],
    queryFn: async () => {
      if (!certKey) return null

      // Sertifikater ligger i candidate-certificates bucket
      const { data, error } = await supabase
        .storage
        .from('candidate-certificates')
        .createSignedUrl(certKey, 3600)

      if (error) throw error
      return data.signedUrl
    },
    enabled: !!certKey,
    staleTime: 1000 * 60 * 50,
  })
}

// Get signed URL for CV download
// Handles multiple formats:
// - uploads/... → candidate-cvs bucket (new applications from bluecrew.no)
// - cv/hash.pdf → candidate-documents bucket (legacy format)
// - other paths → tries both buckets
export async function getCvSignedUrl(cvKey: string): Promise<string | null> {
  const supabase = createClient()

  console.log('[getCvSignedUrl] Getting URL for:', cvKey)

  // Try candidate-cvs bucket first (most common for new applications)
  const { data, error } = await supabase
    .storage
    .from('candidate-cvs')
    .createSignedUrl(cvKey, 3600)

  if (!error && data?.signedUrl) {
    console.log('[getCvSignedUrl] Found in candidate-cvs bucket')
    return data.signedUrl
  }

  console.warn('[getCvSignedUrl] candidate-cvs failed:', error?.message, '- trying candidate-documents')

  // Fallback to candidate-documents bucket
  const { data: fallback, error: fallbackError } = await supabase
    .storage
    .from('candidate-documents')
    .createSignedUrl(cvKey, 3600)

  if (!fallbackError && fallback?.signedUrl) {
    console.log('[getCvSignedUrl] Found in candidate-documents bucket')
    return fallback.signedUrl
  }

  // If path starts with cv/, try the cvs/ folder format
  if (cvKey.startsWith('cv/')) {
    const hash = cvKey.replace('cv/', '').replace('.pdf', '')
    const legacyPath = `cvs/${hash}`
    console.log('[getCvSignedUrl] Trying legacy path:', legacyPath)

    const { data: legacyData, error: legacyError } = await supabase
      .storage
      .from('candidate-documents')
      .createSignedUrl(legacyPath, 3600)

    if (!legacyError && legacyData?.signedUrl) {
      console.log('[getCvSignedUrl] Found with legacy path')
      return legacyData.signedUrl
    }
  }

  console.error('[getCvSignedUrl] All buckets failed:', {
    cvKey,
    candidateCvsError: error?.message,
    candidateDocsError: fallbackError?.message
  })
  return null
}

export async function getCertificateSignedUrl(certKey: string): Promise<string | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .storage
    .from('candidate-certificates')
    .createSignedUrl(certKey, 3600)

  if (error) {
    console.error('Certificate URL error:', error)
    return null
  }
  return data.signedUrl
}
