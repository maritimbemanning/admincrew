'use client'

import { useState, Suspense, useCallback } from 'react'
import { CandidateList } from '@/components/candidates/candidate-list'
import { CandidateFilters, type ActiveFilter } from '@/components/candidates/candidate-filters'
import { PoolsSidebar } from '@/components/candidates/pools-sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
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
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Filter,
  ArrowUpDown,
  X,
  Users,
  SlidersHorizontal,
  Download,
} from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/command/page-header'
import type { CandidateFilters as CandidateFiltersType, CandidateSort } from '@/types'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'

// Filter options - matching actual database schema
const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'Tilgjengelig', color: 'bg-green-500' },
  { value: 'available_soon', label: 'Snart tilgjengelig', color: 'bg-yellow-500' },
  { value: 'on_assignment', label: 'På oppdrag', color: 'bg-blue-500' },
  { value: 'unavailable', label: 'Utilgjengelig', color: 'bg-gray-500' },
  { value: 'inactive', label: 'Inaktiv', color: 'bg-gray-400' },
]

const COMPLIANCE_OPTIONS = [
  { value: 'not_started', label: 'Ikke startet', color: 'bg-gray-500' },
  { value: 'documents_pending', label: 'Venter på dokumenter', color: 'bg-yellow-500' },
  { value: 'review_pending', label: 'Under vurdering', color: 'bg-blue-500' },
  { value: 'approved', label: 'Godkjent', color: 'bg-green-500' },
  { value: 'expired', label: 'Utløpt', color: 'bg-red-500' },
  { value: 'rejected', label: 'Avvist', color: 'bg-red-600' },
]

