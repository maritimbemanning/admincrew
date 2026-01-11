import {
  Zap,
  Wrench,
  Anchor,
  Radio,
  Cog,
  Flame,
  Ship,
  Fish,
  Package,
  type LucideIcon,
} from 'lucide-react'
import type { CampaignPosition, CampaignSegment, CampaignStatus } from '@/types/campaign'

// ══════════════════════════════════════════════════════════════════════════════════════
// POSITION CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════════════

export interface PositionConfig {
  value: CampaignPosition
  label: string
  icon: LucideIcon
  color: string
  description: string
}

export const CAMPAIGN_POSITIONS: Record<CampaignPosition, PositionConfig> = {
  offshore: {
    value: 'offshore',
    label: 'Offshore',
    icon: Ship,
    color: 'bg-blue-500',
    description: 'Generell offshore-stilling',
  },
  elektriker: {
    value: 'elektriker',
    label: 'Elektriker',
    icon: Zap,
    color: 'bg-yellow-500',
    description: 'Elektriker/ETO',
  },
  riggere: {
    value: 'riggere',
    label: 'Rigger',
    icon: Anchor,
    color: 'bg-slate-500',
    description: 'Rigger/Dekksoperatør',
  },
  rov: {
    value: 'rov',
    label: 'ROV-operatør',
    icon: Radio,
    color: 'bg-purple-500',
    description: 'ROV-operatør/pilot',
  },
  mekaniker: {
    value: 'mekaniker',
    label: 'Mekaniker',
    icon: Wrench,
    color: 'bg-orange-500',
    description: 'Mekaniker/Maskinist',
  },
  sveiser: {
    value: 'sveiser',
    label: 'Sveiser',
    icon: Flame,
    color: 'bg-red-500',
    description: 'Sveiser',
  },
  eto: {
    value: 'eto',
    label: 'ETO',
    icon: Zap,
    color: 'bg-amber-500',
    description: 'Elektro-Teknisk Offiser',
  },
}

export const POSITION_OPTIONS = Object.values(CAMPAIGN_POSITIONS)

// ══════════════════════════════════════════════════════════════════════════════════════
// SEGMENT CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════════════

export interface SegmentConfig {
  value: CampaignSegment
  label: string
  labelNo: string
  icon: LucideIcon
  color: string
  bgColor: string
  textColor: string
  description: string
}

export const CAMPAIGN_SEGMENTS: Record<CampaignSegment, SegmentConfig> = {
  offshore: {
    value: 'offshore',
    label: 'Offshore',
    labelNo: 'Offshore',
    icon: Ship,
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    description: 'Olje, gass, vind, rigg',
  },
  oppdrett: {
    value: 'oppdrett',
    label: 'Aquaculture',
    labelNo: 'Havbruk/Akvakultur',
    icon: Fish,
    color: 'teal',
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-800',
    description: 'Brønnbåt, servicebåter',
  },
  shipping: {
    value: 'shipping',
    label: 'Shipping',
    labelNo: 'Shipping/Rederi',
    icon: Package,
    color: 'indigo',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-800',
    description: 'Ferger, cargo, supply',
  },
}

export const SEGMENT_OPTIONS = Object.values(CAMPAIGN_SEGMENTS)

// ══════════════════════════════════════════════════════════════════════════════════════
// STATUS CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════════════

export interface StatusConfig {
  value: CampaignStatus
  label: string
  color: string
  bgColor: string
  textColor: string
  description: string
  order: number
}

export const CAMPAIGN_STATUSES: Record<CampaignStatus, StatusConfig> = {
  ny: {
    value: 'ny',
    label: 'Ny',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    description: 'Nettopp mottatt, ikke behandlet',
    order: 1,
  },
  pending: {
    value: 'pending',
    label: 'Venter',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    description: 'Vipps-verifisert, venter på vurdering',
    order: 2,
  },
  kontaktet: {
    value: 'kontaktet',
    label: 'Kontaktet',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    description: 'Har tatt kontakt med kandidaten',
    order: 3,
  },
  intervju: {
    value: 'intervju',
    label: 'Intervju',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    description: 'Booket/gjennomført intervju',
    order: 4,
  },
  godkjent: {
    value: 'godkjent',
    label: 'Godkjent',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    description: 'Kvalifisert, klar for oppdrag',
    order: 5,
  },
  avvist: {
    value: 'avvist',
    label: 'Avvist',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    description: 'Ikke aktuell',
    order: 6,
  },
  arkivert: {
    value: 'arkivert',
    label: 'Arkivert',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    description: 'Gammel søknad, ikke lenger aktiv',
    order: 7,
  },
}

export const STATUS_OPTIONS = Object.values(CAMPAIGN_STATUSES).sort((a, b) => a.order - b.order)

// ══════════════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════════════

export function getPositionConfig(position: CampaignPosition): PositionConfig {
  return CAMPAIGN_POSITIONS[position] || CAMPAIGN_POSITIONS.offshore
}

export function getSegmentConfig(segment: CampaignSegment): SegmentConfig {
  return CAMPAIGN_SEGMENTS[segment] || CAMPAIGN_SEGMENTS.offshore
}

export function getStatusConfig(status: CampaignStatus): StatusConfig {
  return CAMPAIGN_STATUSES[status] || CAMPAIGN_STATUSES.ny
}

export function getPositionLabel(position: CampaignPosition): string {
  return CAMPAIGN_POSITIONS[position]?.label || position
}

export function getSegmentLabel(segment: CampaignSegment): string {
  return CAMPAIGN_SEGMENTS[segment]?.labelNo || segment
}

export function getStatusLabel(status: CampaignStatus): string {
  return CAMPAIGN_STATUSES[status]?.label || status
}
