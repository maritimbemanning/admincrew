'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { SortableRequestCard, RequestCard } from './request-card'
import { useRequestPipeline, useUpdateRequestStatus } from '@/hooks/use-requests'
import type { CustomerRequest, RequestStatus, RequestFilters } from '@/types/operations'
import { REQUEST_STATUS_LABELS, REQUEST_PIPELINE_STAGES } from '@/types/operations'
import { cn } from '@/lib/utils'

interface RequestKanbanProps {
  filters?: Omit<RequestFilters, 'status'>
}

export function RequestKanban({ filters }: RequestKanbanProps) {
  const router = useRouter()
  const { data, isLoading } = useRequestPipeline(filters)
  const updateStatus = useUpdateRequestStatus()

  const [activeRequest, setActiveRequest] = useState<CustomerRequest | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const request = findRequest(active.id as string)
    if (request) {
      setActiveRequest(request)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveRequest(null)

    if (!over) return

    const requestId = active.id as string
    const newStatus = over.id as RequestStatus

    // Find current status
    const request = findRequest(requestId)
    if (!request || request.status === newStatus) return

    // Update status
    updateStatus.mutate({ id: requestId, status: newStatus })
  }

  const findRequest = (id: string): CustomerRequest | undefined => {
    if (!data?.byStatus) return undefined
    for (const requests of Object.values(data.byStatus)) {
      const found = requests.find((r) => r.id === id)
      if (found) return found
    }
    return undefined
  }

  if (isLoading) {
    return <KanbanSkeleton />
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Kunne ikke laste requests
      </div>
    )
  }

  const { byStatus, stats } = data

  // Pipeline stages to show in Kanban
  const stages: RequestStatus[] = REQUEST_PIPELINE_STAGES

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {stages.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            requests={byStatus[status] || []}
            stats={stats[status]}
            onRequestClick={(id) => router.push(`/operations/requests/${id}`)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeRequest && <RequestCard request={activeRequest} />}
      </DragOverlay>
    </DndContext>
  )
}

interface KanbanColumnProps {
  status: RequestStatus
  requests: CustomerRequest[]
  stats?: { count: number; totalValue: number }
  onRequestClick: (id: string) => void
}

function KanbanColumn({ status, requests, stats, onRequestClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col w-72 min-w-72 bg-muted/30 rounded-lg',
        isOver && 'bg-muted/50 ring-2 ring-primary/20'
      )}
    >
      {/* Column Header */}
      <div className="p-3 border-b bg-background rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{REQUEST_STATUS_LABELS[status]}</h3>
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
            {stats?.count || 0}
          </span>
        </div>
        {stats && stats.totalValue > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            ~{new Intl.NumberFormat('nb-NO', {
              style: 'currency',
              currency: 'NOK',
              notation: 'compact',
              maximumFractionDigits: 0,
            }).format(stats.totalValue)}
          </p>
        )}
      </div>

      {/* Column Content */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px]">
        <SortableContext
          items={requests.map((r) => r.id)}
          strategy={verticalListSortingStrategy}
        >
          {requests.map((request) => (
            <SortableRequestCard
              key={request.id}
              id={request.id}
              request={request}
              onClick={() => onRequestClick(request.id)}
            />
          ))}
        </SortableContext>

        {requests.length === 0 && (
          <div className="text-center py-8 text-xs text-muted-foreground">
            Ingen requests
          </div>
        )}
      </div>
    </div>
  )
}

function KanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {REQUEST_PIPELINE_STAGES.map((status) => (
        <div key={status} className="w-72 min-w-72 bg-muted/30 rounded-lg">
          <div className="p-3 border-b bg-background rounded-t-lg">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-16 mt-2" />
          </div>
          <div className="p-2 space-y-2">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}
