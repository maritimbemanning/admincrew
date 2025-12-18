'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Nonconformity,
  NC_STATUS_LABELS,
  NC_STATUS_COLORS,
  NC_SEVERITY_LABELS,
  NC_SEVERITY_COLORS,
  NC_SOURCE_LABELS,
} from '@/types/qms'
import {
  MoreHorizontal,
  AlertTriangle,
  Calendar,
  User,
  Edit,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { nb } from 'date-fns/locale'
import Link from 'next/link'

interface NcCardProps {
  nc: Nonconformity
  onStatusChange?: (id: string, status: string) => void
}

export function NcCard({ nc, onStatusChange }: NcCardProps) {
  const statusColor = NC_STATUS_COLORS[nc.status]
  const severityColor = NC_SEVERITY_COLORS[nc.severity]

  const isOverdue =
    nc.due_date &&
    new Date(nc.due_date) < new Date() &&
    !['closed', 'verified'].includes(nc.status)

  const daysUntilDue = nc.due_date
    ? differenceInDays(new Date(nc.due_date), new Date())
    : null

  const capaCount = nc.capa_actions?.length || 0
  const capaCompleted =
    nc.capa_actions?.filter((c) => ['completed', 'verified'].includes(c.status))
      .length || 0
  const capaProgress = capaCount > 0 ? (capaCompleted / capaCount) * 100 : 0

  const statusFlow = [
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

  return (
    <Card className={isOverdue ? 'border-red-300' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                nc.severity === 'critical'
                  ? 'bg-red-100'
                  : nc.severity === 'major'
                    ? 'bg-orange-100'
                    : 'bg-yellow-100'
              }`}
            >
              <AlertTriangle
                className={`h-5 w-5 ${
                  nc.severity === 'critical'
                    ? 'text-red-600'
                    : nc.severity === 'major'
                      ? 'text-orange-600'
                      : 'text-yellow-600'
                }`}
              />
            </div>
            <div>
              <Link href={`/qms/nonconformities/${nc.id}`}>
                <CardTitle className="text-base hover:text-primary transition-colors cursor-pointer">
                  {nc.title}
                </CardTitle>
              </Link>
              <p className="text-sm text-muted-foreground">{nc.nc_number}</p>
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
                <Link href={`/qms/nonconformities/${nc.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  Vis detaljer
                </Link>
              </DropdownMenuItem>
              {nc.status !== 'closed' && (
                <DropdownMenuItem asChild>
                  <Link href={`/qms/nonconformities/${nc.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Rediger
                  </Link>
                </DropdownMenuItem>
              )}
              {nextStatus && onStatusChange && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onStatusChange(nc.id, nextStatus)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Flytt til {NC_STATUS_LABELS[nextStatus as keyof typeof NC_STATUS_LABELS]}
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
            {NC_STATUS_LABELS[nc.status]}
          </Badge>
          <Badge variant="outline" className={severityColor}>
            {NC_SEVERITY_LABELS[nc.severity]}
          </Badge>
          <Badge variant="secondary">{NC_SOURCE_LABELS[nc.source]}</Badge>
          {isOverdue && <Badge variant="destructive">Forfalt</Badge>}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {nc.description}
        </p>

        {capaCount > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">CAPA-tiltak</span>
              <span className="font-medium">
                {capaCompleted}/{capaCount}
              </span>
            </div>
            <Progress value={capaProgress} className="h-2" />
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-4">
            {nc.responsible && (
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {nc.responsible.full_name}
              </span>
            )}
            {nc.due_date && (
              <span
                className={`flex items-center gap-1 ${
                  isOverdue
                    ? 'text-red-600'
                    : daysUntilDue !== null && daysUntilDue <= 7
                      ? 'text-orange-600'
                      : ''
                }`}
              >
                {isOverdue ? (
                  <AlertCircle className="h-3.5 w-3.5" />
                ) : (
                  <Clock className="h-3.5 w-3.5" />
                )}
                {isOverdue
                  ? `Forfalt ${Math.abs(daysUntilDue || 0)} dager`
                  : daysUntilDue === 0
                    ? 'Forfaller i dag'
                    : `${daysUntilDue} dager igjen`}
              </span>
            )}
          </div>
          <span className="text-xs">
            Opprettet{' '}
            {format(new Date(nc.created_at), 'dd.MM.yyyy', { locale: nb })}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
