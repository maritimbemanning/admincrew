'use client'

import { useParams, useRouter } from 'next/navigation'
import {
  useTimesheet,
  useSubmitTimesheet,
  useApproveTimesheet,
  useRejectTimesheet,
  useUpdateTimesheet,
} from '@/hooks/use-timesheets'
import { TimesheetGrid } from '@/components/timesheets'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  TIMESHEET_STATUS_LABELS,
  TIMESHEET_STATUS_COLORS,
  TimesheetEntry,
} from '@/types/contracts'
import {
  ArrowLeft,
  MoreHorizontal,
  Edit,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  User,
  Building2,
  Briefcase,
  Save,
  Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

export default function TimesheetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const timesheetId = params.id as string

  const { data: timesheet, isLoading, error } = useTimesheet(timesheetId)
  const submitTimesheet = useSubmitTimesheet()
  const approveTimesheet = useApproveTimesheet()
  const rejectTimesheet = useRejectTimesheet()
  const updateTimesheet = useUpdateTimesheet()

  const [isEditing, setIsEditing] = useState(false)
  const [editedEntries, setEditedEntries] = useState<TimesheetEntry[]>([])
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  if (isLoading) {
    return (
      <div className="container py-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-6">
          <Skeleton className="h-[100px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    )
  }

  if (error || !timesheet) {
    return (
      <div className="container py-6">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive">Kunne ikke laste timeregistrering</p>
          <Button variant="outline" onClick={() => router.back()} className="mt-4">
            Gå tilbake
          </Button>
        </div>
      </div>
    )
  }

  const statusColor = TIMESHEET_STATUS_COLORS[timesheet.status]
  const canEdit = timesheet.status === 'draft'
  const canSubmit = timesheet.status === 'draft' && timesheet.total_hours > 0
  const canApprove = timesheet.status === 'submitted'

  const handleStartEdit = () => {
    setEditedEntries(timesheet.entries)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedEntries([])
  }

  const handleSaveEdit = async () => {
    try {
      await updateTimesheet.mutateAsync({
        id: timesheet.id,
        entries: editedEntries,
      })
      toast.success('Timeregistrering oppdatert')
      setIsEditing(false)
    } catch {
      toast.error('Kunne ikke oppdatere timeregistrering')
    }
  }

  const handleSubmit = async () => {
    try {
      await submitTimesheet.mutateAsync(timesheet.id)
      toast.success('Timeregistrering sendt inn')
      setShowSubmitDialog(false)
    } catch {
      toast.error('Kunne ikke sende inn timeregistrering')
    }
  }

  const handleApprove = async () => {
    try {
      await approveTimesheet.mutateAsync(timesheet.id)
      toast.success('Timeregistrering godkjent')
      setShowApproveDialog(false)
    } catch {
      toast.error('Kunne ikke godkjenne timeregistrering')
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) return

    try {
      await rejectTimesheet.mutateAsync({
        id: timesheet.id,
        reason: rejectReason,
      })
      toast.success('Timeregistrering avvist')
      setShowRejectDialog(false)
      setRejectReason('')
    } catch {
      toast.error('Kunne ikke avvise timeregistrering')
    }
  }

  return (
    <div className="container py-6 max-w-5xl">
      <div className="mb-6">
        <Link href="/timesheets">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake til timeregistrering
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">
                {format(new Date(timesheet.period_start), 'dd.MM', { locale: nb })} -{' '}
                {format(new Date(timesheet.period_end), 'dd.MM.yyyy', { locale: nb })}
              </h1>
              <Badge variant="outline" className={statusColor}>
                {TIMESHEET_STATUS_LABELS[timesheet.status]}
              </Badge>
            </div>
            {timesheet.assignment && (
              <p className="text-muted-foreground mt-1">
                {timesheet.assignment.assignment_number} - {timesheet.assignment.title}
              </p>
            )}
          </div>

          {!isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <MoreHorizontal className="h-4 w-4 mr-2" />
                  Handlinger
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (
                  <DropdownMenuItem onClick={handleStartEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Rediger
                  </DropdownMenuItem>
                )}
                {canSubmit && (
                  <DropdownMenuItem onClick={() => setShowSubmitDialog(true)}>
                    <Send className="h-4 w-4 mr-2" />
                    Send inn
                  </DropdownMenuItem>
                )}
                {canApprove && (
                  <>
                    <DropdownMenuItem onClick={() => setShowApproveDialog(true)}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Godkjenn
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowRejectDialog(true)}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Avvis
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {isEditing && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancelEdit}>
                Avbryt
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={updateTimesheet.isPending}
              >
                {updateTimesheet.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Save className="h-4 w-4 mr-2" />
                Lagre
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Summary card */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {timesheet.assignment?.candidate && (
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ansatt</p>
                    <p className="font-medium">
                      {timesheet.assignment.candidate.first_name}{' '}
                      {timesheet.assignment.candidate.last_name}
                    </p>
                  </div>
                </div>
              )}
              {timesheet.assignment?.organization && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Kunde</p>
                    <p className="font-medium">
                      {timesheet.assignment.organization.name}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Totalt</p>
                  <p className="font-medium">
                    {timesheet.total_hours} timer / {timesheet.total_days} dager
                  </p>
                </div>
              </div>
              {timesheet.status === 'approved' &&
                timesheet.calculated_billing_nok !== null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Fakturering</p>
                    <p className="font-medium">
                      {timesheet.calculated_billing_nok.toLocaleString('nb-NO')} kr
                    </p>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>

        {/* Rejection reason */}
        {timesheet.status === 'rejected' && timesheet.rejection_reason && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                Avvist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{timesheet.rejection_reason}</p>
              {timesheet.rejected_at && (
                <p className="text-sm text-muted-foreground mt-2">
                  Avvist{' '}
                  {format(new Date(timesheet.rejected_at), 'dd.MM.yyyy HH:mm', {
                    locale: nb,
                  })}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Timesheet grid */}
        <TimesheetGrid
          periodStart={timesheet.period_start}
          periodEnd={timesheet.period_end}
          entries={isEditing ? editedEntries : timesheet.entries}
          onChange={isEditing ? setEditedEntries : () => {}}
          readonly={!isEditing}
        />

        {/* Status actions */}
        {!isEditing && (
          <div className="flex justify-end gap-4">
            {canSubmit && (
              <Button onClick={() => setShowSubmitDialog(true)}>
                <Send className="h-4 w-4 mr-2" />
                Send inn
              </Button>
            )}
            {canApprove && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectDialog(true)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Avvis
                </Button>
                <Button onClick={() => setShowApproveDialog(true)}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Godkjenn
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Submit confirmation */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send inn timeregistrering?</AlertDialogTitle>
            <AlertDialogDescription>
              Du er i ferd med å sende inn {timesheet.total_hours} timer for
              godkjenning. Sørg for at alle timer er korrekt registrert.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={submitTimesheet.isPending}
            >
              {submitTimesheet.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send inn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve confirmation */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Godkjenn timeregistrering?</AlertDialogTitle>
            <AlertDialogDescription>
              Du er i ferd med å godkjenne {timesheet.total_hours} timer for{' '}
              {timesheet.assignment?.candidate?.first_name}{' '}
              {timesheet.assignment?.candidate?.last_name}.
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
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
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
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
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
    </div>
  )
}
