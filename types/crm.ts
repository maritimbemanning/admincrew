// ══════════════════════════════════════════════════════════════════════════════════════
// CRM TYPES
// Based on actual Supabase schema (contact-centric model)
// ══════════════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// ENUMS & CONSTANTS
// ═══════════════════════════════════════════════════════

export const CRM_CONTACT_STATUSES = [
  'interested',
  'qualified',
  'contacted',
  'meeting_booked',
  'quote_sent',
  'negotiation',
  'won',
  'lost',
] as const

export type CrmContactStatus = (typeof CRM_CONTACT_STATUSES)[number]

export const CRM_CONTACT_STATUS_LABELS: Record<CrmContactStatus, string> = {
  interested: 'Interessent',
  qualified: 'Kvalifisert',
  contacted: 'Kontaktet',
  meeting_booked: 'Møte booket',
  quote_sent: 'Tilbud sendt',
  negotiation: 'Forhandling',
  won: 'Vunnet',
  lost: 'Tapt',
}

export const CRM_CONTACT_STATUS_COLORS: Record<CrmContactStatus, string> = {
  interested: 'bg-slate-100 text-slate-700',
  qualified: 'bg-blue-100 text-blue-700',
  contacted: 'bg-cyan-100 text-cyan-700',
  meeting_booked: 'bg-purple-100 text-purple-700',
  quote_sent: 'bg-amber-100 text-amber-700',
  negotiation: 'bg-orange-100 text-orange-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
}

export const CRM_CONTACT_SOURCES = [
  'inbound',
  'linkedin',
  'referral',
  'cold_call',
  'ringeliste',
  'website',
  'event',
] as const

export type CrmContactSource = (typeof CRM_CONTACT_SOURCES)[number]

export const CRM_CONTACT_SOURCE_LABELS: Record<CrmContactSource, string> = {
  inbound: 'Innkommende',
  linkedin: 'LinkedIn',
  referral: 'Referanse',
  cold_call: 'Kald samtale',
  ringeliste: 'Ringeliste',
  website: 'Nettside',
  event: 'Arrangement',
}

export const CRM_PRIORITY_LEVELS = ['low', 'normal', 'high'] as const
export type CrmPriority = (typeof CRM_PRIORITY_LEVELS)[number]

export const CRM_PRIORITY_LABELS: Record<CrmPriority, string> = {
  low: 'Lav',
  normal: 'Normal',
  high: 'Høy',
}

export const CRM_PRIORITY_COLORS: Record<CrmPriority, string> = {
  low: 'bg-slate-100 text-slate-600',
  normal: 'bg-blue-100 text-blue-600',
  high: 'bg-red-100 text-red-600',
}

export const CRM_ACTIVITY_TYPES = [
  'call',
  'email',
  'meeting',
  'note',
  'proposal',
  'system',
] as const

export type CrmActivityType = (typeof CRM_ACTIVITY_TYPES)[number]

export const CRM_ACTIVITY_TYPE_LABELS: Record<CrmActivityType, string> = {
  call: 'Samtale',
  email: 'E-post',
  meeting: 'Møte',
  note: 'Notat',
  proposal: 'Tilbud',
  system: 'System',
}

export const CRM_ACTIVITY_TYPE_ICONS: Record<CrmActivityType, string> = {
  call: '📞',
  email: '📧',
  meeting: '🤝',
  note: '📝',
  proposal: '📄',
  system: '⚙️',
}

export const CRM_CALL_OUTCOMES = [
  'positive',
  'neutral',
  'negative',
  'no_answer',
  'voicemail',
] as const

export type CrmCallOutcome = (typeof CRM_CALL_OUTCOMES)[number]

export const CRM_CALL_OUTCOME_LABELS: Record<CrmCallOutcome, string> = {
  positive: 'Positivt',
  neutral: 'Nøytralt',
  negative: 'Negativt',
  no_answer: 'Ikke svar',
  voicemail: 'Talemelding',
}

export const CRM_TASK_STATUSES = ['todo', 'doing', 'done'] as const
export type CrmTaskStatus = (typeof CRM_TASK_STATUSES)[number]

export const CRM_TASK_STATUS_LABELS: Record<CrmTaskStatus, string> = {
  todo: 'Åpen',
  doing: 'Pågår',
  done: 'Ferdig',
}

export const CRM_TASK_CATEGORIES = [
  'kickoff',
  'documents',
  'billing',
  'communication',
] as const

export type CrmTaskCategory = (typeof CRM_TASK_CATEGORIES)[number]

export const CRM_TASK_CATEGORY_LABELS: Record<CrmTaskCategory, string> = {
  kickoff: 'Oppstart',
  documents: 'Dokumenter',
  billing: 'Fakturering',
  communication: 'Kommunikasjon',
}

export const CRM_DEAL_STAGES = [
  'qualification',
  'needs_analysis',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
] as const

export type CrmDealStage = (typeof CRM_DEAL_STAGES)[number]

export const CRM_DEAL_STAGE_LABELS: Record<CrmDealStage, string> = {
  qualification: 'Kvalifisering',
  needs_analysis: 'Behovsanalyse',
  proposal: 'Tilbud',
  negotiation: 'Forhandling',
  closed_won: 'Vunnet',
  closed_lost: 'Tapt',
}

// ═══════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════

