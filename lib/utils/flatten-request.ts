import type { CustomerRequest } from '@/types/operations'

/**
 * Database stores requirements as nested JSON:
 * {
 *   certifications_required: [],
 *   certifications_preferred: [],
 *   languages_required: [],
 *   languages_preferred: [],
 *   experience_min_years: null,
 *   experience_preferred_years: null
 * }
 *
 * Frontend expects flat structure on CustomerRequest.
 * This helper extracts and flattens the requirements.
 */

interface RawRequirements {
  certifications_required?: string[]
  certifications_preferred?: string[]
  languages_required?: string[]
  languages_preferred?: string[]
  experience_min_years?: number | null
  experience_preferred_years?: number | null
  other?: string | null
}

interface RawCustomerRequest {
  id: string
  request_number: string
  organization_id: string | null
  contact_id: string | null
  title: string
  description: string | null
  role_needed: string
  quantity: number
  start_date: string
  end_date: string | null
  duration_type?: string | null
  requirements?: RawRequirements | null
  budget_min_daily_nok: number | null
  budget_max_daily_nok: number | null
  estimated_value_nok: number | null
  status: string
  priority: string
  owner_id: string | null
  owner_name?: string | null
  created_at: string
  updated_at: string
  approved_at: string | null
  approved_by: string | null
  converted_at: string | null
  expires_at: string | null
  organization?: { id: string; name: string } | null
  contact?: { id: string; name: string } | null
  shortlist_count?: number | { count: number }[] | null
}

/**
 * Flatten a single request from database format to frontend format
 */
export function flattenRequest(raw: RawCustomerRequest): CustomerRequest {
  const requirements = raw.requirements || {}

  // Handle shortlist_count which can be an array from Supabase aggregation
  let shortlistCount: number | undefined
  if (typeof raw.shortlist_count === 'number') {
    shortlistCount = raw.shortlist_count
  } else if (Array.isArray(raw.shortlist_count) && raw.shortlist_count.length > 0) {
    shortlistCount = raw.shortlist_count[0]?.count || 0
  }

  return {
    id: raw.id,
    request_number: raw.request_number,
    organization_id: raw.organization_id,
    contact_id: raw.contact_id,
    title: raw.title,
    description: raw.description,
    role_needed: raw.role_needed,
    quantity: raw.quantity,
    start_date: raw.start_date,
    end_date: raw.end_date,

    // Flatten duration - DB has duration_type, frontend expects duration_weeks
    // For now, set duration_weeks to null and rotation_pattern to duration_type
    duration_weeks: null,
    rotation_pattern: raw.duration_type || null,

    // Flatten requirements from JSON
    certifications_required: requirements.certifications_required || [],
    certifications_preferred: requirements.certifications_preferred || [],
    languages_required: requirements.languages_required || [],
    languages_preferred: requirements.languages_preferred || [],
    experience_min_years: requirements.experience_min_years ?? null,
    experience_preferred_years: requirements.experience_preferred_years ?? null,

    // Budget
    budget_min_daily_nok: raw.budget_min_daily_nok,
    budget_max_daily_nok: raw.budget_max_daily_nok,
    estimated_value_nok: raw.estimated_value_nok,

    // Status
    status: raw.status as CustomerRequest['status'],
    priority: raw.priority as CustomerRequest['priority'],

    // Owner
    owner_id: raw.owner_id,
    owner_name: raw.owner_name || null,

    // Timestamps
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    approved_at: raw.approved_at,
    approved_by: raw.approved_by,
    converted_at: raw.converted_at,
    expires_at: raw.expires_at,

    // Relations
    organization: raw.organization || undefined,
    contact: raw.contact || undefined,
    shortlist_count: shortlistCount,
  }
}

/**
 * Flatten multiple requests
 */
export function flattenRequests(rawRequests: RawCustomerRequest[]): CustomerRequest[] {
  return rawRequests.map(flattenRequest)
}

/**
 * Prepare requirements for database insert/update
 * Takes flat structure and nests it back into requirements JSON
 */
export function nestRequirements(
  flat: Partial<Pick<
    CustomerRequest,
    | 'certifications_required'
    | 'certifications_preferred'
    | 'languages_required'
    | 'languages_preferred'
    | 'experience_min_years'
    | 'experience_preferred_years'
  >>
): RawRequirements {
  return {
    certifications_required: flat.certifications_required || [],
    certifications_preferred: flat.certifications_preferred || [],
    languages_required: flat.languages_required || [],
    languages_preferred: flat.languages_preferred || [],
    experience_min_years: flat.experience_min_years ?? null,
    experience_preferred_years: flat.experience_preferred_years ?? null,
  }
}
