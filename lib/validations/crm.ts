// ══════════════════════════════════════════════════════════════════════════════════════
// CRM FORM VALIDATION SCHEMAS
// ══════════════════════════════════════════════════════════════════════════════════════

import { z } from 'zod'
import {
  CRM_CONTACT_STATUSES,
  CRM_CONTACT_SOURCES,
  CRM_PRIORITY_LEVELS,
  CRM_ACTIVITY_TYPES,
  CRM_CALL_OUTCOMES,
  CRM_TASK_STATUSES,
  CRM_TASK_CATEGORIES,
  CRM_DEAL_STAGES,
} from '@/types/crm'

// ═══════════════════════════════════════════════════════
// CONTACT SCHEMA
// ═══════════════════════════════════════════════════════

export const contactFormSchema = z.object({
  name: z.string().min(1, 'Navn er påkrevd'),
  email: z.string().email('Ugyldig e-postadresse').nullable().optional(),
  phone: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  position: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  source: z.enum(CRM_CONTACT_SOURCES).nullable().optional(),
  status: z.enum(CRM_CONTACT_STATUSES).default('interested'),
  priority: z.enum(CRM_PRIORITY_LEVELS).default('normal'),
  tags: z.array(z.string()).default([]),
  notes: z.string().nullable().optional(),
  pinned_note: z.string().nullable().optional(),
  linkedin_url: z.string().url('Ugyldig URL').nullable().optional().or(z.literal('')),
  website: z.string().url('Ugyldig URL').nullable().optional().or(z.literal('')),
  org_number: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  deal_value: z.coerce.number().min(0).nullable().optional(),
  probability: z.coerce.number().min(0).max(100).nullable().optional(),
  interest_level: z.coerce.number().min(1).max(5).nullable().optional(),
  next_activity: z.string().nullable().optional(),
  follow_up_date: z.string().nullable().optional(),
})

export type ContactFormData = z.infer<typeof contactFormSchema>

export const defaultContactValues: Partial<ContactFormData> = {
  name: '',
  email: null,
  phone: null,
  company: null,
  position: null,
  title: null,
  source: null,
  status: 'interested',
  priority: 'normal',
  tags: [],
  notes: null,
  pinned_note: null,
  linkedin_url: null,
  website: null,
  org_number: null,
  industry: null,
  location: null,
  address: null,
  deal_value: null,
  probability: null,
  interest_level: null,
  next_activity: null,
  follow_up_date: null,
}

// ═══════════════════════════════════════════════════════
// ACTIVITY SCHEMA
// ═══════════════════════════════════════════════════════

export const activityFormSchema = z.object({
  contact_id: z.string().uuid('Ugyldig kontakt'),
  type: z.enum(CRM_ACTIVITY_TYPES),
  subject: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date: z.string().default(() => new Date().toISOString()),

  // Call-specific
  call_duration_minutes: z.coerce.number().min(0).nullable().optional(),
  call_outcome: z.enum(CRM_CALL_OUTCOMES).nullable().optional(),

  // Meeting-specific
  meeting_location: z.string().nullable().optional(),
  meeting_attendees: z.array(z.string()).nullable().optional(),

  // Email-specific
  email_from: z.string().nullable().optional(),
  email_to: z.string().nullable().optional(),
  email_cc: z.array(z.string()).nullable().optional(),

  // Follow-up
  next_activity: z.string().nullable().optional(),
  next_follow_up_date: z.string().nullable().optional(),

  created_by_name: z.string().nullable().optional(),
})

export type ActivityFormData = z.infer<typeof activityFormSchema>

export const defaultActivityValues: Partial<ActivityFormData> = {
  type: 'call',
  subject: null,
  description: null,
  call_duration_minutes: null,
  call_outcome: null,
  meeting_location: null,
  meeting_attendees: null,
  email_from: null,
  email_to: null,
  email_cc: null,
  next_activity: null,
  next_follow_up_date: null,
}

// ═══════════════════════════════════════════════════════
// TASK SCHEMA
// ═══════════════════════════════════════════════════════

export const taskFormSchema = z.object({
  title: z.string().min(1, 'Tittel er påkrevd'),
  description: z.string().nullable().optional(),
  contact_id: z.string().uuid().nullable().optional(),
  deal_id: z.string().uuid().nullable().optional(),
  due_date: z.string().nullable().optional(),
  priority: z.enum(CRM_PRIORITY_LEVELS).default('normal'),
  status: z.enum(CRM_TASK_STATUSES).default('todo'),
  category: z.enum(CRM_TASK_CATEGORIES).nullable().optional(),
  assigned_to: z.string().nullable().optional(),
  owner_name: z.string().nullable().optional(),
})

export type TaskFormData = z.infer<typeof taskFormSchema>

export const defaultTaskValues: Partial<TaskFormData> = {
  title: '',
  description: null,
  contact_id: null,
  deal_id: null,
  due_date: null,
  priority: 'normal',
  status: 'todo',
  category: null,
  assigned_to: null,
  owner_name: null,
}

// ═══════════════════════════════════════════════════════
// DEAL SCHEMA
// ═══════════════════════════════════════════════════════

export const dealFormSchema = z.object({
  contact_id: z.string().uuid('Ugyldig kontakt'),
  title: z.string().min(1, 'Tittel er påkrevd'),
  value: z.coerce.number().min(0).nullable().optional(),
  stage: z.enum(CRM_DEAL_STAGES).default('qualification'),
  probability: z.coerce.number().min(0).max(100).default(50),
  expected_close_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  assigned_to: z.string().nullable().optional(),
})

export type DealFormData = z.infer<typeof dealFormSchema>

export const defaultDealValues: Partial<DealFormData> = {
  title: '',
  value: null,
  stage: 'qualification',
  probability: 50,
  expected_close_date: null,
  notes: null,
  assigned_to: null,
}

// ═══════════════════════════════════════════════════════
// INDUSTRY OPTIONS
// ═══════════════════════════════════════════════════════

export const INDUSTRIES = [
  { value: 'aquaculture', label: 'Havbruk' },
  { value: 'offshore', label: 'Offshore' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'fishing', label: 'Fiske' },
  { value: 'maritime_services', label: 'Maritime tjenester' },
  { value: 'construction', label: 'Bygg og anlegg' },
  { value: 'energy', label: 'Energi' },
  { value: 'other', label: 'Annet' },
] as const
