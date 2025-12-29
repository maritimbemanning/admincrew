// components/portal/interest-lead-list.tsx
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
  UserPlus,
  Eye,
  Phone,
  Mail,
  Loader2,
  Ship,
} from 'lucide-react'
import {
  useInterestLeads,
  useUpdateInterestStatus,
  useConvertInterestToCandidate,
  type InboxInterest
} from '@/hooks'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Status labels and colors
const STATUS_LABELS: Record<string, string> = {
  new: 'Ny',
  contacted: 'Kontaktet',
  converted: 'Konvertert',
  archived: 'Arkivert',
  interesse: 'Interesse',
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  converted: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-800',
  interesse: 'bg-blue-100 text-blue-800',
}

interface InterestLeadListProps {
  onViewDetails?: (id: string) => void
}

export function InterestLeadList({ onViewDetails }: InterestLeadListProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data: leads, isLoading } = useInterestLeads()
  const updateStatus = useUpdateInterestStatus()
  const convertToCandidate = useConvertInterestToCandidate()

  // Client-side filtering
  const filteredLeads = useMemo(() => {
    if (!leads) return []

    return leads.filter((lead) => {
      // Status filter
      if (statusFilter !== 'all' && lead.pipeline_status !== statusFilter) {
        return false
      }

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        return (
          lead.name.toLowerCase().includes(searchLower) ||
          lead.email.toLowerCase().includes(searchLower) ||
          (lead.phone && lead.phone.toLowerCase().includes(searchLower)) ||
          (lead.role && lead.role.toLowerCase().includes(searchLower))
        )
      }

      return true
    })
  }, [leads, statusFilter, search])

  const handleConvert = async (lead: InboxInterest) => {
    try {
      const result = await convertToCandidate.mutateAsync(lead.id)
      if (result.isNew) {
        toast.success('Kandidat opprettet', {
          description: `${lead.name} er lagt til som kandidat`,
        })
      } else {
        toast.info('Kandidat finnes allerede', {
          description: 'Lead er markert som konvertert',
        })
      }
    } catch {
      toast.error('Kunne ikke konvertere', {
        description: 'Prøv igjen senere',
      })
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, pipeline_status: status })
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
          <CardTitle className="text-lg">Interesse-leads</CardTitle>
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
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statuser</SelectItem>
                <SelectItem value="new">Nye</SelectItem>
                <SelectItem value="contacted">Kontaktet</SelectItem>
                <SelectItem value="converted">Konvertert</SelectItem>
                <SelectItem value="archived">Arkivert</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredLeads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Ingen interesse-leads funnet
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium truncate">{lead.name}</h4>
                    <Badge
                      variant="secondary"
                      className={cn(STATUS_COLORS[lead.pipeline_status] || STATUS_COLORS.new)}
                    >
                      {STATUS_LABELS[lead.pipeline_status] || lead.pipeline_status}
                    </Badge>
                    {lead.role && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Ship className="h-3 w-3" />
                        {lead.role}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {lead.email}
                    </span>
                    {lead.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {lead.phone}
                      </span>
                    )}
                    {lead.experience && (
                      <span>{lead.experience} års erfaring</span>
                    )}
                  </div>
                  {lead.notes && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {lead.notes}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(lead.created_at), {
                      addSuffix: true,
                      locale: nb
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {lead.pipeline_status !== 'converted' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleConvert(lead)}
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
                      <DropdownMenuItem onClick={() => onViewDetails?.(lead.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Se detaljer
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'contacted')}>
                        <Phone className="h-4 w-4 mr-2" />
                        Merk som kontaktet
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(lead.id, 'archived')}
                        className="text-muted-foreground"
                      >
                        Arkiver
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
