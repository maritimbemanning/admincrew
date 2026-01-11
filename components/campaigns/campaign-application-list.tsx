'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, RefreshCw, FileSearch } from 'lucide-react'
import type { CampaignFilters, CampaignSortField } from '@/types/campaign'
import { CampaignApplicationCard } from './campaign-application-card'
import { useCampaignApplications } from '@/hooks/use-campaign-applications'

interface CampaignApplicationListProps {
  filters: CampaignFilters
  onFiltersChange?: (filters: CampaignFilters) => void
}

export function CampaignApplicationList({
  filters,
  onFiltersChange,
}: CampaignApplicationListProps) {
  const [search, setSearch] = useState(filters.search || '')
  const [sortField, setSortField] = useState<CampaignSortField>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const { data: applications, isLoading, refetch } = useCampaignApplications(filters)

  // Client-side search and sorting
  const filteredAndSorted = useMemo(() => {
    if (!applications) return []

    let result = [...applications]

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(
        (app) =>
          app.name.toLowerCase().includes(searchLower) ||
          app.email.toLowerCase().includes(searchLower) ||
          app.phone.toLowerCase().includes(searchLower) ||
          app.position.toLowerCase().includes(searchLower)
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal: any
      let bVal: any

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
          break
        case 'status':
          aVal = a.status
          bVal = b.status
          break
        case 'position':
          aVal = a.position
          bVal = b.position
          break
        case 'updated_at':
          aVal = new Date(a.updated_at).getTime()
          bVal = new Date(b.updated_at).getTime()
          break
        case 'created_at':
        default:
          aVal = new Date(a.created_at).getTime()
          bVal = new Date(b.created_at).getTime()
          break
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [applications, search, sortField, sortDirection])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (onFiltersChange) {
      onFiltersChange({ ...filters, search: value })
    }
  }

  const handleSortChange = (value: string) => {
    const [field, direction] = value.split('-') as [CampaignSortField, 'asc' | 'desc']
    setSortField(field)
    setSortDirection(direction)
  }

  if (isLoading) {
    return <ApplicationsSkeleton />
  }

  return (
    <div className="space-y-4">
      {/* Search and Sort Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søk etter navn, e-post, telefon..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={`${sortField}-${sortDirection}`}
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at-desc">Nyeste først</SelectItem>
            <SelectItem value="created_at-asc">Eldste først</SelectItem>
            <SelectItem value="updated_at-desc">Sist oppdatert</SelectItem>
            <SelectItem value="name-asc">Navn (A-Å)</SelectItem>
            <SelectItem value="name-desc">Navn (Å-A)</SelectItem>
            <SelectItem value="status-asc">Status</SelectItem>
            <SelectItem value="position-asc">Stilling</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Results Count */}
      {filteredAndSorted.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Viser {filteredAndSorted.length} søknad{filteredAndSorted.length !== 1 ? 'er' : ''}
          {search && ` for "${search}"`}
        </p>
      )}

      {/* Application List */}
      {filteredAndSorted.length === 0 ? (
        <EmptyState hasSearch={!!search} />
      ) : (
        <div className="space-y-3">
          {filteredAndSorted.map((app) => (
            <CampaignApplicationCard key={app.id} application={app} />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <FileSearch className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">
        {hasSearch ? 'Ingen søknader funnet' : 'Ingen søknader ennå'}
      </h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-md">
        {hasSearch
          ? 'Prøv å endre søket eller filtrene for å se flere resultater'
          : 'Kampanjesøknader fra bluecrew.no vil vises her når de kommer inn'}
      </p>
    </div>
  )
}

function ApplicationsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}
