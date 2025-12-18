import { z } from 'zod'

// ============================================================================
// CONTRACT VALIDATION SCHEMAS
// ============================================================================

export const contractFormSchema = z.object({
  assignment_id: z.string().uuid().optional().nullable(),
  organization_id: z.string().uuid().optional().nullable(),
  candidate_id: z.string().uuid().optional().nullable(),
  template_id: z.string().optional().nullable(),
  type: z.enum([
    'employment_temporary',
    'employment_permanent',
    'contractor',
    'service_agreement',
    'nda',
    'other',
  ]),
  title: z.string().min(1, 'Tittel er påkrevd'),
  description: z.string().optional().nullable(),
  content_html: z.string().optional().nullable(),
  variables: z.record(z.string(), z.unknown()).default({}),
  effective_date: z.string().optional().nullable(),
  expiry_date: z.string().optional().nullable(),
})

export type ContractFormValues = z.infer<typeof contractFormSchema>

export const contractFormDefaults: ContractFormValues = {
  type: 'employment_temporary',
  title: '',
  description: null,
  content_html: null,
  variables: {},
  effective_date: null,
  expiry_date: null,
  assignment_id: null,
  organization_id: null,
  candidate_id: null,
  template_id: null,
}

// ============================================================================
// CONTRACT PARTY VALIDATION SCHEMAS
// ============================================================================

export const partyFormSchema = z.object({
  party_type: z.enum(['employee', 'employer', 'customer', 'witness']),
  name: z.string().min(1, 'Navn er påkrevd'),
  email: z.string().email('Ugyldig e-postadresse'),
  phone: z.string().optional().nullable(),
  national_id: z.string().optional().nullable(),
  organization_name: z.string().optional().nullable(),
  organization_number: z.string().optional().nullable(),
  signing_order: z.number().int().min(1).default(1),
})

export type PartyFormValues = z.infer<typeof partyFormSchema>

export const partyFormDefaults: PartyFormValues = {
  party_type: 'employee',
  name: '',
  email: '',
  phone: null,
  national_id: null,
  organization_name: null,
  organization_number: null,
  signing_order: 1,
}

// ============================================================================
// TIMESHEET VALIDATION SCHEMAS
// ============================================================================

export const timesheetEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ugyldig datoformat'),
  hours: z.number().min(0).max(24),
  type: z.enum(['regular', 'overtime', 'holiday', 'sick', 'travel']),
  description: z.string().optional(),
})

export type TimesheetEntryValues = z.infer<typeof timesheetEntrySchema>

export const timesheetFormSchema = z.object({
  assignment_id: z.string().uuid('Ugyldig oppdrag'),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ugyldig startdato'),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ugyldig sluttdato'),
  entries: z.array(timesheetEntrySchema).default([]),
})

export type TimesheetFormValues = z.infer<typeof timesheetFormSchema>

export const timesheetFormDefaults: TimesheetFormValues = {
  assignment_id: '',
  period_start: '',
  period_end: '',
  entries: [],
}

// ============================================================================
// CONTRACT TEMPLATE VALIDATION SCHEMAS
// ============================================================================

export const templateVariableSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['text', 'date', 'number', 'currency', 'select', 'boolean']),
  required: z.boolean().default(false),
  default_value: z.union([z.string(), z.number(), z.boolean()]).optional(),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    )
    .optional(),
  description: z.string().optional(),
})

export const templateFormSchema = z.object({
  name: z.string().min(1, 'Navn er påkrevd'),
  slug: z.string().min(1, 'Slug er påkrevd').regex(/^[a-z0-9-]+$/, 'Kun små bokstaver, tall og bindestrek'),
  description: z.string().optional().nullable(),
  type: z.enum([
    'employment_temporary',
    'employment_permanent',
    'contractor',
    'service_agreement',
    'nda',
    'other',
  ]),
  content_html: z.string().min(1, 'Innhold er påkrevd'),
  variables: z.array(templateVariableSchema).default([]),
  is_active: z.boolean().default(true),
  is_default: z.boolean().default(false),
})

export type TemplateFormValues = z.infer<typeof templateFormSchema>

export const templateFormDefaults: TemplateFormValues = {
  name: '',
  slug: '',
  description: null,
  type: 'employment_temporary',
  content_html: '',
  variables: [],
  is_active: true,
  is_default: false,
}
