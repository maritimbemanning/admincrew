// ══════════════════════════════════════════════════════════════════════════════════════
// CAMPAIGN APPLICATIONS TYPES
// ══════════════════════════════════════════════════════════════════════════════════════

/**
 * Campaign application from bluecrew.no landing pages
 * Table: campaign_applications
 */
export interface CampaignApplication {
  id: string
  candidate_id: string | null
  name: string
  email: string
  phone: string
  position: CampaignPosition
  segment: CampaignSegment
  status: CampaignStatus
  cv_url: string | null
  cv_filename: string | null
  campaign: string | null
  source_url: string | null
  notes: string | null
  gdpr_consent: boolean
  gdpr_consent_date: string | null
  marketing_consent: boolean | null
  created_at: string
  updated_at: string
  // Joined candidate data when candidate_id exists
  candidate?: {
    display_name: string | null
    primary_role: string | null
    cv_key: string | null
    phone: string | null
  }
}

/**
 * Campaign position types from landing pages
 */
export type CampaignPosition = 
  | 'offshore'      // Generell offshore-stilling
  | 'elektriker'    // Elektriker/ETO
  | 'riggere'       // Rigger/Dekksoperatør
  | 'rov'           // ROV-operatør/pilot
  | 'mekaniker'     // Mekaniker/Maskinist
  | 'sveiser'       // Sveiser
  | 'eto'           // Elektro-Teknisk Offiser

/**
 * Campaign segment - industry sector
 */
export type CampaignSegment = 
  | 'offshore'   // Olje, gass, vind, rigg
  | 'oppdrett'   // Havbruk/Akvakultur
  | 'shipping'   // Shipping/Rederi

/**
 * Campaign application status workflow
 * 
 * IMPORTANT: 'ny' = incomplete application (form submitted but NO Vipps, NO CV)
 * These are NOT shown in AdminCrew - only complete applications are shown.
 * 
 * Workflow: User fills form → status='ny' → Vipps verification → CV upload → status='pending'
 */
export type CampaignStatus = 
  | 'ny'          // ⚠️ INCOMPLETE - just form, no Vipps, no CV (hidden from UI)
  | 'pending'     // ✅ Complete - Vipps verified + CV uploaded, ready for review
  | 'kontaktet'   // Har tatt kontakt med kandidaten
  | 'intervju'    // Booket/gjennomført intervju
  | 'godkjent'    // Kvalifisert, klar for oppdrag
  | 'avvist'      // Ikke aktuell
  | 'arkivert'    // Gammel søknad, ikke lenger aktiv

/**
 * Visible statuses in AdminCrew UI (excludes 'ny' incomplete applications)
 */
export type VisibleCampaignStatus = Exclude<CampaignStatus, 'ny'>

/**
 * Filter options for campaign applications
 */
export interface CampaignFilters {
  search?: string                    // Name, email, phone search
  positions?: CampaignPosition[]     // Filter by position(s)
  segments?: CampaignSegment[]       // Filter by segment(s)
  statuses?: CampaignStatus[]        // Filter by status(es)
  verified?: boolean | 'all'         // Has candidate_id or not
  campaign?: string                  // Filter by campaign name
  dateFrom?: string                  // Created after date
  dateTo?: string                    // Created before date
}

/**
 * Stats summary for campaign applications
 * Note: Only counts COMPLETE applications (excludes 'ny' status)
 */
export interface CampaignStats {
  total: number
  byStatus: Record<VisibleCampaignStatus, number>
  byPosition: Record<CampaignPosition, number>
  bySegment: Record<CampaignSegment, number>
  verified: number      // Has Bluecrew Profile linked (candidate_id)
  unverified: number    // Missing Bluecrew Profile (shouldn't happen for complete apps)
  newToday: number      // Complete applications from today
  newThisWeek: number   // Complete applications from this week
}

/**
 * Sort options for campaign applications
 */
export type CampaignSortField = 
  | 'created_at'
  | 'updated_at'
  | 'name'
  | 'status'
  | 'position'

export interface CampaignSort {
  field: CampaignSortField
  direction: 'asc' | 'desc'
}
