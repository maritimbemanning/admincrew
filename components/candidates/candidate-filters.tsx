'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export interface ActiveFilter {
  id: string
  type: 'role' | 'certification' | 'availability' | 'compliance' | 'fylke' | 'search'
  value: string
  label: string
}

interface CandidateFiltersProps {
  filters?: ActiveFilter[]
  onRemoveFilter?: (filterId: string) => void
  onClearAll?: () => void
}

export function CandidateFilters({ 
  filters = [], 
  onRemoveFilter, 
  onClearAll 
}: CandidateFiltersProps) {
  if (filters.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground">Aktive filtre:</span>
      {filters.map((filter) => (
        <Badge key={filter.id} variant="secondary" className="gap-1">
          {filter.label}
          <button 
            className="ml-1 hover:text-destructive"
            onClick={() => onRemoveFilter?.(filter.id)}
            aria-label={`Fjern filter: ${filter.label}`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-muted-foreground"
        onClick={onClearAll}
      >
        Nullstill
      </Button>
    </div>
  )
}
