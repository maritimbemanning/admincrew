'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  Briefcase,
  Users,
  Clock,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RequestKanban } from '@/components/operations/request-kanban'
import { useRequests } from '@/hooks/use-requests'
import { useAssignments } from '@/hooks/use-assignments'
import type { RequestFilters } from '@/types/operations'

export default function OperationsPage() {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [filters, setFilters] = useState<Omit<RequestFilters, 'status'>>({})

  // Get stats
  const { data: requestsData } = useRequests({ pageSize: 1 })
  const { data: assignmentsData } = useAssignments({
    filters: { status: ['active'] },
    pageSize: 1,
  })

  const openRequestCount = requestsData?.total || 0
  const activeAssignmentCount = assignmentsData?.total || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Operations</h1>
          <p className="text-muted-foreground">
            Håndter requests, matching og oppdrag
          </p>
        </div>
        <Button asChild>
          <Link href="/operations/requests/new">
            <Plus className="h-4 w-4 mr-2" />
            Ny request
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Åpne requests</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openRequestCount}</div>
            <p className="text-xs text-muted-foreground">
              Venter på matching/tilbud
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aktive oppdrag</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAssignmentCount}</div>
            <p className="text-xs text-muted-foreground">Pågående leveranser</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. fill time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2 dager</div>
            <p className="text-xs text-muted-foreground">Siste 30 dager</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pipeline verdi</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">~2.4M</div>
            <p className="text-xs text-muted-foreground">Estimert NOK</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk requests..."
              className="pl-9"
              value={filters.search || ''}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
            />
          </div>

          <Select
            value={filters.priority?.join(',') || 'all'}
            onValueChange={(v) =>
              setFilters((prev) => ({
                ...prev,
                priority: v === 'all' ? undefined : [v as any],
              }))
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Prioritet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="urgent">Haster</SelectItem>
              <SelectItem value="high">Høy</SelectItem>
              <SelectItem value="medium">Normal</SelectItem>
              <SelectItem value="low">Lav</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[600px]">
        {viewMode === 'kanban' ? (
          <RequestKanban filters={filters} />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>Liste-visning kommer snart</p>
            <Button
              variant="link"
              onClick={() => setViewMode('kanban')}
              className="mt-2"
            >
              Bruk Kanban-visning
            </Button>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="flex items-center gap-4 pt-4 border-t">
        <Button variant="outline" asChild>
          <Link href="/operations/requests">Alle requests</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/operations/assignments">Alle oppdrag</Link>
        </Button>
      </div>
    </div>
  )
}
