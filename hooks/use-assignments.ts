'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type {
  Assignment,
  AssignmentStatus,
  AssignmentFilters,
  ReleaseChecklist,
} from '@/types/operations'

// ═══════════════════════════════════════════════════════════════════════════════
// QUERY KEYS
// ═══════════════════════════════════════════════════════════════════════════════

export const assignmentKeys = {
  all: ['assignments'] as const,
  lists: () => [...assignmentKeys.all, 'list'] as const,
  list: (filters: AssignmentFilters) => [...assignmentKeys.lists(), filters] as const,
  pipeline: () => [...assignmentKeys.all, 'pipeline'] as const,
  details: () => [...assignmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...assignmentKeys.details(), id] as const,
  forCandidate: (candidateId: string) => [...assignmentKeys.all, 'candidate', candidateId] as const,
  forOrganization: (orgId: string) => [...assignmentKeys.all, 'organization', orgId] as const,
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIST ASSIGNMENTS
// ═══════════════════════════════════════════════════════════════════════════════

interface UseAssignmentsOptions {
  filters?: AssignmentFilters
  page?: number
  pageSize?: number
}

export function useAssignments(options: UseAssignmentsOptions = {}) {
  const { filters = {}, page = 1, pageSize = 50 } = options
  const supabase = createClient()

  return useQuery({
    queryKey: assignmentKeys.list({ ...filters, page, pageSize } as any),
    queryFn: async () => {
      let query = supabase
        .from('assignments')
        .select(`
          *,
          organization:crm_contacts!organization_id(id, name, company),
          candidate:candidates(id, first_name, last_name, primary_role, avatar_url, phone, email),
          request:customer_requests(id, request_number, title)
        `, { count: 'exact' })

      // Apply filters
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,assignment_number.ilike.%${filters.search}%`)
      }

      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }

      if (filters.organization_id) {
        query = query.eq('organization_id', filters.organization_id)
      }

      if (filters.candidate_id) {
        query = query.eq('candidate_id', filters.candidate_id)
      }

      if (filters.owner_id) {
        query = query.eq('owner_id', filters.owner_id)
      }

      if (filters.date_range?.start) {
        query = query.gte('planned_start_date', filters.date_range.start)
      }

      if (filters.date_range?.end) {
        query = query.lte('planned_start_date', filters.date_range.end)
      }

      // Pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      // Order by start date desc
      query = query.order('planned_start_date', { ascending: false })

      const { data, error, count } = await query

      if (error) throw error

      return {
        assignments: (data || []) as Assignment[],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      }
    },
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLE ASSIGNMENT
// ═══════════════════════════════════════════════════════════════════════════════

export function useAssignment(id: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: assignmentKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null

      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          organization:crm_contacts!organization_id(id, name, company, email, phone),
          candidate:candidates(id, first_name, last_name, primary_role, avatar_url, phone, email, compliance_status),
          request:customer_requests(id, request_number, title)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Assignment
    },
    enabled: !!id,
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// PIPELINE DATA (for status board)
// ═══════════════════════════════════════════════════════════════════════════════

export function useAssignmentPipeline() {
  const supabase = createClient()

  return useQuery({
    queryKey: assignmentKeys.pipeline(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          candidate:candidates(id, first_name, last_name, primary_role, avatar_url)
        `)
        .not('status', 'in', '(cancelled)')
        .order('planned_start_date', { ascending: true })

      if (error) throw error

      // Group by status
      const byStatus: Record<AssignmentStatus, Assignment[]> = {
        draft: [],
        pending_compliance: [],
        compliance_ok: [],
        contract_drafting: [],
        contract_sent: [],
        contract_signed: [],
        ready_for_start: [],
        active: [],
        completed: [],
        invoiced: [],
        paid: [],
        cancelled: [],
      }

      for (const assignment of (data || []) as Assignment[]) {
        if (byStatus[assignment.status]) {
          byStatus[assignment.status].push(assignment)
        }
      }

      return { byStatus }
    },
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// MUTATIONS
// ═══════════════════════════════════════════════════════════════════════════════

type CreateAssignmentInput = Omit<Assignment, 'id' | 'assignment_number' | 'created_at' | 'updated_at' | 'organization' | 'candidate' | 'request'>

export function useCreateAssignment() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: CreateAssignmentInput) => {
      // Generate assignment number
      const { count } = await supabase
        .from('assignments')
        .select('id', { count: 'exact', head: true })

      const currentCount = count || 0
      const year = new Date().getFullYear()
      const assignmentNumber = `ASN-${year}-${String(currentCount + 1).padStart(4, '0')}`

      const { data, error } = await supabase
        .from('assignments')
        .insert({
          ...input,
          assignment_number: assignmentNumber,
        })
        .select()
        .single()

      if (error) throw error
      return data as Assignment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all })
    },
  })
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Assignment>
    }) => {
      const { data, error } = await supabase
        .from('assignments')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Assignment
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all })
      queryClient.setQueryData(assignmentKeys.detail(data.id), data)
    },
  })
}

export function useUpdateAssignmentStatus() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string
      status: AssignmentStatus
    }) => {
      const updates: Partial<Assignment> = { status }

      // Set actual dates based on status
      if (status === 'active') {
        updates.actual_start_date = new Date().toISOString().split('T')[0]
      } else if (status === 'completed') {
        updates.actual_end_date = new Date().toISOString().split('T')[0]
      }

      const { data, error } = await supabase
        .from('assignments')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Assignment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all })
    },
  })
}

export function useUpdateReleaseChecklist() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      id,
      checklist,
    }: {
      id: string
      checklist: ReleaseChecklist
    }) => {
      const { data, error } = await supabase
        .from('assignments')
        .update({ release_checklist: checklist })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Assignment
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.detail(data.id) })
    },
  })
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all })
    },
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE FROM SHORTLIST
// ═══════════════════════════════════════════════════════════════════════════════

interface CreateFromShortlistInput {
  shortlist_entry_id: string
  request_id: string
  candidate_id: string
  organization_id?: string
  title: string
  role: string
  planned_start_date: string
  planned_end_date?: string
  employee_rate_amount_nok?: number
  billing_rate_amount_nok?: number
}

export function useCreateAssignmentFromShortlist() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: CreateFromShortlistInput) => {
      // Generate assignment number
      const { count } = await supabase
        .from('assignments')
        .select('id', { count: 'exact', head: true })

      const currentCount = count || 0
      const year = new Date().getFullYear()
      const assignmentNumber = `ASN-${year}-${String(currentCount + 1).padStart(4, '0')}`

      // Create assignment
      const { data: assignment, error: assignmentError } = await supabase
        .from('assignments')
        .insert({
          assignment_number: assignmentNumber,
          request_id: input.request_id,
          organization_id: input.organization_id || null,
          candidate_id: input.candidate_id,
          title: input.title,
          role: input.role,
          planned_start_date: input.planned_start_date,
          planned_end_date: input.planned_end_date || null,
          employee_rate_type: 'daily',
          employee_rate_amount_nok: input.employee_rate_amount_nok || null,
          billing_rate_type: 'daily',
          billing_rate_amount_nok: input.billing_rate_amount_nok || null,
          status: 'draft',
        })
        .select()
        .single()

      if (assignmentError) throw assignmentError

      // Update shortlist entry status
      const { error: shortlistError } = await supabase
        .from('request_shortlists')
        .update({ status: 'converted' })
        .eq('id', input.shortlist_entry_id)

      if (shortlistError) throw shortlistError

      return assignment as Assignment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all })
      queryClient.invalidateQueries({ queryKey: ['shortlists'] })
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}
