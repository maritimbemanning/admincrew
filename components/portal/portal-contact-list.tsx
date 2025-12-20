// components/portal/portal-contact-list.tsx
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
  Eye, 
  Phone,
  Mail,
  CheckCircle,
  Loader2,
  MessageSquare,
  Archive
} from 'lucide-react'
import { 
  usePortalContacts, 
  useUpdatePortalContactStatus
} from '@/hooks'
import { 
  CONTACT_STATUS_LABELS, 
  CONTACT_STATUS_COLORS,
  type ContactStatus 
} from '@/types/portal'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface PortalContactListProps {
  onViewDetails?: (id: string) => void
}

export function PortalContactList({ onViewDetails }: PortalContactListProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'all'>('all')

  const { data: contacts, isLoading } = usePortalContacts({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: search || undefined,
  })

  const updateStatus = useUpdatePortalContactStatus()

  const handleStatusChange = async (id: string, status: ContactStatus) => {
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
          <CardTitle className="text-lg">Kontakthenvendelser</CardTitle>
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
              onValueChange={(v) => setStatusFilter(v as ContactStatus | 'all')}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statuser</SelectItem>
                <SelectItem value="new">Nye</SelectItem>
                <SelectItem value="processed">Behandlet</SelectItem>
                <SelectItem value="archived">Arkivert</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!contacts || contacts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Ingen kontakthenvendelser funnet
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium truncate">{contact.navn}</h4>
                    <Badge 
                      variant="secondary"
                      className={cn(CONTACT_STATUS_COLORS[(contact.status || 'new') as ContactStatus])}
                    >
                      {CONTACT_STATUS_LABELS[(contact.status || 'new') as ContactStatus]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {contact.epost}
                    </span>
                    {contact.telefon && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {contact.telefon}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2 flex items-start gap-1">
                    <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    {contact.melding}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(contact.created_at), { 
                      addSuffix: true, 
                      locale: nb 
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {contact.status === 'new' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(contact.id, 'processed')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Behandlet
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewDetails?.(contact.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Se detaljer
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleStatusChange(contact.id, 'processed')}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Merk som behandlet
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleStatusChange(contact.id, 'archived')}
                        className="text-muted-foreground"
                      >
                        <Archive className="h-4 w-4 mr-2" />
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
