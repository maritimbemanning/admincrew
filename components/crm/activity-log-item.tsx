'use client'

import { formatDistanceToNow } from 'date-fns'
import { nb } from 'date-fns/locale'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Phone,
  Mail,
  Calendar,
  FileText,
  MessageSquare,
  Users,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  Edit,
  ArrowRight,
  Building2,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type ActivityType = 
  | 'call'
  | 'email'
  | 'meeting'
  | 'note'
  | 'task_created'
  | 'task_completed'
  | 'deal_created'
  | 'deal_stage_changed'
  | 'deal_won'
  | 'deal_lost'
  | 'contact_created'
  | 'document_uploaded'
  | 'status_change'

export interface ActivityLogItemProps {
  activity: {
    id: string
    type: ActivityType
    title: string
    description?: string
    created_at: string
    user?: {
      id: string
      name: string
    }
    metadata?: Record<string, any>
  }
  showUser?: boolean
  compact?: boolean
  className?: string
}

const activityConfig: Record<ActivityType, { 
  icon: typeof Phone
  color: string
  bgColor: string
}> = {
  call: { 
    icon: Phone, 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-100' 
  },
  email: { 
    icon: Mail, 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-100' 
  },
  meeting: { 
    icon: Calendar, 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-100' 
  },
  note: { 
    icon: FileText, 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-100' 
  },
  task_created: { 
    icon: CheckCircle, 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-100' 
  },
  task_completed: { 
    icon: CheckCircle, 
    color: 'text-green-600', 
    bgColor: 'bg-green-100' 
  },
  deal_created: { 
    icon: DollarSign, 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-100' 
  },
  deal_stage_changed: { 
    icon: ArrowRight, 
    color: 'text-yellow-600', 
    bgColor: 'bg-yellow-100' 
  },
  deal_won: { 
    icon: DollarSign, 
    color: 'text-green-600', 
    bgColor: 'bg-green-100' 
  },
  deal_lost: { 
    icon: DollarSign, 
    color: 'text-red-600', 
    bgColor: 'bg-red-100' 
  },
  contact_created: { 
    icon: User, 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-100' 
  },
  document_uploaded: { 
    icon: FileText, 
    color: 'text-green-600', 
    bgColor: 'bg-green-100' 
  },
  status_change: { 
    icon: Edit, 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-100' 
  },
}

export function ActivityLogItem({
  activity,
  showUser = true,
  compact = false,
  className,
}: ActivityLogItemProps) {
  const config = activityConfig[activity.type] || activityConfig.note
  const Icon = config.icon

  const timeAgo = formatDistanceToNow(new Date(activity.created_at), {
    addSuffix: true,
    locale: nb,
  })

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3 py-2', className)}>
        <div className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
          config.bgColor
        )}>
          <Icon className={cn('h-3.5 w-3.5', config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm truncate">{activity.title}</p>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {timeAgo}
        </span>
      </div>
    )
  }

  return (
    <div className={cn('flex gap-4', className)}>
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
          config.bgColor
        )}>
          <Icon className={cn('h-4 w-4', config.color)} />
        </div>
        {/* Vertical line */}
        <div className="w-0.5 flex-1 bg-border mt-2" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium">{activity.title}</p>
            {activity.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {activity.description}
              </p>
            )}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {timeAgo}
          </span>
        </div>

        {/* Metadata */}
        {activity.metadata && (
          <div className="mt-2 text-sm">
            {activity.metadata.from_stage && activity.metadata.to_stage && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="px-2 py-0.5 rounded bg-muted">
                  {activity.metadata.from_stage}
                </span>
                <ArrowRight className="h-3 w-3" />
                <span className="px-2 py-0.5 rounded bg-muted">
                  {activity.metadata.to_stage}
                </span>
              </div>
            )}
            {activity.metadata.duration && (
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <Clock className="h-3 w-3" />
                <span>{activity.metadata.duration} min</span>
              </div>
            )}
            {activity.metadata.organization && (
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <Building2 className="h-3 w-3" />
                <span>{activity.metadata.organization}</span>
              </div>
            )}
          </div>
        )}

        {/* User */}
        {showUser && activity.user && (
          <div className="flex items-center gap-2 mt-3">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[10px]">
                {activity.user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              {activity.user.name}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// Variant for timeline list
export function ActivityTimeline({ 
  activities, 
  className 
}: { 
  activities: ActivityLogItemProps['activity'][]
  className?: string 
}) {
  return (
    <div className={cn('space-y-0', className)}>
      {activities.map((activity, index) => (
        <ActivityLogItem
          key={activity.id}
          activity={activity}
          className={index === activities.length - 1 ? '[&>div:first-child>div:last-child]:hidden' : ''}
        />
      ))}
    </div>
  )
}
