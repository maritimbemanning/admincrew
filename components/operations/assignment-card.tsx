'use client'

import { 
  Building2, 
  Calendar, 
  Clock, 
  User,
  FileText,
  MoreHorizontal
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { StatusBadge } from '@/components/shared'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

export interface Assignment {
  id: string
  status: string
  start_date: string
  end_date?: string | null
  hourly_rate?: number
  hours_used?: number
  hours_total?: number
  candidate: {
    id: string
    first_name: string
    last_name: string
  }
  request: {
    id: string
    title: string
    organization?: {
      id: string
      name: string
    }
  }
}

interface AssignmentCardProps {
  assignment: Assignment
  onStatusChange?: (id: string, status: string) => void
  onViewDetails?: (assignment: Assignment) => void
}

export function AssignmentCard({ 
  assignment, 
  onStatusChange,
  onViewDetails 
}: AssignmentCardProps) {
  const candidateName = `${assignment.candidate.first_name} ${assignment.candidate.last_name}`
  const hoursProgress = assignment.hours_total 
    ? ((assignment.hours_used || 0) / assignment.hours_total) * 100 
    : 0

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <Link 
              href={`/operations/assignments/${assignment.id}`}
              className="font-semibold hover:underline"
            >
              {assignment.request.title}
            </Link>
            {assignment.request.organization && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Building2 className="h-4 w-4" />
                {assignment.request.organization.name}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/operations/assignments/${assignment.id}`}>
                  Vis detaljer
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/timesheets?assignment=${assignment.id}`}>
                  Se timelister
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/contracts?assignment=${assignment.id}`}>
                  Se kontrakt
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onStatusChange?.(assignment.id, 'completed')}
              >
                Marker som fullført
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <StatusBadge status={assignment.status} />
        </div>

        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <Link 
            href={`/candidates/${assignment.candidate.id}`}
            className="hover:underline"
          >
            {candidateName}
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Start</p>
              <p>{new Date(assignment.start_date).toLocaleDateString('nb-NO')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Slutt</p>
              <p>
                {assignment.end_date 
                  ? new Date(assignment.end_date).toLocaleDateString('nb-NO')
                  : 'Løpende'
                }
              </p>
            </div>
          </div>
        </div>

        {assignment.hours_total && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                Timer
              </span>
              <span>
                {assignment.hours_used || 0} / {assignment.hours_total}
              </span>
            </div>
            <Progress value={hoursProgress} />
          </div>
        )}

        {assignment.hourly_rate && (
          <div className="pt-2 border-t flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Timerate</span>
            <span className="font-medium">
              {assignment.hourly_rate.toLocaleString('nb-NO')} kr
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
