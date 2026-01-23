'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  FileText, 
  User,
  Building2,
  FileSignature
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TimelineEvent {
  id: string
  type: 'status_change' | 'document' | 'signature' | 'timesheet' | 'note'
  title: string
  description?: string
  timestamp: string
  user?: string
  status?: 'completed' | 'pending' | 'in_progress'
}

interface AssignmentTimelineProps {
  events: TimelineEvent[]
  className?: string
}

const eventIcons = {
  status_change: Clock,
  document: FileText,
  signature: FileSignature,
  timesheet: Clock,
  note: Circle,
}

const eventColors = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
}

export function AssignmentTimeline({ events, className }: AssignmentTimelineProps) {
  if (events.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Ingen hendelser ennå</p>
      </div>
    )
  }

  // Sort events by timestamp, newest first
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return (
    <div className={cn('space-y-4', className)}>
      {sortedEvents.map((event, index) => {
        const Icon = eventIcons[event.type] || Circle
        const colorClass = event.status 
          ? eventColors[event.status] 
          : 'bg-gray-100 text-gray-700'

        return (
          <div key={event.id} className="relative flex gap-4">
            {/* Timeline line */}
            {index < sortedEvents.length - 1 && (
              <div className="absolute left-5 top-10 bottom-0 w-px bg-border" />
            )}

            {/* Icon */}
            <div className={cn(
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
              colorClass
            )}>
              {event.status === 'completed' ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Icon className="h-5 w-5" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{event.title}</p>
                  {event.user && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {event.user}
                    </p>
                  )}
                </div>
                <time className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(event.timestamp), 'PPp', { locale: nb })}
                </time>
              </div>
              {event.description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {event.description}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Predefined timeline templates for common assignment flows
export const assignmentStatusFlow: TimelineEvent['type'][] = [
  'status_change', // Request created
  'status_change', // Matching
  'status_change', // Shortlisted
  'status_change', // Candidate selected
  'document',      // Compliance check
  'signature',     // Contract signed
  'status_change', // Ready for start
  'status_change', // Active
]

export function generateAssignmentTimeline(assignment: {
  status: string
  created_at: string
  contract_signed_at?: string
  started_at?: string
}): TimelineEvent[] {
  const events: TimelineEvent[] = []

  // Always add creation event
  events.push({
    id: '1',
    type: 'status_change',
    title: 'Oppdrag opprettet',
    timestamp: assignment.created_at,
    status: 'completed',
  })

  // Add contract event if signed
  if (assignment.contract_signed_at) {
    events.push({
      id: '2',
      type: 'signature',
      title: 'Kontrakt signert',
      timestamp: assignment.contract_signed_at,
      status: 'completed',
    })
  }

  // Add start event if started
  if (assignment.started_at) {
    events.push({
      id: '3',
      type: 'status_change',
      title: 'Oppdrag startet',
      timestamp: assignment.started_at,
      status: 'completed',
    })
  }

  return events
}
