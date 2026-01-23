'use client'

import { useParams, useRouter } from 'next/navigation'
import { useContract, useUpdateContractStatus } from '@/hooks/use-contracts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { SignatureStatus, SignatureStatusBadge } from '@/components/contracts'
import { PartyFormDialog } from '@/components/contracts'
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  CONTRACT_TYPE_LABELS,
  ContractStatus,
} from '@/types/contracts'
import {
  ArrowLeft,
  MoreHorizontal,
  Edit,
  Send,
  Download,
  FileText,
  Building2,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Briefcase,
} from 'lucide-react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

export default function ContractDetailPage() {
  const params = useParams()
  const router = useRouter()
  const contractId = params.id as string

  const { data: contract, isLoading, error } = useContract(contractId)
  const updateStatus = useUpdateContractStatus()

  const [showPartyForm, setShowPartyForm] = useState(false)
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  if (isLoading) {
    return (
      <div className="container py-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-[200px]" />
            <Skeleton className="h-[400px]" />
          </div>
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    )
  }

  if (error || !contract) {
    return (
      <div className="container py-6">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive">Kunne ikke laste kontrakt</p>
          <Button variant="outline" onClick={() => router.back()} className="mt-4">
            Gå tilbake
          </Button>
        </div>
      </div>
    )
  }

  const statusColor = CONTRACT_STATUS_COLORS[contract.status]
  const canEdit = ['draft', 'pending_review'].includes(contract.status)
  const canSend = contract.status === 'ready_for_signature'
  const canCancel = !['signed', 'cancelled'].includes(contract.status)

  const handleStatusChange = async (newStatus: ContractStatus, reason?: string) => {
    try {
      await updateStatus.mutateAsync({
        id: contract.id,
        status: newStatus,
        reason,
      })
      toast.success('Status oppdatert')
    } catch {
      toast.error('Kunne ikke oppdatere status')
    }
  }

  const handleSend = async () => {
    await handleStatusChange('sent')
    setShowSendDialog(false)
  }

  const handleCancel = async () => {
    await handleStatusChange('cancelled', 'Kansellert av bruker')
    setShowCancelDialog(false)
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <Link href="/contracts">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake til kontrakter
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{contract.contract_number}</h1>
              <Badge variant="outline" className={statusColor}>
                {CONTRACT_STATUS_LABELS[contract.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">{contract.title}</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreHorizontal className="h-4 w-4 mr-2" />
                Handlinger
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <DropdownMenuItem onClick={() => router.push(`/contracts/${contract.id}/edit`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Rediger
                </DropdownMenuItem>
              )}
              {contract.status === 'draft' && (
                <DropdownMenuItem onClick={() => handleStatusChange('pending_review')}>
                  <Clock className="h-4 w-4 mr-2" />
                  Send til gjennomgang
                </DropdownMenuItem>
              )}
              {contract.status === 'pending_review' && (
                <DropdownMenuItem onClick={() => handleStatusChange('ready_for_signature')}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Godkjenn for signering
                </DropdownMenuItem>
              )}
              {canSend && (
                <DropdownMenuItem onClick={() => setShowSendDialog(true)}>
                  <Send className="h-4 w-4 mr-2" />
                  Send til signering
                </DropdownMenuItem>
              )}
              {contract.draft_pdf_path && (
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Last ned utkast (PDF)
                </DropdownMenuItem>
              )}
              {contract.signed_pdf_path && (
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Last ned signert (PDF)
                </DropdownMenuItem>
              )}
              {canCancel && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowCancelDialog(true)}
                    className="text-destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Kanseller kontrakt
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Contract info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Kontraktinformasjon
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{CONTRACT_TYPE_LABELS[contract.type]}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kontraktnummer</p>
                  <p className="font-medium">{contract.contract_number}</p>
                </div>
              </div>

              {contract.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Beskrivelse</p>
                  <p>{contract.description}</p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                {contract.organization && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Organisasjon</p>
                      <p className="font-medium">{contract.organization.name}</p>
                    </div>
                  </div>
                )}
                {contract.candidate && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Kandidat</p>
                      <p className="font-medium">
                        {contract.candidate.first_name} {contract.candidate.last_name}
                      </p>
                    </div>
                  </div>
                )}
                {contract.assignment && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Oppdrag</p>
                      <p className="font-medium">{contract.assignment.assignment_number}</p>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                {contract.effective_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Gyldig fra</p>
                      <p className="font-medium">
                        {format(new Date(contract.effective_date), 'dd. MMMM yyyy', { locale: nb })}
                      </p>
                    </div>
                  </div>
                )}
                {contract.expiry_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Gyldig til</p>
                      <p className="font-medium">
                        {format(new Date(contract.expiry_date), 'dd. MMMM yyyy', { locale: nb })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="content">
            <TabsList>
              <TabsTrigger value="content">Innhold</TabsTrigger>
              <TabsTrigger value="parties">
                Parter ({contract.parties?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="history">Historikk</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {contract.content_html ? (
                    <div
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: contract.content_html }}
                    />
                  ) : (
                    <p className="text-muted-foreground italic">Ingen innhold lagt til ennå</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="parties" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Kontraktsparter</CardTitle>
                  {canEdit && (
                    <Button size="sm" onClick={() => setShowPartyForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Legg til part
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {contract.parties && contract.parties.length > 0 ? (
                    <SignatureStatus
                      parties={contract.parties}
                      esignStatus={contract.esign_status}
                    />
                  ) : (
                    <p className="text-muted-foreground italic">Ingen parter lagt til ennå</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {contract.signed_at && (
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">Signert</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(contract.signed_at), 'dd. MMMM yyyy HH:mm', {
                              locale: nb,
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                    {contract.sent_at && (
                      <div className="flex items-center gap-3">
                        <Send className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">Sendt til signering</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(contract.sent_at), 'dd. MMMM yyyy HH:mm', {
                              locale: nb,
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                    {contract.cancelled_at && (
                      <div className="flex items-center gap-3">
                        <XCircle className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="font-medium">Kansellert</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(contract.cancelled_at), 'dd. MMMM yyyy HH:mm', {
                              locale: nb,
                            })}
                          </p>
                          {contract.cancelled_reason && (
                            <p className="text-sm text-muted-foreground">
                              Grunn: {contract.cancelled_reason}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Opprettet</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(contract.created_at), 'dd. MMMM yyyy HH:mm', {
                            locale: nb,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Kontraktstatus</span>
                <Badge variant="outline" className={statusColor}>
                  {CONTRACT_STATUS_LABELS[contract.status]}
                </Badge>
              </div>

              {contract.parties && contract.parties.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Signeringer</span>
                  <SignatureStatusBadge parties={contract.parties} />
                </div>
              )}

              {contract.status === 'draft' && (
                <Button
                  className="w-full"
                  onClick={() => handleStatusChange('pending_review')}
                  disabled={updateStatus.isPending}
                >
                  Send til gjennomgang
                </Button>
              )}

              {contract.status === 'pending_review' && (
                <Button
                  className="w-full"
                  onClick={() => handleStatusChange('ready_for_signature')}
                  disabled={updateStatus.isPending}
                >
                  Godkjenn for signering
                </Button>
              )}

              {canSend && (
                <Button className="w-full" onClick={() => setShowSendDialog(true)}>
                  <Send className="h-4 w-4 mr-2" />
                  Send til signering
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tidslinje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Opprettet</span>
                  <span>
                    {format(new Date(contract.created_at), 'dd.MM.yyyy', { locale: nb })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sist oppdatert</span>
                  <span>
                    {format(new Date(contract.updated_at), 'dd.MM.yyyy', { locale: nb })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Party form dialog */}
      <PartyFormDialog
        open={showPartyForm}
        onOpenChange={setShowPartyForm}
        contractId={contract.id}
        existingPartiesCount={contract.parties?.length || 0}
      />

      {/* Send confirmation */}
      <AlertDialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send til signering?</AlertDialogTitle>
            <AlertDialogDescription>
              Kontrakten vil bli sendt til alle parter for signering. Sørg for at alt innhold er
              korrekt før du fortsetter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleSend}>Send til signering</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel confirmation */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kanseller kontrakt?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil kansellere denne kontrakten? Denne handlingen kan ikke
              angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Kanseller
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
