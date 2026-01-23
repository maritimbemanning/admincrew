'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Mail,
  Calendar,
  MoreHorizontal,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useCrmContacts } from '@/hooks/use-crm-contacts'
import { ActivityFormDialog } from '@/components/crm/activity-form'
import { TaskFormDialog } from '@/components/crm/task-form'
import type { CrmContact, CrmContactFilters } from '@/types/crm'
import {
  CRM_CONTACT_STATUS_LABELS,
  CRM_CONTACT_STATUS_COLORS,
  CRM_PRIORITY_LABELS,
  CRM_PRIORITY_COLORS,
} from '@/types/crm'

interface ContactListProps {
  filters?: CrmContactFilters
  onContactClick?: (contact: CrmContact) => void
}

function formatCurrency(value: number | null): string {
  if (!value) return '-'
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'short',
  })
}

export function ContactList({ filters, onContactClick }: ContactListProps) {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState('updated_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Dialog states
  const [activityDialogOpen, setActivityDialogOpen] = useState(false)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<CrmContact | null>(null)

  const handleOpenActivityDialog = (contact: CrmContact) => {
    setSelectedContact(contact)
    setActivityDialogOpen(true)
  }

  const handleOpenTaskDialog = (contact: CrmContact) => {
    setSelectedContact(contact)
    setTaskDialogOpen(true)
  }

  const { data, isLoading, error } = useCrmContacts({
    filters,
    page,
    pageSize: 25,
    sortField,
    sortDirection,
  })

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handleRowClick = (contact: CrmContact) => {
    if (onContactClick) {
      onContactClick(contact)
    } else {
      router.push(`/crm/contacts/${contact.id}`)
    }
  }

  if (isLoading) {
    return <ContactListSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        <p>Kunne ikke laste kontakter</p>
        <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
      </div>
    )
  }

  if (!data || data.contacts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">Ingen kontakter funnet</p>
        <p className="text-sm">Prøv å endre filtrene eller opprett en ny kontakt</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8"
                  onClick={() => handleSort('name')}
                >
                  Navn
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Selskap</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="-mr-3 h-8"
                  onClick={() => handleSort('deal_value')}
                >
                  Verdi
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Oppfølging</TableHead>
              <TableHead>Prioritet</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.contacts.map((contact) => (
              <TableRow
                key={contact.id}
                className="cursor-pointer"
                onClick={() => handleRowClick(contact)}
              >
                <TableCell>
                  <div>
                    <div className="font-medium">{contact.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-3">
                      {contact.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {contact.company ? (
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{contact.company}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {contact.status && (
                    <Badge className={cn(CRM_CONTACT_STATUS_COLORS[contact.status])}>
                      {CRM_CONTACT_STATUS_LABELS[contact.status]}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(contact.deal_value)}
                </TableCell>
                <TableCell>
                  {contact.follow_up_date ? (
                    <div
                      className={cn(
                        'flex items-center gap-1.5 text-sm',
                        new Date(contact.follow_up_date) < new Date() &&
                          'text-red-500 font-medium'
                      )}
                    >
                      <Calendar className="h-4 w-4" />
                      {formatDate(contact.follow_up_date)}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {contact.priority && (
                    <Badge
                      variant="secondary"
                      className={cn(CRM_PRIORITY_COLORS[contact.priority])}
                    >
                      {CRM_PRIORITY_LABELS[contact.priority]}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/crm/contacts/${contact.id}`)
                        }}
                      >
                        Vis detaljer
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/crm/contacts/${contact.id}/edit`)
                        }}
                      >
                        Rediger
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenActivityDialog(contact)
                        }}
                      >
                        Logg aktivitet
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenTaskDialog(contact)
                        }}
                      >
                        Opprett oppgave
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Viser {(page - 1) * data.pageSize + 1}-
          {Math.min(page * data.pageSize, data.total)} av {data.total} kontakter
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Side {page} av {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page >= data.totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Activity Dialog */}
      {selectedContact && (
        <ActivityFormDialog
          contactId={selectedContact.id}
          contactName={selectedContact.name}
          open={activityDialogOpen}
          onOpenChange={setActivityDialogOpen}
        />
      )}

      {/* Task Dialog */}
      {selectedContact && (
        <TaskFormDialog
          contactId={selectedContact.id}
          contactName={selectedContact.name}
          open={taskDialogOpen}
          onOpenChange={setTaskDialogOpen}
        />
      )}
    </div>
  )
}

function ContactListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Navn</TableHead>
              <TableHead>Selskap</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Verdi</TableHead>
              <TableHead>Oppfølging</TableHead>
              <TableHead>Prioritet</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48 mt-1" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-28" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20 ml-auto" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-14 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8 rounded" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
