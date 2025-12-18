'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Contract,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  CONTRACT_TYPE_LABELS,
  ESIGN_STATUS_LABELS,
} from '@/types/contracts'
import {
  MoreHorizontal,
  FileText,
  Send,
  Eye,
  Edit,
  Trash2,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  User,
  Calendar,
  PenLine,
} from 'lucide-react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import Link from 'next/link'

interface ContractCardProps {
  contract: Contract
  onEdit?: (contract: Contract) => void
  onDelete?: (contract: Contract) => void
  onSend?: (contract: Contract) => void
  onView?: (contract: Contract) => void
}

export function ContractCard({
  contract,
  onEdit,
  onDelete,
  onSend,
  onView,
}: ContractCardProps) {
  const statusColor = CONTRACT_STATUS_COLORS[contract.status]
  const statusLabel = CONTRACT_STATUS_LABELS[contract.status]
  const typeLabel = CONTRACT_TYPE_LABELS[contract.type]

  const canSend = contract.status === 'ready_for_signature'
  const canEdit = ['draft', 'pending_review'].includes(contract.status)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <Link
                href={`/contracts/${contract.id}`}
                className="font-semibold hover:underline"
              >
                {contract.contract_number}
              </Link>
              <p className="text-sm text-muted-foreground">{contract.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className={statusColor}>
              {statusLabel}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView?.(contract)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Se detaljer
                </DropdownMenuItem>
                {canEdit && (
                  <DropdownMenuItem onClick={() => onEdit?.(contract)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Rediger
                  </DropdownMenuItem>
                )}
                {canSend && (
                  <DropdownMenuItem onClick={() => onSend?.(contract)}>
                    <Send className="h-4 w-4 mr-2" />
                    Send til signering
                  </DropdownMenuItem>
                )}
                {contract.signed_pdf_path && (
                  <DropdownMenuItem>
                    <Download className="h-4 w-4 mr-2" />
                    Last ned signert PDF
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {canEdit && (
                  <DropdownMenuItem
                    onClick={() => onDelete?.(contract)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Slett
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm">
          <Badge variant="secondary">{typeLabel}</Badge>
          {contract.esign_status !== 'not_started' && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <PenLine className="h-3.5 w-3.5" />
              <span>{ESIGN_STATUS_LABELS[contract.esign_status]}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {contract.organization && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{contract.organization.name}</span>
            </div>
          )}
          {contract.candidate && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>
                {contract.candidate.first_name} {contract.candidate.last_name}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {contract.effective_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                Fra {format(new Date(contract.effective_date), 'dd.MM.yyyy', { locale: nb })}
              </span>
            </div>
          )}
          {contract.expiry_date && (
            <div className="flex items-center gap-1">
              <span>
                til {format(new Date(contract.expiry_date), 'dd.MM.yyyy', { locale: nb })}
              </span>
            </div>
          )}
        </div>

        {/* Signature progress */}
        {contract.parties && contract.parties.length > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Signeringer:</span>
              <div className="flex items-center gap-1">
                {contract.parties.map((party) => (
                  <div
                    key={party.id}
                    className="flex items-center gap-1"
                    title={`${party.name}: ${party.status === 'signed' ? 'Signert' : 'Venter'}`}
                  >
                    {party.status === 'signed' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : party.status === 'rejected' ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                ({contract.parties.filter((p) => p.status === 'signed').length}/
                {contract.parties.length})
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Mini card for lists
interface ContractCardMiniProps {
  contract: Contract
  onClick?: () => void
}

export function ContractCardMini({ contract, onClick }: ContractCardMiniProps) {
  const statusColor = CONTRACT_STATUS_COLORS[contract.status]
  const statusLabel = CONTRACT_STATUS_LABELS[contract.status]

  return (
    <div
      onClick={onClick}
      className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{contract.contract_number}</span>
        </div>
        <Badge variant="outline" className={`${statusColor} text-xs`}>
          {statusLabel}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground mt-1 truncate">{contract.title}</p>
    </div>
  )
}
