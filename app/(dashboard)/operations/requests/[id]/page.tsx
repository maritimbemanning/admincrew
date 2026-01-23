'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Zap,
  Users,
  Calendar,
  Building2,
  MoreVertical,
  CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
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
import { MatchingPanel } from '@/components/operations/matching-panel'
import {
  useRequest,
  useRequestShortlist,
  useAddToShortlist,
  useRemoveFromShortlist,
} from '@/hooks/use-request'
import { useDeleteRequest, useUpdateRequestStatus } from '@/hooks/use-requests'
import { buildCriteriaFromRequest } from '@/hooks/use-matching'
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  SHORTLIST_STATUS_LABELS,
} from '@/types/operations'
import type { MatchResult, RequestStatus } from '@/types/operations'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function RequestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const requestId = params.id as string

  const { data: request, isLoading } = useRequest(requestId)
  const { data: shortlist } = useRequestShortlist(requestId)
  const addToShortlist = useAddToShortlist()
  const removeFromShortlist = useRemoveFromShortlist()
  const deleteRequest = useDeleteRequest()
  const updateStatus = useUpdateRequestStatus()

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('matching')

  const handleAddToShortlist = async (result: MatchResult) => {
    try {
      await addToShortlist.mutateAsync({
        request_id: requestId,
        candidate_id: result.candidate_id,
        match_score: result.total_score,
        match_breakdown: result.scores as any,
      })
      toast.success(`${result.candidate.full_name} lagt til i shortlist`)
    } catch (error) {
      toast.error('Kunne ikke legge til i shortlist')
    }
  }

  const handleRemoveFromShortlist = async (id: string) => {
    try {
      await removeFromShortlist.mutateAsync({ id, requestId })
      toast.success('Fjernet fra shortlist')
    } catch (error) {
      toast.error('Kunne ikke fjerne fra shortlist')
    }
  }

  const handleStatusChange = async (status: RequestStatus) => {
    try {
      await updateStatus.mutateAsync({ id: requestId, status })
      toast.success(`Status endret til ${REQUEST_STATUS_LABELS[status]}`)
    } catch (error) {
      toast.error('Kunne ikke endre status')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteRequest.mutateAsync(requestId)
      toast.success('Request slettet')
      router.push('/operations/requests')
    } catch (error) {
      toast.error('Kunne ikke slette request')
    }
  }

  if (isLoading) {
    return <RequestDetailSkeleton />
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Request ikke funnet</p>
        <Button variant="link" asChild className="mt-2">
          <Link href="/operations/requests">Tilbake til requests</Link>
        </Button>
      </div>
    )
  }

  const shortlistedIds = shortlist?.map((s) => s.candidate_id) || []

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
              <h1 className="text-2xl font-bold">{request.title}</h1>
              <Badge
                variant="outline"
                className={cn(REQUEST_STATUS_COLORS[request.status])}
              >
                {REQUEST_STATUS_LABELS[request.status]}
              </Badge>
              <Badge
                variant="outline"
                className={cn(PRIORITY_COLORS[request.priority])}
              >
                {PRIORITY_LABELS[request.priority]}
              </Badge>
            </div>
            <p className="text-muted-foreground font-mono text-sm mt-1">
              {request.request_number}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/operations/requests/${requestId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Rediger
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleStatusChange('approved')}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Godkjenn
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('matching')}>
                <Zap className="h-4 w-4 mr-2" />
                Start matching
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

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Behov</p>
                <p className="font-semibold">
                  {request.quantity}x {request.role_needed}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Start</p>
                <p className="font-semibold">
                  {new Date(request.start_date).toLocaleDateString('nb-NO', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Kunde</p>
                <p className="font-semibold">
                  {request.organization?.name || 'Ikke angitt'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Shortlist</p>
                <p className="font-semibold">{shortlist?.length || 0} kandidater</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="matching">
            <Zap className="h-4 w-4 mr-2" />
            Matching
          </TabsTrigger>
          <TabsTrigger value="shortlist">
            <Users className="h-4 w-4 mr-2" />
            Shortlist ({shortlist?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="details">Detaljer</TabsTrigger>
        </TabsList>

        <TabsContent value="matching" className="mt-6">
          <MatchingPanel
            defaultRole={request.role_needed}
            defaultStartDate={request.start_date}
            defaultCerts={request.certifications_required || []}
            onAddToShortlist={handleAddToShortlist}
            shortlistedIds={shortlistedIds}
          />
        </TabsContent>

        <TabsContent value="shortlist" className="mt-6">
          {!shortlist || shortlist.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Ingen kandidater i shortlist ennå
                </p>
                <Button
                  variant="link"
                  onClick={() => setActiveTab('matching')}
                  className="mt-2"
                >
                  Start matching for å finne kandidater
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {shortlist.map((entry, index) => (
                <Card key={entry.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold text-muted-foreground">
                          #{index + 1}
                        </span>
                        <div>
                          <p className="font-semibold">
                            {entry.candidate?.first_name} {entry.candidate?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {entry.candidate?.primary_role}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {entry.match_score && (
                          <Badge variant="outline">Score: {entry.match_score}</Badge>
                        )}
                        <Badge variant="outline">
                          {SHORTLIST_STATUS_LABELS[entry.status]}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFromShortlist(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="details" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Krav</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {request.certifications_required &&
                  request.certifications_required.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Påkrevde sertifikater
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {request.certifications_required.map((cert) => (
                          <Badge key={cert} variant="default">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                {request.certifications_preferred &&
                  request.certifications_preferred.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Foretrukne sertifikater
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {request.certifications_preferred.map((cert) => (
                          <Badge key={cert} variant="secondary">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                {request.experience_min_years && (
                  <div>
                    <p className="text-sm text-muted-foreground">Min. erfaring</p>
                    <p className="font-medium">{request.experience_min_years} år</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Budget */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Budsjett</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {request.budget_max_daily_nok && (
                  <div>
                    <p className="text-sm text-muted-foreground">Maks dagrate</p>
                    <p className="font-medium">
                      {new Intl.NumberFormat('nb-NO', {
                        style: 'currency',
                        currency: 'NOK',
                      }).format(request.budget_max_daily_nok)}
                    </p>
                  </div>
                )}

                {request.estimated_value_nok && (
                  <div>
                    <p className="text-sm text-muted-foreground">Estimert verdi</p>
                    <p className="font-medium text-lg text-green-600">
                      {new Intl.NumberFormat('nb-NO', {
                        style: 'currency',
                        currency: 'NOK',
                      }).format(request.estimated_value_nok)}
                    </p>
                  </div>
                )}

                {request.duration_weeks && (
                  <div>
                    <p className="text-sm text-muted-foreground">Varighet</p>
                    <p className="font-medium">{request.duration_weeks} uker</p>
                  </div>
                )}

                {request.rotation_pattern && (
                  <div>
                    <p className="text-sm text-muted-foreground">Turnus</p>
                    <p className="font-medium">{request.rotation_pattern}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            {request.description && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Beskrivelse</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{request.description}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett request?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette denne requesten? Dette kan ikke
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

function RequestDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32 mt-2" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-[400px]" />
    </div>
  )
}
