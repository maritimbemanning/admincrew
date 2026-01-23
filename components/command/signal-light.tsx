'use client'

import { cn } from '@/lib/utils'

type SignalStatus = 'available' | 'available_soon' | 'on_assignment' | 'unavailable' | 'inactive'

interface SignalLightProps {
  status: SignalStatus
  size?: 'sm' | 'md' | 'lg'
  showPulse?: boolean
  className?: string
}

const statusColors: Record<SignalStatus, string> = {
  available: 'signal-light-green',
  available_soon: 'signal-light-yellow',
  on_assignment: 'signal-light-blue',
  unavailable: 'signal-light-red',
  inactive: 'signal-light-gray',
}

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
}

export function SignalLight({
  status,
  size = 'md',
  showPulse = true,
  className
}: SignalLightProps) {
  return (
    <span
      className={cn(
        'signal-light',
        sizeClasses[size],
        statusColors[status],
        !showPulse && 'after:hidden',
        className
      )}
      aria-label={status.replace('_', ' ')}
    />
  )
}

// Helper to convert candidate availability to signal status
export function getSignalStatus(availability: string | null | undefined): SignalStatus {
  switch (availability) {
    case 'available':
    case 'tilgjengelig':
      return 'available'
    case 'available_soon':
    case 'snart_tilgjengelig':
      return 'available_soon'
    case 'on_assignment':
    case 'på_oppdrag':
      return 'on_assignment'
    case 'unavailable':
    case 'ikke_tilgjengelig':
      return 'unavailable'
    default:
      return 'inactive'
  }
}
