'use client'

import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  className?: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  // Availability
  available: { label: 'Tilgjengelig', className: 'bg-green-100 text-green-800 border-green-200' },
  available_soon: { label: 'Snart tilgjengelig', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  on_assignment: { label: 'På oppdrag', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  unavailable: { label: 'Utilgjengelig', className: 'bg-gray-100 text-gray-800 border-gray-200' },
  inactive: { label: 'Inaktiv', className: 'bg-gray-100 text-gray-500 border-gray-200' },

  // Compliance
  not_started: { label: 'Ikke startet', className: 'bg-gray-100 text-gray-800 border-gray-200' },
  documents_pending: { label: 'Dokumenter mangler', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  review_pending: { label: 'Venter på godkjenning', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  approved: { label: 'Godkjent', className: 'bg-green-100 text-green-800 border-green-200' },
  expired: { label: 'Utløpt', className: 'bg-red-100 text-red-800 border-red-200' },
  rejected: { label: 'Avvist', className: 'bg-red-100 text-red-800 border-red-200' },

  // Request status
  draft: { label: 'Utkast', className: 'bg-gray-100 text-gray-800 border-gray-200' },
  pending_approval: { label: 'Venter godkjenning', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  matching: { label: 'Matching', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  shortlisted: { label: 'Shortlistet', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  offer_sent: { label: 'Tilbud sendt', className: 'bg-purple-100 text-purple-800 border-purple-200' },
  offer_accepted: { label: 'Tilbud akseptert', className: 'bg-green-100 text-green-800 border-green-200' },
  offer_rejected: { label: 'Tilbud avvist', className: 'bg-red-100 text-red-800 border-red-200' },
  converted: { label: 'Konvertert', className: 'bg-green-100 text-green-800 border-green-200' },
  on_hold: { label: 'På vent', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  cancelled: { label: 'Kansellert', className: 'bg-red-100 text-red-800 border-red-200' },

  // Assignment status
  pending_compliance: { label: 'Venter compliance', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  compliance_ok: { label: 'Compliance OK', className: 'bg-green-100 text-green-800 border-green-200' },
  contract_drafting: { label: 'Kontrakt utarbeides', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  contract_sent: { label: 'Kontrakt sendt', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  contract_signed: { label: 'Kontrakt signert', className: 'bg-green-100 text-green-800 border-green-200' },
  ready_for_start: { label: 'Klar til start', className: 'bg-green-100 text-green-800 border-green-200' },
  active: { label: 'Aktiv', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  completed: { label: 'Fullført', className: 'bg-gray-100 text-gray-800 border-gray-200' },
  invoiced: { label: 'Fakturert', className: 'bg-green-100 text-green-800 border-green-200' },
  paid: { label: 'Betalt', className: 'bg-green-100 text-green-800 border-green-200' },

  // Contract status
  pending_review: { label: 'Venter gjennomgang', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  ready_for_signature: { label: 'Klar for signering', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  sent: { label: 'Sendt', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  partially_signed: { label: 'Delvis signert', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  signed: { label: 'Signert', className: 'bg-green-100 text-green-800 border-green-200' },

  // Timesheet status
  submitted: { label: 'Innsendt', className: 'bg-blue-100 text-blue-800 border-blue-200' },

  // Pipeline stages
  lead: { label: 'Lead', className: 'bg-gray-100 text-gray-800 border-gray-200' },
  contacted: { label: 'Kontaktet', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  meeting_scheduled: { label: 'Møte booka', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  proposal_sent: { label: 'Tilbud sendt', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  negotiation: { label: 'Forhandling', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  won: { label: 'Kunde', className: 'bg-green-100 text-green-800 border-green-200' },
  lost: { label: 'Tapt', className: 'bg-red-100 text-red-800 border-red-200' },
  churned: { label: 'Churned', className: 'bg-red-100 text-red-800 border-red-200' },

  // QMS
  open: { label: 'Åpen', className: 'bg-red-100 text-red-800 border-red-200' },
  analysis: { label: 'Under analyse', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  action_planned: { label: 'Tiltak planlagt', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  action_implemented: { label: 'Tiltak implementert', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  verified: { label: 'Verifisert', className: 'bg-green-100 text-green-800 border-green-200' },
  closed: { label: 'Lukket', className: 'bg-gray-100 text-gray-800 border-gray-200' },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { 
    label: status, 
    className: 'bg-gray-100 text-gray-800 border-gray-200' 
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}

// Export the config for use elsewhere
export { statusConfig }
