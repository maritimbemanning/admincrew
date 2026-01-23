'use client'

import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ContractParty,
  PARTY_TYPE_LABELS,
  PARTY_STATUS_LABELS,
  EsignStatus,
  ESIGN_STATUS_LABELS,
} from '@/types/contracts'
import {
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Send,
  AlertCircle,
  User,
  Building2,
  Users,
} from 'lucide-react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface SignatureStatusProps {
  parties: ContractParty[]
  esignStatus: EsignStatus
}

export function SignatureStatus({ parties, esignStatus }: SignatureStatusProps) {
  const signedCount = parties.filter((p) => p.status === 'signed').length
  const totalCount = parties.length
  const progressPercent = totalCount > 0 ? (signedCount / totalCount) * 100 : 0

  const sortedParties = [...parties].sort((a, b) => a.signing_order - b.signing_order)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Signeringsstatus</span>
          <Badge variant="outline">
            {ESIGN_STATUS_LABELS[esignStatus]}
          </Badge>
        </div>
        <span className="text-sm text-muted-foreground">
          {signedCount}/{totalCount} signert
        </span>
      </div>

      <Progress value={progressPercent} className="h-2" />

      <div className="space-y-2">
        {sortedParties.map((party, index) => (
          <SignaturePartyRow
            key={party.id}
            party={party}
            order={index + 1}
            isActive={
              party.status === 'pending' &&
              sortedParties
                .filter((p) => p.signing_order < party.signing_order)
                .every((p) => p.status === 'signed')
            }
          />
        ))}
      </div>
    </div>
  )
}

interface SignaturePartyRowProps {
  party: ContractParty
  order: number
  isActive: boolean
}

function SignaturePartyRow({ party, order, isActive }: SignaturePartyRowProps) {
  const getStatusIcon = () => {
    switch (party.status) {
      case 'signed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'viewed':
        return <Eye className="h-5 w-5 text-blue-500" />
      case 'notified':
        return <Send className="h-5 w-5 text-purple-500" />
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const getPartyIcon = () => {
    switch (party.party_type) {
      case 'employee':
        return <User className="h-4 w-4" />
      case 'employer':
        return <Building2 className="h-4 w-4" />
      case 'customer':
        return <Building2 className="h-4 w-4" />
      case 'witness':
        return <Users className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border',
        isActive && 'border-primary bg-primary/5',
        party.status === 'signed' && 'bg-green-50 border-green-200',
        party.status === 'rejected' && 'bg-red-50 border-red-200'
      )}
    >
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
        {order}
      </div>

      {getStatusIcon()}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {getPartyIcon()}
          <span className="font-medium truncate">{party.name}</span>
          <Badge variant="secondary" className="text-xs">
            {PARTY_TYPE_LABELS[party.party_type]}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{party.email}</span>
          {party.organization_name && (
            <>
              <span>•</span>
              <span>{party.organization_name}</span>
            </>
          )}
        </div>
      </div>

      <div className="text-right text-sm">
        <div className="font-medium">{PARTY_STATUS_LABELS[party.status]}</div>
        {party.signed_at && (
          <div className="text-muted-foreground text-xs">
            {format(new Date(party.signed_at), 'dd.MM.yyyy HH:mm', { locale: nb })}
          </div>
        )}
        {party.viewed_at && !party.signed_at && (
          <div className="text-muted-foreground text-xs">
            Sett {format(new Date(party.viewed_at), 'dd.MM.yyyy HH:mm', { locale: nb })}
          </div>
        )}
      </div>
    </div>
  )
}

// Compact signature status for cards
interface SignatureStatusBadgeProps {
  parties: ContractParty[]
}

export function SignatureStatusBadge({ parties }: SignatureStatusBadgeProps) {
  const signedCount = parties.filter((p) => p.status === 'signed').length
  const rejectedCount = parties.filter((p) => p.status === 'rejected').length
  const totalCount = parties.length

  if (rejectedCount > 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center gap-1 text-red-600">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">Avvist</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {parties
              .filter((p) => p.status === 'rejected')
              .map((p) => (
                <div key={p.id}>
                  {p.name}: {p.rejected_reason || 'Ingen grunn oppgitt'}
                </div>
              ))}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (signedCount === totalCount && totalCount > 0) {
    return (
      <div className="flex items-center gap-1 text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-sm">Fullstendig signert</span>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex items-center gap-1 text-muted-foreground">
            {parties.map((party) => (
              <div key={party.id}>
                {party.status === 'signed' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Clock className="h-4 w-4 text-yellow-500" />
                )}
              </div>
            ))}
            <span className="text-xs ml-1">
              {signedCount}/{totalCount}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            {parties.map((party) => (
              <div key={party.id} className="flex items-center gap-2">
                {party.status === 'signed' ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <Clock className="h-3 w-3 text-yellow-500" />
                )}
                <span>
                  {party.name} ({PARTY_TYPE_LABELS[party.party_type]})
                </span>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
