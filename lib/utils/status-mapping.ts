// ══════════════════════════════════════════════════════════════════════════════════════
// STATUS MAPPING FUNCTIONS
// Maps actual database values to app-expected enum values
// ══════════════════════════════════════════════════════════════════════════════════════

import type { AvailabilityStatus, ComplianceStatus } from '@/types/database.types'

/**
 * Maps database status field to AvailabilityStatus enum
 * DB values: pending, godkjent, ansatt, avslått, null
 */
export function mapDbStatusToAvailability(dbStatus: string | null): AvailabilityStatus {
  switch (dbStatus?.toLowerCase()) {
    case 'godkjent':
      return 'available'
    case 'ansatt':
      return 'on_assignment'
    case 'pending':
      return 'available_soon'
    case 'avslått':
    case 'avslaatt':
      return 'unavailable'
    case 'inaktiv':
      return 'inactive'
    default:
      return 'available'
  }
}

/**
 * Maps database compliance_state to ComplianceStatus enum
 * DB values: pending, verified, null
 */
export function mapDbComplianceState(state: string | null): ComplianceStatus {
  switch (state?.toLowerCase()) {
    case 'verified':
    case 'godkjent':
      return 'approved'
    case 'pending':
    case 'under_review':
      return 'review_pending'
    case 'documents_pending':
    case 'mangler_dokumenter':
      return 'documents_pending'
    case 'expired':
    case 'utløpt':
      return 'expired'
    case 'rejected':
    case 'avvist':
      return 'rejected'
    default:
      return 'not_started'
  }
}

/**
 * Maps AvailabilityStatus back to database status value
 */
export function mapAvailabilityToDbStatus(status: AvailabilityStatus): string {
  switch (status) {
    case 'available':
      return 'godkjent'
    case 'on_assignment':
      return 'ansatt'
    case 'available_soon':
      return 'pending'
    case 'unavailable':
      return 'avslått'
    case 'inactive':
      return 'inaktiv'
    default:
      return 'pending'
  }
}

/**
 * Maps ComplianceStatus back to database compliance_state value
 */
export function mapComplianceToDbState(status: ComplianceStatus): string {
  switch (status) {
    case 'approved':
      return 'verified'
    case 'review_pending':
    case 'documents_pending':
      return 'pending'
    case 'expired':
      return 'expired'
    case 'rejected':
      return 'rejected'
    case 'not_started':
    default:
      return 'pending'
  }
}

/**
 * Parse full name into first and last name
 */
export function parseFullName(fullName: string | null): { firstName: string; lastName: string } {
  if (!fullName) {
    return { firstName: '', lastName: '' }
  }
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' }
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ')
  }
}

/**
 * Get display name from various name fields
 */
export function getDisplayName(
  name: string | null,
  firstName: string | null,
  lastName: string | null
): string {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`.trim()
  }
  if (firstName) {
    return firstName
  }
  if (name) {
    return name
  }
  return 'Ukjent'
}

/**
 * Get primary role from work_main array or primary_rank field
 */
export function getPrimaryRole(
  workMain: string[] | null,
  primaryRank: string | null,
  rolle: string | null
): string {
  if (workMain && workMain.length > 0) {
    return workMain[0]
  }
  if (primaryRank) {
    return primaryRank
  }
  if (rolle) {
    return rolle
  }
  return 'Ikke spesifisert'
}
