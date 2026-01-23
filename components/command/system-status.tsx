'use client'

import { cn } from '@/lib/utils'

type Status = 'live' | 'synced' | 'offline' | 'error'

interface SystemStatusProps {
  status: Status
  lastSync?: Date
  showTime?: boolean
  className?: string
}

export function SystemStatus({
  status,
  lastSync,
  showTime = true,
  className
}: SystemStatusProps) {
  const statusConfig = {
    live: { label: 'LIVE', className: 'status-live' },
    synced: { label: 'SYNCED', className: 'status-synced' },
    offline: { label: 'OFFLINE', className: 'status-offline' },
    error: { label: 'ERROR', className: 'status-offline' },
  }

  const config = statusConfig[status]
  const timeString = lastSync
    ? lastSync.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <span className={cn(config.className, className)}>
      <span className="signal-light signal-light-green w-1.5 h-1.5" />
      {config.label}
      {showTime && timeString && (
        <span className="text-muted-foreground ml-1">{timeString}</span>
      )}
    </span>
  )
}
