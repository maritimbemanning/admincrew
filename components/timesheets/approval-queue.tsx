'use client'

import { useState } from 'react'
import {
  useTimesheetApprovalQueue,
  useApproveTimesheet,
  useRejectTimesheet,
} from '@/hooks/use-timesheets'
import { TimesheetCard } from './timesheet-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Timesheet } from '@/types/contracts'
import { CheckCircle2, XCircle, Clock, Inbox, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function ApprovalQueue() {
  const router = useRouter()
  const { data: timesheets, isLoading, error } = useTimesheetApprovalQueue()
  const approveTimesheet = useApproveTimesheet()
  const rejectTimesheet = useRejectTimesheet()

  const [timesheetToApprove, setTimesheetToApprove] = useState<Timesheet | null>(null)
  const [timesheetToReject, setTimesheetToReject] = useState<Timesheet | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const handleApprove = async () => {
    if (!timesheetToApprove) return

    try {
      await approveTimesheet.mutateAsync(timesheetToApprove.id)
      toast.success('Timeregistrering godkjent')
      setTimesheetToApprove(null)
    } catch {
      toast.error('Kunne ikke godkjenne timeregistrering')
    }
  }

  const handleReject = async () => {
    if (!timesheetToReject || !rejectReason.trim()) return

    try {
      await rejectTimesheet.mutateAsync({
        id: timesheetToReject.id,
        reason: rejectReason,
      })
      toast.success('Timeregistrering avvist')
      setTimesheetToReject(null)
      setRejectReason('')
    } catch {
      toast.error('Kunne ikke avvise timeregistrering')
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-[200px] rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive">Kunne ikke laste godkjenningskøen</p>
        <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
          Prøv igjen
        </Button>
      </div>
    )
  }

  if (!timesheets || timesheets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Ingen ventende godkjenninger</h3>
        <p className="text-muted-foreground mt-1">
          Alle innsendte timeregistreringer er behandlet
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <Badge variant="secondary" className="text-lg px-3 py-1">
          <Clock className="h-4 w-4 mr-2" />
          {timesheets.length} venter på godkjenning
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {timesheets.map((timesheet) => (
          <TimesheetCard
            key={timesheet.id}
            timesheet={timesheet}
            onView={() => router.push(`/timesheets/${timesheet.id}`)}
            onApprove={() => setTimesheetToApprove(timesheet)}
            onReject={() => setTimesheetToReject(timesheet)}
          />
        ))}
      </div>

      {/* Approve confirmation */}
      <AlertDialog
        open={!!timesheetToApprove}
        onOpenChange={() => setTimesheetToApprove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Godkjenn timeregistrering?</AlertDialogTitle>
            <AlertDialogDescription>
              Du er i ferd med å godkjenne{' '}
              <strong>{timesheetToApprove?.total_hours} timer</strong> for{' '}
              {timesheetToApprove?.assignment?.candidate?.first_name}{' '}
              {timesheetToApprove?.assignment?.candidate?.last_name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={approveTimesheet.isPending}
            >
              {approveTimesheet.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Godkjenn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject dialog */}
      <Dialog open={!!timesheetToReject} onOpenChange={() => setTimesheetToReject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avvis timeregistrering</DialogTitle>
            <DialogDescription>
              Oppgi en grunn for avvisningen. Dette vil bli sendt til den ansatte.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Grunn for avvisning..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTimesheetToReject(null)}>
              Avbryt
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || rejectTimesheet.isPending}
            >
              {rejectTimesheet.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <XCircle className="h-4 w-4 mr-2" />
              Avvis
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
