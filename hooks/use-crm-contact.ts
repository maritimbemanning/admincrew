'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { CrmContact, CrmActivity, CrmTask, CrmDeal } from '@/types/crm'
import { crmContactKeys } from './use-crm-contacts'

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

export interface CrmContactWithRelations extends CrmContact {
  activities: CrmActivity[]
  tasks: CrmTask[]
  deals: CrmDeal[]
}

// ═══════════════════════════════════════════════════════
// FETCH FUNCTION
// ═══════════════════════════════════════════════════════

async function fetchCrmContact(id: string): Promise<CrmContactWithRelations | null> {
  const supabase = createClient()

  // Fetch contact
  const { data: contact, error: contactError } = await supabase
    .from('crm_contacts')
    .select('*')
    .eq('id', id)
    .single()

  if (contactError) {
    if (contactError.code === 'PGRST116') {
      return null // Not found
    }
    throw contactError
  }

  // Fetch related activities
  const { data: activities, error: activitiesError } = await supabase
    .from('crm_activities')
    .select('*')
    .eq('contact_id', id)
    .order('date', { ascending: false })
    .limit(50)

  if (activitiesError) {
    console.error('Error fetching activities:', activitiesError)
  }

  // Fetch related tasks
  const { data: tasks, error: tasksError } = await supabase
    .from('crm_tasks')
    .select('*')
    .eq('contact_id', id)
    .is('deleted_at', null)
    .order('due_date', { ascending: true, nullsFirst: false })

  if (tasksError) {
    console.error('Error fetching tasks:', tasksError)
  }

  // Fetch related deals
  const { data: deals, error: dealsError } = await supabase
    .from('crm_deals')
    .select('*')
    .eq('contact_id', id)
    .order('created_at', { ascending: false })

  if (dealsError) {
    console.error('Error fetching deals:', dealsError)
  }

  return {
    ...contact,
    activities: (activities || []) as CrmActivity[],
    tasks: (tasks || []) as CrmTask[],
    deals: (deals || []) as CrmDeal[],
  } as CrmContactWithRelations
}

// ═══════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════

export function useCrmContact(id: string | undefined) {
  return useQuery({
    queryKey: crmContactKeys.detail(id || ''),
    queryFn: () => fetchCrmContact(id!),
    enabled: !!id,
  })
}
