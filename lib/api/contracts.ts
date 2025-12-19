/**
 * Contracts API Helper
 * 
 * Server-side API functions for contract operations.
 */

import { createClient } from '@/lib/supabase/server'

// Contracts

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

export async function createContract(input: any) {
  const supabase = await createClient()

  // Generate reference number
  const { count: countData } = await supabase
    .from('contracts')
    .select('id', { count: 'exact', head: true })

  const count = countData || 0
  const referenceNumber = `CTR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

  const { data, error } = await supabase
    .from('contracts')
    .insert({ ...input, reference_number: referenceNumber })
    .select()
    .single()

  if (error) throw error

  return data
}

export async function updateContract(id: string, input: any) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('contracts')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return data
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

export async function addContractParty(contractId: string, party: any) {
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

  return data
}

export async function updateContractParty(id: string, input: any) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('contract_parties')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return data
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

export async function recordSignature(partyId: string, signatureData: any) {
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

  // Check if all parties have signed
  const { data: contract } = await supabase
    .from('contracts')
    .select('id, contract_parties(signed_at)')
    .eq('id', data.contract_id)
    .single()

  if (contract) {
    const allSigned = contract.contract_parties.every((p: any) => p.signed_at)
    if (allSigned) {
      await updateContract(contract.id, { 
        status: 'signed',
        signed_at: new Date().toISOString(),
      })
    } else {
      const signedCount = contract.contract_parties.filter((p: any) => p.signed_at).length
      if (signedCount > 0) {
        await updateContract(contract.id, { status: 'partially_signed' })
      }
    }
  }

  return data
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
  data: any
) {
  // In real implementation, would use lib/contracts/generator
  const contract = await createContract({
    template_id: templateId,
    assignment_id: assignmentId,
    type: data.type || 'assignment',
    title: data.title,
    content: data.content,
    status: 'draft',
    ...data,
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

export async function getContractStats() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('contracts')
    .select('status, type')

  if (error) throw error

  const byStatus = data.reduce((acc: any, c: any) => {
    acc[c.status] = (acc[c.status] || 0) + 1
    return acc
  }, {})

  const byType = data.reduce((acc: any, c: any) => {
    acc[c.type] = (acc[c.type] || 0) + 1
    return acc
  }, {})

  return {
    total: data.length,
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
