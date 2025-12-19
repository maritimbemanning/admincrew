'use client'

import * as React from 'react'
import { Search, X, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { AvailabilityBadge } from './availability-badge'

export interface SearchableCandidate {
  id: string
  first_name: string
  last_name: string
  email: string
  availability_status: 'available' | 'available_soon' | 'on_assignment' | 'unavailable' | 'inactive'
  skills?: string[]
}

interface CandidateSearchProps {
  candidates: SearchableCandidate[]
  selectedIds?: string[]
  onSelect: (candidate: SearchableCandidate) => void
  onDeselect?: (candidateId: string) => void
  placeholder?: string
  multiple?: boolean
  disabled?: boolean
  className?: string
}

export function CandidateSearch({
  candidates,
  selectedIds = [],
  onSelect,
  onDeselect,
  placeholder = 'Søk etter kandidat...',
  multiple = false,
  disabled = false,
  className,
}: CandidateSearchProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')

  const filteredCandidates = candidates.filter((candidate) => {
    const fullName = `${candidate.first_name} ${candidate.last_name}`.toLowerCase()
    const searchLower = search.toLowerCase()
    
    return (
      fullName.includes(searchLower) ||
      candidate.email.toLowerCase().includes(searchLower) ||
      candidate.skills?.some((skill) => skill.toLowerCase().includes(searchLower))
    )
  })

  const selectedCandidates = candidates.filter((c) => selectedIds.includes(c.id))

  const handleSelect = (candidate: SearchableCandidate) => {
    onSelect(candidate)
    if (!multiple) {
      setOpen(false)
      setSearch('')
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-start text-left font-normal"
          >
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            {selectedCandidates.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : multiple ? (
              <span>{selectedCandidates.length} valgt</span>
            ) : (
              <span>
                {selectedCandidates[0].first_name} {selectedCandidates[0].last_name}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={placeholder}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>Ingen kandidater funnet.</CommandEmpty>
              <CommandGroup>
                {filteredCandidates.slice(0, 10).map((candidate) => {
                  const isSelected = selectedIds.includes(candidate.id)
                  const initials = `${candidate.first_name[0]}${candidate.last_name[0]}`

                  return (
                    <CommandItem
                      key={candidate.id}
                      value={candidate.id}
                      onSelect={() => handleSelect(candidate)}
                      className={cn(isSelected && 'bg-accent')}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {candidate.first_name} {candidate.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {candidate.email}
                          </p>
                        </div>
                        <AvailabilityBadge 
                          status={candidate.availability_status} 
                          size="sm" 
                        />
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected candidates display */}
      {multiple && selectedCandidates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCandidates.map((candidate) => (
            <Badge
              key={candidate.id}
              variant="secondary"
              className="gap-1"
            >
              <User className="h-3 w-3" />
              {candidate.first_name} {candidate.last_name}
              <button
                type="button"
                onClick={() => onDeselect?.(candidate.id)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
