'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { RequestKanban } from '@/components/operations/request-kanban'
import { useRequests } from '@/hooks/use-requests'
import type { RequestFilters, RequestStatus, PriorityLevel } from '@/types/operations'
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
} from '@/types/operations'
import { cn } from '@/lib/utils'

export default function RequestsPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('list')
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<RequestFilters>({})

  const { data, isLoading } = useRequests({
    filters,
    page,
    pageSize: 20,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Requests</h1>
          <p className="text-muted-foreground">
            {data?.total || 0} requests totalt
          </p>
        </div>
        <Button asChild>
          <Link href="/operations/requests/new">
            <Plus className="h-4 w-4 mr-2" />
            Ny request
          </Link>
        </Button>
      </div>

      {/* Filters */}
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
            value={filters.status?.[0] || 'all'}
            onValueChange={(v) =>
              setFilters((prev) => ({
                ...prev,
                status: v === 'all' ? undefined : [v as RequestStatus],
              }))
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statuser</SelectItem>
              <SelectItem value="draft">Utkast</SelectItem>
              <SelectItem value="approved">Godkjent</SelectItem>
              <SelectItem value="matching">Matcher</SelectItem>
              <SelectItem value="shortlisted">Shortlistet</SelectItem>
              <SelectItem value="offer_sent">Tilbud sendt</SelectItem>
              <SelectItem value="converted">Konvertert</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.priority?.[0] || 'all'}
            onValueChange={(v) =>
              setFilters((prev) => ({
                ...prev,
                priority: v === 'all' ? undefined : [v as PriorityLevel],
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
      {viewMode === 'kanban' ? (
        <RequestKanban filters={filters} />
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request</TableHead>
                <TableHead>Rolle</TableHead>
                <TableHead>Startdato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioritet</TableHead>
                <TableHead className="text-right">Verdi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : data?.requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <p className="text-muted-foreground">Ingen requests funnet</p>
                    <Button variant="link" asChild className="mt-2">
                      <Link href="/operations/requests/new">
                        Opprett din første request
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                data?.requests.map((request) => (
                  <TableRow
                    key={request.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() =>
                      router.push(`/operations/requests/${request.id}`)
                    }
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.title}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {request.request_number}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span>
                        {request.quantity}x {request.role_needed}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(request.start_date).toLocaleDateString('nb-NO', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(REQUEST_STATUS_COLORS[request.status])}
                      >
                        {REQUEST_STATUS_LABELS[request.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(PRIORITY_COLORS[request.priority])}
                      >
                        {PRIORITY_LABELS[request.priority]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {request.estimated_value_nok ? (
                        <span className="font-medium">
                          {new Intl.NumberFormat('nb-NO', {
                            style: 'currency',
                            currency: 'NOK',
                            notation: 'compact',
                            maximumFractionDigits: 0,
                          }).format(request.estimated_value_nok)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Side {data.page} av {data.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
