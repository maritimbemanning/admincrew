'use client'

import * as React from 'react'
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { 
  GripVertical, 
  X, 
  User, 
  Star, 
  Mail,
  Check 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { RatingStars, StatusBadge } from '@/components/shared'
import { cn } from '@/lib/utils'

export interface ShortlistCandidate {
  id: string
  candidate_id: string
  candidate: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone?: string
    hourly_rate?: number
    rating?: number
    availability_status: string
  }
  status: 'pending' | 'contacted' | 'interested' | 'rejected' | 'selected'
  notes?: string
  order: number
}

interface ShortlistManagerProps {
  requestId: string
  candidates: ShortlistCandidate[]
  onReorder: (candidates: ShortlistCandidate[]) => void
  onRemove: (candidateId: string) => void
  onStatusChange: (candidateId: string, status: string) => void
  onSelect: (candidateId: string) => void
  selectedCandidateId?: string
  isLoading?: boolean
}

function SortableCandidate({
  candidate,
  isSelected,
  onRemove,
  onStatusChange,
  onSelect,
}: {
  candidate: ShortlistCandidate
  isSelected: boolean
  onRemove: () => void
  onStatusChange: (status: string) => void
  onSelect: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: candidate.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const { candidate: c } = candidate
  const initials = `${c.first_name[0]}${c.last_name[0]}`.toUpperCase()

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 border rounded-lg bg-background',
        isDragging && 'opacity-50',
        isSelected && 'border-primary ring-1 ring-primary'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <Avatar className="h-10 w-10">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">
            {c.first_name} {c.last_name}
          </p>
          {isSelected && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <StatusBadge status={c.availability_status} />
          {c.hourly_rate && <span>{c.hourly_rate} kr/t</span>}
          {c.rating && <RatingStars value={c.rating} readonly size="sm" />}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Badge
          variant="outline"
          className={cn(
            candidate.status === 'selected' && 'bg-green-100 text-green-800',
            candidate.status === 'rejected' && 'bg-red-100 text-red-800'
          )}
        >
          {candidate.status === 'pending' && 'Venter'}
          {candidate.status === 'contacted' && 'Kontaktet'}
          {candidate.status === 'interested' && 'Interessert'}
          {candidate.status === 'rejected' && 'Avslått'}
          {candidate.status === 'selected' && 'Valgt'}
        </Badge>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onSelect}
          disabled={isSelected}
        >
          <Check className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function ShortlistManager({
  requestId,
  candidates,
  onReorder,
  onRemove,
  onStatusChange,
  onSelect,
  selectedCandidateId,
  isLoading,
}: ShortlistManagerProps) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = candidates.findIndex((c) => c.id === active.id)
      const newIndex = candidates.findIndex((c) => c.id === over.id)

      const newCandidates = [...candidates]
      const [removed] = newCandidates.splice(oldIndex, 1)
      newCandidates.splice(newIndex, 0, removed)

      // Update order values
      const reordered = newCandidates.map((c, index) => ({
        ...c,
        order: index,
      }))

      onReorder(reordered)
    }
  }

  if (candidates.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Ingen kandidater på shortlist</h3>
          <p className="text-sm text-muted-foreground">
            Bruk matching-funksjonen for å finne og legge til kandidater.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Shortlist ({candidates.length})</span>
          {selectedCandidateId && (
            <Badge className="bg-green-100 text-green-800">
              Kandidat valgt
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={candidates.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {candidates
                .sort((a, b) => a.order - b.order)
                .map((candidate) => (
                  <SortableCandidate
                    key={candidate.id}
                    candidate={candidate}
                    isSelected={selectedCandidateId === candidate.candidate_id}
                    onRemove={() => onRemove(candidate.candidate_id)}
                    onStatusChange={(status) => onStatusChange(candidate.candidate_id, status)}
                    onSelect={() => onSelect(candidate.candidate_id)}
                  />
                ))}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  )
}
