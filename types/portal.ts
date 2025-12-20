// types/portal.ts
// Typer for data fra bluecrew.no portal (søknader, interesse, bemanningsbehov, kontakt)
// BASERT PÅ: mcp_supabase_list_tables - FAKTISK DATABASE SCHEMA

// ═══════════════════════════════════════════════════════════════════════════════════════
// JOB APPLICATIONS
// Tabellnavn: job_applications
// Status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired'
// ═══════════════════════════════════════════════════════════════════════════════════════

export interface JobApplication {
  id: string
  job_posting_id: string | null
  candidate_id: string | null
  
  // Søker-info (engelske kolonnenavn i DB)
  name: string
  email: string
  phone: string | null
  cover_letter: string | null
  
  // Dokumenter
  cv_key: string | null
  certificates_key: string | null
  
  // Tracking
  ip_address: string | null
  user_agent: string | null
  source: string | null  // default: 'website'
  
  // Status - NB: 'pending' er default, ikke 'new'!
  status: JobApplicationStatus
  
  // Vipps verifisering
  vipps_verified: boolean
  vipps_name: string | null
  vipps_phone: string | null
  vipps_sub: string | null
  vipps_verified_at: string | null
  
  // Timestamps
  created_at: string
  updated_at: string
  
  // Joined (optional)
  job_posting?: {
    id: string
    title: string
    slug: string | null
    company_name: string | null
  }
}

// Status fra CHECK constraint i DB
export type JobApplicationStatus = 
  | 'pending'     // default
  | 'reviewed' 
  | 'shortlisted' 
  | 'rejected' 
  | 'hired'

export const JOB_APPLICATION_STATUS_LABELS: Record<JobApplicationStatus, string> = {
  pending: 'Ny',
  reviewed: 'Gjennomgått',
  shortlisted: 'Shortlist',
  rejected: 'Avslått',
  hired: 'Ansatt',
}

export const JOB_APPLICATION_STATUS_COLORS: Record<JobApplicationStatus, string> = {
  pending: 'bg-blue-100 text-blue-800',
  reviewed: 'bg-yellow-100 text-yellow-800',
  shortlisted: 'bg-purple-100 text-purple-800',
  rejected: 'bg-red-100 text-red-800',
  hired: 'bg-green-100 text-green-800',
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// INTEREST LEADS (Meld interesse)
// Tabellnavn: interest_leads
// Type: default 'sjomann' (ikke 'sjofolk'!)
// ═══════════════════════════════════════════════════════════════════════════════════════

export interface InterestLead {
  id: string
  navn: string
  epost: string
  telefon: string | null
  type: string | null  // default: 'sjomann'
  melding: string | null
  status: string | null  // default: 'new'
  metadata: Record<string, unknown> | null
  created_at: string
}

export type LeadType = 'sjomann' | 'rederi'
export type LeadStatus = 'new' | 'contacted' | 'converted' | 'archived'

export const LEAD_TYPE_LABELS: Record<string, string> = {
  sjomann: 'Sjømann',
  rederi: 'Rederi',
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Ny',
  contacted: 'Kontaktet',
  converted: 'Konvertert',
  archived: 'Arkivert',
}

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  converted: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-800',
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// STAFFING NEEDS (Bemanningsbehov fra rederier)
// Tabellnavn: staffing_needs
// NB: stillinger og oppstart er TEXT, ikke array/date!
// ═══════════════════════════════════════════════════════════════════════════════════════

export interface StaffingNeed {
  id: string
  fartoytype: string | null
  stillinger: string | null  // TEXT, ikke array!
  antall: number | null
  oppstart: string | null    // TEXT, ikke date!
  rotasjon: string | null
  kontakt_navn: string
  kontakt_epost: string
  kontakt_telefon: string | null
  bedrift: string | null
  merknad: string | null
  status: string | null  // default: 'new'
  metadata: Record<string, unknown> | null
  created_at: string
}

export type StaffingNeedStatus = 'new' | 'contacted' | 'negotiating' | 'converted' | 'closed'

export const STAFFING_STATUS_LABELS: Record<StaffingNeedStatus, string> = {
  new: 'Ny',
  contacted: 'Kontaktet',
  negotiating: 'Forhandler',
  converted: 'Konvertert',
  closed: 'Lukket',
}

export const STAFFING_STATUS_COLORS: Record<StaffingNeedStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  negotiating: 'bg-purple-100 text-purple-800',
  converted: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// CONTACTS (Kontaktskjema)
// Tabellnavn: contacts (ikke portal_contacts!)
// ═══════════════════════════════════════════════════════════════════════════════════════

export interface PortalContact {
  id: string
  navn: string
  epost: string
  telefon: string | null
  melding: string
  status: string | null  // default: 'new'
  metadata: Record<string, unknown> | null
  created_at: string
}

export type ContactStatus = 'new' | 'processed' | 'archived'

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  new: 'Ny',
  processed: 'Behandlet',
  archived: 'Arkivert',
}

export const CONTACT_STATUS_COLORS: Record<ContactStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  processed: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-800',
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// JOB POSTINGS (Stillinger)
// Tabellnavn: job_postings
// ═══════════════════════════════════════════════════════════════════════════════════════

export interface JobPosting {
  id: string
  title: string
  slug: string | null
  description: string | null
  short_description: string | null
  company_name: string | null
  contact_email: string | null
  contact_phone: string | null
  role: string | null
  vessel_type: string | null
  location: string | null
  job_type: string | null
  category: string | null
  fylke: string | null
  kommune: string | null
  region: string | null
  rotation: string | null
  salary_range: string | null
  salary_min: number | null
  salary_max: number | null
  salary_text: string | null
  requirements: unknown[] | null
  application_deadline: string | null
  meta_title: string | null
  meta_description: string | null
  status: string | null  // default: 'draft'
  published_at: string | null
  expires_at: string | null
  views_count: number
  applications_count: number
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export type JobPostingStatus = 'draft' | 'active' | 'filled' | 'expired' | 'archived'

export const JOB_POSTING_STATUS_LABELS: Record<JobPostingStatus, string> = {
  draft: 'Utkast',
  active: 'Aktiv',
  filled: 'Besatt',
  expired: 'Utløpt',
  archived: 'Arkivert',
}
