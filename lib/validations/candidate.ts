// ══════════════════════════════════════════════════════════════════════════════════════
// CANDIDATE FORM VALIDATION SCHEMA
// ══════════════════════════════════════════════════════════════════════════════════════

import { z } from 'zod'
import type { AvailabilityStatus, ComplianceStatus, DocumentType } from '@/types/database.types'

// ═══════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════

export const AVAILABILITY_STATUSES: AvailabilityStatus[] = [
  'available',
  'available_soon',
  'on_assignment',
  'unavailable',
  'inactive',
]

export const COMPLIANCE_STATUSES: ComplianceStatus[] = [
  'not_started',
  'documents_pending',
  'review_pending',
  'approved',
  'expired',
  'rejected',
]

export const DOCUMENT_TYPES: DocumentType[] = [
  'cv',
  'passport',
  'seabook',
  'certificate',
  'diploma',
  'reference',
  'contract',
  'other',
]

export const DOCUMENT_TYPE_NAMES: Record<DocumentType, string> = {
  cv: 'CV',
  passport: 'Pass',
  seabook: 'Sjøfartsbok',
  certificate: 'Sertifikat',
  diploma: 'Diplom',
  reference: 'Referanse',
  contract: 'Kontrakt',
  other: 'Annet',
}

export const PRIMARY_ROLES = [
  'captain',
  'skipper',
  'chief_officer',
  'second_officer',
  'third_officer',
  'chief_engineer',
  'engineer',
  'second_engineer',
  'third_engineer',
  'electro_technical_officer',
  'able_seaman',
  'ordinary_seaman',
  'motorman',
  'cook',
  'steward',
  'rov_pilot',
  'dp_operator',
  'diver',
  'aquaculture_technician',
  'other_maritime',
  'other',
] as const

export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  captain: 'Kaptein',
  skipper: 'Skipper',
  chief_officer: 'Overstyrmann',
  second_officer: 'Styrmann',
  third_officer: '2. Styrmann',
  chief_engineer: 'Maskinsjef',
  engineer: 'Maskinist',
  second_engineer: '1. Maskinist',
  third_engineer: '2. Maskinist',
  electro_technical_officer: 'ETO',
  able_seaman: 'Matros',
  ordinary_seaman: 'Dekksarbeider',
  motorman: 'Motormann',
  cook: 'Kokk',
  steward: 'Steward',
  rov_pilot: 'ROV-pilot',
  dp_operator: 'DP-operatør',
  diver: 'Dykker',
  aquaculture_technician: 'Akvatekniker',
  other_maritime: 'Annet maritimt',
  other: 'Annet',
}

export const SECTORS = [
  'aquaculture',
  'offshore',
  'shipping',
  'fishing',
  'maritime_services',
] as const

export const SECTOR_DISPLAY_NAMES: Record<string, string> = {
  aquaculture: 'Havbruk',
  offshore: 'Offshore',
  shipping: 'Shipping',
  fishing: 'Fiske',
  maritime_services: 'Maritime tjenester',
}

export const NORWEGIAN_FYLKER = [
  'Agder',
  'Innlandet',
  'Møre og Romsdal',
  'Nordland',
  'Oslo',
  'Rogaland',
  'Troms og Finnmark',
  'Trøndelag',
  'Vestfold og Telemark',
  'Vestland',
  'Viken',
] as const

export const LANGUAGES = [
  { code: 'no', name: 'Norsk' },
  { code: 'en', name: 'Engelsk' },
  { code: 'sv', name: 'Svensk' },
  { code: 'da', name: 'Dansk' },
  { code: 'fi', name: 'Finsk' },
  { code: 'de', name: 'Tysk' },
  { code: 'es', name: 'Spansk' },
  { code: 'fr', name: 'Fransk' },
  { code: 'pl', name: 'Polsk' },
  { code: 'ru', name: 'Russisk' },
  { code: 'fil', name: 'Filippinsk' },
] as const

export const LANGUAGE_LEVELS = [
  { value: 'native', label: 'Morsmål' },
  { value: 'fluent', label: 'Flytende' },
  { value: 'advanced', label: 'Avansert' },
  { value: 'intermediate', label: 'Middels' },
  { value: 'basic', label: 'Grunnleggende' },
] as const

// ═══════════════════════════════════════════════════════
// ZOD SCHEMAS
// ═══════════════════════════════════════════════════════

// Language entry schema
const languageEntrySchema = z.object({
  code: z.string().min(2),
  level: z.enum(['native', 'fluent', 'advanced', 'intermediate', 'basic']).default('intermediate'),
})

// Type-safe enum schemas
const availabilityStatusSchema = z.enum([
  'available',
  'available_soon',
  'on_assignment',
  'unavailable',
  'inactive',
])

const complianceStatusSchema = z.enum([
  'not_started',
  'documents_pending',
  'review_pending',
  'approved',
  'expired',
  'rejected',
])

