'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Building2, Calendar, Users, GripVertical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { CustomerRequest } from '@/types/operations'
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
} from '@/types/operations'
import { cn } from '@/lib/utils'

interface RequestCardProps {
  request: CustomerRequest
  onClick?: () => void
}

export function RequestCard({ request, onClick }: RequestCardProps) {
  return (
    <Card
      className={cn(
        'p-3 cursor-pointer hover:shadow-md transition-shadow',
        'border-l-4',
        request.priority === 'urgent' && 'border-l-red-500',
        request.priority === 'high' && 'border-l-orange-500',
        request.priority === 'medium' && 'border-l-blue-500',
        request.priority === 'low' && 'border-l-gray-300'
      )}
      onClick={onClick}
    >
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-mono">
              {request.request_number}
            </p>
            <h4 className="font-medium text-sm truncate">{request.title}</h4>
          </div>
          <Badge
            variant="outline"
            className={cn('text-xs shrink-0', PRIORITY_COLORS[request.priority])}
          >
            {PRIORITY_LABELS[request.priority]}
          </Badge>
        </div>

        {/* Role & Quantity */}
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span>
            {request.quantity}x {request.role_needed}
          </span>
        </div>

        {/* Organization */}
        {request.organization && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            <span className="truncate">{request.organization.name}</span>
          </div>
        )}

        {/* Start Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {new Date(request.start_date).toLocaleDateString('nb-NO', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>

        {/* Value */}
        {request.estimated_value_nok && (
          <div className="text-sm font-medium text-green-600">
            {new Intl.NumberFormat('nb-NO', {
              style: 'currency',
              currency: 'NOK',
              maximumFractionDigits: 0,
            }).format(request.estimated_value_nok)}
          </div>
        )}
      </div>
    </Card>
  )
}

// Sortable version for Kanban
interface SortableRequestCardProps extends RequestCardProps {
  id: string
}

export function SortableRequestCard({ id, request, onClick }: SortableRequestCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && 'opacity-50')}
    >
      <Card
        className={cn(
          'p-3 cursor-pointer hover:shadow-md transition-shadow',
          'border-l-4',
          request.priority === 'urgent' && 'border-l-red-500',
          request.priority === 'high' && 'border-l-orange-500',
          request.priority === 'medium' && 'border-l-blue-500',
          request.priority === 'low' && 'border-l-gray-300'
        )}
        onClick={onClick}
      >
        <div className="space-y-2">
          {/* Drag Handle + Header */}
          <div className="flex items-start gap-2">
            <button
              {...attributes}
              {...listeners}
              className="p-0.5 -ml-1 cursor-grab active:cursor-grabbing touch-none"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-mono">
                {request.request_number}
              </p>
              <h4 className="font-medium text-sm truncate">{request.title}</h4>
            </div>
            <Badge
              variant="outline"
              className={cn('text-xs shrink-0', PRIORITY_COLORS[request.priority])}
            >
              {PRIORITY_LABELS[request.priority]}
            </Badge>
          </div>

          {/* Role & Quantity */}
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span>
              {request.quantity}x {request.role_needed}
            </span>
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {new Date(request.start_date).toLocaleDateString('nb-NO', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>

          {/* Value */}
          {request.estimated_value_nok && (
            <div className="text-sm font-medium text-green-600">
              ~{Math.round(request.estimated_value_nok / 1000)}K
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
