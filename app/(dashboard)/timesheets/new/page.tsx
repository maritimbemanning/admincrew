'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCreateTimesheet, useAssignmentTimesheets } from '@/hooks/use-timesheets'
import { TimesheetGrid } from '@/components/timesheets'
import { PeriodSelector, usePeriodSelector } from '@/components/timesheets'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, Loader2, Briefcase } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { TimesheetEntry } from '@/types/contracts'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

function NewTimesheetContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedAssignmentId = searchParams.get('assignment_id')

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(
    preselectedAssignmentId || ''
  )
  const [entries, setEntries] = useState<TimesheetEntry[]>([])

  const {
    periodType,
    setPeriodType,
    currentDate,
    setCurrentDate,
    periodStart,
    periodEnd,
  } = usePeriodSelector()

  const createTimesheet = useCreateTimesheet()

  // Fetch active assignments for dropdown
  const supabase = createClient()
  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['assignments', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          id,
          assignment_number,
          title,
          role,
          candidate:candidates(id, first_name, last_name),
          organization:crm_organizations(id, name)
        `)
        .eq('status', 'active')
        .order('title')

      if (error) throw error
      return data
    },
  })

  // Check if timesheet already exists for this period
  const { data: existingTimesheets } = useAssignmentTimesheets(selectedAssignmentId)

  const periodConflict = existingTimesheets?.some(
    (ts) =>
      ts.period_start === periodStart &&
      ts.period_end === periodEnd
  )

  const handleSave = async () => {
    if (!selectedAssignmentId) {
      toast.error('Velg et oppdrag')
      return
    }

    if (periodConflict) {
      toast.error('Det finnes allerede en timeregistrering for denne perioden')
      return
    }

    try {
      const result = await createTimesheet.mutateAsync({
        assignment_id: selectedAssignmentId,
        period_start: periodStart,
        period_end: periodEnd,
        entries,
      })
      toast.success('Timeregistrering opprettet')
      router.push(`/timesheets/${result.id}`)
    } catch {
      toast.error('Kunne ikke opprette timeregistrering')
    }
  }

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0)

  return (
    <div className="space-y-6">
      {/* Assignment selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Velg oppdrag
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedAssignmentId}
            onValueChange={setSelectedAssignmentId}
            disabled={assignmentsLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Velg oppdrag..." />
            </SelectTrigger>
            <SelectContent>
              {assignments?.map((assignment) => (
                <SelectItem key={assignment.id} value={assignment.id}>
                  <div className="flex flex-col">
                    <span>
                      {assignment.assignment_number} - {assignment.title}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {assignment.candidate?.[0]?.first_name} {assignment.candidate?.[0]?.last_name}
                      {assignment.organization?.[0] && ` • ${assignment.organization[0].name}`}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {periodConflict && (
            <p className="mt-2 text-sm text-destructive">
              Det finnes allerede en timeregistrering for denne perioden på dette oppdraget.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Period selector */}
      <Card>
        <CardContent className="pt-6">
          <PeriodSelector
            periodType={periodType}
            onPeriodTypeChange={setPeriodType}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            periodStart={periodStart}
            periodEnd={periodEnd}
          />
        </CardContent>
      </Card>

      {/* Timesheet grid */}
      {selectedAssignmentId && (
        <TimesheetGrid
          periodStart={periodStart}
          periodEnd={periodEnd}
          entries={entries}
          onChange={setEntries}
        />
      )}

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            Totalt: <span className="font-bold text-foreground">{totalHours}</span> timer
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            Avbryt
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              !selectedAssignmentId ||
              periodConflict ||
              createTimesheet.isPending
            }
          >
            {createTimesheet.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Save className="h-4 w-4 mr-2" />
            Lagre
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function NewTimesheetPage() {
  return (
    <div className="container py-6 max-w-5xl">
      <div className="mb-6">
        <Link href="/timesheets">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake til timeregistrering
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Ny timeregistrering</h1>
        <p className="text-muted-foreground mt-1">
          Registrer timer for et oppdrag
        </p>
      </div>

      <Suspense fallback={<div>Laster...</div>}>
        <NewTimesheetContent />
      </Suspense>
    </div>
  )
}
