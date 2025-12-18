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
  Timesheet,
  TIMESHEET_STATUS_LABELS,
  TIMESHEET_STATUS_COLORS,
} from '@/types/contracts'
import {
  MoreHorizontal,
  Clock,
  Eye,
  Edit,
  Trash2,
  Send,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  Building2,
  Briefcase,
} from 'lucide-react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import Link from 'next/link'

interface TimesheetCardProps {
  timesheet: Timesheet
  onView?: (timesheet: Timesheet) => void
  onEdit?: (timesheet: Timesheet) => void
  onDelete?: (timesheet: Timesheet) => void
  onSubmit?: (timesheet: Timesheet) => void
  onApprove?: (timesheet: Timesheet) => void
  onReject?: (timesheet: Timesheet) => void
}

export function TimesheetCard({
  timesheet,
  onView,
  onEdit,
  onDelete,
  onSubmit,
  onApprove,
  onReject,
}: TimesheetCardProps) {
  const statusColor = TIMESHEET_STATUS_COLORS[timesheet.status]
  const statusLabel = TIMESHEET_STATUS_LABELS[timesheet.status]

  const canEdit = timesheet.status === 'draft'
  const canSubmit = timesheet.status === 'draft' && timesheet.total_hours > 0
  const canApprove = timesheet.status === 'submitted'

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {format(new Date(timesheet.period_start), 'dd.MM', { locale: nb })} -{' '}
                  {format(new Date(timesheet.period_end), 'dd.MM.yyyy', { locale: nb })}
                </span>
              </div>
              {timesheet.assignment && (
                <p className="text-sm text-muted-foreground">
                  {timesheet.assignment.assignment_number}
                </p>
              )}
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
                <DropdownMenuItem onClick={() => onView?.(timesheet)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Se detaljer
                </DropdownMenuItem>
                {canEdit && (
                  <DropdownMenuItem onClick={() => onEdit?.(timesheet)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Rediger
                  </DropdownMenuItem>
                )}
                {canSubmit && (
                  <DropdownMenuItem onClick={() => onSubmit?.(timesheet)}>
                    <Send className="h-4 w-4 mr-2" />
                    Send inn
                  </DropdownMenuItem>
                )}
                {canApprove && (
                  <>
                    <DropdownMenuItem onClick={() => onApprove?.(timesheet)}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Godkjenn
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onReject?.(timesheet)}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Avvis
                    </DropdownMenuItem>
                  </>
                )}
                {canEdit && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete?.(timesheet)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Slett
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Assignment info */}
        {timesheet.assignment && (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              <span>{timesheet.assignment.title}</span>
            </div>
            {timesheet.assignment.candidate && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>
                  {timesheet.assignment.candidate.first_name}{' '}
                  {timesheet.assignment.candidate.last_name}
                </span>
              </div>
            )}
            {timesheet.assignment.organization && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{timesheet.assignment.organization.name}</span>
              </div>
            )}
          </div>
        )}

        {/* Hours summary */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Timer</p>
            <p className="text-xl font-bold">{timesheet.total_hours.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Dager</p>
            <p className="text-xl font-bold">{timesheet.total_days.toFixed(1)}</p>
          </div>
        </div>

        {/* Costs (if approved) */}
        {timesheet.status === 'approved' && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            {timesheet.calculated_cost_nok !== null && (
              <div>
                <p className="text-sm text-muted-foreground">Kostnad</p>
                <p className="font-medium">
                  {timesheet.calculated_cost_nok.toLocaleString('nb-NO')} kr
                </p>
              </div>
            )}
            {timesheet.calculated_billing_nok !== null && (
              <div>
                <p className="text-sm text-muted-foreground">Fakturering</p>
                <p className="font-medium">
                  {timesheet.calculated_billing_nok.toLocaleString('nb-NO')} kr
                </p>
              </div>
            )}
          </div>
        )}

        {/* Rejection info */}
        {timesheet.status === 'rejected' && timesheet.rejection_reason && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">Avvisningsgrunn</p>
            <p className="text-sm text-destructive">{timesheet.rejection_reason}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