export interface CrmContact {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  position: string | null
  source: CrmContactSource | null
  status: CrmContactStatus | null
  tags: string[] | null
  notes: string | null
  linkedin_url: string | null
  created_at: string
  updated_at: string
  last_contact_at: string | null
  assigned_to: string | null
  campaign_tag: string | null
  contact_status: string | null
  interest_level: number | null
  archived_at: string | null
  manual_entry: boolean | null
  owner_id: string | null
  archived_reason: string | null
  merged_from: string[] | null
  hubspot_id: string | null
  title: string | null
  next_activity: string | null
  follow_up_date: string | null
  deal_value: number | null
  probability: number | null
  priority: CrmPriority | null
  org_number: string | null
  location: string | null
  address: string | null
  website: string | null
  pinned_note: string | null
  industry: string | null
  // Computed/joined
  activities?: CrmActivity[]
  deals?: CrmDeal[]
  tasks?: CrmTask[]
}

export interface CrmContactInsert {
  name: string
  email?: string | null
  phone?: string | null
  company?: string | null
  position?: string | null
  source?: CrmContactSource | null
  status?: CrmContactStatus | null
  tags?: string[] | null
  notes?: string | null
  linkedin_url?: string | null
  assigned_to?: string | null
  campaign_tag?: string | null
  interest_level?: number | null
  owner_id?: string | null
  title?: string | null
  next_activity?: string | null
  follow_up_date?: string | null
  deal_value?: number | null
  probability?: number | null
  priority?: CrmPriority | null
  org_number?: string | null
  location?: string | null
  address?: string | null
  website?: string | null
  pinned_note?: string | null
  industry?: string | null
}

export type CrmContactUpdate = Partial<CrmContactInsert>

export interface CrmActivity {
  id: string
  contact_id: string | null
  type: CrmActivityType
  subject: string | null
  description: string | null
  date: string
  created_by: string | null
  created_at: string
  call_duration_minutes: number | null
  call_outcome: CrmCallOutcome | null
  meeting_location: string | null
  meeting_attendees: string[] | null
  meeting_recording_url: string | null
  email_from: string | null
  email_to: string | null
  email_cc: string[] | null
  email_thread_id: string | null
  email_message_id: string | null
  next_activity: string | null
  next_follow_up_date: string | null
  created_by_name: string | null
  hubspot_engagement_id: string | null
  // Joined
  contact?: CrmContact
}

export interface CrmActivityInsert {
  contact_id: string
  type: CrmActivityType
  subject?: string | null
  description?: string | null
  date?: string
  created_by?: string | null
  call_duration_minutes?: number | null
  call_outcome?: CrmCallOutcome | null
  meeting_location?: string | null
  meeting_attendees?: string[] | null
  email_from?: string | null
  email_to?: string | null
  email_cc?: string[] | null
  next_activity?: string | null
  next_follow_up_date?: string | null
  created_by_name?: string | null
}

export type CrmActivityUpdate = Partial<CrmActivityInsert>

export interface CrmTask {
  id: string
  contact_id: string | null
  deal_id: string | null
  title: string
  description: string | null
  due_date: string | null
  priority: CrmPriority | null
  status: CrmTaskStatus | null
  assigned_to: string | null
  created_at: string
  completed_at: string | null
  deleted_at: string | null
  owner: string | null
  owner_name: string | null
  completed_by: string | null
  category: CrmTaskCategory | null
  source: string | null
  created_by: string | null
  // Joined
  contact?: CrmContact
  deal?: CrmDeal
}

export interface CrmTaskInsert {
  contact_id?: string | null
  deal_id?: string | null
  title: string
  description?: string | null
  due_date?: string | null
  priority?: CrmPriority | null
  status?: CrmTaskStatus | null
  assigned_to?: string | null
  owner?: string | null
  owner_name?: string | null
  category?: CrmTaskCategory | null
  created_by?: string | null
}

export type CrmTaskUpdate = Partial<CrmTaskInsert>

export interface CrmDeal {
  id: string
  contact_id: string | null
  title: string
  value: number | null
  stage: CrmDealStage | null
  probability: number | null
  expected_close_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  closed_at: string | null
  assigned_to: string | null
  // Joined
  contact?: CrmContact
  tasks?: CrmTask[]
}

export interface CrmDealInsert {
  contact_id: string
  title: string
  value?: number | null
  stage?: CrmDealStage | null
  probability?: number | null
  expected_close_date?: string | null
  notes?: string | null
  assigned_to?: string | null
}

export type CrmDealUpdate = Partial<CrmDealInsert>

// ═══════════════════════════════════════════════════════
// FILTER TYPES
// ═══════════════════════════════════════════════════════

export interface CrmContactFilters {
  search?: string
  status?: CrmContactStatus[]
  source?: CrmContactSource[]
  priority?: CrmPriority[]
  industry?: string[]
  tags?: string[]
  owner_id?: string
  has_deal?: boolean
  has_follow_up?: boolean
  follow_up_overdue?: boolean
  archived?: boolean
}

export interface CrmActivityFilters {
  contact_id?: string
  type?: CrmActivityType[]
  date_from?: string
  date_to?: string
  created_by?: string
}

export interface CrmTaskFilters {
  contact_id?: string
  deal_id?: string
  status?: CrmTaskStatus[]
  priority?: CrmPriority[]
  category?: CrmTaskCategory[]
  assigned_to?: string
  due_date_from?: string
  due_date_to?: string
  overdue?: boolean
}

// ═══════════════════════════════════════════════════════
// PIPELINE TYPES
// ═══════════════════════════════════════════════════════

export interface PipelineColumn {
  id: CrmContactStatus
  label: string
  contacts: CrmContact[]
  count: number
  totalValue: number
}

export interface PipelineStats {
  totalContacts: number
  totalValue: number
  avgProbability: number
  byStatus: Record<CrmContactStatus, { count: number; value: number }>
}