const ROLE_OPTIONS = [
  { value: 'Kaptein', label: 'Kaptein' },
  { value: 'Skipper', label: 'Skipper' },
  { value: 'Overstyrmann', label: 'Overstyrmann' },
  { value: 'Styrmann', label: 'Styrmann' },
  { value: 'Matros', label: 'Matros' },
  { value: 'Maskinist', label: 'Maskinist' },
  { value: 'ETO', label: 'ETO' },
  { value: 'Kokk', label: 'Kokk' },
  { value: 'Akvatekniker', label: 'Akvatekniker' },
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
    }
  })

  const handleAddFilter = useCallback((type: 'role' | 'availability' | 'compliance', value: string, label: string) => {
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
    <div className="flex h-[calc(100vh-7rem)] gap-6">
      {/* Pools Sidebar - Premium Style */}
      <div className="hidden lg:block">
        <PoolsSidebar
          activePoolId={activePoolId}
          onPoolSelect={setActivePoolId}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 space-y-6">
        {/* Mission Control Header */}
        <PageHeader
          coordinates={[
            { label: 'Dashboard', href: '/' },
            { label: 'Crew Manifest' },
          ]}
          title="Kandidater"
          subtitle="Administrer og søk i kandidatbasen"
          icon={<Users className="h-5 w-5" />}
          actions={
            <>
              <Button variant="outline" size="sm" className="hidden md:flex">
                <Download className="h-4 w-4 mr-2" />
                Eksporter
              </Button>
              <Button asChild className="bg-navy-900 text-cream-50 hover:bg-navy-800 dark:bg-gold-500 dark:text-navy-900 dark:hover:bg-gold-400">
                <Link href="/candidates/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Ny kandidat
                </Link>
              </Button>
            </>
          }
        />

        {/* Search and Filters Bar */}
        <div className="space-y-4">
          <Card className="p-4 border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
              {/* Search Input */}
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søk på navn, rolle, sertifikater..."
                  className="pl-10 h-11 bg-background/50 border-border/50 focus:border-gold-500/50 focus:ring-gold-500/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Sort Dropdown */}
                <Select
                  value={`${sort.field}-${sort.direction}`}
                  onValueChange={(value) => {
                    const [field, direction] = value.split('-') as [CandidateSort['field'], CandidateSort['direction']]
                    setSort({ field, direction })
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-[180px] h-11 bg-background/50 border-border/50">
                    <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
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
                    <Button 
                      variant="outline" 
                      className={cn(
                        "h-11 gap-2 bg-background/50 border-border/50",
                        activeFilters.length > 0 && "border-gold-500/50 bg-gold-500/5"
                      )}
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      <span className="hidden sm:inline">Filter</span>
                      {activeFilters.length > 0 && (
                        <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-gold-500 text-navy-900">
                          {activeFilters.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96 p-0" align="end">
                    <div className="p-4 border-b">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gold-500" />
                        Filtrer kandidater
                      </h4>
                    </div>
                    <div className="p-4 space-y-5 max-h-[400px] overflow-auto">
                      {/* Availability */}
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          Tilgjengelighet
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {AVAILABILITY_OPTIONS.map(opt => {
                            const isActive = activeFilters.some(f => f.type === 'availability' && f.value === opt.value)
                            return (
                              <Badge
                                key={opt.value}
                                variant={isActive ? 'default' : 'outline'}
                                className={cn(
                                  "cursor-pointer transition-all",
                                  isActive && "bg-gold-500 text-navy-900 hover:bg-gold-400"
                                )}
                                onClick={() => {
                                  if (isActive) {
                                    handleRemoveFilter(`availability-${opt.value}`)
                                  } else {
                                    handleAddFilter('availability', opt.value, opt.label)
                                  }
                                }}
                              >
                                <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", opt.color)} />
                                {opt.label}
                                {isActive && <X className="h-3 w-3 ml-1" />}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>

                      {/* Compliance */}
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          Verifisering
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {COMPLIANCE_OPTIONS.map(opt => {
                            const isActive = activeFilters.some(f => f.type === 'compliance' && f.value === opt.value)
                            return (
                              <Badge
                                key={opt.value}
                                variant={isActive ? 'default' : 'outline'}
                                className={cn(
                                  "cursor-pointer transition-all",
                                  isActive && "bg-gold-500 text-navy-900 hover:bg-gold-400"
                                )}
                                onClick={() => {
                                  if (isActive) {
                                    handleRemoveFilter(`compliance-${opt.value}`)
                                  } else {
                                    handleAddFilter('compliance', opt.value, opt.label)
                                  }
                                }}
                              >
                                <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", opt.color)} />
                                {opt.label}
                                {isActive && <X className="h-3 w-3 ml-1" />}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>

                      {/* Roles */}
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-gold-500" />
                          Stilling
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {ROLE_OPTIONS.map(opt => {
                            const isActive = activeFilters.some(f => f.type === 'role' && f.value === opt.value)
                            return (
                              <Badge
                                key={opt.value}
                                variant={isActive ? 'default' : 'outline'}
                                className={cn(
                                  "cursor-pointer transition-all",
                                  isActive && "bg-gold-500 text-navy-900 hover:bg-gold-400"
                                )}
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
                    </div>

                    {activeFilters.length > 0 && (
                      <div className="p-4 border-t bg-muted/30">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleClearAllFilters} 
                          className="w-full text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Nullstill alle filtre ({activeFilters.length})
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>

                {/* View Mode Toggle */}
                <div className="flex items-center border rounded-lg overflow-hidden bg-background/50">
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="rounded-none h-11 w-11"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="rounded-none h-11 w-11"
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            {activeFilters.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <CandidateFilters 
                  filters={activeFilters}
                  onRemoveFilter={handleRemoveFilter}
                  onClearAll={handleClearAllFilters}
                />
              </div>
            )}
          </Card>
        </div>

        {/* Candidate List */}
        <div className="flex-1 overflow-auto rounded-xl">
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
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div 
          key={i} 
          className="h-20 bg-card/50 animate-pulse rounded-xl border border-border/30"
          style={{ animationDelay: `${i * 50}ms` }}
        />
      ))}
    </div>
  )
}
