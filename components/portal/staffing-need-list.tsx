// components/portal/staffing-need-list.tsx
'use client'

import { useState, useMemo } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
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
  ArrowRight,
  Eye,
  Phone,
  Mail,
  Building2,
  Users,
  Calendar,
  Loader2
} from 'lucide-react'
import {
  useStaffingNeeds,
  useUpdateLeadStatus,
  useConvertToCustomerRequest,
  type InboxLead
} from '@/hooks'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

// Status labels and colors for leads
const STATUS_LABELS: Record<string, string> = {
  new: 'Ny',
  contacted: 'Kontaktet',
  negotiating: 'Forhandler',
  converted: 'Konvertert',
  closed: 'Lukket',
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  negotiating: 'bg-orange-100 text-orange-800',
  converted: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
}

interface StaffingNeedListProps {
  onViewDetails?: (id: string) => void
}

export function StaffingNeedList({ onViewDetails }: StaffingNeedListProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data: needs, isLoading } = useStaffingNeeds()
  const updateStatus = useUpdateLeadStatus()
  const convertToRequest = useConvertToCustomerRequest()

  // Client-side filtering
  const filteredNeeds = useMemo(() => {
    if (!needs) return []

    return needs.filter((need) => {
      // Status filter
      if (statusFilter !== 'all' && need.status !== statusFilter) {
        return false
      }

      // Search filter - use correct InboxLead field names
      if (search) {
        const searchLower = search.toLowerCase()
        return (
          (need.bedrift && need.bedrift.toLowerCase().includes(searchLower)) ||
          need.kontakt_navn.toLowerCase().includes(searchLower) ||
          need.kontakt_epost.toLowerCase().includes(searchLower) ||
          (need.stillinger && need.stillinger.toLowerCase().includes(searchLower))
        )
      }

      return true
    })
  }, [needs, statusFilter, search])

  const handleConvert = async (need: InboxLead) => {
    try {
      const result = await convertToRequest.mutateAsync(need.id)
      toast.success('Kundeforespørsel opprettet', {
        description: 'Bemanningsbehov er konvertert til request',
        action: {
          label: 'Vis request',
          onClick: () => router.push(`/operations/requests/${result.requestId}`),
        },
      })
    } catch {
      toast.error('Kunne ikke konvertere', {
        description: 'Prøv igjen senere',
      })
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
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
          <CardTitle className="text-lg">Bemanningsbehov</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søk firma/kontakt..."
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
                <SelectItem value="new">Nye</SelectItem>
                <SelectItem value="contacted">Kontaktet</SelectItem>
                <SelectItem value="negotiating">Forhandler</SelectItem>
                <SelectItem value="converted">Konvertert</SelectItem>
                <SelectItem value="closed">Lukket</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredNeeds.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Ingen bemanningsbehov funnet
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNeeds.map((need) => (
              <div
                key={need.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium truncate">
                      {need.bedrift || 'Ukjent firma'}
                    </h4>
                    <Badge
                      variant="secondary"
                      className={cn(STATUS_COLORS[need.status] || STATUS_COLORS.new)}
                    >
                      {STATUS_LABELS[need.status] || need.status}
                    </Badge>
                    {need.stillinger && (
                      <Badge variant="outline">
                        {need.stillinger}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {need.kontakt_navn}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {need.kontakt_epost}
                    </span>
                    {need.kontakt_telefon && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {need.kontakt_telefon}
                      </span>
                    )}
                    {need.antall && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {need.antall} stk
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    {need.fartoytype && (
                      <span>Fartøytype: {need.fartoytype}</span>
                    )}
                  </div>
                  {need.oppstart && (
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Oppstart: {format(new Date(need.oppstart), 'd. MMM yyyy', { locale: nb })}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Mottatt {formatDistanceToNow(new Date(need.created_at), {
                      addSuffix: true,
                      locale: nb
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {need.status !== 'converted' && need.status !== 'closed' && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleConvert(need)}
                      disabled={convertToRequest.isPending}
                    >
                      <ArrowRight className="h-4 w-4 mr-1" />
                      Opprett request
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewDetails?.(need.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Se detaljer
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleStatusChange(need.id, 'contacted')}>
                        <Phone className="h-4 w-4 mr-2" />
                        Merk som kontaktet
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(need.id, 'negotiating')}>
                        Forhandler
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(need.id, 'closed')}
                        className="text-muted-foreground"
                      >
                        Lukk
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
