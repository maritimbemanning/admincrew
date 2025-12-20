// components/portal/job-application-list.tsx
'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { nb } from 'date-fns/locale'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Search, 
  MoreHorizontal, 
  UserPlus, 
  Eye, 
  Phone,
  Mail,
  FileText,
  Loader2,
  CheckCircle
} from 'lucide-react'
import { 
  useJobApplications, 
  useUpdateJobApplicationStatus,
  useConvertApplicationToCandidate
} from '@/hooks'
import { 
  JOB_APPLICATION_STATUS_LABELS, 
  JOB_APPLICATION_STATUS_COLORS,
  type JobApplicationStatus,
  type JobApplication
} from '@/types/portal'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface JobApplicationListProps {
  onViewDetails?: (id: string) => void
}

export function JobApplicationList({ onViewDetails }: JobApplicationListProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<JobApplicationStatus | 'all'>('all')

  const { data: applications, isLoading } = useJobApplications({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: search || undefined,
  })

  const updateStatus = useUpdateJobApplicationStatus()
  const convertToCandidate = useConvertApplicationToCandidate()

  const handleConvert = async (app: JobApplication) => {
    try {
      const result = await convertToCandidate.mutateAsync(app)
      if (result.created) {
        toast.success('Kandidat opprettet', {
          description: `${app.name} er lagt til som kandidat`,
        })
      } else {
        toast.info('Kandidat finnes allerede', {
          description: 'Søknaden er markert som konvertert',
        })
      }
    } catch {
      toast.error('Kunne ikke konvertere', {
        description: 'Prøv igjen senere',
      })
    }
  }

  const handleStatusChange = async (id: string, status: JobApplicationStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status })
      toast.success('Status oppdatert')
    } catch {
      toast.error('Kunne ikke oppdatere status')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Jobbsøknader</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-50"
              />
            </div>
            <Select 
              value={statusFilter} 
              onValueChange={(v) => setStatusFilter(v as JobApplicationStatus | 'all')}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statuser</SelectItem>
                <SelectItem value="pending">Nye</SelectItem>
                <SelectItem value="reviewed">Gjennomgått</SelectItem>
                <SelectItem value="shortlisted">Shortlist</SelectItem>
                <SelectItem value="hired">Ansatt</SelectItem>
                <SelectItem value="rejected">Avvist</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!applications || applications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Ingen jobbsøknader funnet
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium truncate">{app.name}</h4>
                    <Badge 
                      variant="secondary"
                      className={cn(JOB_APPLICATION_STATUS_COLORS[app.status])}
                    >
                      {JOB_APPLICATION_STATUS_LABELS[app.status]}
                    </Badge>
                    {app.vipps_verified && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verifisert
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {app.email}
                    </span>
                    {app.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {app.phone}
                      </span>
                    )}
                    {app.job_posting?.title && (
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {app.job_posting.title}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(app.created_at), { 
                      addSuffix: true, 
                      locale: nb 
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {app.status !== 'hired' && !app.candidate_id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleConvert(app)}
                      disabled={convertToCandidate.isPending}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Konverter
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewDetails?.(app.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Se detaljer
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleStatusChange(app.id, 'reviewed')}>
                        Merk som gjennomgått
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(app.id, 'shortlisted')}>
                        Legg til shortlist
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(app.id, 'hired')}>
                        Merk som ansatt
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleStatusChange(app.id, 'rejected')}
                        className="text-destructive"
                      >
                        Avvis søknad
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
