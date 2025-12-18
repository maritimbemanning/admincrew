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

// Personal info schema
export const personalInfoSchema = z.object({
  first_name: z.string().min(1, 'Fornavn er påkrevd'),
  last_name: z.string().min(1, 'Etternavn er påkrevd'),
  email: z.string().email('Ugyldig e-postadresse'),
  phone: z.string().optional().nullable(),
  phone_secondary: z.string().optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  nationality: z.string().default('NO'),
  national_id_number: z.string().optional().nullable(),
})

// Address schema
export const addressSchema = z.object({
  address_street: z.string().optional().nullable(),
  address_postal_code: z.string().optional().nullable(),
  address_city: z.string().optional().nullable(),
  address_country: z.string().default('NO'),
  fylke: z.string().optional().nullable(),
  kommune: z.string().optional().nullable(),
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

// Availability schema
export const availabilitySchema = z.object({
  availability_status: availabilityStatusSchema.default('available'),
  availability_date: z.string().optional().nullable(),
  availability_notes: z.string().optional().nullable(),
})

// Rotation and salary schema
export const rotationSalarySchema = z.object({
  rotation_preferred: z.array(z.string()).default([]),
  rotation_max_weeks_on: z.coerce.number().min(1).max(12).optional().nullable(),
  rotation_min_weeks_off: z.coerce.number().min(1).max(12).optional().nullable(),
  rotation_flexible: z.boolean().default(true),
  salary_min_monthly_nok: z.coerce.number().min(0).optional().nullable(),
  salary_preferred_monthly_nok: z.coerce.number().min(0).optional().nullable(),
  salary_negotiable: z.boolean().default(true),
  location_preferred_regions: z.array(z.string()).default([]),
  location_willing_to_relocate: z.boolean().default(false),
})

// Internal (admin only) schema
export const internalInfoSchema = z.object({
  internal_rating: z.coerce.number().min(1).max(5).optional().nullable(),
  internal_notes: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  compliance_status: complianceStatusSchema.default('not_started'),
  compliance_notes: z.string().optional().nullable(),
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
  // Rotation & Salary
  ...rotationSalarySchema.shape,
  // Internal
  ...internalInfoSchema.shape,
})

// Type inference
export type CandidateFormData = z.infer<typeof candidateFormSchema>

// Default values for new candidate
export const defaultCandidateValues: Partial<CandidateFormData> = {
  first_name: '',
  last_name: '',
  email: '',
  phone: null,
  phone_secondary: null,
  date_of_birth: null,
  nationality: 'NO',
  national_id_number: null,
  address_street: null,
  address_postal_code: null,
  address_city: null,
  address_country: 'NO',
  fylke: null,
  kommune: null,
  primary_role: '',
  secondary_roles: [],
  experience_years: 0,
  languages: [{ code: 'no', level: 'native' }],
  sectors: [],
  cv_summary: null,
  availability_status: 'available',
  availability_date: null,
  availability_notes: null,
  rotation_preferred: [],
  rotation_max_weeks_on: null,
  rotation_min_weeks_off: null,
  rotation_flexible: true,
  salary_min_monthly_nok: null,
  salary_preferred_monthly_nok: null,
  salary_negotiable: true,
  location_preferred_regions: [],
  location_willing_to_relocate: false,
  internal_rating: null,
  internal_notes: null,
  tags: [],
  compliance_status: 'not_started',
  compliance_notes: null,
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
