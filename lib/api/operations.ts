/**
 * Operations API Helper
 *
 * Server-side API functions for operations (requests, assignments).
 */

import { createClient } from '@/lib/supabase/server'
import type {
  TablesInsert,
  TablesUpdate,
  CustomerRequest,
  Assignment,
  RequestStatus,
  AssignmentStatus,
  Candidate,
  Organization
} from '@/types/database.types'

// ═══════════════════════════════════════════════════════
// INPUT TYPES
// ═══════════════════════════════════════════════════════

export type CreateRequestInput = TablesInsert<'customer_requests'>
export type UpdateRequestInput = TablesUpdate<'customer_requests'>
export type CreateAssignmentInput = TablesInsert<'assignments'>
export type UpdateAssignmentInput = TablesUpdate<'assignments'>

// ═══════════════════════════════════════════════════════
// RESPONSE TYPES
// ═══════════════════════════════════════════════════════

export interface RequestWithRelations extends CustomerRequest {
  crm_organizations?: Pick<Organization, 'id' | 'name'> | null
  request_skills?: Array<{
    skill_id: string
    skills: { id: string; name: string } | null
  }>
  request_certifications?: Array<{
    certification_id: string
    certifications: { id: string; name: string } | null
  }>
  shortlist_candidates?: Array<{
    id: string
    candidate_id: string
    status: string
    candidates: Candidate | null
  }>
}

export interface AssignmentWithRelations extends Assignment {
  candidates?: Pick<Candidate, 'id' | 'first_name' | 'last_name' | 'email' | 'phone'> | null
  requests?: {
    id: string
    title: string
    reference_number?: string
    request_number?: string
    crm_organizations?: Pick<Organization, 'id' | 'name'> | null
  } | null
  contracts?: Array<{
    id: string
    status: string
    signed_at: string | null
  }>
  timesheets?: Array<{
    id: string
    period_start: string
    period_end: string
    status: string
    total_hours: number | null
  }>
}

export interface ReleaseChecklistItem {
  id: string
  assignment_id: string
  item: string
  order: number
  completed: boolean
  completed_at: string | null
  completed_by: string | null
}

export interface OperationsStats {
  requests: {
    total: number
    byStatus: Record<string, number>
  }
  assignments: {
    total: number
    byStatus: Record<string, number>
  }
}

// Requests

export interface RequestFilters {
  search?: string
  status?: string[]
  priority?: string[]
  clientId?: string
  assignedTo?: string
  dateFrom?: string
  dateTo?: string
}

