'use client'

import { useState, Suspense, useCallback } from 'react'
import { CandidateList } from '@/components/candidates/candidate-list'
import { CandidateFilters, type ActiveFilter } from '@/components/candidates/candidate-filters'
import { PoolsSidebar } from '@/components/candidates/pools-sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Plus, Search, LayoutGrid, List, Filter, ArrowUpDown, X } from 'lucide-react'
import Link from 'next/link'
import type { CandidateFilters as CandidateFiltersType, CandidateSort } from '@/types'
import { useDebounce } from '@/hooks/use-debounce'

// Filter options - matching actual database schema
// employment_status column values
const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'Tilgjengelig' },
  { value: 'on_assignment', label: 'På oppdrag' },
  { value: 'unavailable', label: 'Utilgjengelig' },
]

// Pipeline stage + status for workflow filtering
const STATUS_OPTIONS = [
  { value: 'ny', label: 'Ny (ubehandlet)' },
  { value: 'pending', label: 'Pending' },
  { value: 'godkjent', label: 'Godkjent' },
  { value: 'avslått', label: 'Avslått' },
]

// verification_status column values for compliance
const COMPLIANCE_OPTIONS = [
  { value: 'pending_bankid', label: 'Venter på BankID' },
  { value: 'pending_documents', label: 'Venter på dokumenter' },
  { value: 'pending_review', label: 'Under vurdering' },
  { value: 'verified', label: 'Verifisert' },
  { value: 'rejected', label: 'Avvist' },
]

// primary_rank column values from actual database
const ROLE_OPTIONS = [
  { value: 'Skipper / kyst', label: 'Skipper / kyst' },
  { value: 'Styrmann', label: 'Styrmann' },
  { value: 'Matros', label: 'Matros' },
  { value: 'Dekksarbeider', label: 'Dekksarbeider' },
  { value: 'Maskinist', label: 'Maskinist' },
  { value: 'Akvatekniker m/fagbrev', label: 'Akvatekniker' },
  { value: 'Annet maritimt', label: 'Annet maritimt' },
]

