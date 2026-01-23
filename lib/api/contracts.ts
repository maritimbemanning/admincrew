/**
 * Contracts API Helper
 *
 * Server-side API functions for contract operations.
 */

import { createClient } from '@/lib/supabase/server'
import type {
  ContractStatus,
  ContractType,
  Candidate,
  Organization
} from '@/types/database.types'

// ═══════════════════════════════════════════════════════
// CONTRACT TYPES
// ═══════════════════════════════════════════════════════

export interface Contract {
  id: string
  contract_number: string
  assignment_id: string | null
  organization_id: string | null
  candidate_id: string | null
  type: ContractType
  title: string
  content_html: string | null
  template_id: string | null
  variables: Record<string, unknown> | null
  draft_pdf_path: string | null
  signed_pdf_path: string | null
  esign_provider: string | null
  esign_request_id: string | null
  esign_status: string
  status: ContractStatus
  signed_at: string | null
  sent_at: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  created_at: string
  created_by: string | null
  updated_at: string
}

export interface ContractParty {
  id: string
  contract_id: string
  party_type: string
  name: string
  email: string
  national_id: string | null
  signing_order: number
  status: string
  signed_at: string | null
  signature_method: string | null
  signature_data: Record<string, unknown> | null
  user_id: string | null
}

export interface CreateContractInput {
  assignment_id?: string | null
  organization_id?: string | null
  candidate_id?: string | null
  type: ContractType
  title: string
  content_html?: string | null
  template_id?: string | null
  variables?: Record<string, unknown> | null
  status?: ContractStatus
}

export type UpdateContractInput = Partial<CreateContractInput> & {
  signed_at?: string | null
  sent_at?: string | null
  cancelled_at?: string | null
  cancellation_reason?: string | null
}

export interface CreateContractPartyInput {
  party_type: string
  name: string
  email: string
  national_id?: string | null
  signing_order?: number
  user_id?: string | null
}

export type UpdateContractPartyInput = Partial<CreateContractPartyInput> & {
  status?: string
  signed_at?: string | null
  signature_method?: string | null
  signature_data?: Record<string, unknown> | null
}

export interface SignatureData {
  method: string
  timestamp: string
  ip_address?: string
  user_agent?: string
  provider_reference?: string
}

export interface ContractFromTemplateInput {
  type?: ContractType
  title: string
  content?: string
  parties?: CreateContractPartyInput[]
}

export interface ContractWithRelations extends Contract {
  contract_parties?: ContractParty[]
  assignments?: {
    id: string
    candidates?: Pick<Candidate, 'id' | 'first_name' | 'last_name'> | null
    requests?: {
      id: string
      title: string
      crm_organizations?: Pick<Organization, 'id' | 'name'> | null
    } | null
  } | null
}

export interface ContractStats {
  total: number
  byStatus: Record<string, number>
  byType: Record<string, number>
}

// ═══════════════════════════════════════════════════════
// FILTER TYPES
// ═══════════════════════════════════════════════════════

export interface ContractFilters {
  search?: string
  type?: string
  status?: string
  assignmentId?: string
  partyId?: string
}

