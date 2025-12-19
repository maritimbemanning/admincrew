/**
 * CRM API Helper
 * 
 * Server-side API functions for CRM operations.
 */

import { createClient } from '@/lib/supabase/server'

// Organizations

export interface OrganizationFilters {
  search?: string
  industry?: string
  pipelineStage?: string
  assignedTo?: string
}

export interface OrganizationListOptions {
  filters?: OrganizationFilters
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export async function getOrganizations(options: OrganizationListOptions = {}) {
  const supabase = await createClient()
  const {
    filters = {},
    limit = 50,
    offset = 0,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = options

  let query = supabase
    .from('crm_organizations')
    .select('*', { count: 'exact' })
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(offset, offset + limit - 1)

  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,org_number.ilike.%${filters.search}%`)
  }

  if (filters.industry) {
    query = query.eq('industry', filters.industry)
  }

  if (filters.pipelineStage) {
    query = query.eq('pipeline_stage', filters.pipelineStage)
  }

  if (filters.assignedTo) {
    query = query.eq('assigned_to', filters.assignedTo)
  }

  const { data, error, count } = await query

  if (error) throw error

  return { organizations: data, count: count ?? 0 }
}

export async function getOrganization(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('crm_organizations')
    .select(`
      *,
      crm_contacts(*),
      crm_activities(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error

  return data
}

export async function createOrganization(input: any) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('crm_organizations')
    .insert(input)
    .select()
    .single()

  if (error) throw error

  return data
}

export async function updateOrganization(id: string, input: any) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('crm_organizations')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return data
}

export async function deleteOrganization(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('crm_organizations')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Contacts

export interface ContactFilters {
  search?: string
  organizationId?: string
  role?: string
}

export async function getContacts(options: { filters?: ContactFilters; limit?: number; offset?: number } = {}) {
  const supabase = await createClient()
  const { filters = {}, limit = 50, offset = 0 } = options

  let query = supabase
    .from('crm_contacts')
    .select('*, crm_organizations(id, name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (filters.search) {
    query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
  }

  if (filters.organizationId) {
    query = query.eq('organization_id', filters.organizationId)
  }

  const { data, error, count } = await query

  if (error) throw error

  return { contacts: data, count: count ?? 0 }
}

export async function getContact(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('crm_contacts')
    .select('*, crm_organizations(id, name)')
    .eq('id', id)
    .single()

  if (error) throw error

  return data
}

export async function createContact(input: any) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('crm_contacts')
    .insert(input)
    .select()
    .single()

  if (error) throw error

  return data
}

export async function updateContact(id: string, input: any) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('crm_contacts')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return data
}

export async function deleteContact(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('crm_contacts')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Activities

export async function getActivities(options: { 
  organizationId?: string
  contactId?: string
  limit?: number 
} = {}) {
  const supabase = await createClient()
  const { organizationId, contactId, limit = 50 } = options

  let query = supabase
    .from('crm_activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (organizationId) {
    query = query.eq('organization_id', organizationId)
  }

  if (contactId) {
    query = query.eq('contact_id', contactId)
  }

  const { data, error } = await query

  if (error) throw error

  return data
}

export async function createActivity(input: any) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('crm_activities')
    .insert(input)
    .select()
    .single()

  if (error) throw error

  return data
}

// Tasks

export async function getTasks(options: {
  assignedTo?: string
  status?: string
  dueBeforeDate?: string
  limit?: number
} = {}) {
  const supabase = await createClient()
  const { assignedTo, status, dueBeforeDate, limit = 50 } = options

  let query = supabase
    .from('crm_tasks')
    .select('*, crm_organizations(id, name), crm_contacts(id, first_name, last_name)')
    .order('due_date', { ascending: true })
    .limit(limit)

  if (assignedTo) {
    query = query.eq('assigned_to', assignedTo)
  }

  if (status) {
    query = query.eq('status', status)
  }

  if (dueBeforeDate) {
    query = query.lte('due_date', dueBeforeDate)
  }

  const { data, error } = await query

  if (error) throw error

  return data
}

export async function createTask(input: any) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('crm_tasks')
    .insert(input)
    .select()
    .single()

  if (error) throw error

  return data
}

export async function updateTask(id: string, input: any) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('crm_tasks')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return data
}

export async function completeTask(id: string) {
  return updateTask(id, { 
    status: 'completed', 
    completed_at: new Date().toISOString() 
  })
}

// Pipeline stats

export async function getPipelineStats() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('crm_organizations')
    .select('pipeline_stage, estimated_value')

  if (error) throw error

  const stats = data.reduce((acc: any, org: any) => {
    const stage = org.pipeline_stage || 'lead'
    if (!acc[stage]) {
      acc[stage] = { count: 0, value: 0 }
    }
    acc[stage].count++
    acc[stage].value += org.estimated_value || 0
    return acc
  }, {})

  return stats
}
