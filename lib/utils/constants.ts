// lib/utils/constants.ts
// Application-wide constants

// ═══════════════════════════════════════════════════════════════════
// MARITIME ROLES
// ═══════════════════════════════════════════════════════════════════

export const MARITIME_ROLES = [
  { value: 'captain', label: 'Kaptein' },
  { value: 'chief_officer', label: 'Overstyrmann' },
  { value: 'second_officer', label: '2. Styrmann' },
  { value: 'third_officer', label: '3. Styrmann' },
  { value: 'chief_engineer', label: 'Maskinsjef' },
  { value: 'second_engineer', label: '2. Maskinist' },
  { value: 'third_engineer', label: '3. Maskinist' },
  { value: 'electrician', label: 'Elektriker' },
  { value: 'bosun', label: 'Båtsmann' },
  { value: 'able_seaman', label: 'Matros' },
  { value: 'ordinary_seaman', label: 'Lettmatros' },
  { value: 'deckhand', label: 'Dekksmann' },
  { value: 'cook', label: 'Kokk' },
  { value: 'steward', label: 'Steward' },
  { value: 'cadet_deck', label: 'Kadett (dekk)' },
  { value: 'cadet_engine', label: 'Kadett (maskin)' },
] as const

export type MaritimeRole = typeof MARITIME_ROLES[number]['value']

// ═══════════════════════════════════════════════════════════════════
// CERTIFICATIONS
// ═══════════════════════════════════════════════════════════════════

export const CERTIFICATION_CATEGORIES = [
  { value: 'competency', label: 'Kompetanse' },
  { value: 'safety', label: 'Sikkerhet' },
  { value: 'medical', label: 'Medisinsk' },
  { value: 'endorsement', label: 'Påtegning' },
  { value: 'special', label: 'Spesialkurs' },
  { value: 'other', label: 'Annet' },
] as const

export const COMMON_CERTIFICATIONS = [
  // Competency certificates
  { code: 'D1', name: 'Dekksoffiser klasse 1', category: 'competency' },
  { code: 'D2', name: 'Dekksoffiser klasse 2', category: 'competency' },
  { code: 'D3', name: 'Dekksoffiser klasse 3', category: 'competency' },
  { code: 'D4', name: 'Dekksoffiser klasse 4', category: 'competency' },
  { code: 'D5', name: 'Dekksoffiser klasse 5', category: 'competency' },
  { code: 'D6', name: 'Dekksoffiser klasse 6', category: 'competency' },
  { code: 'M1', name: 'Maskinoffiser klasse 1', category: 'competency' },
  { code: 'M2', name: 'Maskinoffiser klasse 2', category: 'competency' },
  { code: 'M3', name: 'Maskinoffiser klasse 3', category: 'competency' },
  { code: 'M4', name: 'Maskinoffiser klasse 4', category: 'competency' },
  
  // Safety certificates
  { code: 'STCW', name: 'STCW Grunnkurs', category: 'safety' },
  { code: 'GMDSS-GOC', name: 'GMDSS GOC', category: 'safety' },
  { code: 'GMDSS-ROC', name: 'GMDSS ROC', category: 'safety' },
  { code: 'BRM', name: 'Bridge Resource Management', category: 'safety' },
  { code: 'ERM', name: 'Engine Room Resource Management', category: 'safety' },
  
  // DP certificates
  { code: 'DP-BASIC', name: 'DP Basic', category: 'special' },
  { code: 'DP-ADV', name: 'DP Advanced', category: 'special' },
  
  // Medical
  { code: 'MED-2', name: 'Helseattest 2 år', category: 'medical' },
  { code: 'MED-1', name: 'Helseattest 1 år', category: 'medical' },
] as const

// ═══════════════════════════════════════════════════════════════════
// NORWEGIAN FYLKER (COUNTIES)
// ═══════════════════════════════════════════════════════════════════

export const NORWEGIAN_FYLKER = [
  { value: 'agder', label: 'Agder' },
  { value: 'innlandet', label: 'Innlandet' },
  { value: 'more_og_romsdal', label: 'Møre og Romsdal' },
  { value: 'nordland', label: 'Nordland' },
  { value: 'oslo', label: 'Oslo' },
  { value: 'rogaland', label: 'Rogaland' },
  { value: 'troms_og_finnmark', label: 'Troms og Finnmark' },
  { value: 'trondelag', label: 'Trøndelag' },
  { value: 'vestfold_og_telemark', label: 'Vestfold og Telemark' },
  { value: 'vestland', label: 'Vestland' },
  { value: 'viken', label: 'Viken' },
] as const

// ═══════════════════════════════════════════════════════════════════
// STATUS MAPPINGS
// ═══════════════════════════════════════════════════════════════════

export const AVAILABILITY_STATUS = {
  available: { label: 'Tilgjengelig', color: 'green' },
  available_soon: { label: 'Snart tilgjengelig', color: 'yellow' },
  on_assignment: { label: 'På oppdrag', color: 'blue' },
  unavailable: { label: 'Utilgjengelig', color: 'red' },
  inactive: { label: 'Inaktiv', color: 'gray' },
} as const

