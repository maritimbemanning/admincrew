'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ContactList } from '@/components/crm/contact-list'
import { useDebounce } from '@/hooks/use-debounce'
import type { CrmContactFilters, CrmContactStatus, CrmPriority } from '@/types/crm'
import {
  CRM_CONTACT_STATUSES,
  CRM_CONTACT_STATUS_LABELS,
  CRM_PRIORITY_LEVELS,
  CRM_PRIORITY_LABELS,
} from '@/types/crm'
import { INDUSTRIES } from '@/lib/validations/crm'

export default function ContactsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<CrmContactStatus | undefined>()
  const [industryFilter, setIndustryFilter] = useState<string | undefined>()
  const [priorityFilter, setPriorityFilter] = useState<CrmPriority | undefined>()

  const debouncedSearch = useDebounce(searchQuery, 300)

  const filters: CrmContactFilters = {
    search: debouncedSearch || undefined,
    status: statusFilter ? [statusFilter] : undefined,
    industry: industryFilter ? [industryFilter] : undefined,
    priority: priorityFilter ? [priorityFilter] : undefined,
  }

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter(undefined)
    setIndustryFilter(undefined)
    setPriorityFilter(undefined)
  }

  const hasActiveFilters =
    !!debouncedSearch || !!statusFilter || !!industryFilter || !!priorityFilter

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="border-b p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Kontakter</h1>
            <p className="text-sm text-muted-foreground">
              Oversikt over alle CRM-kontakter
            </p>
          </div>
          <Button onClick={() => router.push('/crm/contacts/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Ny kontakt
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk på navn, selskap, e-post..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select
            value={statusFilter || 'all'}
            onValueChange={(val) =>
              setStatusFilter(val === 'all' ? undefined : (val as CrmContactStatus))
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statuser</SelectItem>
              {CRM_CONTACT_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {CRM_CONTACT_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={industryFilter || 'all'}
            onValueChange={(val) => setIndustryFilter(val === 'all' ? undefined : val)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Bransje" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle bransjer</SelectItem>
              {INDUSTRIES.map((industry) => (
                <SelectItem key={industry.value} value={industry.value}>
                  {industry.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={priorityFilter || 'all'}
            onValueChange={(val) =>
              setPriorityFilter(val === 'all' ? undefined : (val as CrmPriority))
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Prioritet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              {CRM_PRIORITY_LEVELS.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {CRM_PRIORITY_LABELS[priority]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Nullstill filtre
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <ContactList filters={filters} />
      </div>
    </div>
  )
}