export interface RequestListOptions {
  filters?: RequestFilters
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export async function getRequests(options: RequestListOptions = {}) {
  const supabase = await createClient()
  const {
    filters = {},
    limit = 50,
    offset = 0,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = options

  let query = supabase
    .from('requests')
    .select('*, crm_organizations(id, name)', { count: 'exact' })
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(offset, offset + limit - 1)

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,reference_number.ilike.%${filters.search}%`)
  }

  if (filters.status?.length) {
    query = query.in('status', filters.status)
  }

  if (filters.priority?.length) {
    query = query.in('priority', filters.priority)
  }

  if (filters.clientId) {
    query = query.eq('client_id', filters.clientId)
  }

  if (filters.assignedTo) {
    query = query.eq('assigned_to', filters.assignedTo)
  }

  if (filters.dateFrom) {
    query = query.gte('start_date', filters.dateFrom)
  }

  if (filters.dateTo) {
    query = query.lte('end_date', filters.dateTo)
  }

  const { data, error, count } = await query

  if (error) throw error

  return { requests: data, count: count ?? 0 }
}

export async function getRequest(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('requests')
    .select(`
      *,
      crm_organizations(id, name),
      request_skills(skill_id, skills(id, name)),
      request_certifications(certification_id, certifications(id, name)),
      shortlist_candidates(id, candidate_id, status, candidates(*))
    `)
    .eq('id', id)
    .single()

  if (error) throw error

  return data
}

export async function createRequest(input: CreateRequestInput): Promise<CustomerRequest> {
  const supabase = await createClient()

  // Generate reference number
  const { count: countData } = await supabase
    .from('customer_requests')
    .select('id', { count: 'exact', head: true })

  const count = countData || 0
  const requestNumber = `REQ-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

  const { data, error } = await supabase
    .from('customer_requests')
    .insert({ ...input, request_number: requestNumber })
    .select()
    .single()

  if (error) throw error

  return data
}

export async function updateRequest(id: string, input: UpdateRequestInput): Promise<CustomerRequest> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customer_requests')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return data
}

export async function deleteRequest(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('requests')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function updateRequestStatus(id: string, status: RequestStatus): Promise<CustomerRequest> {
  return updateRequest(id, { status })
}

// Shortlist

export async function addToShortlist(requestId: string, candidateId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('shortlist_candidates')
    .insert({
      request_id: requestId,
      candidate_id: candidateId,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw error

  return data
}

export async function removeFromShortlist(requestId: string, candidateId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('shortlist_candidates')
    .delete()
    .eq('request_id', requestId)
    .eq('candidate_id', candidateId)

  if (error) throw error
}

export async function updateShortlistStatus(
  requestId: string,
  candidateId: string,
  status: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('shortlist_candidates')
    .update({ status })
    .eq('request_id', requestId)
    .eq('candidate_id', candidateId)
    .select()
    .single()

  if (error) throw error

  return data
}

// Assignments

export async function getAssignments(options: {
  candidateId?: string
  requestId?: string
  status?: string[]
  limit?: number
  offset?: number
} = {}) {
  const supabase = await createClient()
  const { candidateId, requestId, status, limit = 50, offset = 0 } = options

  let query = supabase
    .from('assignments')
    .select(`
      *,
      candidates(id, first_name, last_name, email),
      requests(id, title, reference_number, crm_organizations(id, name))
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (candidateId) {
    query = query.eq('candidate_id', candidateId)
  }

  if (requestId) {
    query = query.eq('request_id', requestId)
  }

  if (status?.length) {
    query = query.in('status', status)
  }

  const { data, error, count } = await query

  if (error) throw error

  return { assignments: data, count: count ?? 0 }
}

export async function getAssignment(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('assignments')
    .select(`
      *,
      candidates(id, first_name, last_name, email, phone),
      requests(id, title, reference_number, crm_organizations(id, name)),
      contracts(id, status, signed_at),
      timesheets(id, period_start, period_end, status, total_hours)
    `)
    .eq('id', id)
    .single()

  if (error) throw error

  return data
}

export async function createAssignment(input: CreateAssignmentInput): Promise<Assignment> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('assignments')
    .insert(input)
    .select()
    .single()

  if (error) throw error

  // Update request status
  if (input.request_id) {
    await updateRequestStatus(input.request_id, 'converted')
  }

  return data
}

export async function updateAssignment(id: string, input: UpdateAssignmentInput): Promise<Assignment> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('assignments')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return data
}

export async function updateAssignmentStatus(id: string, status: AssignmentStatus): Promise<Assignment> {
  return updateAssignment(id, { status })
}

// Release checklist

export async function getReleaseChecklist(assignmentId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('release_checklists')
    .select('*')
    .eq('assignment_id', assignmentId)
    .order('order', { ascending: true })

  if (error) throw error

  return data
}

export async function updateChecklistItem(id: string, completed: boolean) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('release_checklists')
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return data
}

// Dashboard stats

export async function getOperationsStats(): Promise<OperationsStats> {
  const supabase = await createClient()

  const [requestsResult, assignmentsResult] = await Promise.all([
    supabase
      .from('customer_requests')
      .select('status', { count: 'exact' }),
    supabase
      .from('assignments')
      .select('status', { count: 'exact' }),
  ])

  interface StatusRow {
    status: string
  }

  const requestsByStatus = (requestsResult.data as StatusRow[] | null)?.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, {})

  const assignmentsByStatus = (assignmentsResult.data as StatusRow[] | null)?.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1
    return acc
  }, {})

  return {
    requests: {
      total: requestsResult.count || 0,
      byStatus: requestsByStatus || {},
    },
    assignments: {
      total: assignmentsResult.count || 0,
      byStatus: assignmentsByStatus || {},
    },
  }
}
