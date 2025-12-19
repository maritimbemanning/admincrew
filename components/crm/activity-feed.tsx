'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { 
  Phone, 
  Mail, 
  Calendar, 
  MessageSquare, 
  FileText,
  Clock,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Activity {
  id: string
  type: 'call' | 'email' | 'meeting' | 'note' | 'task'
  title: string
  description?: string | null
  created_at: string
  created_by?: string | null
  contact_name?: string | null
}

interface ActivityFeedProps {
  activities: Activity[]
  className?: string
}

const activityIcons = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: MessageSquare,
  task: FileText,
}

const activityColors = {
  call: 'bg-green-100 text-green-700',
  email: 'bg-blue-100 text-blue-700',
  meeting: 'bg-purple-100 text-purple-700',
  note: 'bg-yellow-100 text-yellow-700',
  task: 'bg-orange-100 text-orange-700',
}

export function ActivityFeed({ activities, className }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Ingen aktiviteter ennå</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {activities.map((activity, index) => {
        const Icon = activityIcons[activity.type] || MessageSquare
        const colorClass = activityColors[activity.type] || 'bg-gray-100 text-gray-700'

        return (
          <div key={activity.id} className="relative flex gap-4">
            {/* Timeline line */}
            {index < activities.length - 1 && (
              <div className="absolute left-5 top-10 bottom-0 w-px bg-border" />
            )}

            {/* Icon */}
            <div className={cn(
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
              colorClass
            )}>
              <Icon className="h-5 w-5" />
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{activity.title}</p>
                  {activity.contact_name && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {activity.contact_name}
                    </p>
                  )}
                </div>
                <time className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(activity.created_at), 'PPp', { locale: nb })}
                </time>
              </div>
              {activity.description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {activity.description}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
