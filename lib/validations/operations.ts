import { z } from 'zod'
import {
  REQUEST_STATUSES,
  ASSIGNMENT_STATUSES,
  PRIORITY_LEVELS,
  SHORTLIST_STATUSES,
} from '@/types/operations'

// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

export const requestFormSchema = z.object({
  title: z.string().min(1, 'Tittel er påkrevd').max(200),
  description: z.string().max(2000).nullable(),

  role_needed: z.string().min(1, 'Rolle er påkrevd'),
  quantity: z.number().int().min(1).default(1),

  start_date: z.string().min(1, 'Startdato er påkrevd'),
  end_date: z.string().nullable(),
  duration_weeks: z.number().int().min(1).nullable(),
  rotation_pattern: z.string().nullable(),

  // Requirements
  certifications_required: z.array(z.string()).default([]),
  certifications_preferred: z.array(z.string()).default([]),
  experience_min_years: z.number().int().min(0).nullable(),
  experience_preferred_years: z.number().int().min(0).nullable(),
  languages_required: z.array(z.string()).default([]),
  languages_preferred: z.array(z.string()).default([]),
  location_fylke: z.string().nullable(),

  // Budget
  budget_min_daily_nok: z.number().min(0).nullable(),
  budget_max_daily_nok: z.number().min(0).nullable(),
  estimated_value_nok: z.number().min(0).nullable(),

  // Relations
  organization_id: z.string().uuid().nullable(),
  contact_id: z.string().uuid().nullable(),

  // Status
  status: z.enum(REQUEST_STATUSES).default('draft'),
  priority: z.enum(PRIORITY_LEVELS).default('medium'),

  // Owner
  owner_id: z.string().uuid().nullable(),
  owner_name: z.string().nullable(),
})

export type RequestFormData = z.infer<typeof requestFormSchema>

export const defaultRequestValues: RequestFormData = {
  title: '',
  description: null,
  role_needed: '',
  quantity: 1,
  start_date: '',
  end_date: null,
  duration_weeks: null,
  rotation_pattern: null,
  certifications_required: [],
  certifications_preferred: [],
  experience_min_years: null,
  experience_preferred_years: null,
  languages_required: [],
  languages_preferred: [],
  location_fylke: null,
  budget_min_daily_nok: null,
  budget_max_daily_nok: null,
  estimated_value_nok: null,
  organization_id: null,
  contact_id: null,
  status: 'draft',
  priority: 'medium',
  owner_id: null,
  owner_name: null,
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHORTLIST SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

export const shortlistEntrySchema = z.object({
  request_id: z.string().uuid(),
  candidate_id: z.string().uuid(),
  match_score: z.number().min(0).max(100).nullable(),
  rank_position: z.number().int().min(1).nullable(),
  status: z.enum(SHORTLIST_STATUSES).default('proposed'),
  notes: z.string().max(1000).nullable(),
  offer_daily_rate_nok: z.number().min(0).nullable(),
})

export type ShortlistEntryData = z.infer<typeof shortlistEntrySchema>

// ═══════════════════════════════════════════════════════════════════════════════
// ASSIGNMENT SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

export const releaseChecklistSchema = z.object({
  compliance_verified: z.boolean().default(false),
  certifications_valid: z.boolean().default(false),
  contract_signed: z.boolean().default(false),
  travel_arranged: z.boolean().default(false),
  accommodation_arranged: z.boolean().default(false),
  ppe_provided: z.boolean().default(false),
  customer_notified: z.boolean().default(false),
  candidate_briefed: z.boolean().default(false),
  notes: z.string().max(1000).nullable(),
})

export type ReleaseChecklistData = z.infer<typeof releaseChecklistSchema>

export const defaultReleaseChecklist: ReleaseChecklistData = {
  compliance_verified: false,
  certifications_valid: false,
  contract_signed: false,
  travel_arranged: false,
  accommodation_arranged: false,
  ppe_provided: false,
  customer_notified: false,
  candidate_briefed: false,
  notes: null,
}

export const assignmentFormSchema = z.object({
  title: z.string().min(1, 'Tittel er påkrevd').max(200),
  description: z.string().max(2000).nullable(),
  role: z.string().min(1, 'Rolle er påkrevd'),

  // Relations
  request_id: z.string().uuid().nullable(),
  organization_id: z.string().uuid().nullable(),
  candidate_id: z.string().uuid(),

  // Dates
  planned_start_date: z.string().min(1, 'Startdato er påkrevd'),
  planned_end_date: z.string().nullable(),

  // Location
  vessel_name: z.string().max(100).nullable(),
  work_location: z.string().max(200).nullable(),

  // Rates
  employee_rate_type: z.enum(['daily', 'hourly', 'monthly']).default('daily'),
  employee_rate_amount_nok: z.number().min(0).nullable(),
  billing_rate_type: z.enum(['daily', 'hourly', 'monthly']).default('daily'),
  billing_rate_amount_nok: z.number().min(0).nullable(),

  // Status
  status: z.enum(ASSIGNMENT_STATUSES).default('draft'),

  // Release checklist
  release_checklist: releaseChecklistSchema.nullable(),

  // Owner
  owner_id: z.string().uuid().nullable(),
  owner_name: z.string().nullable(),
})

export type AssignmentFormData = z.infer<typeof assignmentFormSchema>

export const defaultAssignmentValues: Partial<AssignmentFormData> = {
  title: '',
  description: null,
  role: '',
  request_id: null,
  organization_id: null,
  planned_start_date: '',
  planned_end_date: null,
  vessel_name: null,
  work_location: null,
  employee_rate_type: 'daily',
  employee_rate_amount_nok: null,
  billing_rate_type: 'daily',
  billing_rate_amount_nok: null,
  status: 'draft',
  release_checklist: null,
  owner_id: null,
  owner_name: null,
}

// ═══════════════════════════════════════════════════════════════════════════════
// MATCHING CRITERIA SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

export const matchingCriteriaSchema = z.object({
  role: z.string().min(1, 'Rolle er påkrevd'),
  start_date: z.string().min(1, 'Startdato er påkrevd'),

  certifications: z.object({
    required: z.array(z.string()).default([]),
    preferred: z.array(z.string()).default([]),
  }).optional(),

  experience: z.object({
    min_years: z.number().int().min(0).optional(),
    preferred_years: z.number().int().min(0).optional(),
  }).optional(),

  languages: z.object({
    required: z.array(z.string()).default([]),
    preferred: z.array(z.string()).default([]),
  }).optional(),

  location: z.object({
    fylke: z.array(z.string()).default([]),
  }).optional(),

  availability: z.object({
    status: z.array(z.string()).default(['available', 'available_soon']),
    available_by: z.string().optional(),
  }).optional(),

  exclude_candidate_ids: z.array(z.string().uuid()).default([]),
  include_pool_ids: z.array(z.string().uuid()).default([]),
})

export type MatchingCriteriaData = z.infer<typeof matchingCriteriaSchema>

export const defaultMatchingCriteria: MatchingCriteriaData = {
  role: '',
  start_date: '',
  certifications: {
    required: [],
    preferred: [],
  },
  experience: {},
  languages: {
    required: [],
    preferred: [],
  },
  location: {
    fylke: [],
  },
  availability: {
    status: ['available', 'available_soon'],
  },
  exclude_candidate_ids: [],
  include_pool_ids: [],
}
