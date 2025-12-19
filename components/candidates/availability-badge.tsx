'use client'

import { Badge } from '@/components/ui/badge'
import { Calendar, Check, Clock, Pause, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AvailabilityStatus = 
  | 'available' 
  | 'available_soon' 
  | 'on_assignment' 
  | 'unavailable'
  | 'inactive'

interface AvailabilityBadgeProps {
  status: AvailabilityStatus
  availableFrom?: string | null
  showDate?: boolean
  size?: 'sm' | 'md'
  className?: string
}

const statusConfig: Record<AvailabilityStatus, {
  label: string
  icon: typeof Check
  className: string
}> = {
  available: {
    label: 'Tilgjengelig',
    icon: Check,
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  available_soon: {
    label: 'Snart tilgjengelig',
    icon: Calendar,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  on_assignment: {
    label: 'På oppdrag',
    icon: Clock,
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  unavailable: {
    label: 'Utilgjengelig',
    icon: X,
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  inactive: {
    label: 'Inaktiv',
    icon: Pause,
    className: 'bg-gray-100 text-gray-500 border-gray-200',
  },
}

export function AvailabilityBadge({ 
  status, 
  availableFrom,
  showDate = false,
  size = 'md',
  className 
}: AvailabilityBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  const formattedDate = availableFrom 
    ? new Date(availableFrom).toLocaleDateString('nb-NO', {
        day: 'numeric',
        month: 'short',
      })
    : null

  return (
    <Badge 
      variant="outline" 
      className={cn(
        'gap-1',
        config.className,
        size === 'sm' && 'text-xs px-1.5 py-0',
        className
      )}
    >
      <Icon className={cn('h-3 w-3', size === 'sm' && 'h-2.5 w-2.5')} />
      <span>
        {config.label}
        {showDate && formattedDate && status === 'available_soon' && (
          <span className="ml-1">({formattedDate})</span>
        )}
      </span>
    </Badge>
  )
}
