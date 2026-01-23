'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  User,
  Building2,
  MoreVertical,
  FileText,
  CheckCircle,
  Clock,
  MapPin,
  Ship,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
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
  useAssignment,
  useUpdateAssignmentStatus,
  useUpdateReleaseChecklist,
  useDeleteAssignment,
} from '@/hooks/use-assignments'
import {
  ASSIGNMENT_STATUS_LABELS,
  ASSIGNMENT_STATUS_COLORS,
} from '@/types/operations'
import type { AssignmentStatus, ReleaseChecklist } from '@/types/operations'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const CHECKLIST_ITEMS: { key: keyof Omit<ReleaseChecklist, 'notes'>; label: string }[] = [
  { key: 'compliance_verified', label: 'Compliance verifisert' },
  { key: 'certifications_valid', label: 'Sertifikater gyldige' },
  { key: 'contract_signed', label: 'Kontrakt signert' },
  { key: 'travel_arranged', label: 'Reise arrangert' },
  { key: 'accommodation_arranged', label: 'Losji arrangert' },
  { key: 'ppe_provided', label: 'Verneutstyr utlevert' },
  { key: 'customer_notified', label: 'Kunde varslet' },
  { key: 'candidate_briefed', label: 'Kandidat briefet' },
]

export default function AssignmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const assignmentId = params.id as string

  const { data: assignment, isLoading } = useAssignment(assignmentId)
  const updateStatus = useUpdateAssignmentStatus()
  const updateChecklist = useUpdateReleaseChecklist()
  const deleteAssignment = useDeleteAssignment()

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleStatusChange = async (status: AssignmentStatus) => {
    try {
      await updateStatus.mutateAsync({ id: assignmentId, status })
      toast.success(`Status endret til ${ASSIGNMENT_STATUS_LABELS[status]}`)
    } catch (error) {
      toast.error('Kunne ikke endre status')
    }
  }

  const handleChecklistChange = async (key: keyof ReleaseChecklist, value: boolean) => {
    if (!assignment) return

    const currentChecklist = assignment.release_checklist || {
      compliance_verified: false,
      certifications_valid: false,
      contract_signed: false,
      travel_arranged: false,
      accommodation_arranged: false,
      ppe_provided: false,
      customer_notified: false,
      candidate_briefed: false,
      notes: null,
    }

    try {
      await updateChecklist.mutateAsync({
        id: assignmentId,
        checklist: { ...currentChecklist, [key]: value },
      })
    } catch (error) {
      toast.error('Kunne ikke oppdatere sjekkliste')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteAssignment.mutateAsync(assignmentId)
      toast.success('Oppdrag slettet')
      router.push('/operations/assignments')
    } catch (error) {
      toast.error('Kunne ikke slette oppdrag')
    }
  }

  if (isLoading) {
    return <AssignmentDetailSkeleton />
  }

  if (!assignment) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Oppdrag ikke funnet</p>
        <Button variant="link" asChild className="mt-2">
          <Link href="/operations/assignments">Tilbake til oppdrag</Link>
        </Button>
      </div>
    )
  }

  const candidateName = assignment.candidate
    ? `${assignment.candidate.first_name} ${assignment.candidate.last_name}`
    : 'Ukjent kandidat'

  const initials = candidateName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const checklist = assignment.release_checklist || {
    compliance_verified: false,
    certifications_valid: false,
    contract_signed: false,
    travel_arranged: false,
    accommodation_arranged: false,
    ppe_provided: false,
    customer_notified: false,
    candidate_briefed: false,
    notes: null,
  }

  const checklistComplete = CHECKLIST_ITEMS.every((item) => checklist[item.key])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{assignment.title}</h1>
              <Badge
                variant="outline"
                className={cn(ASSIGNMENT_STATUS_COLORS[assignment.status])}
              >
                {ASSIGNMENT_STATUS_LABELS[assignment.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground font-mono text-sm mt-1">
              {assignment.assignment_number}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleStatusChange('active')}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Start oppdrag
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                <Clock className="h-4 w-4 mr-2" />
                Marker fullført
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Slett
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Candidate Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Kandidat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{candidateName}</h3>
                  <p className="text-muted-foreground">{assignment.role}</p>
                  {assignment.candidate?.email && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {assignment.candidate.email}
                    </p>
                  )}
                  {assignment.candidate?.phone && (
                    <p className="text-sm text-muted-foreground">
                      {assignment.candidate.phone}
                    </p>
                  )}
                </div>
                <Button variant="outline" asChild>
                  <Link href={`/candidates/${assignment.candidate_id}`}>
                    Se profil
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Oppdragsdetaljer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Periode</p>
                    <p className="font-medium">
                      {new Date(assignment.planned_start_date).toLocaleDateString(
                        'nb-NO',
                        { day: 'numeric', month: 'long', year: 'numeric' }
                      )}
                      {assignment.planned_end_date && (
                        <>
                          {' - '}
                          {new Date(assignment.planned_end_date).toLocaleDateString(
                            'nb-NO',
                            { day: 'numeric', month: 'long', year: 'numeric' }
                          )}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Kunde</p>
                    <p className="font-medium">
                      {assignment.organization?.name || 'Ikke angitt'}
                    </p>
                  </div>
                </div>

                {assignment.vessel_name && (
                  <div className="flex items-center gap-3">
                    <Ship className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Fartøy</p>
                      <p className="font-medium">{assignment.vessel_name}</p>
                    </div>
                  </div>
                )}

                {assignment.work_location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Lokasjon</p>
                      <p className="font-medium">{assignment.work_location}</p>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Rates */}
              <div className="grid grid-cols-2 gap-4">
                {assignment.employee_rate_amount_nok && (
                  <div>
                    <p className="text-sm text-muted-foreground">Lønnsrate</p>
                    <p className="text-lg font-semibold">
                      {new Intl.NumberFormat('nb-NO', {
                        style: 'currency',
                        currency: 'NOK',
                        maximumFractionDigits: 0,
                      }).format(assignment.employee_rate_amount_nok)}
                      /{assignment.employee_rate_type === 'daily' ? 'dag' : 'time'}
                    </p>
                  </div>
                )}

                {assignment.billing_rate_amount_nok && (
                  <div>
                    <p className="text-sm text-muted-foreground">Faktureringsrate</p>
                    <p className="text-lg font-semibold text-green-600">
                      {new Intl.NumberFormat('nb-NO', {
                        style: 'currency',
                        currency: 'NOK',
                        maximumFractionDigits: 0,
                      }).format(assignment.billing_rate_amount_nok)}
                      /{assignment.billing_rate_type === 'daily' ? 'dag' : 'time'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Release Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Release Checklist
                </span>
                {checklistComplete && (
                  <Badge variant="default" className="bg-green-600">
                    Komplett
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {CHECKLIST_ITEMS.map((item) => (
                  <div key={item.key} className="flex items-center gap-3">
                    <Checkbox
                      id={item.key}
                      checked={checklist[item.key]}
                      onCheckedChange={(checked) =>
                        handleChecklistChange(item.key, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={item.key}
                      className={cn(
                        'text-sm cursor-pointer',
                        checklist[item.key] && 'text-muted-foreground line-through'
                      )}
                    >
                      {item.label}
                    </label>
                  </div>
                ))}
              </div>

              {checklistComplete && (
                <Button
                  className="w-full mt-4"
                  onClick={() => handleStatusChange('ready_for_start')}
                  disabled={assignment.status === 'ready_for_start'}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Klar for start
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Handlinger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Generer kontrakt
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-2" />
                Timeregistrering
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett oppdrag?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette dette oppdraget? Dette kan ikke
              angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function AssignmentDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32 mt-2" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-60" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  )
}