export const COMPLIANCE_STATUS = {
  not_started: { label: 'Ikke startet', color: 'gray' },
  documents_pending: { label: 'Dokumenter mangler', color: 'yellow' },
  review_pending: { label: 'Venter godkjenning', color: 'orange' },
  approved: { label: 'Godkjent', color: 'green' },
  expired: { label: 'Utløpt', color: 'red' },
  rejected: { label: 'Avvist', color: 'red' },
} as const

export const REQUEST_STATUS = {
  draft: { label: 'Utkast', color: 'gray' },
  pending_approval: { label: 'Venter godkjenning', color: 'yellow' },
  approved: { label: 'Godkjent', color: 'green' },
  matching: { label: 'Under matching', color: 'blue' },
  shortlisted: { label: 'Shortlist klar', color: 'purple' },
  offer_sent: { label: 'Tilbud sendt', color: 'orange' },
  offer_accepted: { label: 'Akseptert', color: 'green' },
  offer_rejected: { label: 'Avslått', color: 'red' },
  converted: { label: 'Konvertert', color: 'green' },
  on_hold: { label: 'På vent', color: 'yellow' },
  cancelled: { label: 'Kansellert', color: 'gray' },
  expired: { label: 'Utløpt', color: 'gray' },
} as const

export const ASSIGNMENT_STATUS = {
  draft: { label: 'Utkast', color: 'gray' },
  pending_compliance: { label: 'Venter compliance', color: 'yellow' },
  compliance_ok: { label: 'Compliance OK', color: 'green' },
  contract_drafting: { label: 'Kontrakt utarbeides', color: 'blue' },
  contract_sent: { label: 'Kontrakt sendt', color: 'purple' },
  contract_signed: { label: 'Signert', color: 'green' },
  ready_for_start: { label: 'Klar for start', color: 'green' },
  active: { label: 'Aktiv', color: 'blue' },
  completed: { label: 'Fullført', color: 'green' },
  invoiced: { label: 'Fakturert', color: 'purple' },
  paid: { label: 'Betalt', color: 'green' },
  cancelled: { label: 'Kansellert', color: 'gray' },
} as const

export const CONTRACT_STATUS = {
  draft: { label: 'Utkast', color: 'gray' },
  pending_signatures: { label: 'Venter signaturer', color: 'yellow' },
  partially_signed: { label: 'Delvis signert', color: 'orange' },
  signed: { label: 'Signert', color: 'green' },
  active: { label: 'Aktiv', color: 'blue' },
  expired: { label: 'Utløpt', color: 'gray' },
  terminated: { label: 'Terminert', color: 'red' },
} as const

// ═══════════════════════════════════════════════════════════════════
// PIPELINE STAGES
// ═══════════════════════════════════════════════════════════════════

export const CRM_PIPELINE_STAGES = [
  { value: 'lead', label: 'Lead', color: 'gray' },
  { value: 'prospect', label: 'Prospekt', color: 'blue' },
  { value: 'qualified', label: 'Kvalifisert', color: 'purple' },
  { value: 'proposal', label: 'Tilbud', color: 'orange' },
  { value: 'negotiation', label: 'Forhandling', color: 'yellow' },
  { value: 'customer', label: 'Kunde', color: 'green' },
  { value: 'churned', label: 'Tapt', color: 'red' },
] as const

export const REQUEST_KANBAN_COLUMNS = [
  { value: 'new', label: 'Nye', statuses: ['draft', 'pending_approval'] },
  { value: 'approved', label: 'Godkjent', statuses: ['approved'] },
  { value: 'matching', label: 'Matching', statuses: ['matching', 'shortlisted'] },
  { value: 'offer', label: 'Tilbud', statuses: ['offer_sent'] },
  { value: 'won', label: 'Vunnet', statuses: ['offer_accepted', 'converted'] },
  { value: 'lost', label: 'Tapt/Vent', statuses: ['offer_rejected', 'on_hold', 'cancelled', 'expired'] },
] as const

// ═══════════════════════════════════════════════════════════════════
// APP CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

export const APP_CONFIG = {
  name: 'AdminCrew',
  company: 'BlueCrew AS',
  locale: 'nb-NO',
  currency: 'NOK',
  defaultPageSize: 20,
  maxPageSize: 100,
  debounceMs: 300,
  matchingTimeoutMs: 10000, // 10 seconds
} as const

// ═══════════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ═══════════════════════════════════════════════════════════════════

export const KEYBOARD_SHORTCUTS = {
  search: { key: 'k', modifiers: ['meta'] },
  newCandidate: { key: 'n', modifiers: ['meta', 'shift'] },
  newRequest: { key: 'r', modifiers: ['meta', 'shift'] },
  quickMatch: { key: 'm', modifiers: ['meta'] },
  save: { key: 's', modifiers: ['meta'] },
  escape: { key: 'Escape', modifiers: [] },
} as const
