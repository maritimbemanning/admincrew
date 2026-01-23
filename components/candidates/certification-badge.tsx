'use client'

import { Badge } from '@/components/ui/badge'
import { Award, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CertificationBadgeProps {
  name: string
  expiresAt?: string | null
  isValid?: boolean
  className?: string
}

export function CertificationBadge({ 
  name, 
  expiresAt, 
  isValid = true,
  className 
}: CertificationBadgeProps) {
  // Check if certification is expiring soon (within 30 days)
  const isExpiringSoon = expiresAt 
    ? new Date(expiresAt).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000
    : false

  // Check if certification is expired
  const isExpired = expiresAt 
    ? new Date(expiresAt).getTime() < Date.now()
    : false

  const getStatusIcon = () => {
    if (isExpired) return AlertTriangle
    if (isExpiringSoon) return Clock
    if (isValid) return CheckCircle
    return Award
  }

  const getStatusColor = () => {
    if (isExpired) return 'bg-red-100 text-red-800 border-red-200'
    if (isExpiringSoon) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    if (isValid) return 'bg-green-100 text-green-800 border-green-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const Icon = getStatusIcon()

  return (
    <Badge 
      variant="outline" 
      className={cn('gap-1', getStatusColor(), className)}
    >
      <Icon className="h-3 w-3" />
      <span className="truncate max-w-[150px]">{name}</span>
    </Badge>
  )
}
