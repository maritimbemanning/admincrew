'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  useNonconformity,
  useUpdateNcStatus,
  useCreateCapa,
  useUpdateCapa,
  useUpdateCapaStatus,
  useDeleteCapa,
} from '@/hooks/use-qms-nc'
import { CapaList, CapaFormDialog } from '@/components/qms'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  NC_STATUS_LABELS,
  NC_STATUS_COLORS,
  NC_SEVERITY_LABELS,
  NC_SEVERITY_COLORS,
  NC_SOURCE_LABELS,
  CapaAction,
  CapaStatus,
  NcStatus,
} from '@/types/qms'
import {
  ArrowLeft,
  MoreHorizontal,
  Edit,
  AlertTriangle,
  Calendar,
  User,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { nb } from 'date-fns/locale'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NonconformityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ncId = params.id as string

  const { data: nc, isLoading, error } = useNonconformity(ncId)
  const updateNcStatus = useUpdateNcStatus()
  const createCapa = useCreateCapa()
  const updateCapa = useUpdateCapa()
  const updateCapaStatus = useUpdateCapaStatus()
  const deleteCapa = useDeleteCapa()

  const [showCapaForm, setShowCapaForm] = useState(false)
  const [editingCapa, setEditingCapa] = useState<CapaAction | null>(null)

  if (isLoading) {
    return (
      <div className="container py-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-6">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    )
  }

  if (error || !nc) {
    return (
      <div className="container py-6">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive">Kunne ikke laste avvik</p>
          <Button variant="outline" onClick={() => router.back()} className="mt-4">
            Gå tilbake
          </Button>
        </div>
      </div>
    )
  }

  const statusColor = NC_STATUS_COLORS[nc.status]
  const severityColor = NC_SEVERITY_COLORS[nc.severity]

  const isOverdue =
    nc.due_date &&
    new Date(nc.due_date) < new Date() &&
    !['closed', 'verified'].includes(nc.status)

  const daysUntilDue = nc.due_date
    ? differenceInDays(new Date(nc.due_date), new Date())
    : null

  const isClosed = ['closed', 'verified'].includes(nc.status)

  const statusFlow: NcStatus[] = [
    'open',
    'analysis',
    'action_planned',
    'action_implemented',
    'verified',
    'closed',
  ]
  const currentStatusIndex = statusFlow.indexOf(nc.status)
  const nextStatus =
    currentStatusIndex < statusFlow.length - 1
      ? statusFlow[currentStatusIndex + 1]
      : null

  const handleStatusChange = async (status: NcStatus) => {
    try {
      await updateNcStatus.mutateAsync({ id: nc.id, status })
      toast.success('Status oppdatert')
    } catch {
      toast.error('Kunne ikke oppdatere status')
    }
  }

  const handleCreateCapa = async (data: { type: 'corrective' | 'preventive'; description: string; due_date?: string; responsible_id?: string }) => {
    try {
      await createCapa.mutateAsync({
        nonconformity_id: nc.id,
        ...data,
      })
      toast.success('CAPA-tiltak opprettet')
      setShowCapaForm(false)
    } catch {
      toast.error('Kunne ikke opprette tiltak')
    }
  }

  const handleUpdateCapa = async (data: { description: string; due_date?: string; responsible_id?: string }) => {
    if (!editingCapa) return
    try {
      await updateCapa.mutateAsync({
        id: editingCapa.id,
        ncId: nc.id,
        ...data,
      })
      toast.success('Tiltak oppdatert')
      setEditingCapa(null)
    } catch {
      toast.error('Kunne ikke oppdatere tiltak')
    }
  }

  const handleCapaStatusChange = async (capaId: string, status: CapaStatus) => {
    try {
      await updateCapaStatus.mutateAsync({ id: capaId, ncId: nc.id, status })
      toast.success('Status oppdatert')
    } catch {
      toast.error('Kunne ikke oppdatere status')
    }
  }

  const handleDeleteCapa = async (capaId: string) => {
    try {
      await deleteCapa.mutateAsync({ id: capaId, ncId: nc.id })
      toast.success('Tiltak slettet')
    } catch {
      toast.error('Kunne ikke slette tiltak')
    }
  }

  return (
    <div className="container py-6 max-w-4xl">
      <div className="mb-6">
        <Link href="/qms/nonconformities">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake til avvik
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{nc.title}</h1>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className={statusColor}>
                {NC_STATUS_LABELS[nc.status]}
              </Badge>
              <Badge variant="outline" className={severityColor}>
                {NC_SEVERITY_LABELS[nc.severity]}
              </Badge>
              {isOverdue && <Badge variant="destructive">Forfalt</Badge>}
            </div>
            <p className="text-muted-foreground mt-2">
              {nc.nc_number} • {NC_SOURCE_LABELS[nc.source]}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreHorizontal className="h-4 w-4 mr-2" />
                Handlinger
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isClosed && (
                <DropdownMenuItem asChild>
                  <Link href={`/qms/nonconformities/${nc.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Rediger
                  </Link>
                </DropdownMenuItem>
              )}
              {nextStatus && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleStatusChange(nextStatus)}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Flytt til {NC_STATUS_LABELS[nextStatus]}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-6">
        {/* Metadata */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {nc.responsible && (
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ansvarlig</p>
                    <p className="font-medium">{nc.responsible.full_name}</p>
                  </div>
                </div>
              )}
              {nc.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Sted</p>
                    <p className="font-medium">{nc.location}</p>
                  </div>
                </div>
              )}
              {nc.detected_at && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Oppdaget</p>
                    <p className="font-medium">
                      {format(new Date(nc.detected_at), 'dd.MM.yyyy', { locale: nb })}
                    </p>
                  </div>
                </div>
              )}
              {nc.due_date && (
                <div className="flex items-center gap-3">
                  {isOverdue ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Frist</p>
                    <p className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                      {format(new Date(nc.due_date), 'dd.MM.yyyy', { locale: nb })}
                      {isOverdue && ` (${Math.abs(daysUntilDue || 0)} dager over)`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Detaljer</TabsTrigger>
            <TabsTrigger value="capa">CAPA ({nc.capa_actions?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Beskrivelse</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{nc.description}</p>
              </CardContent>
            </Card>

            {/* Immediate action */}
            {nc.immediate_action && (
              <Card>
                <CardHeader>
                  <CardTitle>Umiddelbar handling</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{nc.immediate_action}</p>
                </CardContent>
              </Card>
            )}

            {/* Root cause */}
            {nc.root_cause && (
              <Card>
                <CardHeader>
                  <CardTitle>Rotårsaksanalyse</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{nc.root_cause}</p>
                </CardContent>
              </Card>
            )}

            {/* Timestamps */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Opprettet{' '}
                    {format(new Date(nc.created_at), 'dd.MM.yyyy HH:mm', { locale: nb })}
                  </span>
                  {nc.closed_at && (
                    <span>
                      Lukket{' '}
                      {format(new Date(nc.closed_at), 'dd.MM.yyyy HH:mm', { locale: nb })}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="capa">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  CAPA-tiltak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CapaList
                  capaActions={nc.capa_actions || []}
                  ncId={nc.id}
                  onAdd={() => setShowCapaForm(true)}
                  onEdit={(capa) => setEditingCapa(capa)}
                  onDelete={handleDeleteCapa}
                  onStatusChange={handleCapaStatusChange}
                  readonly={isClosed}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Status progression */}
        {!isClosed && nextStatus && (
          <div className="flex justify-end">
            <Button onClick={() => handleStatusChange(nextStatus)}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Flytt til {NC_STATUS_LABELS[nextStatus]}
            </Button>
          </div>
        )}
      </div>

      {/* CAPA form dialog */}
      <CapaFormDialog
        open={showCapaForm}
        onOpenChange={setShowCapaForm}
        ncId={nc.id}
        onSubmit={handleCreateCapa}
        isSubmitting={createCapa.isPending}
      />

      {/* Edit CAPA dialog */}
      {editingCapa && (
        <CapaFormDialog
          open={!!editingCapa}
          onOpenChange={() => setEditingCapa(null)}
          capa={editingCapa}
          ncId={nc.id}
          onSubmit={handleUpdateCapa}
          isSubmitting={updateCapa.isPending}
        />
      )}
    </div>
  )
}
