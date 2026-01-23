'use client'

import { useState, useMemo } from 'react'
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
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { Plus, TrendingUp, Users } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { ContactCardMini, SortableContactCard } from './contact-card-mini'
import { useCrmPipeline, useUpdateCrmContactStatus } from '@/hooks/use-crm-contacts'
import type {
  CrmContact,
  CrmContactStatus,
  CrmContactFilters,
  PipelineColumn,
} from '@/types/crm'
import {
  CRM_CONTACT_STATUSES,
  CRM_CONTACT_STATUS_LABELS,
  CRM_CONTACT_STATUS_COLORS,
} from '@/types/crm'

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

interface PipelineKanbanProps {
  filters?: CrmContactFilters
  onContactClick?: (contact: CrmContact) => void
  onNewContact?: (status?: CrmContactStatus) => void
}

// ═══════════════════════════════════════════════════════
// COLUMN COMPONENT
// ═══════════════════════════════════════════════════════

interface KanbanColumnProps {
  column: PipelineColumn
  contacts: CrmContact[]
  onContactClick?: (contact: CrmContact) => void
  onAddContact?: () => void
}

function KanbanColumn({ column, contacts, onContactClick, onAddContact }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
    return value.toString()
  }

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Docking Bay Header */}
      <div className="docking-stripes rounded-t-lg px-3 py-2.5 border border-b-0 dark:bg-navy-800/50 dark:border-white/5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'signal-light w-2 h-2',
                column.id === 'won' && 'signal-light-green',
                column.id === 'lost' && 'signal-light-red',
                column.id === 'interested' && 'signal-light-gray',
                column.id === 'qualified' && 'signal-light-blue',
                column.id === 'contacted' && 'signal-light-blue',
                column.id === 'meeting_booked' && 'signal-light-yellow',
                column.id === 'quote_sent' && 'signal-light-yellow',
                column.id === 'negotiation' && 'signal-light-yellow'
              )}
            />
            <h3 className="text-tactical text-gold-400">{CRM_CONTACT_STATUS_LABELS[column.id]}</h3>
          </div>
          <span className="text-tactical bg-navy-900/30 dark:bg-white/5 px-2 py-0.5 rounded text-muted-foreground">
            {column.count}
          </span>
        </div>
        {column.totalValue > 0 && (
          <div className="flex items-center gap-1 text-xs">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            <span className="font-mono text-gold-400">{formatValue(column.totalValue)} kr</span>
          </div>
        )}
      </div>

      {/* Column Content - Landing Zone when dragging */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 border rounded-b-lg bg-muted/20 min-h-[200px] transition-all duration-200 dark:bg-navy-900/30 dark:border-white/5',
          isOver && 'landing-zone landing-zone-active'
        )}
      >
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="p-2 space-y-2">
            <SortableContext
              items={contacts.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {contacts.map((contact) => (
                <SortableContactCard
                  key={contact.id}
                  contact={contact}
                  onClick={() => onContactClick?.(contact)}
                />
              ))}
            </SortableContext>

            {contacts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Ingen kontakter
              </div>
            )}

            {/* Add contact button */}
            {onAddContact && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground"
                onClick={onAddContact}
              >
                <Plus className="h-4 w-4 mr-2" />
                Legg til kontakt
              </Button>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// LOADING SKELETON
// ═══════════════════════════════════════════════════════

function PipelineKanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {CRM_CONTACT_STATUSES.map((status) => (
        <div key={status} className="w-72 shrink-0">
          <div className="bg-muted/50 rounded-t-lg px-3 py-2 border border-b-0">
            <Skeleton className="h-5 w-24 mb-1" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="border rounded-b-lg bg-muted/20 p-2 space-y-2 min-h-[200px]">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// STATS BAR
// ═══════════════════════════════════════════════════════

interface StatsBarProps {
  totalContacts: number
  totalValue: number
  avgProbability: number
}

function StatsBar({ totalContacts, totalValue, avgProbability }: StatsBarProps) {
  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
    return value.toString()
  }

  return (
    <div className="flex items-center gap-6 mb-4 px-1 glass-panel rounded-lg p-3">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-gold-400" />
        <span className="text-tactical text-muted-foreground">Kontakter</span>
        <span className="font-mono text-lg font-semibold text-gold-400">{totalContacts}</span>
      </div>
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-emerald-500" />
        <span className="text-tactical text-muted-foreground">Pipeline</span>
        <span className="font-mono text-lg font-semibold text-gold-400">{formatValue(totalValue)} kr</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-tactical text-muted-foreground">Sannsynlighet</span>
        <span className="font-mono text-lg font-semibold text-gold-400">{avgProbability.toFixed(0)}%</span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

export function PipelineKanban({
  filters,
  onContactClick,
  onNewContact,
}: PipelineKanbanProps) {
  const { data, isLoading, error } = useCrmPipeline(filters)
  const updateStatus = useUpdateCrmContactStatus()

  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  // Find the active contact being dragged
  const activeContact = useMemo(() => {
    if (!activeId || !data?.columns) return null
    for (const column of data.columns) {
      const contact = column.contacts.find((c) => c.id === activeId)
      if (contact) return contact
    }
    return null
  }, [activeId, data?.columns])

  // Sensors for drag and drop
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
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    setOverId(over?.id as string | null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    setActiveId(null)
    setOverId(null)

    if (!over) return

    const contactId = active.id as string
    const newStatus = over.id as CrmContactStatus

    // Check if this is a valid status column
    if (!CRM_CONTACT_STATUSES.includes(newStatus)) return

    // Find the current status of the contact
    const currentContact = data?.columns
      .flatMap((col) => col.contacts)
      .find((c) => c.id === contactId)

    if (!currentContact || currentContact.status === newStatus) return

    // Update the contact status
    updateStatus.mutate({
      id: contactId,
      status: newStatus,
    })
  }

  if (isLoading) {
    return <PipelineKanbanSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        <p>Kunne ikke laste pipeline</p>
        <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div>
      <StatsBar
        totalContacts={data.stats.totalContacts}
        totalValue={data.stats.totalValue}
        avgProbability={data.stats.avgProbability}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {data.columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              contacts={column.contacts}
              onContactClick={onContactClick}
              onAddContact={
                onNewContact ? () => onNewContact(column.id) : undefined
              }
            />
          ))}
        </div>

        {/* Drag overlay - shows the card being dragged */}
        <DragOverlay>
          {activeContact ? (
            <div className="w-72">
              <ContactCardMini contact={activeContact} isDragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
