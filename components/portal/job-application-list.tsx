// components/portal/job-application-list.tsx
'use client'

import { useState, useMemo } from 'react'
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
  Eye,
  Phone,
  Mail,
  FileText,
  Loader2,
  CheckCircle
} from 'lucide-react'
import {
  useJobApplications,
  useMarkCandidateReviewed,
  useUpdateCandidateStatus,
  type InboxCandidate
} from '@/hooks'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Status labels and colors for candidates
const STATUS_LABELS: Record<string, string> = {
  pending: 'Ny',
  godkjent: 'Godkjent',
  ansatt: 'Ansatt',
  avslått: 'Avslått',
  ny: 'Ny',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-blue-100 text-blue-800',
  godkjent: 'bg-green-100 text-green-800',
  ansatt: 'bg-purple-100 text-purple-800',
  avslått: 'bg-red-100 text-red-800',
  ny: 'bg-blue-100 text-blue-800',
}

const PIPELINE_LABELS: Record<string, string> = {
  ny: 'Ny',
  vurdert: 'Vurdert',
  shortlist: 'Shortlist',
  tilbud: 'Tilbud sendt',
  ansatt: 'Ansatt',
  avvist: 'Avvist',
}

interface JobApplicationListProps {
  onViewDetails?: (id: string) => void
}

export function JobApplicationList({ onViewDetails }: JobApplicationListProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data: applications, isLoading } = useJobApplications()
  const markReviewed = useMarkCandidateReviewed()
  const updateStatus = useUpdateCandidateStatus()

  // Client-side filtering
  const filteredApplications = useMemo(() => {
    if (!applications) return []

    return applications.filter((app) => {
      // Status filter
      if (statusFilter !== 'all' && app.status !== statusFilter && app.pipeline_stage !== statusFilter) {
        return false
      }

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        return (
          app.name.toLowerCase().includes(searchLower) ||
          app.email.toLowerCase().includes(searchLower) ||
          (app.phone && app.phone.toLowerCase().includes(searchLower)) ||
          (app.rolle && app.rolle.toLowerCase().includes(searchLower))
        )
      }

      return true
    })
  }, [applications, statusFilter, search])

  const handleMarkReviewed = async (app: InboxCandidate) => {
    try {
      await markReviewed.mutateAsync(app.id)
      toast.success('Markert som vurdert', {
        description: `${app.name} er markert som vurdert`,
      })
    } catch {
      toast.error('Kunne ikke oppdatere', {
        description: 'Prøv igjen senere',
      })
    }
  }

  const handleStatusChange = async (id: string, status: string, pipeline_stage?: string) => {
    try {
      await updateStatus.mutateAsync({ id, status, pipeline_stage })
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
          <CardTitle className="text-lg">Nye kandidater</CardTitle>
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
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statuser</SelectItem>
                <SelectItem value="pending">Nye</SelectItem>
                <SelectItem value="godkjent">Godkjent</SelectItem>
                <SelectItem value="ansatt">Ansatt</SelectItem>
                <SelectItem value="avslått">Avslått</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredApplications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Ingen nye kandidater funnet
          </div>
        ) : (
          <div className="space-y-3">
            {filteredApplications.map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium truncate">{app.name}</h4>
                    <Badge
                      variant="secondary"
                      className={cn(STATUS_COLORS[app.status] || STATUS_COLORS.pending)}
                    >
                      {STATUS_LABELS[app.status] || app.status}
                    </Badge>
                    {app.pipeline_stage && app.pipeline_stage !== 'ny' && (
                      <Badge variant="outline">
                        {PIPELINE_LABELS[app.pipeline_stage] || app.pipeline_stage}
                      </Badge>
                    )}
                    {app.cv_key && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <FileText className="h-3 w-3 mr-1" />
                        CV
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
                    {app.rolle && (
                      <span>{app.rolle}</span>
                    )}
                    {app.erfaring && (
                      <span>{app.erfaring} års erfaring</span>
                    )}
                    {app.fylke && (
                      <span>{app.fylke}</span>
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
                  {app.pipeline_stage === 'ny' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkReviewed(app)}
                      disabled={markReviewed.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Vurdert
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
                        Se profil
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleStatusChange(app.id, 'godkjent', 'vurdert')}>
                        Godkjenn
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(app.id, app.status, 'shortlist')}>
                        Legg til shortlist
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(app.id, 'avslått', 'avvist')}
                        className="text-destructive"
                      >
                        Avvis
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
