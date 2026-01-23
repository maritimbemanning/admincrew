'use client'

import { useState } from 'react'
import {
  useTimesheets,
  useSubmitTimesheet,
  useDeleteTimesheet,
} from '@/hooks/use-timesheets'
import { TimesheetCard } from './timesheet-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Timesheet,
  TimesheetFilters,
  TimesheetStatus,
  TIMESHEET_STATUS_LABELS,
} from '@/types/contracts'
import { Search, Plus, Filter, X, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function TimesheetList() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<TimesheetStatus | 'all'>('all')
  const [timesheetToDelete, setTimesheetToDelete] = useState<Timesheet | null>(null)
  const [timesheetToSubmit, setTimesheetToSubmit] = useState<Timesheet | null>(null)

  const filters: TimesheetFilters = {
    status: statusFilter !== 'all' ? [statusFilter] : undefined,
  }

  const { data, isLoading, error } = useTimesheets({ filters, page, pageSize: 12 })
  const submitTimesheet = useSubmitTimesheet()
  const deleteTimesheet = useDeleteTimesheet()

  const handleDelete = async () => {
    if (!timesheetToDelete) return

    try {
      await deleteTimesheet.mutateAsync(timesheetToDelete.id)
      toast.success('Timeregistrering slettet')
      setTimesheetToDelete(null)
    } catch {
      toast.error('Kunne ikke slette timeregistrering')
    }
  }

  const handleSubmit = async () => {
    if (!timesheetToSubmit) return

    try {
      await submitTimesheet.mutateAsync(timesheetToSubmit.id)
      toast.success('Timeregistrering sendt inn')
      setTimesheetToSubmit(null)
    } catch {
      toast.error('Kunne ikke sende inn timeregistrering')
    }
  }

  const clearFilters = () => {
    setStatusFilter('all')
    setPage(1)
  }

  const hasActiveFilters = statusFilter !== 'all'

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive">Kunne ikke laste timeregistreringer</p>
        <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
          Prøv igjen
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as TimesheetStatus | 'all')
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statuser</SelectItem>
              {Object.entries(TIMESHEET_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Nullstill
            </Button>
          )}
        </div>

        <Link href="/timesheets/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ny timeregistrering
          </Button>
        </Link>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[200px] rounded-lg" />
          ))}
        </div>
      ) : data?.timesheets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Clock className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Ingen timeregistreringer</h3>
          <p className="text-muted-foreground mt-1">
            {hasActiveFilters
              ? 'Prøv å endre filteret ditt'
              : 'Opprett din første timeregistrering for å komme i gang'}
          </p>
          {!hasActiveFilters && (
            <Link href="/timesheets/new">
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Ny timeregistrering
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data?.timesheets.map((timesheet) => (
              <TimesheetCard
                key={timesheet.id}
                timesheet={timesheet}
                onView={() => router.push(`/timesheets/${timesheet.id}`)}
                onEdit={() => router.push(`/timesheets/${timesheet.id}/edit`)}
                onDelete={() => setTimesheetToDelete(timesheet)}
                onSubmit={() => setTimesheetToSubmit(timesheet)}
              />
            ))}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Viser {(page - 1) * 12 + 1}-{Math.min(page * 12, data.total)} av{' '}
                {data.total} timeregistreringer
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Forrige
                </Button>
                <span className="text-sm">
                  Side {page} av {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                >
                  Neste
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!timesheetToDelete}
        onOpenChange={() => setTimesheetToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett timeregistrering?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette denne timeregistreringen? Denne
              handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submit confirmation */}
      <AlertDialog
        open={!!timesheetToSubmit}
        onOpenChange={() => setTimesheetToSubmit(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send inn timeregistrering?</AlertDialogTitle>
            <AlertDialogDescription>
              Du er i ferd med å sende inn timeregistreringen for godkjenning.
              Sørg for at alle timer er korrekt registrert.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              Send inn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