export default function CandidatesPage() {
  const [activePoolId, setActivePoolId] = useState<string | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [currentPage, setCurrentPage] = useState(1)
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([])
  const [sort, setSort] = useState<CandidateSort>({ field: 'updated_at', direction: 'desc' })
  const [filterOpen, setFilterOpen] = useState(false)

  const debouncedSearch = useDebounce(searchQuery, 300)

  // Build filters object from active filters
  const filters: CandidateFiltersType = {
    search: debouncedSearch || undefined,
  }

  // Add filters from activeFilters state
  activeFilters.forEach(filter => {
    if (filter.type === 'role') {
      filters.roles = [...(filters.roles || []), filter.value]
    } else if (filter.type === 'availability') {
      filters.availability = [...(filters.availability || []), filter.value as CandidateFiltersType['availability'] extends (infer T)[] | undefined ? T : never]
    } else if (filter.type === 'compliance') {
      filters.compliance = [...(filters.compliance || []), filter.value as CandidateFiltersType['compliance'] extends (infer T)[] | undefined ? T : never]
    } else if (filter.type === 'status') {
      filters.status = [...(filters.status || []), filter.value]
    }
  })

  const handleAddFilter = useCallback((type: 'role' | 'availability' | 'compliance' | 'status', value: string, label: string) => {
    // Check if filter already exists
    const exists = activeFilters.some(f => f.type === type && f.value === value)
    if (!exists) {
      setActiveFilters(prev => [...prev, { id: `${type}-${value}`, type, value, label }])
      setCurrentPage(1)
    }
  }, [activeFilters])

  const handleRemoveFilter = useCallback((filterId: string) => {
    setActiveFilters(prev => prev.filter(f => f.id !== filterId))
    setCurrentPage(1)
  }, [])

  const handleClearAllFilters = useCallback(() => {
    setActiveFilters([])
    setCurrentPage(1)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Pools Sidebar */}
      <PoolsSidebar
        activePoolId={activePoolId}
        onPoolSelect={setActivePoolId}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Kandidater</h1>
              <p className="text-sm text-muted-foreground">
                Administrer og søk i kandidatbasen
              </p>
            </div>
            <Button asChild>
              <Link href="/candidates/new">
                <Plus className="h-4 w-4 mr-2" />
                Ny kandidat
              </Link>
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søk på navn, rolle, sertifikater..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Sort dropdown */}
            <Select
              value={`${sort.field}-${sort.direction}`}
              onValueChange={(value) => {
                const [field, direction] = value.split('-') as [CandidateSort['field'], CandidateSort['direction']]
                setSort({ field, direction })
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sorter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated_at-desc">Sist oppdatert</SelectItem>
                <SelectItem value="created_at-desc">Nyeste først</SelectItem>
                <SelectItem value="created_at-asc">Eldste først</SelectItem>
                <SelectItem value="name-asc">Navn A-Å</SelectItem>
                <SelectItem value="name-desc">Navn Å-A</SelectItem>
                <SelectItem value="experience-desc">Mest erfaring</SelectItem>
                <SelectItem value="experience-asc">Minst erfaring</SelectItem>
                <SelectItem value="availability-asc">Tilgjengelighet</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter Popover */}
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <Filter className="h-4 w-4" />
                  {activeFilters.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                      {activeFilters.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <h4 className="font-medium">Filtrer kandidater</h4>
                  
                  {/* Availability */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Tilgjengelighet</p>
                    <div className="flex flex-wrap gap-1">
                      {AVAILABILITY_OPTIONS.map(opt => {
                        const isActive = activeFilters.some(f => f.type === 'availability' && f.value === opt.value)
                        return (
                          <Badge
                            key={opt.value}
                            variant={isActive ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => {
                              if (isActive) {
                                handleRemoveFilter(`availability-${opt.value}`)
                              } else {
                                handleAddFilter('availability', opt.value, opt.label)
                              }
                            }}
                          >
                            {opt.label}
                            {isActive && <X className="h-3 w-3 ml-1" />}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Status</p>
                    <div className="flex flex-wrap gap-1">
                      {STATUS_OPTIONS.map(opt => {
                        const isActive = activeFilters.some(f => f.type === 'status' && f.value === opt.value)
                        return (
                          <Badge
                            key={opt.value}
                            variant={isActive ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => {
                              if (isActive) {
                                handleRemoveFilter(`status-${opt.value}`)
                              } else {
                                handleAddFilter('status', opt.value, opt.label)
                              }
                            }}
                          >
                            {opt.label}
                            {isActive && <X className="h-3 w-3 ml-1" />}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>

                  {/* Compliance / Verification */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Verifisering</p>
                    <div className="flex flex-wrap gap-1">
                      {COMPLIANCE_OPTIONS.map(opt => {
                        const isActive = activeFilters.some(f => f.type === 'compliance' && f.value === opt.value)
                        return (
                          <Badge
                            key={opt.value}
                            variant={isActive ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => {
                              if (isActive) {
                                handleRemoveFilter(`compliance-${opt.value}`)
                              } else {
                                handleAddFilter('compliance', opt.value, opt.label)
                              }
                            }}
                          >
                            {opt.label}
                            {isActive && <X className="h-3 w-3 ml-1" />}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>

                  {/* Roles */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Stilling</p>
                    <div className="flex flex-wrap gap-1">
                      {ROLE_OPTIONS.map(opt => {
                        const isActive = activeFilters.some(f => f.type === 'role' && f.value === opt.value)
                        return (
                          <Badge
                            key={opt.value}
                            variant={isActive ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => {
                              if (isActive) {
                                handleRemoveFilter(`role-${opt.value}`)
                              } else {
                                handleAddFilter('role', opt.value, opt.label)
                              }
                            }}
                          >
                            {opt.label}
                            {isActive && <X className="h-3 w-3 ml-1" />}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>

                  {activeFilters.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleClearAllFilters} className="w-full">
                      Nullstill alle filtre
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-r-none"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-l-none"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          <CandidateFilters 
            filters={activeFilters}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={handleClearAllFilters}
          />
        </div>

        {/* Candidate List */}
        <div className="flex-1 overflow-auto p-4">
          <Suspense fallback={<CandidateListSkeleton />}>
            <CandidateList
              filters={filters}
              poolId={activePoolId}
              sort={sort}
              page={currentPage}
              onPageChange={handlePageChange}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

function CandidateListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
      ))}
    </div>
  )
}
