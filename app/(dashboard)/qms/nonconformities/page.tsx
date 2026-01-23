'use client'

import { useState } from 'react'
import { useNonconformities, useUpdateNcStatus } from '@/hooks/use-qms-nc'
import { NcCard } from '@/components/qms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  NcFilters,
  NC_SEVERITY_LABELS,
  NC_STATUS_LABELS,
  NcSeverity,
  NcStatus,
} from '@/types/qms'
import { Plus, Search, AlertTriangle, X, Clock, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useDebounce } from '@/hooks/use-debounce'

export default function NonconformitiesPage() {
  const [filters, setFilters] = useState<NcFilters>({})
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [activeTab, setActiveTab] = useState('all')

  const debouncedSearch = useDebounce(search, 300)

  // Build effective filters based on tab
  const effectiveFilters: NcFilters = {
    ...filters,
    search: debouncedSearch,
  }

  if (activeTab === 'open') {
    effectiveFilters.status = ['open', 'analysis', 'action_planned', 'action_implemented']
  } else if (activeTab === 'overdue') {
    effectiveFilters.overdue = true
  } else if (activeTab === 'closed') {
    effectiveFilters.status = ['verified', 'closed']
  }

  const { data, isLoading, error } = useNonconformities({
    filters: effectiveFilters,
    page,
    pageSize: 20,
  })

  const updateStatus = useUpdateNcStatus()

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: status as NcStatus })
      toast.success('Status oppdatert')
    } catch {
      toast.error('Kunne ikke oppdatere status')
    }
  }

  const clearFilters = () => {
    setFilters({})
    setSearch('')
    setPage(1)
  }

  const hasActiveFilters =
    search || filters.severity?.length || filters.status?.length || filters.source?.length

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Avvik</h1>
          <p className="text-muted-foreground">
            Håndtering av avvik og korrigerende tiltak
          </p>
        </div>
        <Link href="/qms/nonconformities/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Registrer avvik
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alle
          </TabsTrigger>
          <TabsTrigger value="open" className="gap-2">
            <Clock className="h-4 w-4" />
            Åpne
          </TabsTrigger>
          <TabsTrigger value="overdue" className="gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Forfalte
          </TabsTrigger>
          <TabsTrigger value="closed" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Lukkede
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søk etter avvik..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={filters.severity?.[0] || 'all'}
          onValueChange={(value) =>
            setFilters((f) => ({
              ...f,
              severity: value === 'all' ? undefined : [value as NcSeverity],
            }))
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Alvorlighet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            {(Object.entries(NC_SEVERITY_LABELS) as [NcSeverity, string][]).map(
              ([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>

        {activeTab === 'all' && (
          <Select
            value={filters.status?.[0] || 'all'}
            onValueChange={(value) =>
              setFilters((f) => ({
                ...f,
                status: value === 'all' ? undefined : [value as NcStatus],
              }))
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statuser</SelectItem>
              {(Object.entries(NC_STATUS_LABELS) as [NcStatus, string][]).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        )}

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Nullstill
          </Button>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-[200px]" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive">Kunne ikke laste avvik</p>
        </div>
      ) : data?.nonconformities.length === 0 ? (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-1">Ingen avvik</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {hasActiveFilters
              ? 'Ingen avvik matcher søket'
              : activeTab === 'overdue'
                ? 'Ingen forfalte avvik'
                : activeTab === 'closed'
                  ? 'Ingen lukkede avvik'
                  : 'Registrer et avvik for å komme i gang'}
          </p>
          {!hasActiveFilters && activeTab === 'all' && (
            <Link href="/qms/nonconformities/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Registrer avvik
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {data?.nonconformities.map((nc) => (
              <NcCard key={nc.id} nc={nc} onStatusChange={handleStatusChange} />
            ))}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Forrige
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Side {page} av {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
              >
                Neste
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
