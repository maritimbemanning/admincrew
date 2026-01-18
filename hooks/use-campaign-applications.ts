'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type {
  CampaignApplication,
  CampaignFilters,
  CampaignStats,
  CampaignStatus,
  VisibleCampaignStatus,
} from '@/types/campaign'
import { getCvSignedUrl } from './use-inbox'

// ═══════════════════════════════════════════════════════════
// QUERY KEYS
// ═══════════════════════════════════════════════════════════

export const campaignKeys = {
  all: ['campaign-applications'] as const,
  lists: () => [...campaignKeys.all, 'list'] as const,
  list: (filters: CampaignFilters) => [...campaignKeys.lists(), filters] as const,
  details: () => [...campaignKeys.all, 'detail'] as const,
  detail: (id: string) => [...campaignKeys.details(), id] as const,
  stats: () => [...campaignKeys.all, 'stats'] as const,
}

// ═══════════════════════════════════════════════════════════
// FETCH FUNCTIONS
// ═══════════════════════════════════════════════════════════

async function fetchCampaignApplications(
  filters: CampaignFilters = {}
): Promise<CampaignApplication[]> {
  const supabase = createClient()

  let query = supabase
    .from('campaign_applications')
    .select(`
      id,
      candidate_id,
      name,
      email,
      phone,
      position,
      segment,
      status,
      cv_url,
      cv_filename,
      campaign,
      source_url,
      notes,
      gdpr_consent,
      gdpr_consent_date,
      marketing_consent,
      created_at,
      updated_at
    `)
    .order('created_at', { ascending: false })

  // IMPORTANT: Exclude 'ny' status by default - these are incomplete applications
  // 'ny' = just filled form, NOT Vipps verified, NO CV uploaded
  // Only show applications that are ready for review (pending+)
  if (filters.statuses && filters.statuses.length > 0) {
    query = query.in('status', filters.statuses)
  } else {
    // Default: exclude incomplete applications
    query = query.neq('status', 'ny')
  }

  if (filters.positions && filters.positions.length > 0) {
    query = query.in('position', filters.positions)
  }

  if (filters.segments && filters.segments.length > 0) {
    query = query.in('segment', filters.segments)
  }

  if (filters.verified === true) {
    query = query.not('candidate_id', 'is', null)
  } else if (filters.verified === false) {
    query = query.is('candidate_id', null)
  }

  if (filters.campaign) {
    query = query.eq('campaign', filters.campaign)
  }

  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }

  if (filters.dateTo) {
    query = query.lte('created_at', filters.dateTo)
  }

  const { data, error } = await query

  if (error) {
    console.error('[fetchCampaignApplications] Error:', error)
    throw error
  }

  return data || []
}

