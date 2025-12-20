'use client'

import { useState, Suspense, useCallback } from 'react'
import { CandidateList } from '@/components/candidates/candidate-list'
import { CandidateFilters, type ActiveFilter } from '@/components/candidates/candidate-filters'
import { PoolsSidebar } from '@/components/candidates/pools-sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search, LayoutGrid, List, Filter, ArrowUpDown } from 'lucide-react'
import Link from 'next/link'
import type { CandidateFilters as CandidateFiltersType, CandidateSort } from '@/types'
import { useDebounce } from '@/hooks/use-debounce'

export default function CandidatesPage() {
  const [activePoolId, setActivePoolId] = useState<string | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [currentPage, setCurrentPage] = useState(1)
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([])
  const [sort, setSort] = useState<CandidateSort>({ field: 'updated_at', direction: 'desc' })

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
    }
  })

  const handleRemoveFilter = useCallback((filterId: string) => {
    setActiveFilters(prev => prev.filter(f => f.id !== filterId))
    setCurrentPage(1) // Reset to first page when filters change
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

            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>

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
