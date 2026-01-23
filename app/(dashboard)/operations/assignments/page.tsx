'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { useAssignments } from '@/hooks/use-assignments'
import type { AssignmentFilters, AssignmentStatus } from '@/types/operations'
import { ASSIGNMENT_STATUS_LABELS, ASSIGNMENT_STATUS_COLORS } from '@/types/operations'
import { cn } from '@/lib/utils'

export default function AssignmentsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<AssignmentFilters>({})

  const { data, isLoading } = useAssignments({
    filters,
    page,
    pageSize: 20,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Oppdrag</h1>
          <p className="text-muted-foreground">{data?.total || 0} oppdrag totalt</p>
        </div>
        <Button asChild>
          <Link href="/operations/requests">
            <Plus className="h-4 w-4 mr-2" />
            Fra request
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søk oppdrag..."
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
              status: v === 'all' ? undefined : [v as AssignmentStatus],
            }))
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle statuser</SelectItem>
            <SelectItem value="draft">Utkast</SelectItem>
            <SelectItem value="pending_compliance">Venter compliance</SelectItem>
            <SelectItem value="contract_sent">Kontrakt sendt</SelectItem>
            <SelectItem value="contract_signed">Kontrakt signert</SelectItem>
            <SelectItem value="active">Aktiv</SelectItem>
            <SelectItem value="completed">Fullført</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Oppdrag</TableHead>
              <TableHead>Kandidat</TableHead>
              <TableHead>Kunde</TableHead>
              <TableHead>Periode</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Rate</TableHead>
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
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : data?.assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <p className="text-muted-foreground">Ingen oppdrag funnet</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link href="/operations/requests">
                      Opprett oppdrag fra en request
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              data?.assignments.map((assignment) => {
                const candidateName = assignment.candidate
                  ? `${assignment.candidate.first_name} ${assignment.candidate.last_name}`
                  : 'Ukjent'
                const initials = candidateName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)

                return (
                  <TableRow
                    key={assignment.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() =>
                      router.push(`/operations/assignments/${assignment.id}`)
                    }
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{assignment.title}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {assignment.assignment_number}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{candidateName}</p>
                          <p className="text-xs text-muted-foreground">
                            {assignment.role}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {assignment.organization?.name || 'Ikke angitt'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {new Date(assignment.planned_start_date).toLocaleDateString(
                            'nb-NO',
                            { day: 'numeric', month: 'short' }
                          )}
                          {assignment.planned_end_date && (
                            <>
                              {' - '}
                              {new Date(assignment.planned_end_date).toLocaleDateString(
                                'nb-NO',
                                { day: 'numeric', month: 'short' }
                              )}
                            </>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(ASSIGNMENT_STATUS_COLORS[assignment.status])}
                      >
                        {ASSIGNMENT_STATUS_LABELS[assignment.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {assignment.billing_rate_amount_nok ? (
                        <span className="font-medium">
                          {new Intl.NumberFormat('nb-NO', {
                            style: 'currency',
                            currency: 'NOK',
                            maximumFractionDigits: 0,
                          }).format(assignment.billing_rate_amount_nok)}
                          /dag
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
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
    </div>
  )
}
