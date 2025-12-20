// components/portal/interest-lead-list.tsx
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
  Loader2,
  Ship,
  Building2
} from 'lucide-react'
import { 
  useInterestLeads, 
  useUpdateLeadStatus,
  useConvertLeadToCandidate
} from '@/hooks'
import { 
  LEAD_STATUS_LABELS, 
  LEAD_STATUS_COLORS,
  LEAD_TYPE_LABELS,
  type LeadStatus,
  type InterestLead
} from '@/types/portal'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface InterestLeadListProps {
  onViewDetails?: (id: string) => void
}

export function InterestLeadList({ onViewDetails }: InterestLeadListProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const { data: leads, isLoading } = useInterestLeads({
    status: statusFilter === 'all' ? undefined : statusFilter,
    type: typeFilter === 'all' ? undefined : typeFilter,
    search: search || undefined,
  })

  const updateStatus = useUpdateLeadStatus()
  const convertToCandidate = useConvertLeadToCandidate()

  const handleConvert = async (lead: InterestLead) => {
    try {
      const result = await convertToCandidate.mutateAsync(lead)
      if (result.created) {
        toast.success('Kandidat opprettet', {
          description: `${lead.navn} er lagt til som kandidat`,
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

  const handleStatusChange = async (id: string, status: LeadStatus) => {
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
              value={typeFilter} 
              onValueChange={setTypeFilter}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle typer</SelectItem>
                <SelectItem value="sjomann">Sjømann</SelectItem>
                <SelectItem value="rederi">Rederi</SelectItem>
              </SelectContent>
            </Select>
            <Select 
              value={statusFilter} 
              onValueChange={(v) => setStatusFilter(v as LeadStatus | 'all')}
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
        {!leads || leads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Ingen interesse-leads funnet
          </div>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium truncate">{lead.navn}</h4>
                    <Badge 
                      variant="secondary"
                      className={cn(LEAD_STATUS_COLORS[(lead.status || 'new') as LeadStatus])}
                    >
                      {LEAD_STATUS_LABELS[(lead.status || 'new') as LeadStatus]}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {lead.type === 'sjomann' ? (
                        <Ship className="h-3 w-3" />
                      ) : (
                        <Building2 className="h-3 w-3" />
                      )}
                      {LEAD_TYPE_LABELS[lead.type || 'sjomann']}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {lead.epost}
                    </span>
                    {lead.telefon && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {lead.telefon}
                      </span>
                    )}
                  </div>
                  {lead.melding && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {lead.melding}
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
                  {lead.status !== 'converted' && lead.type === 'sjofolk' && (
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