async function fetchCampaignApplication(id: string): Promise<CampaignApplication | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('campaign_applications')
    .select(`
      id,
      candidate_id,
      name,
      email,
      phone,
      position,
      segment,
      status,
      cv_url,
      cv_filename,
      campaign,
      source_url,
      notes,
      gdpr_consent,
      gdpr_consent_date,
      marketing_consent,
      created_at,
      updated_at
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('[fetchCampaignApplication] Error:', error)
    throw error
  }

  // If candidate_id exists, fetch profile data from bluecrew_profiles
  if (data?.candidate_id) {
    // candidate_id links to bluecrew_profiles.candidate_id
    const { data: profile } = await supabase
      .from('bluecrew_profiles')
      .select('first_name, last_name, primary_role, cv_key, phone')
      .eq('candidate_id', data.candidate_id)
      .single()

    if (profile) {
      return {
        ...data,
        candidate: {
          display_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || null,
          primary_role: profile.primary_role,
          cv_key: profile.cv_key,
          phone: profile.phone,
        },
      }
    }
  }

  return data
}

async function fetchCampaignStats(): Promise<CampaignStats> {
  const supabase = createClient()

  // IMPORTANT: Only count COMPLETE applications (exclude 'ny' status)
  // 'ny' = incomplete, not Vipps verified, no CV
  const { data: applications, error } = await supabase
    .from('campaign_applications')
    .select('status, position, segment, candidate_id, created_at')
    .neq('status', 'ny') // Exclude incomplete applications

  if (error) {
    console.error('[fetchCampaignStats] Error:', error.message || error)
    // Don't throw - return empty stats instead (might be auth issue)
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Use empty array if no data (auth error or no results)
  const apps = applications || []

  const stats: CampaignStats = {
    total: apps.length,
    byStatus: {
      // 'ny' removed - we don't show incomplete applications
      pending: 0,
      kontaktet: 0,
      intervju: 0,
      godkjent: 0,
      avvist: 0,
      arkivert: 0,
    },
    byPosition: {
      offshore: 0,
      elektriker: 0,
      riggere: 0,
      rov: 0,
      mekaniker: 0,
      sveiser: 0,
      eto: 0,
    },
    bySegment: {
      offshore: 0,
      oppdrett: 0,
      shipping: 0,
    },
    verified: 0,
    unverified: 0,
    newToday: 0,
    newThisWeek: 0,
  }

  apps.forEach((app) => {
    // Count by status (only visible/complete statuses)
    if (app.status in stats.byStatus) {
      stats.byStatus[app.status as VisibleCampaignStatus]++
    }

    // Count by position
    if (app.position in stats.byPosition) {
      stats.byPosition[app.position as keyof typeof stats.byPosition]++
    }

    // Count by segment
    if (app.segment in stats.bySegment) {
      stats.bySegment[app.segment as keyof typeof stats.bySegment]++
    }

    // Count verified (has Bluecrew Profile linked)
    if (app.candidate_id) {
      stats.verified++
    } else {
      stats.unverified++
    }

    // Count new applications (completed this period)
    const createdAt = new Date(app.created_at)
    if (createdAt >= today) {
      stats.newToday++
    }
    if (createdAt >= weekAgo) {
      stats.newThisWeek++
    }
  })

  return stats
}

// ═══════════════════════════════════════════════════════════
// QUERY HOOKS
// ═══════════════════════════════════════════════════════════

export function useCampaignApplications(filters: CampaignFilters = {}) {
  return useQuery({
    queryKey: campaignKeys.list(filters),
    queryFn: () => fetchCampaignApplications(filters),
  })
}

export function useCampaignApplication(id: string) {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: () => fetchCampaignApplication(id),
    enabled: !!id,
  })
}

export function useCampaignStats() {
  return useQuery({
    queryKey: campaignKeys.stats(),
    queryFn: fetchCampaignStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

// ═══════════════════════════════════════════════════════════
// MUTATION HOOKS
// ═══════════════════════════════════════════════════════════

export function useUpdateCampaignStatus() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CampaignStatus }) => {
      const { error } = await supabase
        .from('campaign_applications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.all })
    },
    onError: (error, variables) => {
      console.error('[useUpdateCampaignStatus] Failed:', {
        id: variables.id,
        status: variables.status,
        error: error instanceof Error ? error.message : error,
      })
    },
  })
}

export function useUpdateCampaignNotes() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from('campaign_applications')
        .update({ notes, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.all })
    },
    onError: (error, variables) => {
      console.error('[useUpdateCampaignNotes] Failed:', {
        id: variables.id,
        error: error instanceof Error ? error.message : error,
      })
    },
  })
}

export function useLinkCampaignToCandidate() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, candidateId }: { id: string; candidateId: string }) => {
      const { error } = await supabase
        .from('campaign_applications')
        .update({ candidate_id: candidateId, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.all })
    },
    onError: (error, variables) => {
      console.error('[useLinkCampaignToCandidate] Failed:', {
        id: variables.id,
        candidateId: variables.candidateId,
        error: error instanceof Error ? error.message : error,
      })
    },
  })
}

export function useBulkUpdateCampaignStatus() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: CampaignStatus }) => {
      const { error } = await supabase
        .from('campaign_applications')
        .update({ status, updated_at: new Date().toISOString() })
        .in('id', ids)

      if (error) throw error
      return { successful: ids.length, total: ids.length }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.all })
    },
    onError: (error, variables) => {
      console.error('[useBulkUpdateCampaignStatus] Failed:', {
        ids: variables.ids,
        status: variables.status,
        error: error instanceof Error ? error.message : error,
      })
    },
  })
}

// ═══════════════════════════════════════════════════════════
// CV DOWNLOAD HELPER
// ═══════════════════════════════════════════════════════════

/**
 * Get signed URL for CV download
 * Reuses logic from use-inbox.ts since CVs are in same bucket
 * Note: getCvSignedUrl is also exported from use-inbox, import from there if needed
 */
export { getCvSignedUrl }

// Note: useCvDownloadUrl is already exported from use-inbox.ts
// Don't re-export here to avoid conflicts
