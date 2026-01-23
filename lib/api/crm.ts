/**
 * CRM API Helper
 *
 * Server-side API functions for CRM operations.
 */

import { createClient } from '@/lib/supabase/server'
import type {
  TablesInsert,
  TablesUpdate,
  Organization,
  Contact,
  PipelineStage
} from '@/types/database.types'

// ═══════════════════════════════════════════════════════
// INPUT TYPES
// ═══════════════════════════════════════════════════════

export type CreateOrganizationInput = TablesInsert<'crm_organizations'>
export type UpdateOrganizationInput = TablesUpdate<'crm_organizations'>
export type CreateContactInput = TablesInsert<'crm_contacts'>
export type UpdateContactInput = TablesUpdate<'crm_contacts'>

export interface CreateActivityInput {
  organization_id?: string
  contact_id?: string
  deal_id?: string
  type: string
  subject?: string
  description?: string
  duration_minutes?: number
  outcome?: string
  participants?: string[]
  performed_by?: string
  performed_at?: string
}

export interface CreateTaskInput {
  organization_id?: string
  contact_id?: string
  deal_id?: string
  title: string
  description?: string
  due_date?: string
  due_time?: string
  reminder_at?: string
  priority?: string
  status?: string
  assigned_to?: string
}

export type UpdateTaskInput = Partial<CreateTaskInput> & {
  completed_at?: string
  completed_by?: string
  completion_notes?: string
}

// ═══════════════════════════════════════════════════════
// RESPONSE TYPES
// ═══════════════════════════════════════════════════════

export interface OrganizationWithRelations extends Organization {
  crm_contacts?: Contact[]
  crm_activities?: CrmActivity[]
}

export interface ContactWithOrganization extends Contact {
  crm_organizations?: Pick<Organization, 'id' | 'name'> | null
}

export interface CrmActivity {
  id: string
  organization_id: string | null
  contact_id: string | null
  deal_id: string | null
  type: string
  subject: string | null
  description: string | null
  duration_minutes: number | null
  outcome: string | null
  participants: string[] | null
  performed_by: string | null
  performed_at: string
  created_at: string
}

export interface CrmTask {
  id: string
  organization_id: string | null
  contact_id: string | null
  deal_id: string | null
  title: string
  description: string | null
  due_date: string | null
  due_time: string | null
  reminder_at: string | null
  priority: string
  status: string
  completed_at: string | null
  completed_by: string | null
  completion_notes: string | null
  assigned_to: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  crm_organizations?: Pick<Organization, 'id' | 'name'> | null
  crm_contacts?: Pick<Contact, 'id' | 'first_name' | 'last_name'> | null
}

export interface PipelineStageStats {
  count: number
  value: number
}

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

export async function createOrganization(input: CreateOrganizationInput): Promise<Organization> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('crm_organizations')
    .insert(input)
    .select()
    .single()

  if (error) throw error

  return data
}

export async function updateOrganization(id: string, input: UpdateOrganizationInput): Promise<Organization> {
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

export async function createContact(input: CreateContactInput): Promise<Contact> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('crm_contacts')
    .insert(input)
    .select()
    .single()

  if (error) throw error

  return data
}

export async function updateContact(id: string, input: UpdateContactInput): Promise<Contact> {
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

export async function createActivity(input: CreateActivityInput): Promise<CrmActivity> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('crm_activities')
    .insert(input)
    .select()
    .single()

  if (error) throw error

  return data as CrmActivity
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

export async function createTask(input: CreateTaskInput): Promise<CrmTask> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('crm_tasks')
    .insert(input)
    .select()
    .single()

  if (error) throw error

  return data as CrmTask
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<CrmTask> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('crm_tasks')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return data as CrmTask
}

export async function completeTask(id: string) {
  return updateTask(id, { 
    status: 'completed', 
    completed_at: new Date().toISOString() 
  })
}

// Pipeline stats

export async function getPipelineStats(): Promise<Record<PipelineStage, PipelineStageStats>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('crm_organizations')
    .select('pipeline_stage, estimated_annual_value_nok')

  if (error) throw error

  interface OrgPipelineRow {
    pipeline_stage: PipelineStage
    estimated_annual_value_nok: number | null
  }

  const stats = (data as OrgPipelineRow[]).reduce<Record<string, PipelineStageStats>>((acc, org) => {
    const stage = org.pipeline_stage || 'lead'
    if (!acc[stage]) {
      acc[stage] = { count: 0, value: 0 }
    }
    acc[stage].count++
    acc[stage].value += org.estimated_annual_value_nok || 0
    return acc
  }, {})

  return stats as Record<PipelineStage, PipelineStageStats>
}
