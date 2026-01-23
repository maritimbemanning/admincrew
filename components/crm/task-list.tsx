'use client'

import * as React from 'react'
import { format, isPast, isToday, isTomorrow } from 'date-fns'
import { nb } from 'date-fns/locale'
import { 
  CheckCircle2, 
  Circle,
  Clock,
  AlertCircle,
  MoreHorizontal
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface Task {
  id: string
  title: string
  description?: string | null
  due_date?: string | null
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed'
  assigned_to?: string | null
  organization_name?: string | null
  contact_name?: string | null
}

interface TaskListProps {
  tasks: Task[]
  onComplete?: (taskId: string) => void
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  className?: string
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
}

const priorityLabels = {
  low: 'Lav',
  medium: 'Medium',
  high: 'Høy',
}

function getDueDateLabel(dueDate: string) {
  const date = new Date(dueDate)
  
  if (isToday(date)) {
    return { label: 'I dag', className: 'text-orange-600' }
  }
  if (isTomorrow(date)) {
    return { label: 'I morgen', className: 'text-yellow-600' }
  }
  if (isPast(date)) {
    return { label: 'Forfalt', className: 'text-red-600' }
  }
  
  return { 
    label: format(date, 'd. MMM', { locale: nb }), 
    className: 'text-muted-foreground' 
  }
}

export function TaskList({ 
  tasks, 
  onComplete, 
  onEdit, 
  onDelete,
  className 
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <CheckCircle2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Ingen oppgaver</p>
      </div>
    )
  }

  return (
    <ul className={cn('space-y-2', className)}>
      {tasks.map((task) => {
        const isCompleted = task.status === 'completed'
        const dueDateInfo = task.due_date ? getDueDateLabel(task.due_date) : null
        const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isCompleted

        return (
          <li
            key={task.id}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg border transition-colors',
              isCompleted && 'bg-muted/50 opacity-75',
              isOverdue && 'border-red-200 bg-red-50/50'
            )}
          >
            {/* Checkbox */}
            <button
              onClick={() => onComplete?.(task.id)}
              className="mt-0.5 flex-shrink-0"
              disabled={isCompleted}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Circle className={cn(
                  'h-5 w-5',
                  isOverdue ? 'text-red-400' : 'text-muted-foreground'
                )} />
              )}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={cn(
                  'font-medium',
                  isCompleted && 'line-through text-muted-foreground'
                )}>
                  {task.title}
                </p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit?.(task)}>
                      Rediger
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => onDelete?.(task.id)}
                    >
                      Slett
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {task.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {task.description}
                </p>
              )}

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className={priorityColors[task.priority]}>
                  {priorityLabels[task.priority]}
                </Badge>

                {dueDateInfo && (
                  <span className={cn('flex items-center gap-1 text-xs', dueDateInfo.className)}>
                    {isOverdue ? (
                      <AlertCircle className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {dueDateInfo.label}
                  </span>
                )}

                {(task.organization_name || task.contact_name) && (
                  <span className="text-xs text-muted-foreground">
                    {task.organization_name || task.contact_name}
                  </span>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
