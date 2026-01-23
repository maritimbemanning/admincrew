'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  QmsDocument,
  QMS_DOCUMENT_STATUS_LABELS,
  QMS_DOCUMENT_STATUS_COLORS,
  QMS_DOCUMENT_TYPE_LABELS,
} from '@/types/qms'
import {
  MoreHorizontal,
  FileText,
  Calendar,
  User,
  Edit,
  Archive,
  CheckCircle2,
  Send,
  Eye,
  Download,
} from 'lucide-react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import Link from 'next/link'

interface DocumentCardProps {
  document: QmsDocument
  onApprove?: (id: string) => void
  onSubmit?: (id: string) => void
  onArchive?: (id: string) => void
}

export function DocumentCard({
  document,
  onApprove,
  onSubmit,
  onArchive,
}: DocumentCardProps) {
  const statusColor = QMS_DOCUMENT_STATUS_COLORS[document.status]
  const canSubmit = document.status === 'draft'
  const canApprove = document.status === 'pending_approval'
  const isReviewDue =
    document.next_review_date &&
    new Date(document.next_review_date) <= new Date() &&
    document.status === 'approved'

  return (
    <Card className={isReviewDue ? 'border-orange-300' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <Link href={`/qms/documents/${document.id}`}>
                <CardTitle className="text-base hover:text-primary transition-colors cursor-pointer">
                  {document.title}
                </CardTitle>
              </Link>
              <p className="text-sm text-muted-foreground">
                {document.document_number} • v{document.current_version}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/qms/documents/${document.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  Vis
                </Link>
              </DropdownMenuItem>
              {document.status !== 'obsolete' && (
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
                  Last ned
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {canSubmit && onSubmit && (
                <DropdownMenuItem onClick={() => onSubmit(document.id)}>
                  <Send className="h-4 w-4 mr-2" />
                  Send til godkjenning
                </DropdownMenuItem>
              )}
              {canApprove && onApprove && (
                <DropdownMenuItem onClick={() => onApprove(document.id)}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Godkjenn
                </DropdownMenuItem>
              )}
              {document.status !== 'obsolete' && onArchive && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onArchive(document.id)}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Arkiver
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={statusColor}>
            {QMS_DOCUMENT_STATUS_LABELS[document.status]}
          </Badge>
          <Badge variant="secondary">
            {QMS_DOCUMENT_TYPE_LABELS[document.type]}
          </Badge>
          {document.category && (
            <Badge variant="outline">{document.category}</Badge>
          )}
          {isReviewDue && (
            <Badge variant="destructive">Gjennomgang forfalt</Badge>
          )}
        </div>

        {document.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {document.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-4">
            {document.owner && (
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {document.owner.full_name}
              </span>
            )}
            {document.next_review_date && (
              <span
                className={`flex items-center gap-1 ${isReviewDue ? 'text-orange-600' : ''}`}
              >
                <Calendar className="h-3.5 w-3.5" />
                Neste gjennomgang:{' '}
                {format(new Date(document.next_review_date), 'dd.MM.yyyy', {
                  locale: nb,
                })}
              </span>
            )}
          </div>
          <span className="text-xs">
            Oppdatert{' '}
            {format(new Date(document.updated_at), 'dd.MM.yyyy', { locale: nb })}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
