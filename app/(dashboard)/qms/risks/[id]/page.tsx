'use client'

import { useParams, useRouter } from 'next/navigation'
import {
  useRisk,
  useUpdateRiskStatus,
  useUpdateResidualRisk,
  useArchiveRisk,
} from '@/hooks/use-qms-risks'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  RISK_CATEGORY_LABELS,
  RISK_STATUS_LABELS,
  RISK_STATUS_COLORS,
  getRiskLevel,
  RISK_LEVEL_LABELS,
  RISK_LEVEL_COLORS,
  RiskStatus,
} from '@/types/qms'
import {
  ArrowLeft,
  MoreHorizontal,
  Edit,
  Archive,
  Calendar,
  User,
  Shield,
  Clock,
  TrendingDown,
} from 'lucide-react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

export default function RiskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const riskId = params.id as string

  const { data: risk, isLoading, error } = useRisk(riskId)
  const updateStatus = useUpdateRiskStatus()
  const updateResidual = useUpdateResidualRisk()
  const archiveRisk = useArchiveRisk()

  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [residualLikelihood, setResidualLikelihood] = useState<number | null>(null)
  const [residualImpact, setResidualImpact] = useState<number | null>(null)

  if (isLoading) {
    return (
      <div className="container py-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-6">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    )
  }

  if (error || !risk) {
    return (
      <div className="container py-6">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive">Kunne ikke laste risiko</p>
          <Button variant="outline" onClick={() => router.back()} className="mt-4">
            Gå tilbake
          </Button>
        </div>
      </div>
    )
  }

  const statusColor = RISK_STATUS_COLORS[risk.status]
  const riskLevel = getRiskLevel(risk.risk_score)
  const isClosed = risk.status === 'closed'

  const residualScore =
    risk.residual_likelihood && risk.residual_impact
      ? risk.residual_likelihood * risk.residual_impact
      : null
  const residualLevel = residualScore ? getRiskLevel(residualScore) : null

  const handleStatusChange = async (status: RiskStatus) => {
    try {
      await updateStatus.mutateAsync({ id: risk.id, status })
      toast.success('Status oppdatert')
    } catch {
      toast.error('Kunne ikke oppdatere status')
    }
  }

  const handleArchive = async () => {
    try {
      await archiveRisk.mutateAsync(risk.id)
      toast.success('Risiko arkivert')
      router.push('/qms/risks')
    } catch {
      toast.error('Kunne ikke arkivere risiko')
    }
  }

  const handleResidualUpdate = async () => {
    if (!residualLikelihood || !residualImpact) return
    try {
      await updateResidual.mutateAsync({
        id: risk.id,
        residual_likelihood: residualLikelihood,
        residual_impact: residualImpact,
      })
      toast.success('Restrisiko oppdatert')
      setResidualLikelihood(null)
      setResidualImpact(null)
    } catch {
      toast.error('Kunne ikke oppdatere restrisiko')
    }
  }

  return (
    <div className="container py-6 max-w-4xl">
      <div className="mb-6">
        <Link href="/qms/risks">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake til risikoregister
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{risk.title}</h1>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className={statusColor}>
                {RISK_STATUS_LABELS[risk.status]}
              </Badge>
              <Badge variant="outline">{RISK_CATEGORY_LABELS[risk.category]}</Badge>
            </div>
            <p className="text-muted-foreground mt-2">{risk.risk_number}</p>
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
                  <Link href={`/qms/risks/${risk.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Rediger
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {risk.status === 'identified' && (
                <DropdownMenuItem onClick={() => handleStatusChange('assessed')}>
                  Marker som vurdert
                </DropdownMenuItem>
              )}
              {risk.status === 'assessed' && (
                <DropdownMenuItem onClick={() => handleStatusChange('mitigated')}>
                  Marker som mitigert
                </DropdownMenuItem>
              )}
              {['assessed', 'mitigated'].includes(risk.status) && (
                <DropdownMenuItem onClick={() => handleStatusChange('accepted')}>
                  Aksepter risiko
                </DropdownMenuItem>
              )}
              {!isClosed && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setShowArchiveDialog(true)}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Arkiver
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-6">
        {/* Risk scores */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Inherent risk */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Iboende risiko
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Sannsynlighet: <span className="font-medium">{risk.likelihood}/5</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Konsekvens: <span className="font-medium">{risk.impact}/5</span>
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className={`w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-2xl ${RISK_LEVEL_COLORS[riskLevel]}`}
                  >
                    {risk.risk_score}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {RISK_LEVEL_LABELS[riskLevel]}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Residual risk */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Restrisiko
              </CardTitle>
            </CardHeader>
            <CardContent>
              {residualScore !== null && residualLevel !== null ? (
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Sannsynlighet:{' '}
                      <span className="font-medium">{risk.residual_likelihood}/5</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Konsekvens:{' '}
                      <span className="font-medium">{risk.residual_impact}/5</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div
                      className={`w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-2xl ${RISK_LEVEL_COLORS[residualLevel]}`}
                    >
                      {residualScore}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {RISK_LEVEL_LABELS[residualLevel]}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Vurder restrisiko etter at tiltak er iverksatt
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Sannsynlighet</Label>
                      <Select
                        value={residualLikelihood?.toString() || ''}
                        onValueChange={(v) => setResidualLikelihood(parseInt(v))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Velg" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <SelectItem key={n} value={n.toString()}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Konsekvens</Label>
                      <Select
                        value={residualImpact?.toString() || ''}
                        onValueChange={(v) => setResidualImpact(parseInt(v))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Velg" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <SelectItem key={n} value={n.toString()}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    onClick={handleResidualUpdate}
                    disabled={!residualLikelihood || !residualImpact}
                    size="sm"
                  >
                    Lagre restrisiko
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Metadata */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {risk.owner && (
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Eier</p>
                    <p className="font-medium">{risk.owner.full_name}</p>
                  </div>
                </div>
              )}
              {risk.next_review_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Neste gjennomgang</p>
                    <p className="font-medium">
                      {format(new Date(risk.next_review_date), 'dd.MM.yyyy', {
                        locale: nb,
                      })}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Opprettet</p>
                  <p className="font-medium">
                    {format(new Date(risk.created_at), 'dd.MM.yyyy', { locale: nb })}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>Beskrivelse</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{risk.description}</p>
          </CardContent>
        </Card>

        {/* Mitigation strategy */}
        {risk.mitigation_strategy && (
          <Card>
            <CardHeader>
              <CardTitle>Mitigeringsstrategi</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{risk.mitigation_strategy}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Archive dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arkiver risiko?</AlertDialogTitle>
            <AlertDialogDescription>
              Risikoen vil bli markert som lukket og fjernet fra aktive risikoer.
              Denne handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>Arkiver</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
