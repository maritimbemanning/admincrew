'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type {
  Nonconformity,
  NcFilters,
  CreateNonconformityInput,
  UpdateNonconformityInput,
  CapaAction,
  CreateCapaInput,
  UpdateCapaInput,
  NcStatus,
  CapaStatus,
} from '@/types/qms'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const ncKeys = {
  all: ['nonconformities'] as const,
  lists: () => [...ncKeys.all, 'list'] as const,
  list: (filters: NcFilters) => [...ncKeys.lists(), filters] as const,
  details: () => [...ncKeys.all, 'detail'] as const,
  detail: (id: string) => [...ncKeys.details(), id] as const,
  open: () => [...ncKeys.all, 'open'] as const,
  overdue: () => [...ncKeys.all, 'overdue'] as const,
}

export const capaKeys = {
  all: ['capa'] as const,
  byNc: (ncId: string) => [...capaKeys.all, 'nc', ncId] as const,
}

// ============================================================================
// NC LIST HOOK
// ============================================================================

interface UseNonconformitiesOptions {
  filters?: NcFilters
  page?: number
  pageSize?: number
}

export function useNonconformities(options: UseNonconformitiesOptions = {}) {
  const { filters = {}, page = 1, pageSize = 20 } = options
  const supabase = createClient()

  return useQuery({
    queryKey: ncKeys.list({ ...filters, page, pageSize } as NcFilters),
    queryFn: async () => {
      let query = supabase
        .from('qms_nonconformities')
        .select(
          `
          *,
          responsible:user_profiles!qms_nonconformities_responsible_id_fkey(id, full_name, email),
          reporter:user_profiles!qms_nonconformities_reported_by_fkey(id, full_name, email),
          capa_actions:qms_capa_actions(*)
        `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,nc_number.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        )
      }

      if (filters.severity && filters.severity.length > 0) {
        query = query.in('severity', filters.severity)
      }

      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }

      if (filters.source && filters.source.length > 0) {
        query = query.in('source', filters.source)
      }

      if (filters.responsible_id) {
        query = query.eq('responsible_id', filters.responsible_id)
      }

      if (filters.overdue) {
        const today = new Date().toISOString().split('T')[0]
        query = query
          .lte('due_date', today)
          .not('status', 'in', '(closed,verified)')
      }

      // Pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      return {
        nonconformities: data as Nonconformity[],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      }
    },
  })
}

// ============================================================================
// SINGLE NC HOOK
// ============================================================================

export function useNonconformity(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ncKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qms_nonconformities')
        .select(
          `
          *,
          responsible:user_profiles!qms_nonconformities_responsible_id_fkey(id, full_name, email),
          reporter:user_profiles!qms_nonconformities_reported_by_fkey(id, full_name, email),
          capa_actions:qms_capa_actions(
            *,
            responsible:user_profiles!qms_capa_actions_responsible_id_fkey(id, full_name, email)
          )
        `
        )
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Nonconformity
    },
    enabled: !!id,
  })
}

// ============================================================================
// OPEN NCS
// ============================================================================

export function useOpenNonconformities() {
  const supabase = createClient()

  return useQuery({
    queryKey: ncKeys.open(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qms_nonconformities')
        .select(
          `
          *,
          responsible:user_profiles!qms_nonconformities_responsible_id_fkey(id, full_name, email)
        `
        )
        .not('status', 'in', '(closed,verified)')
        .order('severity', { ascending: false })
        .order('due_date', { ascending: true })

      if (error) throw error
      return data as Nonconformity[]
    },
  })
}

// ============================================================================
// OVERDUE NCS
// ============================================================================

export function useOverdueNonconformities() {
  const supabase = createClient()

  return useQuery({
    queryKey: ncKeys.overdue(),
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('qms_nonconformities')
        .select(
          `
          *,
          responsible:user_profiles!qms_nonconformities_responsible_id_fkey(id, full_name, email)
        `
        )
        .lte('due_date', today)
        .not('status', 'in', '(closed,verified)')
        .order('due_date', { ascending: true })

      if (error) throw error
      return data as Nonconformity[]
    },
  })
}

// ============================================================================
// NC MUTATIONS
// ============================================================================

export function useCreateNonconformity() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: CreateNonconformityInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Generate NC number
      const year = new Date().getFullYear()
      const { count } = await supabase
        .from('qms_nonconformities')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', `${year}-01-01`)

      const currentCount = count || 0
      const ncNumber = `NC-${year}-${String(currentCount + 1).padStart(4, '0')}`

      const { data, error } = await supabase
        .from('qms_nonconformities')
        .insert({
          ...input,
          nc_number: ncNumber,
          status: 'open',
          reported_by: user?.id || null,
        })
        .select()
        .single()

      if (error) throw error
      return data as Nonconformity
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ncKeys.all })
    },
  })
}

export function useUpdateNonconformity() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateNonconformityInput & { id: string }) => {
      const { data, error } = await supabase
        .from('qms_nonconformities')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Nonconformity
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ncKeys.all })
      queryClient.invalidateQueries({ queryKey: ncKeys.detail(data.id) })
    },
  })
}

export function useUpdateNcStatus() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: NcStatus }) => {
      const updates: Record<string, unknown> = { status }

      if (status === 'closed') {
        updates.closed_at = new Date().toISOString()
      }

      if (status === 'verified') {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        updates.verified_at = new Date().toISOString()
        updates.verified_by = user?.id || null
      }

      const { data, error } = await supabase
        .from('qms_nonconformities')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Nonconformity
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ncKeys.all })
      queryClient.invalidateQueries({ queryKey: ncKeys.detail(data.id) })
    },
  })
}

// ============================================================================
// CAPA MUTATIONS
// ============================================================================

export function useCreateCapa() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: CreateCapaInput) => {
      const { data, error } = await supabase
        .from('qms_capa_actions')
        .insert({
          ...input,
          status: 'planned',
        })
        .select()
        .single()

      if (error) throw error
      return data as CapaAction
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ncKeys.detail(data.nonconformity_id) })
      queryClient.invalidateQueries({ queryKey: capaKeys.byNc(data.nonconformity_id) })
    },
  })
}

export function useUpdateCapa() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      id,
      ncId,
      ...input
    }: UpdateCapaInput & { id: string; ncId: string }) => {
      const { data, error } = await supabase
        .from('qms_capa_actions')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { ...data, ncId } as CapaAction & { ncId: string }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ncKeys.detail(data.ncId) })
      queryClient.invalidateQueries({ queryKey: capaKeys.byNc(data.ncId) })
    },
  })
}

export function useUpdateCapaStatus() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      id,
      ncId,
      status,
    }: {
      id: string
      ncId: string
      status: CapaStatus
    }) => {
      const updates: Record<string, unknown> = { status }

      if (status === 'completed') {
        updates.completed_at = new Date().toISOString()
      }

      if (status === 'verified') {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        updates.verified_at = new Date().toISOString()
        updates.verified_by = user?.id || null
      }

      const { data, error } = await supabase
        .from('qms_capa_actions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { ...data, ncId } as CapaAction & { ncId: string }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ncKeys.detail(data.ncId) })
      queryClient.invalidateQueries({ queryKey: capaKeys.byNc(data.ncId) })
    },
  })
}

export function useDeleteCapa() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ncId }: { id: string; ncId: string }) => {
      const { error } = await supabase.from('qms_capa_actions').delete().eq('id', id)

      if (error) throw error
      return { id, ncId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ncKeys.detail(data.ncId) })
      queryClient.invalidateQueries({ queryKey: capaKeys.byNc(data.ncId) })
    },
  })
}
