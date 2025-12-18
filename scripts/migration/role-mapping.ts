/**
 * Role Mapping - Bluecrew.no -> AdminCrew V2
 *
 * This file contains mappings for converting role names from bluecrew.no
 * to the standardized format used in adminc.no v2.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ROLE MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

export const ROLE_MAP: Record<string, string> = {
  // ═══════════════════════════════════════════════════════════════════════════════
  // DEKKSOFFISERER
  // ═══════════════════════════════════════════════════════════════════════════════
  'Kaptein / Skipsfører': 'captain',
  'Kaptein': 'captain',
  'Skipsfører': 'captain',
  'kaptein': 'captain',
  'skipsfører': 'captain',
  'Skipper / kyst': 'skipper',
  'Skipper': 'skipper',
  'skipper': 'skipper',
  'Overstyrmann': 'chief_officer',
  'overstyrmann': 'chief_officer',
  'Styrmann': 'second_officer',
  'styrmann': 'second_officer',
  '1. Styrmann': 'second_officer',
  '2. Styrmann': 'third_officer',
  'Kadett dekk': 'deck_cadet',
  'Dekkskadett': 'deck_cadet',

  // ═══════════════════════════════════════════════════════════════════════════════
  // MASKINOFFISERER
  // ═══════════════════════════════════════════════════════════════════════════════
  'Maskinsjef': 'chief_engineer',
  'maskinsjef': 'chief_engineer',
  'Maskinist': 'engineer',
  'maskinist': 'engineer',
  '1. Maskinist': 'second_engineer',
  '2. Maskinist': 'third_engineer',
  'Kadett maskin': 'engine_cadet',
  'Maskinkadett': 'engine_cadet',
  'ETO': 'electro_technical_officer',
  'eto': 'electro_technical_officer',
  'ETO (Elektro-teknisk offiser)': 'electro_technical_officer',
  'Elektro-teknisk offiser': 'electro_technical_officer',

  // ═══════════════════════════════════════════════════════════════════════════════
  // MANNSKAP (DEKK)
  // ═══════════════════════════════════════════════════════════════════════════════
  'Matros': 'able_seaman',
  'matros': 'able_seaman',
  'Lettmatros': 'ordinary_seaman',
  'Dekksarbeider': 'ordinary_seaman',
  'dekksarbeider': 'ordinary_seaman',
  'Motormann': 'motorman',
  'motormann': 'motorman',
  'Pumpemann': 'pumpman',

  // ═══════════════════════════════════════════════════════════════════════════════
  // SERVICE / CATERING
  // ═══════════════════════════════════════════════════════════════════════════════
  'Kokk': 'cook',
  'kokk': 'cook',
  'Skipskokk': 'cook',
  'Byssegutt': 'cook',
  'Steward': 'steward',
  'steward': 'steward',
  'Messegutt': 'mess_boy',
  'Messemann': 'mess_boy',
  'Forpleiningsassistent': 'steward',

  // ═══════════════════════════════════════════════════════════════════════════════
  // SPESIALISTER
  // ═══════════════════════════════════════════════════════════════════════════════
  'ROV Pilot': 'rov_pilot',
  'ROV-pilot': 'rov_pilot',
  'ROV pilot': 'rov_pilot',
  'ROV-operatør': 'rov_pilot',
  'DP Operatør': 'dp_operator',
  'DP-operatør': 'dp_operator',
  'DPO': 'dp_operator',
  'Dykker': 'diver',
  'dykker': 'diver',
  'Kranfører': 'crane_operator',
  'kranfører': 'crane_operator',
  'Krankjører': 'crane_operator',

  // ═══════════════════════════════════════════════════════════════════════════════
  // HAVBRUK / AKVAKULTUR
  // ═══════════════════════════════════════════════════════════════════════════════
  'Akvatekniker': 'aquaculture_technician',
  'akvatekniker': 'aquaculture_technician',
  'Akvatekniker m/fagbrev': 'aquaculture_technician',
  'Akvakulturtekniker': 'aquaculture_technician',
  'Røkter': 'fish_farm_worker',
  'røkter': 'fish_farm_worker',
  'Driftstekniker havbruk': 'aquaculture_operations',
  'Havbruksarbeider': 'fish_farm_worker',
  'Oppdrettsarbeider': 'fish_farm_worker',
  'Merdarbeider': 'fish_farm_worker',
  'Operativ drift': 'aquaculture_operations',
  'Vedlikehold': 'aquaculture_technician',

  // ═══════════════════════════════════════════════════════════════════════════════
  // FISKERI
  // ═══════════════════════════════════════════════════════════════════════════════
  'Fisker': 'fisher',
  'fisker': 'fisher',
  'Fiskerikaptein': 'captain',
  'Bas': 'fisher',

  // ═══════════════════════════════════════════════════════════════════════════════
  // SERVICEFARTØY
  // ═══════════════════════════════════════════════════════════════════════════════
  'Skipper/Styrmann': 'skipper',
  'Kokekyndig': 'cook',

  // ═══════════════════════════════════════════════════════════════════════════════
  // LOGISTIKK
  // ═══════════════════════════════════════════════════════════════════════════════
  'Supply': 'other_maritime',
  'Offshore service': 'other_maritime',

  // ═══════════════════════════════════════════════════════════════════════════════
  // ANNET
  // ═══════════════════════════════════════════════════════════════════════════════
  'Annet maritimt': 'other_maritime',
  'Annet': 'other',
  'annet': 'other',
  'Andre stillinger': 'other',
  '': 'other',
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

export type AvailabilityStatus =
  | 'available'
  | 'available_soon'
  | 'on_assignment'
  | 'unavailable'
  | 'inactive'

export const STATUS_MAP: Record<string, AvailabilityStatus> = {
  pending: 'available',
  godkjent: 'available',
  aktiv: 'available',
  inaktiv: 'unavailable',
}

// ═══════════════════════════════════════════════════════════════════════════════
// DISPLAY NAMES (for UI)
// ═══════════════════════════════════════════════════════════════════════════════

export const DISPLAY_NAMES: Record<string, string> = {
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
  fish_farm_worker: 'Røkter',
  aquaculture_operations: 'Driftstekniker havbruk',
  other_maritime: 'Annet maritimt',
  other: 'Annet',
  deck_cadet: 'Kadett dekk',
  engine_cadet: 'Kadett maskin',
  pumpman: 'Pumpemann',
  mess_boy: 'Messegutt',
  crane_operator: 'Kranfører',
  fisher: 'Fisker',
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Map a role from bluecrew.no format to V2 format
 * Handles both simple roles ("Matros") and category:role format ("Servicefartøy mannskap:Matros")
 */
export function mapRole(sourceRole: string | null | undefined): string {
  if (!sourceRole) return 'other'

  // Check if it's in "Category:Role" format
  if (sourceRole.includes(':')) {
    const rolePart = sourceRole.split(':')[1]?.trim()
    if (rolePart && ROLE_MAP[rolePart]) {
      return ROLE_MAP[rolePart]
    }
  }

  // Try direct lookup
  return ROLE_MAP[sourceRole] || 'other'
}

/**
 * Map availability status from bluecrew.no to V2
 */
export function mapStatus(sourceStatus: string | null | undefined): AvailabilityStatus {
  if (!sourceStatus) return 'available'
  return STATUS_MAP[sourceStatus.toLowerCase()] || 'available'
}

/**
 * Get display name for a role
 */
export function getDisplayName(role: string): string {
  return DISPLAY_NAMES[role] || role
}
