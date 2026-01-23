'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type {
  QmsDocument,
  QmsDocumentFilters,
  CreateQmsDocumentInput,
  UpdateQmsDocumentInput,
  QmsDocumentStatus,
} from '@/types/qms'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const qmsDocumentKeys = {
  all: ['qms-documents'] as const,
  lists: () => [...qmsDocumentKeys.all, 'list'] as const,
  list: (filters: QmsDocumentFilters) => [...qmsDocumentKeys.lists(), filters] as const,
  details: () => [...qmsDocumentKeys.all, 'detail'] as const,
  detail: (id: string) => [...qmsDocumentKeys.details(), id] as const,
  reviewDue: () => [...qmsDocumentKeys.all, 'review-due'] as const,
}

// ============================================================================
// DOCUMENT LIST HOOK
// ============================================================================

interface UseQmsDocumentsOptions {
  filters?: QmsDocumentFilters
  page?: number
  pageSize?: number
}

export function useQmsDocuments(options: UseQmsDocumentsOptions = {}) {
  const { filters = {}, page = 1, pageSize = 20 } = options
  const supabase = createClient()

  return useQuery({
    queryKey: qmsDocumentKeys.list({ ...filters, page, pageSize } as QmsDocumentFilters),
    queryFn: async () => {
      let query = supabase
        .from('qms_documents')
        .select(
          `
          *,
          owner:user_profiles!qms_documents_owner_id_fkey(id, full_name, email),
          approver:user_profiles!qms_documents_approved_by_fkey(id, full_name, email)
        `,
          { count: 'exact' }
        )
        .is('archived_at', null)
        .order('updated_at', { ascending: false })

      // Apply filters
      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,document_number.ilike.%${filters.search}%`
        )
      }

      if (filters.type && filters.type.length > 0) {
        query = query.in('type', filters.type)
      }

      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }

      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      if (filters.owner_id) {
        query = query.eq('owner_id', filters.owner_id)
      }

      if (filters.review_due) {
        const today = new Date().toISOString().split('T')[0]
        query = query.lte('next_review_date', today)
      }

      // Pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      return {
        documents: data as QmsDocument[],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      }
    },
  })
}

// ============================================================================
// SINGLE DOCUMENT HOOK
// ============================================================================

export function useQmsDocument(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: qmsDocumentKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qms_documents')
        .select(
          `
          *,
          owner:user_profiles!qms_documents_owner_id_fkey(id, full_name, email),
          approver:user_profiles!qms_documents_approved_by_fkey(id, full_name, email)
        `
        )
        .eq('id', id)
        .single()

      if (error) throw error
      return data as QmsDocument
    },
    enabled: !!id,
  })
}

// ============================================================================
// DOCUMENTS DUE FOR REVIEW
// ============================================================================

export function useQmsDocumentsReviewDue() {
  const supabase = createClient()

  return useQuery({
    queryKey: qmsDocumentKeys.reviewDue(),
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('qms_documents')
        .select(
          `
          *,
          owner:user_profiles!qms_documents_owner_id_fkey(id, full_name, email)
        `
        )
        .eq('status', 'approved')
        .lte('next_review_date', today)
        .is('archived_at', null)
        .order('next_review_date', { ascending: true })

      if (error) throw error
      return data as QmsDocument[]
    },
  })
}

// ============================================================================
// DOCUMENT MUTATIONS
// ============================================================================

export function useCreateQmsDocument() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: CreateQmsDocumentInput) => {
      // Generate document number
      const { count } = await supabase
        .from('qms_documents')
        .select('id', { count: 'exact', head: true })

      const currentCount = count || 0
      const documentNumber = `DOC-${String(currentCount + 1).padStart(4, '0')}`

      const { data, error } = await supabase
        .from('qms_documents')
        .insert({
          ...input,
          document_number: documentNumber,
          current_version: 1,
          status: 'draft',
        })
        .select()
        .single()

      if (error) throw error
      return data as QmsDocument
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qmsDocumentKeys.all })
    },
  })
}

export function useUpdateQmsDocument() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateQmsDocumentInput & { id: string }) => {
      const { data, error } = await supabase
        .from('qms_documents')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as QmsDocument
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: qmsDocumentKeys.all })
      queryClient.invalidateQueries({ queryKey: qmsDocumentKeys.detail(data.id) })
    },
  })
}

export function useUpdateQmsDocumentStatus() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: QmsDocumentStatus }) => {
      const updates: Record<string, unknown> = { status }

      if (status === 'approved') {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        updates.approved_at = new Date().toISOString()
        updates.approved_by = user?.id || null
      }

      const { data, error } = await supabase
        .from('qms_documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as QmsDocument
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: qmsDocumentKeys.all })
      queryClient.invalidateQueries({ queryKey: qmsDocumentKeys.detail(data.id) })
    },
  })
}

export function useArchiveQmsDocument() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('qms_documents')
        .update({
          archived_at: new Date().toISOString(),
          status: 'obsolete',
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as QmsDocument
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qmsDocumentKeys.all })
    },
  })
}
