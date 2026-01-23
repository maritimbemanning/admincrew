'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type {
  Contract,
  ContractFilters,
  CreateContractInput,
  UpdateContractInput,
  ContractStatus,
  ContractParty,
  AddPartyInput,
} from '@/types/contracts'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const contractKeys = {
  all: ['contracts'] as const,
  lists: () => [...contractKeys.all, 'list'] as const,
  list: (filters: ContractFilters) => [...contractKeys.lists(), filters] as const,
  details: () => [...contractKeys.all, 'detail'] as const,
  detail: (id: string) => [...contractKeys.details(), id] as const,
  parties: (contractId: string) => [...contractKeys.all, 'parties', contractId] as const,
  templates: () => [...contractKeys.all, 'templates'] as const,
}

// ============================================================================
// CONTRACT LIST HOOK
// ============================================================================

interface UseContractsOptions {
  filters?: ContractFilters
  page?: number
  pageSize?: number
}

export function useContracts(options: UseContractsOptions = {}) {
  const { filters = {}, page = 1, pageSize = 20 } = options
  const supabase = createClient()

  return useQuery({
    queryKey: contractKeys.list({ ...filters, page, pageSize } as ContractFilters),
    queryFn: async () => {
      let query = supabase
        .from('contracts')
        .select(
          `
          *,
          assignment:assignments(id, assignment_number, title, role),
          organization:crm_organizations(id, name),
          candidate:candidates(id, first_name, last_name, email),
          parties:contract_parties(*)
        `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,contract_number.ilike.%${filters.search}%`
        )
      }

      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }

      if (filters.type && filters.type.length > 0) {
        query = query.in('type', filters.type)
      }

      if (filters.organization_id) {
        query = query.eq('organization_id', filters.organization_id)
      }

      if (filters.candidate_id) {
        query = query.eq('candidate_id', filters.candidate_id)
      }

      if (filters.assignment_id) {
        query = query.eq('assignment_id', filters.assignment_id)
      }

      if (filters.esign_status && filters.esign_status.length > 0) {
        query = query.in('esign_status', filters.esign_status)
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from)
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      // Pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      return {
        contracts: data as Contract[],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      }
    },
  })
}

// ============================================================================
// SINGLE CONTRACT HOOK
// ============================================================================

export function useContract(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: contractKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select(
          `
          *,
          assignment:assignments(id, assignment_number, title, role),
          organization:crm_organizations(id, name),
          candidate:candidates(id, first_name, last_name, email),
          parties:contract_parties(*)
        `
        )
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Contract
    },
    enabled: !!id,
  })
}

// ============================================================================
// CONTRACT MUTATIONS
// ============================================================================

export function useCreateContract() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: CreateContractInput) => {
      // Generate contract number
      const { count } = await supabase
        .from('contracts')
        .select('id', { count: 'exact', head: true })

      const currentCount = count || 0
      const year = new Date().getFullYear()
      const contractNumber = `CON-${year}-${String(currentCount + 1).padStart(4, '0')}`

      const { data, error } = await supabase
        .from('contracts')
        .insert({
          ...input,
          contract_number: contractNumber,
          status: 'draft',
          esign_status: 'not_started',
        })
        .select()
        .single()

      if (error) throw error
      return data as Contract
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.all })
    },
  })
}

export function useUpdateContract() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateContractInput & { id: string }) => {
      const { data, error } = await supabase
        .from('contracts')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Contract
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: contractKeys.all })
      queryClient.invalidateQueries({ queryKey: contractKeys.detail(data.id) })
    },
  })
}

export function useUpdateContractStatus() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      id,
      status,
      reason,
    }: {
      id: string
      status: ContractStatus
      reason?: string
    }) => {
      const updates: Record<string, unknown> = { status }

      // Set timestamps based on status
      if (status === 'sent') {
        updates.sent_at = new Date().toISOString()
      } else if (status === 'signed') {
        updates.signed_at = new Date().toISOString()
      } else if (status === 'cancelled') {
        updates.cancelled_at = new Date().toISOString()
        updates.cancelled_reason = reason || null
      }

      const { data, error } = await supabase
        .from('contracts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Contract
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: contractKeys.all })
      queryClient.invalidateQueries({ queryKey: contractKeys.detail(data.id) })
    },
  })
}

export function useDeleteContract() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contracts').delete().eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.all })
    },
  })
}

// ============================================================================
// CONTRACT PARTY MUTATIONS
// ============================================================================

export function useAddParty() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: AddPartyInput) => {
      const { data, error } = await supabase
        .from('contract_parties')
        .insert(input)
        .select()
        .single()

      if (error) throw error
      return data as ContractParty
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: contractKeys.detail(data.contract_id) })
      queryClient.invalidateQueries({ queryKey: contractKeys.parties(data.contract_id) })
    },
  })
}

export function useUpdateParty() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      id,
      contract_id,
      ...input
    }: Partial<ContractParty> & { id: string; contract_id: string }) => {
      const { data, error } = await supabase
        .from('contract_parties')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { ...data, contract_id } as ContractParty
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: contractKeys.detail(data.contract_id) })
      queryClient.invalidateQueries({ queryKey: contractKeys.parties(data.contract_id) })
    },
  })
}

export function useRemoveParty() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, contract_id }: { id: string; contract_id: string }) => {
      const { error } = await supabase.from('contract_parties').delete().eq('id', id)

      if (error) throw error
      return { id, contract_id }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: contractKeys.detail(data.contract_id) })
      queryClient.invalidateQueries({ queryKey: contractKeys.parties(data.contract_id) })
    },
  })
}

// ============================================================================
// CONTRACT TEMPLATES HOOK
// ============================================================================

export function useContractTemplates() {
  const supabase = createClient()

  return useQuery({
    queryKey: contractKeys.templates(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return data
    },
  })
}

// ============================================================================
// HELPER: Create contract from assignment
// ============================================================================

export function useCreateContractFromAssignment() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      assignment_id,
      template_id,
      type,
    }: {
      assignment_id: string
      template_id?: string
      type: Contract['type']
    }) => {
      // Get assignment details
      const { data: assignment, error: assignmentError } = await supabase
        .from('assignments')
        .select(
          `
          *,
          candidate:candidates(id, first_name, last_name, email, national_id_number),
          organization:crm_organizations(id, name, org_number, email)
        `
        )
        .eq('id', assignment_id)
        .single()

      if (assignmentError) throw assignmentError

      // Generate contract number
      const { count } = await supabase
        .from('contracts')
        .select('id', { count: 'exact', head: true })

      const currentCount = count || 0
      const year = new Date().getFullYear()
      const contractNumber = `CON-${year}-${String(currentCount + 1).padStart(4, '0')}`

      // Create contract
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .insert({
          contract_number: contractNumber,
          assignment_id,
          organization_id: assignment.organization_id,
          candidate_id: assignment.candidate_id,
          template_id: template_id || null,
          type,
          title: `${type === 'employment_temporary' ? 'Ansettelseskontrakt' : 'Oppdragskontrakt'} - ${assignment.title}`,
          status: 'draft',
          esign_status: 'not_started',
          effective_date: assignment.planned_start_date,
          expiry_date: assignment.planned_end_date,
        })
        .select()
        .single()

      if (contractError) throw contractError

      // Add parties
      const parties = []

      // Employee party
      if (assignment.candidate) {
        parties.push({
          contract_id: contract.id,
          party_type: 'employee',
          name: `${assignment.candidate.first_name} ${assignment.candidate.last_name}`,
          email: assignment.candidate.email,
          national_id: assignment.candidate.national_id_number || null,
          signing_order: 1,
          status: 'pending',
        })
      }

      // Employer party (BlueCrew)
      parties.push({
        contract_id: contract.id,
        party_type: 'employer',
        name: 'BlueCrew AS',
        email: 'kontrakter@bluecrew.no',
        organization_name: 'BlueCrew AS',
        organization_number: '123456789',
        signing_order: 2,
        status: 'pending',
      })

      if (parties.length > 0) {
        const { error: partiesError } = await supabase.from('contract_parties').insert(parties)

        if (partiesError) throw partiesError
      }

      return contract as Contract
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.all })
    },
  })
}
