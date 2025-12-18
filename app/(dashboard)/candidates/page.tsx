'use client'

import { useState, Suspense } from 'react'
import { CandidateList } from '@/components/candidates/candidate-list'
import { CandidateFilters } from '@/components/candidates/candidate-filters'
import { PoolsSidebar } from '@/components/candidates/pools-sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, LayoutGrid, List, Filter } from 'lucide-react'
import Link from 'next/link'
import type { CandidateFilters as CandidateFiltersType } from '@/types'
import { useDebounce } from '@/hooks/use-debounce'

export default function CandidatesPage() {
  const [activePoolId, setActivePoolId] = useState<string | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  const debouncedSearch = useDebounce(searchQuery, 300)

  const filters: CandidateFiltersType = {
    search: debouncedSearch || undefined,
  }

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
                Administrer og sok i kandidatbasen
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
                placeholder="Sok pa navn, rolle, sertifikater..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

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
          <CandidateFilters />
        </div>

        {/* Candidate List */}
        <div className="flex-1 overflow-auto p-4">
          <Suspense fallback={<CandidateListSkeleton />}>
            <CandidateList
              filters={filters}
              poolId={activePoolId}
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
