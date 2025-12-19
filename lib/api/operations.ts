/**
 * Operations API Helper
 * 
 * Server-side API functions for operations (requests, assignments).
 */

import { createClient } from '@/lib/supabase/server'

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

export async function createRequest(input: any) {
  const supabase = await createClient()

  // Generate reference number
  const { count: countData } = await supabase
    .from('requests')
    .select('id', { count: 'exact', head: true })

  const count = countData || 0
  const referenceNumber = `REQ-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

  const { data, error } = await supabase
    .from('requests')
    .insert({ ...input, reference_number: referenceNumber })
    .select()
    .single()

  if (error) throw error

  return data
}

export async function updateRequest(id: string, input: any) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('requests')
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

export async function updateRequestStatus(id: string, status: string) {
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

export async function createAssignment(input: any) {
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

export async function updateAssignment(id: string, input: any) {
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

export async function updateAssignmentStatus(id: string, status: string) {
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

export async function getOperationsStats() {
  const supabase = await createClient()

  const [requestsResult, assignmentsResult] = await Promise.all([
    supabase
      .from('requests')
      .select('status', { count: 'exact' }),
    supabase
      .from('assignments')
      .select('status', { count: 'exact' }),
  ])

  const requestsByStatus = requestsResult.data?.reduce((acc: any, r: any) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, {})

  const assignmentsByStatus = assignmentsResult.data?.reduce((acc: any, a: any) => {
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