// Personal info schema - matches actual DB columns
export const personalInfoSchema = z.object({
  first_name: z.string().min(1, 'Fornavn er påkrevd'),
  last_name: z.string().min(1, 'Etternavn er påkrevd'),
  email: z.string().email('Ugyldig e-postadresse'),
  phone: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),  // actual DB column
  date_of_birth: z.string().optional().nullable(),
  nationality: z.string().default('NO'),
})

// Address schema - matches actual DB columns
export const addressSchema = z.object({
  fylke: z.string().optional().nullable(),
  kommune: z.string().optional().nullable(),
  city: z.string().optional().nullable(),  // actual DB column
  country: z.string().default('NO'),  // actual DB column
})

// Professional info schema
export const professionalInfoSchema = z.object({
  primary_role: z.string().min(1, 'Primærrolle er påkrevd'),
  secondary_roles: z.array(z.string()).default([]),
  experience_years: z.coerce.number().min(0).max(50).default(0),
  languages: z.array(languageEntrySchema).default([{ code: 'no', level: 'native' }]),
  sectors: z.array(z.string()).default([]),
  cv_summary: z.string().optional().nullable(),
})

// Availability schema - matches actual DB columns
export const availabilitySchema = z.object({
  availability_status: availabilityStatusSchema.default('available'),
  availability_date: z.string().optional().nullable(),  // maps to available_from
  available_until: z.string().optional().nullable(),  // actual DB column
})

// Rate/Compensation schema - matches actual DB columns
export const rateCompensationSchema = z.object({
  expected_daily_rate: z.coerce.number().min(0).optional().nullable(),  // actual DB column
  currency: z.string().default('NOK'),  // actual DB column
  preferred_contract_length_months: z.coerce.number().min(1).max(24).optional().nullable(),  // actual DB column
})

// Internal (admin only) schema - matches actual DB columns
export const internalInfoSchema = z.object({
  internal_rating: z.coerce.number().min(1).max(5).optional().nullable(),
  internal_notes: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  compliance_status: complianceStatusSchema.default('not_started'),
  flagged_reason: z.string().optional().nullable(),  // actual DB column (was compliance_notes)
})

// ═══════════════════════════════════════════════════════
// COMPLETE FORM SCHEMA
// ═══════════════════════════════════════════════════════

export const candidateFormSchema = z.object({
  // Personal
  ...personalInfoSchema.shape,
  // Address
  ...addressSchema.shape,
  // Professional
  ...professionalInfoSchema.shape,
  // Availability
  ...availabilitySchema.shape,
  // Rate/Compensation - actual DB columns
  ...rateCompensationSchema.shape,
  // Internal
  ...internalInfoSchema.shape,
})

// Type inference
export type CandidateFormData = z.infer<typeof candidateFormSchema>

// Default values for new candidate - matches actual DB columns
export const defaultCandidateValues: Partial<CandidateFormData> = {
  // Personal
  first_name: '',
  last_name: '',
  email: '',
  phone: null,
  mobile: null,
  date_of_birth: null,
  nationality: 'NO',
  // Address
  fylke: null,
  kommune: null,
  city: null,
  country: 'NO',
  // Professional
  primary_role: '',
  secondary_roles: [],
  experience_years: 0,
  languages: [{ code: 'no', level: 'native' }],
  sectors: [],
  cv_summary: null,
  // Availability
  availability_status: 'available',
  availability_date: null,
  available_until: null,
  // Rate/Compensation
  expected_daily_rate: null,
  currency: 'NOK',
  preferred_contract_length_months: null,
  // Internal
  internal_rating: null,
  internal_notes: null,
  tags: [],
  compliance_status: 'not_started',
  flagged_reason: null,
}

// ═══════════════════════════════════════════════════════
// CERTIFICATION SCHEMA
// ═══════════════════════════════════════════════════════

export const CERTIFICATION_CATEGORIES = [
  'competency',
  'safety',
  'medical',
  'endorsement',
  'special',
  'other',
] as const

export const CERTIFICATION_CATEGORY_NAMES: Record<string, string> = {
  competency: 'Kompetanse',
  safety: 'Sikkerhet',
  medical: 'Helse',
  endorsement: 'Påtegning',
  special: 'Spesialsertifikat',
  other: 'Annet',
}

export const certificationFormSchema = z.object({
  category: z.enum(CERTIFICATION_CATEGORIES),
  code: z.string().min(1, 'Kode er påkrevd'),
  name: z.string().min(1, 'Navn er påkrevd'),
  issuer: z.string().optional().nullable(),
  issuer_country: z.string().default('NO'),
  certificate_number: z.string().optional().nullable(),
  issue_date: z.string().optional().nullable(),
  expiry_date: z.string().optional().nullable(),
  is_permanent: z.boolean().default(false),
  notes: z.string().optional().nullable(),
})

export type CertificationFormData = z.infer<typeof certificationFormSchema>

export const defaultCertificationValues: CertificationFormData = {
  category: 'competency',
  code: '',
  name: '',
  issuer: null,
  issuer_country: 'NO',
  certificate_number: null,
  issue_date: null,
  expiry_date: null,
  is_permanent: false,
  notes: null,
}
