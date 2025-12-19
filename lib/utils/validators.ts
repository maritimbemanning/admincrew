// lib/utils/validators.ts
// Common validation functions for forms and data

import { z } from 'zod'

// ═══════════════════════════════════════════════════════════════════
// BASIC VALIDATORS
// ═══════════════════════════════════════════════════════════════════

/**
 * Validate Norwegian phone number
 */
export function isValidPhoneNumber(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  
  // Norwegian mobile or landline (8 digits)
  if (digits.length === 8) return true
  
  // With country code +47
  if (digits.length === 10 && digits.startsWith('47')) return true
  
  return false
}

/**
 * Validate Norwegian organization number
 */
export function isValidOrgNumber(orgNum: string): boolean {
  const digits = orgNum.replace(/\D/g, '')
  
  if (digits.length !== 9) return false
  
  // Check digit validation (MOD11)
  const weights = [3, 2, 7, 6, 5, 4, 3, 2]
  let sum = 0
  
  for (let i = 0; i < 8; i++) {
    sum += parseInt(digits[i]) * weights[i]
  }
  
  const checkDigit = 11 - (sum % 11)
  const expectedCheck = checkDigit === 11 ? 0 : checkDigit
  
  return parseInt(digits[8]) === expectedCheck
}

/**
 * Validate Norwegian birth number (fødselsnummer)
 */
export function isValidBirthNumber(birthNum: string): boolean {
  const digits = birthNum.replace(/\D/g, '')
  
  if (digits.length !== 11) return false
  
  // Checksum validation
  const weights1 = [3, 7, 6, 1, 8, 9, 4, 5, 2]
  const weights2 = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  
  let sum1 = 0
  for (let i = 0; i < 9; i++) {
    sum1 += parseInt(digits[i]) * weights1[i]
  }
  const check1 = 11 - (sum1 % 11)
  if (check1 === 11 && parseInt(digits[9]) !== 0) return false
  if (check1 !== 11 && check1 !== parseInt(digits[9])) return false
  
  let sum2 = 0
  for (let i = 0; i < 10; i++) {
    sum2 += parseInt(digits[i]) * weights2[i]
  }
  const check2 = 11 - (sum2 % 11)
  if (check2 === 11 && parseInt(digits[10]) !== 0) return false
  if (check2 !== 11 && check2 !== parseInt(digits[10])) return false
  
  return true
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate Norwegian postal code
 */
export function isValidPostalCode(postalCode: string): boolean {
  const digits = postalCode.replace(/\D/g, '')
  return digits.length === 4
}

// ═══════════════════════════════════════════════════════════════════
// ZOD SCHEMAS
// ═══════════════════════════════════════════════════════════════════

export const phoneSchema = z.string().refine(isValidPhoneNumber, {
  message: 'Ugyldig telefonnummer',
})

export const emailSchema = z.string().email({
  message: 'Ugyldig e-postadresse',
})

export const orgNumberSchema = z.string().refine(isValidOrgNumber, {
  message: 'Ugyldig organisasjonsnummer',
})

export const postalCodeSchema = z.string().refine(isValidPostalCode, {
  message: 'Ugyldig postnummer (4 siffer)',
})

export const birthNumberSchema = z.string().refine(isValidBirthNumber, {
  message: 'Ugyldig fødselsnummer',
})

// Optional versions
export const optionalPhoneSchema = z.string().optional().refine(
  (val) => !val || isValidPhoneNumber(val),
  { message: 'Ugyldig telefonnummer' }
)

export const optionalEmailSchema = z.string().optional().refine(
  (val) => !val || isValidEmail(val),
  { message: 'Ugyldig e-postadresse' }
)

// ═══════════════════════════════════════════════════════════════════
// COMPLEX VALIDATORS
// ═══════════════════════════════════════════════════════════════════

/**
 * Validate that end date is after start date
 */
export function isValidDateRange(startDate: Date, endDate: Date): boolean {
  return endDate > startDate
}

/**
 * Validate that a date is in the future
 */
export function isFutureDate(date: Date): boolean {
  return date > new Date()
}

/**
 * Validate that a date is not too far in the past (e.g., for birth dates)
 */
export function isReasonableBirthDate(date: Date): boolean {
  const minAge = 16 // Minimum working age
  const maxAge = 100
  
  const now = new Date()
  const age = now.getFullYear() - date.getFullYear()
  
  return age >= minAge && age <= maxAge
}

/**
 * Validate password strength
 */
export function isStrongPassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Må være minst 8 tegn')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Må inneholde minst én stor bokstav')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Må inneholde minst én liten bokstav')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Må inneholde minst ett tall')
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

// ═══════════════════════════════════════════════════════════════════
// SANITIZERS
// ═══════════════════════════════════════════════════════════════════

/**
 * Sanitize phone number to digits only
 */
export function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

/**
 * Sanitize org number to digits only
 */
export function sanitizeOrgNumber(orgNum: string): string {
  return orgNum.replace(/\D/g, '')
}

/**
 * Trim and normalize whitespace
 */
export function normalizeWhitespace(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Capitalize each word
 */
export function capitalizeWords(text: string): string {
  return text
    .split(' ')
    .map(capitalize)
    .join(' ')
}
