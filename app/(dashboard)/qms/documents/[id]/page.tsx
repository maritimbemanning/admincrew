'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQmsDocument, useUpdateQmsDocumentStatus, useArchiveQmsDocument } from '@/hooks/use-qms-documents'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  QMS_DOCUMENT_STATUS_LABELS,
  QMS_DOCUMENT_STATUS_COLORS,
  QMS_DOCUMENT_TYPE_LABELS,
} from '@/types/qms'
import {
  ArrowLeft,
  MoreHorizontal,
  Edit,
  Send,
  CheckCircle2,
  Archive,
  Calendar,
  User,
  FileText,
  Download,
  Clock,
} from 'lucide-react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

export default function QmsDocumentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const documentId = params.id as string

  const { data: document, isLoading, error } = useQmsDocument(documentId)
  const updateStatus = useUpdateQmsDocumentStatus()
  const archiveDocument = useArchiveQmsDocument()

  const [showArchiveDialog, setShowArchiveDialog] = useState(false)

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

  if (error || !document) {
    return (
      <div className="container py-6">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive">Kunne ikke laste dokument</p>
          <Button variant="outline" onClick={() => router.back()} className="mt-4">
            Gå tilbake
          </Button>
        </div>
      </div>
    )
  }

  const statusColor = QMS_DOCUMENT_STATUS_COLORS[document.status]
  const canEdit = document.status !== 'obsolete'
  const canSubmit = document.status === 'draft'
  const canApprove = document.status === 'pending_approval'
  const isReviewDue =
    document.next_review_date &&
    new Date(document.next_review_date) <= new Date() &&
    document.status === 'approved'

  const handleSubmitForApproval = async () => {
    try {
      await updateStatus.mutateAsync({ id: document.id, status: 'pending_approval' })
      toast.success('Dokument sendt til godkjenning')
    } catch {
      toast.error('Kunne ikke sende dokument til godkjenning')
    }
  }

  const handleApprove = async () => {
    try {
      await updateStatus.mutateAsync({ id: document.id, status: 'approved' })
      toast.success('Dokument godkjent')
    } catch {
      toast.error('Kunne ikke godkjenne dokument')
    }
  }

  const handleArchive = async () => {
    try {
      await archiveDocument.mutateAsync(document.id)
      toast.success('Dokument arkivert')
      router.push('/qms/documents')
    } catch {
      toast.error('Kunne ikke arkivere dokument')
    }
  }

  return (
    <div className="container py-6 max-w-4xl">
      <div className="mb-6">
        <Link href="/qms/documents">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake til dokumenter
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{document.title}</h1>
              <Badge variant="outline" className={statusColor}>
                {QMS_DOCUMENT_STATUS_LABELS[document.status]}
              </Badge>
              {isReviewDue && (
                <Badge variant="destructive">Gjennomgang forfalt</Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              {document.document_number} • v{document.current_version} •{' '}
              {QMS_DOCUMENT_TYPE_LABELS[document.type]}
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
              {canEdit && (
                <DropdownMenuItem asChild>
                  <Link href={`/qms/documents/${document.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Rediger
                  </Link>
                </DropdownMenuItem>
              )}
              {document.file_path && (
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Last ned fil
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {canSubmit && (
                <DropdownMenuItem onClick={handleSubmitForApproval}>
                  <Send className="h-4 w-4 mr-2" />
                  Send til godkjenning
                </DropdownMenuItem>
              )}
              {canApprove && (
                <DropdownMenuItem onClick={handleApprove}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Godkjenn
                </DropdownMenuItem>
              )}
              {document.status !== 'obsolete' && (
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
        {/* Metadata card */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {document.owner && (
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Eier</p>
                    <p className="font-medium">{document.owner.full_name}</p>
                  </div>
                </div>
              )}
              {document.category && (
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Kategori</p>
                    <p className="font-medium">{document.category}</p>
                  </div>
                </div>
              )}
              {document.next_review_date && (
                <div className="flex items-center gap-3">
                  <Calendar
                    className={`h-5 w-5 ${isReviewDue ? 'text-orange-500' : 'text-muted-foreground'}`}
                  />
                  <div>
                    <p className="text-sm text-muted-foreground">Neste gjennomgang</p>
                    <p className={`font-medium ${isReviewDue ? 'text-orange-600' : ''}`}>
                      {format(new Date(document.next_review_date), 'dd.MM.yyyy', {
                        locale: nb,
                      })}
                    </p>
                  </div>
                </div>
              )}
              {document.approved_at && document.approver && (
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Godkjent</p>
                    <p className="font-medium">
                      {document.approver.full_name},{' '}
                      {format(new Date(document.approved_at), 'dd.MM.yyyy', {
                        locale: nb,
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        {document.description && (
          <Card>
            <CardHeader>
              <CardTitle>Beskrivelse</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{document.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        {document.content_html && (
          <Card>
            <CardHeader>
              <CardTitle>Innhold</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: document.content_html }}
              />
            </CardContent>
          </Card>
        )}

        {/* Timestamps */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Opprettet{' '}
                {format(new Date(document.created_at), 'dd.MM.yyyy HH:mm', {
                  locale: nb,
                })}
              </span>
              <span>
                Sist oppdatert{' '}
                {format(new Date(document.updated_at), 'dd.MM.yyyy HH:mm', {
                  locale: nb,
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          {canSubmit && (
            <Button onClick={handleSubmitForApproval}>
              <Send className="h-4 w-4 mr-2" />
              Send til godkjenning
            </Button>
          )}
          {canApprove && (
            <Button onClick={handleApprove}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Godkjenn dokument
            </Button>
          )}
        </div>
      </div>

      {/* Archive dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arkiver dokument?</AlertDialogTitle>
            <AlertDialogDescription>
              Dokumentet vil bli markert som utgått og fjernet fra aktive dokumenter.
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
