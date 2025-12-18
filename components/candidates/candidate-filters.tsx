'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

// Placeholder - will be replaced with actual filter state
const activeFilters = [
  { id: '1', type: 'role', value: 'Kaptein', label: 'Kaptein' },
  { id: '2', type: 'certification', value: 'D5', label: 'D5' },
  { id: '3', type: 'availability', value: 'available', label: 'Tilgjengelig' },
]

export function CandidateFilters() {
  if (activeFilters.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground">Aktive filtre:</span>
      {activeFilters.map((filter) => (
        <Badge key={filter.id} variant="secondary" className="gap-1">
          {filter.label}
          <button className="ml-1 hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Button variant="ghost" size="sm" className="text-muted-foreground">
        Nullstill
      </Button>
    </div>
  )
}
