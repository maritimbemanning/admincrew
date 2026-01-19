'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// ═══════════════════════════════════════════════════════
// TYPES - Matching actual database tables
// ═══════════════════════════════════════════════════════

// bluecrew_profiles table - ALL candidates from bluecrew.no
export interface InboxCandidate {
  id: string
  first_name: string | null
  last_name: string | null
  name: string | null
  email: string
  phone: string | null
  status: string
  pipeline_stage: string | null
  cv_key: string | null
  primary_role: string | null
  experience_years: number | null
  internal_notes: string | null
  source: string | null
  created_at: string
}

// staffing_needs table - B2B staffing needs from bluecrew.no
export interface InboxLead {
  id: string
  bedrift: string | null
  kontakt_navn: string
  kontakt_epost: string
  kontakt_telefon: string | null
  fartoytype: string | null
  stillinger: string | null
  antall: number | null
  oppstart: string | null
  status: string
  created_at: string
}

export interface InboxStats {
  newCandidates: number
  newStaffingNeeds: number
  total: number
}

// Legacy type aliases for backwards compatibility
export type JobApplication = InboxCandidate
export type InterestLead = InboxCandidate // Now same as candidate
export type StaffingNeed = InboxLead
export type InboxInterest = InboxCandidate // Deprecated - use InboxCandidate

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

  const { data, error} = await supabase
    .from('bluecrew_profiles')
    .select('id, first_name, last_name, name, email, phone, status, pipeline_stage, cv_key, primary_role, experience_years, internal_notes, source, created_at')
    .eq('pipeline_stage', 'ny')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[fetchNewCandidates] Error:', error)
    throw error
  }

  return data || []
}

// DEPRECATED: interest_leads table no longer exists - all data is in candidates
async function fetchNewInterests(): Promise<InboxCandidate[]> {
  // Return empty - interest_leads table was merged into candidates
  console.warn('[fetchNewInterests] DEPRECATED: interest_leads merged into candidates table')
  return []
}

async function fetchNewLeads(): Promise<InboxLead[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('staffing_needs')
    .select('id, bedrift, kontakt_navn, kontakt_epost, kontakt_telefon, fartoytype, stillinger, antall, oppstart, status, created_at')
    .eq('status', 'new')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[fetchNewLeads] Error:', error)
    throw error
  }
  return data || []
}

async function fetchInboxStats(): Promise<InboxStats> {
  const supabase = createClient()

  const [candidates, leads] = await Promise.all([
    supabase.from('bluecrew_profiles').select('id', { count: 'exact', head: true }).eq('pipeline_stage', 'ny'),
    supabase.from('staffing_needs').select('id', { count: 'exact', head: true }).eq('status', 'new'),
  ])

  if (candidates.error) console.error('[fetchInboxStats] candidates error:', candidates.error)
  if (leads.error) console.error('[fetchInboxStats] leads error:', leads.error)

  return {
    newCandidates: candidates.count || 0,
    newStaffingNeeds: leads.count || 0,
    total: (candidates.count || 0) + (leads.count || 0),
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

// Stats hooks - simplified since interest_leads merged into candidates
export function useJobApplicationStats() {
  const { data: stats, ...rest } = useInboxStats()
  return {
    ...rest,
    data: stats ? { count: stats.newCandidates, pending: stats.newCandidates, new: stats.newCandidates, total: stats.newCandidates } : null
  }
}

// DEPRECATED: interest_leads merged into candidates
export function useInterestLeadStats() {
  const { data: stats, ...rest } = useInboxStats()
  return {
    ...rest,
    data: { count: 0, pending: 0, new: 0, total: 0 } // Always 0 - merged into candidates
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
        .from('bluecrew_profiles')
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

// DEPRECATED: interest_leads merged into candidates - this is now a no-op
export function useConvertInterestToCandidate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (candidateId: string) => {
      // No-op - all interests are already in candidates table
      console.warn('[useConvertInterestToCandidate] DEPRECATED: interests already in candidates table')
      return { candidateId, isNew: false }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inboxKeys.all })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
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
        .from('bluecrew_profiles')
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

// DEPRECATED: interest_leads merged into candidates - use useUpdateCandidateStatus instead
export function useUpdateInterestStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string; status?: string; pipeline_status?: string }) => {
      console.warn('[useUpdateInterestStatus] DEPRECATED: use useUpdateCandidateStatus instead')
      return { id }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inboxKeys.all })
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
        .from('bluecrew_profiles')
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
        .from('staffing_needs')
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
        .from('bluecrew_profiles')
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

// Convert staffing need to customer request
export function useConvertToCustomerRequest() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (leadId: string) => {
      // 1. Get the staffing need
      const { data: lead, error: leadError } = await supabase
        .from('staffing_needs')
        .select('*')
        .eq('id', leadId)
        .single()

      if (leadError) throw leadError

      // 2. Create customer request from lead data
      const { data: request, error: requestError } = await supabase
        .from('customer_requests')
        .insert({
          title: `${lead.stillinger || 'Bemanningsbehov'} - ${lead.bedrift || 'Ukjent bedrift'}`,
          organization_name: lead.bedrift,
          contact_name: lead.kontakt_navn,
          contact_email: lead.kontakt_epost,
          contact_phone: lead.kontakt_telefon,
          role_needed: lead.stillinger,
          quantity: lead.antall || 1,
          start_date: lead.oppstart,
          work_location: lead.fartoytype,
          status: 'draft',
          source: 'staffing_need',
          source_lead_id: leadId,
        })
        .select('id')
        .single()

      if (requestError) throw requestError

      // 3. Update staffing need status
      await supabase
        .from('staffing_needs')
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
