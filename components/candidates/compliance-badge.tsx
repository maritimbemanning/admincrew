'use client'

import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle2, 
  Clock, 
  FileWarning, 
  AlertTriangle,
  XCircle,
  Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export type ComplianceStatus = 
  | 'not_started' 
  | 'documents_pending' 
  | 'review_pending' 
  | 'approved'
  | 'expired'
  | 'rejected'

interface ComplianceBadgeProps {
  status: ComplianceStatus
  showLabel?: boolean
  showTooltip?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const statusConfig: Record<ComplianceStatus, {
  label: string
  description: string
  icon: typeof CheckCircle2
  className: string
  iconClassName: string
}> = {
  not_started: {
    label: 'Ikke startet',
    description: 'Compliance-prosessen har ikke startet ennå',
    icon: Clock,
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    iconClassName: 'text-gray-500',
  },
  documents_pending: {
    label: 'Dokumenter mangler',
    description: 'Nødvendige dokumenter må lastes opp',
    icon: FileWarning,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    iconClassName: 'text-yellow-600',
  },
  review_pending: {
    label: 'Venter godkjenning',
    description: 'Dokumenter er lastet opp og venter på gjennomgang',
    icon: Clock,
    className: 'bg-orange-100 text-orange-800 border-orange-200',
    iconClassName: 'text-orange-600',
  },
  approved: {
    label: 'Godkjent',
    description: 'Alle compliance-krav er oppfylt',
    icon: CheckCircle2,
    className: 'bg-green-100 text-green-800 border-green-200',
    iconClassName: 'text-green-600',
  },
  expired: {
    label: 'Utløpt',
    description: 'Sertifiseringer eller dokumenter har utløpt',
    icon: AlertTriangle,
    className: 'bg-red-100 text-red-800 border-red-200',
    iconClassName: 'text-red-600',
  },
  rejected: {
    label: 'Avvist',
    description: 'Dokumentasjon ble avvist og må oppdateres',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 border-red-200',
    iconClassName: 'text-red-600',
  },
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

export function ComplianceBadge({ 
  status, 
  showLabel = true,
  showTooltip = true,
  size = 'md',
  className 
}: ComplianceBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  const badge = (
    <Badge 
      variant="outline" 
      className={cn(
        'gap-1',
        config.className,
        !showLabel && 'px-1',
        className
      )}
    >
      <Icon className={cn(sizeClasses[size], config.iconClassName)} />
      {showLabel && <span>{config.label}</span>}
    </Badge>
  )

  if (!showTooltip) {
    return badge
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>{config.description}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Compliance checklist component for detailed view
interface ComplianceChecklistItem {
  id: string
  label: string
  status: 'completed' | 'pending' | 'missing' | 'expired'
  expiresAt?: string
}

interface ComplianceChecklistProps {
  items: ComplianceChecklistItem[]
  className?: string
}

const checklistStatusIcons = {
  completed: CheckCircle2,
  pending: Clock,
  missing: FileWarning,
  expired: AlertTriangle,
}

const checklistStatusColors = {
  completed: 'text-green-600',
  pending: 'text-yellow-600',
  missing: 'text-red-600',
  expired: 'text-red-600',
}

export function ComplianceChecklist({ items, className }: ComplianceChecklistProps) {
  return (
    <ul className={cn('space-y-2', className)}>
      {items.map((item) => {
        const Icon = checklistStatusIcons[item.status]
        const colorClass = checklistStatusColors[item.status]

        return (
          <li key={item.id} className="flex items-center gap-2 text-sm">
            <Icon className={cn('h-4 w-4', colorClass)} />
            <span className={item.status === 'completed' ? '' : 'text-muted-foreground'}>
              {item.label}
            </span>
            {item.expiresAt && item.status === 'expired' && (
              <span className="text-xs text-red-600">
                (utløpt {new Date(item.expiresAt).toLocaleDateString('nb-NO')})
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
