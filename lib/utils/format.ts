// lib/utils/format.ts
// Utility functions for formatting dates, numbers, and other values

import { format, formatDistance, formatRelative, parseISO } from 'date-fns'
import { nb } from 'date-fns/locale'

// ═══════════════════════════════════════════════════════════════════
// DATE FORMATTING
// ═══════════════════════════════════════════════════════════════════

/**
 * Format a date string or Date object to Norwegian date format
 */
export function formatDate(
  date: string | Date | null | undefined,
  formatStr: string = 'dd.MM.yyyy'
): string {
  if (!date) return '-'
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatStr, { locale: nb })
}

/**
 * Format date with time
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, 'dd.MM.yyyy HH:mm')
}

/**
 * Format date as relative time (e.g., "3 dager siden")
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '-'
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return formatDistance(dateObj, new Date(), { addSuffix: true, locale: nb })
}

/**
 * Format date range
 */
export function formatDateRange(
  start: string | Date | null | undefined,
  end: string | Date | null | undefined
): string {
  if (!start && !end) return '-'
  if (!end) return `Fra ${formatDate(start)}`
  if (!start) return `Til ${formatDate(end)}`
  return `${formatDate(start)} - ${formatDate(end)}`
}

/**
 * Get month name in Norwegian
 */
export function getMonthName(month: number): string {
  const months = [
    'Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Desember'
  ]
  return months[month] || ''
}

// ═══════════════════════════════════════════════════════════════════
// NUMBER FORMATTING
// ═══════════════════════════════════════════════════════════════════

/**
 * Format number as Norwegian currency (NOK)
 */
export function formatCurrency(
  amount: number | null | undefined,
  options: { decimals?: number; showSymbol?: boolean } = {}
): string {
  if (amount === null || amount === undefined) return '-'
  
  const { decimals = 0, showSymbol = true } = options
  
  const formatted = new Intl.NumberFormat('nb-NO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
  
  return showSymbol ? `kr ${formatted}` : formatted
}

/**
 * Format number with thousands separator
 */
export function formatNumber(
  value: number | null | undefined,
  decimals: number = 0
): string {
  if (value === null || value === undefined) return '-'
  
  return new Intl.NumberFormat('nb-NO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Format percentage
 */
export function formatPercent(
  value: number | null | undefined,
  decimals: number = 0
): string {
  if (value === null || value === undefined) return '-'
  
  return `${formatNumber(value, decimals)} %`
}

/**
 * Format hours (e.g., 7.5 -> "7:30")
 */
export function formatHours(hours: number | null | undefined): string {
  if (hours === null || hours === undefined) return '-'
  
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  
  return `${h}:${m.toString().padStart(2, '0')}`
}

/**
 * Format duration in hours and minutes
 */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return '-'
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) return `${mins} min`
  if (mins === 0) return `${hours} t`
  return `${hours} t ${mins} min`
}

// ═══════════════════════════════════════════════════════════════════
// STRING FORMATTING
// ═══════════════════════════════════════════════════════════════════

/**
 * Format phone number (Norwegian format)
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '-'
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')
  
  // Norwegian phone numbers (8 digits)
  if (digits.length === 8) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`
  }
  
  // With country code
  if (digits.length === 10 && digits.startsWith('47')) {
    return `+47 ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`
  }
  
  return phone
}

/**
 * Format org number (Norwegian format: XXX XXX XXX)
 */
export function formatOrgNumber(orgNum: string | null | undefined): string {
  if (!orgNum) return '-'
  
  const digits = orgNum.replace(/\D/g, '')
  
  if (digits.length === 9) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
  }
  
  return orgNum
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string | null | undefined, maxLength: number): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 3)}...`
}

/**
 * Format full name
 */
export function formatName(
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string {
  const parts = [firstName, lastName].filter(Boolean)
  return parts.join(' ') || '-'
}

/**
 * Get initials from name
 */
export function getInitials(
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string {
  const first = firstName?.[0]?.toUpperCase() || ''
  const last = lastName?.[0]?.toUpperCase() || ''
  return `${first}${last}` || '?'
}

// ═══════════════════════════════════════════════════════════════════
// FILE SIZE FORMATTING
// ═══════════════════════════════════════════════════════════════════

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return '-'
  
  const units = ['B', 'KB', 'MB', 'GB']
  let unitIndex = 0
  let size = bytes
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}