export interface ContractListOptions {
  filters?: ContractFilters
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export async function getContracts(options: ContractListOptions = {}) {
  const supabase = await createClient()
  const {
    filters = {},
    limit = 50,
    offset = 0,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = options

  let query = supabase
    .from('contracts')
    .select('*, contract_parties(*)', { count: 'exact' })
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(offset, offset + limit - 1)

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,reference_number.ilike.%${filters.search}%`)
  }

  if (filters.type) {
    query = query.eq('type', filters.type)
  }

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  if (filters.assignmentId) {
    query = query.eq('assignment_id', filters.assignmentId)
  }

  const { data, error, count } = await query

  if (error) throw error

  return { contracts: data, count: count ?? 0 }
}

export async function getContract(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('contracts')
    .select(`
      *,
      contract_parties(*),
      assignments(id, candidates(id, first_name, last_name), requests(id, title, crm_organizations(id, name)))
    `)
    .eq('id', id)
    .single()

  if (error) throw error

  return data
}

export async function createContract(input: CreateContractInput): Promise<Contract> {
  const supabase = await createClient()

  // Generate reference number
  const { count: countData } = await supabase
    .from('contracts')
    .select('id', { count: 'exact', head: true })

  const count = countData || 0
  const contractNumber = `CTR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

  const { data, error } = await supabase
    .from('contracts')
    .insert({ ...input, contract_number: contractNumber })
    .select()
    .single()

  if (error) throw error

  return data as Contract
}

export async function updateContract(id: string, input: UpdateContractInput): Promise<Contract> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('contracts')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return data as Contract
}

export async function deleteContract(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('contracts')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Contract parties

export async function addContractParty(contractId: string, party: CreateContractPartyInput): Promise<ContractParty> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('contract_parties')
    .insert({
      contract_id: contractId,
      ...party,
    })
    .select()
    .single()

  if (error) throw error

  return data as ContractParty
}

export async function updateContractParty(id: string, input: UpdateContractPartyInput): Promise<ContractParty> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('contract_parties')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return data as ContractParty
}

export async function removeContractParty(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('contract_parties')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Signature operations

export async function recordSignature(partyId: string, signatureData: SignatureData): Promise<ContractParty> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('contract_parties')
    .update({
      signed_at: new Date().toISOString(),
      signature_data: signatureData,
    })
    .eq('id', partyId)
    .select()
    .single()

  if (error) throw error

  const partyData = data as ContractParty

  // Check if all parties have signed
  interface ContractWithParties {
    id: string
    contract_parties: Array<{ signed_at: string | null }>
  }

  const { data: contract } = await supabase
    .from('contracts')
    .select('id, contract_parties(signed_at)')
    .eq('id', partyData.contract_id)
    .single()

  if (contract) {
    const contractData = contract as ContractWithParties
    const allSigned = contractData.contract_parties.every((p) => p.signed_at)
    if (allSigned) {
      await updateContract(contractData.id, {
        status: 'signed',
        signed_at: new Date().toISOString(),
      })
    } else {
      const signedCount = contractData.contract_parties.filter((p) => p.signed_at).length
      if (signedCount > 0) {
        await updateContract(contractData.id, { status: 'partially_signed' })
      }
    }
  }

  return partyData
}

// Contract status updates

export async function sendContractForSignature(id: string) {
  return updateContract(id, { 
    status: 'sent',
    sent_at: new Date().toISOString(),
  })
}

export async function cancelContract(id: string, reason?: string) {
  return updateContract(id, { 
    status: 'cancelled',
    cancelled_at: new Date().toISOString(),
    cancellation_reason: reason,
  })
}

// Contract from template

export async function createContractFromTemplate(
  templateId: string,
  assignmentId: string,
  data: ContractFromTemplateInput
): Promise<Contract> {
  // In real implementation, would use lib/contracts/generator
  const contract = await createContract({
    template_id: templateId,
    assignment_id: assignmentId,
    type: data.type || 'employment_temporary',
    title: data.title,
    content_html: data.content,
    status: 'draft',
  })

  // Add parties if provided
  if (data.parties) {
    for (const party of data.parties) {
      await addContractParty(contract.id, party)
    }
  }

  return contract
}

// Dashboard stats

export async function getContractStats(): Promise<ContractStats> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('contracts')
    .select('status, type')

  if (error) throw error

  interface ContractStatusRow {
    status: string
    type: string
  }

  const contractData = data as ContractStatusRow[]

  const byStatus = contractData.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1
    return acc
  }, {})

  const byType = contractData.reduce<Record<string, number>>((acc, c) => {
    acc[c.type] = (acc[c.type] || 0) + 1
    return acc
  }, {})

  return {
    total: contractData.length,
    byStatus,
    byType,
  }
}

// Get contracts pending signature

export async function getContractsPendingSignature(userId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('contracts')
    .select('*, contract_parties(*)')
    .in('status', ['sent', 'partially_signed'])

  if (userId) {
    query = query.contains('contract_parties', [{ user_id: userId, signed_at: null }])
  }

  const { data, error } = await query

  if (error) throw error

  return data
}
